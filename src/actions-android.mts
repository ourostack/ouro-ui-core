// The Android projection of the one action model: what a Compose app needs so that agents reach, through AppFunctions,
// the same actions a person presses. Proven on an emulator in ourostack/ouro-ui-android's CI, whose ouro-actions
// library is the runtime the generated Kotlin calls (docs/decisions/2026-11-14-native-kits.md).
//
// From an action set and the app's Android options it writes:
//   OuroActions.kt  each action as an OuroAction (ouro-actions' runtime) with its Input and Output types, the set's
//                   catalog, and Base<Set>AppFunctionService: one AppFunction per action an agent may call, whose
//                   body goes through the same runtime a person's press does
//   doors.json      for every action and every door (the person's press, an AppFunction), whether the door carries
//                   it and, when not, why: never a silent skip, never a coercion
//
// A person-only action has no AppFunction, as it has no App Intent on Apple; the catalog's refusal answers any bridge
// that relays a call to it. A consequential action's AppFunction asks the person through the action's `confirm`, and
// is refused until the app sets one.
//
// It imports only core's action model, so an app vendors it beside that file, and runs it with Node 22.18 or later:
//   node ouro-actions-android.mts generate <actions.mts> <dir>   write every Android projection into <dir>
//   node ouro-actions-android.mts check <actions.mts> <dir>      fail when <dir> differs from what generate writes
// The declarations module names its Android options as `export const android = { package }`.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS_VERSION, actionText, names, refusal, type Action, type ActionSet, type Field } from "./actions.mts";

const GENERATOR = `ouro-actions-android ${ACTIONS_VERSION}`;

/** What the app tells the projection about itself. */
export interface AndroidOptions {
  /** The Kotlin package of OuroActions.kt, such as `com.example.shop.actions`. */
  package: string;
}

/** Whether one door carries an action, and why not when it doesn't. */
export type Door = { carries: true } | { carries: false; why: string };

/** The doors an Android app opens for an action. */
export interface Doors {
  /** A person's own press, in the app. Every action has it. */
  person: Door;
  /** An AppFunction, which agents find through AppFunctionManager. */
  appFunction: Door;
}

const yes: Door = { carries: true };
const no = (why: string): Door => ({ carries: false, why });
const structured = (f: Field) => f.kind === "list" || f.kind === "group" || f.kind === "one-of";

/**
 * Which doors carry an action. A person-only action is in no agent door. An AppFunction takes text, numbers, booleans
 * and enums here; an action that needs a list, group or one-of input is left to the doors that carry structured
 * values (MCP, the CLI), and says so.
 */
export function doorsOf(a: Action): Doors {
  if (a.consent === "person-only") return { person: yes, appFunction: no("person-only: only the person starts it, so it has no AppFunction, and a bridge that relays a call to it answers core's typed refusal") };
  for (const [name, f] of Object.entries(a.input)) {
    if (f.protocolOnly || f.optional || !structured(f)) continue;
    return { person: yes, appFunction: no(`required input "${name}" is a ${f.kind}, which this projection does not map to AppFunction parameters yet`) };
  }
  return { person: yes, appFunction: yes };
}

const KOTLIN_KEYWORDS = new Set(["as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if", "in", "interface", "is", "null", "object", "package", "return", "super", "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while"]);
const lit = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$")}"`;
const id = (name: string) => (KOTLIN_KEYWORDS.has(name) ? `\`${name}\`` : name);
const consentOf = (a: Action) => ({ read: "Read", write: "Write", consequential: "Consequential", "person-only": "PersonOnly" })[a.consent];
const describe = (f: Field) => (f.kind === "string" && f.multiline ? `${f.description} It may run over several lines.` : f.description);
const base = (f: Field) => (f.kind === "string" || f.kind === "enum" ? "String" : f.kind === "number" ? "Double" : f.kind === "integer" ? "Long" : f.kind === "boolean" ? "Boolean" : "Any");
/** A value the Input may lack: optional, nullable, protocol-only (an agent's AppFunction never sends one), or structured. */
const loose = (f: Field) => Boolean(f.optional || f.nullable || f.protocolOnly || structured(f));
const flat = (fields: Record<string, Field>) => Object.entries(fields).filter(([, f]) => !structured(f));
/** The AppFunction's parameters: what a person's door would take, flat. */
const params = (a: Action) => Object.entries(a.input).filter(([, f]) => !f.protocolOnly && !structured(f));

export function checkOptions(value: unknown): AndroidOptions {
  const r = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const problems: string[] = [];
  const pkg = r["package"];
  if (typeof pkg !== "string" || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(pkg) || pkg.split(".").some((p) => KOTLIN_KEYWORDS.has(p))) {
    problems.push(`package is ${JSON.stringify(pkg)}. Fix: a Kotlin package of lowercase words joined by dots, such as "com.example.shop.actions".`);
  }
  for (const k of Object.keys(r)) if (k !== "package") problems.push(`has ${JSON.stringify(k)}, which Android options don't. Fix: remove it.`);
  if (problems.length) throw new Error(`Android options: ${problems.join(" ")}`);
  return r as unknown as AndroidOptions;
}

function renderKotlin(set: ActionSet, o: AndroidOptions): string {
  const setName = names(set.name.replace(/-/g, "_")).pascal;
  const service = `${setName}AppFunctionService`;
  const agents = set.actions.filter((a) => doorsOf(a).appFunction.carries);
  const L: string[] = [
    `// Generated by ${GENERATOR} from the "${set.name}" action set. Don't edit; change the declarations and run generate.`,
    "//",
    "// Each action is an OuroAction: the app sets its handler (`perform`) when it starts, and every door calls it. An action",
    `// an agent may call is also an AppFunction in Base${service}, which goes through ouro-actions' agent door: a`,
    "// person-only action has no AppFunction, and a consequential one asks the person through its `confirm` first.",
    `package ${o.package}`,
    "",
    "import android.os.Build",
    "import androidx.annotation.RequiresApi",
    "import androidx.appfunctions.AppFunctionDeclaration",
    "import androidx.appfunctions.AppFunctionInstruction",
    "import androidx.appfunctions.AppFunctionInvalidArgumentException",
    "import androidx.appfunctions.AppFunctionSerializable",
    "import androidx.appfunctions.AppFunctionService",
    "import androidx.appfunctions.AppFunctionServiceEntryPoint",
    "import androidx.appfunctions.AppFunctionStringValueConstraint",
    "import bot.ouro.ui.actions.OuroAction",
    "import bot.ouro.ui.actions.OuroActionSet",
    "import bot.ouro.ui.actions.OuroConsent",
    "import bot.ouro.ui.actions.OuroRefusal",
    "import bot.ouro.ui.actions.callFromAppFunction",
  ];
  const outputType = (a: Action) => (flat(a.output).length ? `${a.names.pascal}Output` : "Unit");

  for (const a of set.actions) {
    const P = a.names.pascal;
    const d = doorsOf(a).appFunction;
    L.push("", `// ${a.id} (${a.consent})`, "");
    const inputs = Object.entries(a.input);
    if (inputs.length) {
      L.push(`/** What ${a.id} takes. */`, `data class ${P}Input(`);
      for (const [n, f] of inputs) {
        if (structured(f)) L.push(`    /** ${f.label}: a ${f.kind}, which only structured doors (MCP, the CLI) carry; null from a person's press. */`);
        L.push(`    val ${id(n)}: ${base(f)}${loose(f) ? "? = null" : ""},`);
      }
      L.push(")");
    } else L.push(`/** ${a.id} takes no input. */`, `data object ${P}Input`);
    const outs = flat(a.output);
    if (outs.length) {
      L.push("", `/** What ${a.id} returns. */`, "@AppFunctionSerializable(isDescribedByKDoc = false)", `data class ${P}Output(`);
      for (const [n, f] of outs) L.push(`    @property:AppFunctionInstruction(${lit(describe(f))})`, `    val ${id(n)}: ${base(f)}${f.optional || f.nullable ? "? = null" : ""},`);
      L.push(")");
    }
    L.push("", `/** ${a.label}: ${a.description} */`, `object ${P} : OuroAction<${P}Input, ${outputType(a)}>(`);
    L.push(`    id = ${lit(a.id)},`, `    label = ${lit(a.label)},`, `    description = ${lit(a.description)},`, `    agent = ${lit(a.agent)},`, `    consent = OuroConsent.${consentOf(a)},`);
    L.push(`    appFunction = ${d.carries ? lit(a.names.camel) : "null"},`, `    appFunctionWhy = ${d.carries ? "null" : lit(d.why)},`);
    if (a.consent === "person-only") {
      const r = refusal(a).error;
      L.push("    refusal = OuroRefusal(", `        action = ${lit(a.id)},`, `        thing = ${lit(r.thing)},`, `        problem = ${lit(r.problem)},`, `        message = ${lit(r.message)},`);
      L.push(`        reason = ${lit(a.personOnly!.reason)},`, `        how = ${lit(a.personOnly!.how)},`, "    ),");
    } else L.push("    refusal = null,");
    L.push(")");
  }

  L.push("", `/** The "${set.name}" action set. */`, "object OuroActions {");
  L.push(`    /** The generated AppFunction service, which the app declares in its manifest (ouro-ui-android's README). */`);
  L.push(`    const val SERVICE: String = ${lit(service)}`, "", "    /** Every action, for bridges and the X-ray. */");
  L.push(`    val set: OuroActionSet = OuroActionSet(${lit(set.name)}, listOf(${set.actions.map((a) => a.names.pascal).join(", ")}))`, "}");

  L.push("", "/**", ` * The "${set.name}" set's AppFunctions, one per action an agent may call. The AppFunctions compiler generates`);
  L.push(` * ${service} from it, which the app declares in its manifest.`, " */");
  L.push("@RequiresApi(Build.VERSION_CODES.BAKLAVA)");
  L.push(`@AppFunctionServiceEntryPoint(serviceName = ${lit(service)}, appFunctionXmlFileName = ${lit(`${set.name.replace(/-/g, "_")}_app_functions`)})`);
  L.push(`abstract class Base${service} : AppFunctionService() {`);
  agents.forEach((a, i) => {
    const P = a.names.pascal;
    const ps = params(a);
    if (i > 0) L.push("");
    L.push("    @AppFunctionDeclaration(isDescribedByKDoc = false)", `    @AppFunctionInstruction(${lit(a.agent)})`);
    if (!ps.length) L.push(`    suspend fun ${a.names.camel}(): ${outputType(a)} {`);
    else {
      L.push(`    suspend fun ${a.names.camel}(`);
      for (const [n, f] of ps) {
        L.push(`        @AppFunctionInstruction(${lit(describe(f))})`);
        if (f.kind === "enum") L.push(`        @AppFunctionStringValueConstraint(enumValues = [${f.values.map(lit).join(", ")}])`);
        L.push(`        ${id(n)}: ${base(f)}${f.optional || f.nullable ? "? = null" : ""},`);
      }
      L.push(`    ): ${outputType(a)} {`);
    }
    for (const [n, f] of ps) {
      if (f.kind !== "enum") continue;
      const test = `${id(n)} !in listOf(${f.values.map(lit).join(", ")})`;
      L.push(`        if (${f.optional || f.nullable ? `${id(n)} != null && ` : ""}${test}) throw AppFunctionInvalidArgumentException(${lit(`${n} is not one of ${f.values.join(", ")}.`)})`);
    }
    const input = Object.keys(a.input).length ? `${P}Input(${ps.map(([n]) => `${id(n)} = ${id(n)}`).join(", ")})` : `${P}Input`;
    L.push(`        return ${P}.callFromAppFunction(${input})`, "    }");
  });
  L.push("}");
  return `${L.join("\n")}\n`;
}

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

/** Every file generate writes, by name. Deterministic: the same set and options render the same bytes. */
export function renderAndroid(set: ActionSet, options: AndroidOptions): Map<string, string> {
  const o = checkOptions(options);
  const files = new Map<string, string>();
  files.set("doors.json", json({ generator: GENERATOR, set: set.name, actions: Object.fromEntries(set.actions.map((a) => [a.id, { ...doorsOf(a), text: actionText(a) }])) }));
  files.set("OuroActions.kt", renderKotlin(set, o));
  return files;
}

async function readDir(dir: string): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return found;
  }
  for (const name of entries.sort()) {
    if (name.startsWith(".")) continue;
    const text = await readFile(join(dir, name), "utf8").catch((error: { code?: string }) => (error.code === "EISDIR" ? null : Promise.reject(error)));
    if (text !== null) found.set(name, text);
  }
  return found;
}

/** Every way `found` differs from what the set generates. */
export function checkAndroid(set: ActionSet, options: AndroidOptions, found: ReadonlyMap<string, string>): string[] {
  const expected = renderAndroid(set, options);
  const problems: string[] = [];
  for (const [path, text] of expected) {
    const have = found.get(path);
    if (have === undefined) problems.push(`${path}: missing. Fix: run generate.`);
    else if (have !== text) {
      const a = text.split("\n");
      const b = have.split("\n");
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      problems.push(`${path}:${i + 1}: drifted from its declaration: expected ${JSON.stringify(a[i] ?? "<end of file>")}, found ${JSON.stringify(b[i] ?? "<end of file>")}. Fix: change the declaration and run generate; never edit a generated file.`);
    }
  }
  for (const path of found.keys()) if (!expected.has(path)) problems.push(`${path}: not generated from any declaration. Fix: delete it.`);
  return problems;
}

const USAGE = "usage: node ouro-actions-android.mts generate|check <actions.mts> <dir>";

/** Runs the CLI; returns the exit code: 0 clean, 1 drift, 2 usage. */
export async function main(argv: readonly string[], io: { out(s: string): void; err(s: string): void }): Promise<number> {
  const [cmd, declarations, dir, ...rest] = argv;
  if (!cmd || !declarations || !dir || rest.length || !["generate", "check"].includes(cmd)) {
    io.err(`${USAGE}\n`);
    return 2;
  }
  const mod = (await import(pathToFileURL(resolve(declarations)).href)) as { default?: ActionSet; android?: unknown };
  if (!mod.default || !Array.isArray(mod.default.actions)) throw new Error(`${declarations}: has no default export from defineActions. Fix: export default defineActions("<name>", [ ... ]).`);
  if (mod.android === undefined) throw new Error(`${declarations}: has no Android options. Fix: export const android = { package: "com.example.shop.actions" };`);
  const options = checkOptions(mod.android);
  if (cmd === "generate") {
    await mkdir(dir, { recursive: true });
    const files = renderAndroid(mod.default, options);
    for (const [path, text] of files) await writeFile(join(dir, path), text);
    io.out(`ouro-actions-android: wrote ${files.size} files for ${mod.default.actions.length} actions into ${dir}.\n`);
    return 0;
  }
  const problems = checkAndroid(mod.default, options, await readDir(dir));
  for (const p of problems) io.err(`ouro-actions-android: ${p}\n`);
  if (problems.length) return 1;
  io.out(`ouro-actions-android: ${mod.default.actions.length} actions, every Android projection matches its declaration.\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s) }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      process.stderr.write(`ouro-actions-android: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    },
  );
}
