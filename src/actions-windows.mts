// The Windows projections of the one action model: what a WinUI 3 app needs so that agents reach the same actions a
// person presses. Moved here from ouro-ui-windows' spike (#1), as the 2026-11-14 native-kits decision asks.
//
// From an action set and the app's Windows options it writes:
//   app-actions.json    the Windows App Actions registration (schema version 3), for the package's
//                       com.microsoft.windows.ai.actions app extension
//   mcpb.manifest.json  the MCP bundle manifest that registers the app's MCP server with the On-device Agent Registry;
//                       its _meta static responses equal core's mcp.json, so the registry lists the same tools
//   doors.json          for every action and every door (person, MCP, App Action), whether the door carries it and,
//                       when not, why: never a silent skip, never a coercion to text
//   OuroActions.g.cs    the actions as data for ouro-ui-windows' runtime (Ouro.Actions): each action's facts, input
//                       schema and refusal, and the catalog every door goes through
//
// The runtime contract (input validation, idempotency, audit, confirmation of consequential actions, the person-only
// refusal) lives once, in ouro-ui-windows' Ouro.Actions library; this file only describes the actions to it.
//
// It imports only core's action model, so an app vendors it beside that file (a release ships it as
// dist/actions/ouro-actions-windows.mts, importing ./ouro-actions.mts), and runs it with Node 22.18 or later:
//   node ouro-actions-windows.mts generate <actions.mts> <dir>   write every Windows projection into <dir>
//   node ouro-actions-windows.mts check <actions.mts> <dir>      fail when <dir> differs from what generate writes
// The declarations module names its Windows options as `export const windows = { scheme, server, version }`.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS_VERSION, inputSchema, refusal, toMcpTool, type Action, type ActionSet, type Field } from "./actions.mts";

const GENERATOR = `ouro-actions-windows ${ACTIONS_VERSION}`;

/** What the app tells the projection about itself. */
export interface WindowsOptions {
  /** The URI scheme the package registers (uap:Protocol); an App Action launches the app through it. Lowercase. */
  scheme: string;
  /** The MCP server's name, which is also its executable's alias in the package: `<server>.exe`. */
  server: string;
  /** The app's version, which the MCP server reports. */
  version: string;
  /** The C# namespace of OuroActions.g.cs. Default `Ouro.Actions.Generated`. */
  namespace?: string;
}

/** Whether one door carries an action, and why not when it doesn't. */
export type Door = { carries: true } | { carries: false; why: string };

/** The doors a Windows app opens for an action. */
export interface Doors {
  /** A person's own press, in the app. Every action has it. */
  person: Door;
  /** The MCP server, registered with the On-device Agent Registry. */
  mcp: Door;
  /** Windows App Actions. */
  appAction: Door;
}

const yes: Door = { carries: true };
const no = (why: string): Door => ({ carries: false, why });

/**
 * Which doors carry an action. A person-only action is in no agent door. App Actions carry text, files, photos,
 * documents, tables and contacts, never numbers, booleans, enums or structured values
 * (https://learn.microsoft.com/windows/ai/app-actions/actions-json), so an action that needs one of those as input is
 * MCP-only; an optional one is left out of the App Action and the app gets its default.
 */
export function doorsOf(a: Action): Doors {
  if (a.consent === "person-only") {
    const why = "person-only: only the person starts it, so every agent door answers the typed refusal";
    return { person: yes, mcp: no(why), appAction: no(why) };
  }
  for (const [name, f] of Object.entries(a.input)) {
    if (f.protocolOnly || f.optional || f.kind === "string") continue;
    return { person: yes, mcp: yes, appAction: no(`required input "${name}" is ${f.kind === "enum" ? "an enum" : `a ${f.kind}`}, and App Actions carry text, files, photos, documents, tables and contacts only`) };
  }
  return { person: yes, mcp: yes, appAction: yes };
}

const textInputs = (a: Action) => Object.entries(a.input).filter(([, f]) => !f.protocolOnly && f.kind === "string") as [string, Field][];
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

/** One App Action. Its URI carries each text input and the invocation's token, which the runtime keys idempotency on. */
export function toAppAction(a: Action, o: WindowsOptions) {
  const inputs = textInputs(a);
  const required = inputs.filter(([, f]) => !f.optional).map(([n]) => n);
  const all = inputs.map(([n]) => n);
  const phrase = (names: string[]) => (names.length ? `${a.label}: ${names.map((n) => `\${${n}.Text}`).join(", ")}` : a.label);
  const combos = [{ inputs: required, description: phrase(required) }];
  if (all.length > required.length) combos.push({ inputs: all, description: phrase(all) });
  const query = [...all.map((n) => `${n}=\${${n}.Text}`), "token=${$.Token}"].join("&");
  return {
    id: `Ouro.${a.names.pascal}`,
    description: a.description,
    displaysUI: true,
    usesGenerativeAI: false,
    isAvailable: true,
    allowedAppInvokers: ["*"],
    inputs: inputs.map(([name, f]) => (f.optional ? { name, kind: "Text", required: false } : { name, kind: "Text" })),
    inputCombinations: combos,
    invocation: { type: "uri", uri: `${o.scheme}://action/${a.id}?${query}` },
  };
}

export function renderMcpb(set: ActionSet, o: WindowsOptions) {
  const tools = set.actions.filter((a) => doorsOf(a).mcp.carries).map(toMcpTool);
  const exe = `${o.server}.exe`;
  return {
    manifest_version: "0.1",
    name: o.server,
    version: o.version,
    description: `Ouro UI actions for ${set.name}, generated from their declarations.`,
    author: { name: "Ouro" },
    server: { type: "binary", entry_point: exe, mcp_config: { command: exe, args: [] } },
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
    tools_generated: false,
    license: "MIT",
    _meta: {
      "com.microsoft.windows": {
        static_responses: {
          initialize: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: o.server, version: o.version } },
          "tools/list": { tools },
        },
      },
    },
  };
}

const cs = (s: string) => JSON.stringify(s);
const raw = (s: string) => {
  if (s.includes('"""')) throw new Error('a generated JSON string holds three quotes in a row, which a C# raw string literal can\'t. Fix: reword the declaration so no text has """.');
  return `"""\n${s}\n"""`;
};
const CONSENT_CASE = { read: "Read", write: "Write", consequential: "Consequential", "person-only": "PersonOnly" } as const;

/** OuroActions.g.cs: the actions as data for Ouro.Actions' runtime, which owns every door's behaviour. */
export function renderCSharp(set: ActionSet, o: WindowsOptions): string {
  const ns = o.namespace ?? "Ouro.Actions.Generated";
  const L: string[] = [];
  L.push(`// <auto-generated> ${GENERATOR} from the "${set.name}" action set. Don't edit; change the declarations and generate again.`);
  L.push("#nullable enable");
  L.push("using Ouro.Actions;");
  L.push("");
  L.push(`namespace ${ns};`);
  L.push("");
  L.push(`/// <summary>The "${set.name}" actions. Every door runs them through one <c>new OuroActionRuntime(OuroActions.Catalog, handler)</c>.</summary>`);
  L.push("public static class OuroActions");
  L.push("{");
  for (const a of set.actions) {
    const d = doorsOf(a);
    L.push(`    /// <summary>${a.label}: ${a.description.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</summary>`);
    L.push(`    public static readonly OuroActionInfo ${a.names.pascal} = new(`);
    L.push(`        Id: ${cs(a.id)},`);
    L.push(`        Consent: OuroConsent.${CONSENT_CASE[a.consent]},`);
    L.push(`        Label: ${cs(a.label)},`);
    L.push(`        Description: ${cs(a.description)},`);
    L.push(`        Agent: ${cs(a.agent)},`);
    L.push(`        InputSchemaJson: ${raw(JSON.stringify(inputSchema(a)))},`);
    L.push(`        RefusalJson: ${a.consent === "person-only" ? raw(JSON.stringify(refusal(a))) : "null"},`);
    L.push(`        AppAction: ${d.appAction.carries},`);
    L.push(`        Idempotent: ${a.idempotent === true});`);
    L.push("");
  }
  L.push("    /// <summary>Every action, the app's scheme and its MCP server: what Ouro.Actions' runtime and MCP server serve.</summary>");
  L.push("    public static readonly OuroActionCatalog Catalog = new(");
  L.push(`        Set: ${cs(set.name)},`);
  L.push(`        Scheme: ${cs(o.scheme)},`);
  L.push(`        Server: ${cs(o.server)},`);
  L.push(`        Version: ${cs(o.version)},`);
  L.push(`        McpToolsJson: ${raw(JSON.stringify(set.actions.filter((a) => doorsOf(a).mcp.carries).map(toMcpTool)))},`);
  L.push(`        Actions: new[] { ${set.actions.map((a) => a.names.pascal).join(", ")} });`);
  L.push("}");
  return `${L.join("\n")}\n`;
}

/** Checks the options, and throws with every problem and its fix. */
export function checkOptions(o: unknown): WindowsOptions {
  const r = (o ?? {}) as Record<string, unknown>;
  const problems: string[] = [];
  if (typeof r["scheme"] !== "string" || !/^[a-z][a-z0-9.+-]*$/.test(r["scheme"])) problems.push(`scheme is ${JSON.stringify(r["scheme"])}. Fix: the lowercase URI scheme the package registers, such as "ouro-shop".`);
  if (typeof r["server"] !== "string" || !/^[A-Za-z][A-Za-z0-9.-]*$/.test(r["server"])) problems.push(`server is ${JSON.stringify(r["server"])}. Fix: the MCP server's name and executable alias without .exe, such as "OuroShop.Mcp".`);
  if (typeof r["version"] !== "string" || !/^\d+\.\d+\.\d+/.test(r["version"])) problems.push(`version is ${JSON.stringify(r["version"])}. Fix: the app's version, such as "1.0.0".`);
  if (r["namespace"] !== undefined && (typeof r["namespace"] !== "string" || !/^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)*$/.test(r["namespace"]))) problems.push(`namespace is ${JSON.stringify(r["namespace"])}. Fix: a C# namespace such as "OuroShop.Actions", or leave it out.`);
  for (const k of Object.keys(r)) if (!["scheme", "server", "version", "namespace"].includes(k)) problems.push(`has ${JSON.stringify(k)}, which Windows options don't. Fix: remove it.`);
  if (problems.length) throw new Error(`Windows options: ${problems.join(" ")}`);
  return r as unknown as WindowsOptions;
}

/** Every file generate writes, by name. Deterministic: the same set and options render the same bytes. */
export function renderWindows(set: ActionSet, options: WindowsOptions): Map<string, string> {
  const o = checkOptions(options);
  const files = new Map<string, string>();
  const appActions = set.actions.filter((a) => doorsOf(a).appAction.carries).map((a) => toAppAction(a, o));
  files.set("app-actions.json", json({ version: 3, actions: appActions }));
  files.set("doors.json", json({ generator: GENERATOR, set: set.name, actions: Object.fromEntries(set.actions.map((a) => [a.id, doorsOf(a)])) }));
  files.set("mcpb.manifest.json", json(renderMcpb(set, o)));
  files.set("OuroActions.g.cs", renderCSharp(set, o));
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
export function checkWindows(set: ActionSet, options: WindowsOptions, found: ReadonlyMap<string, string>): string[] {
  const expected = renderWindows(set, options);
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

const USAGE = "usage: node ouro-actions-windows.mts generate|check <actions.mts> <dir>";

/** Runs the CLI; returns the exit code: 0 clean, 1 drift, 2 usage. */
export async function main(argv: readonly string[], io: { out(s: string): void; err(s: string): void }): Promise<number> {
  const [cmd, declarations, dir, ...rest] = argv;
  if (!cmd || !declarations || !dir || rest.length || !["generate", "check"].includes(cmd)) {
    io.err(`${USAGE}\n`);
    return 2;
  }
  const mod = (await import(pathToFileURL(resolve(declarations)).href)) as { default?: ActionSet; windows?: unknown };
  if (!mod.default || !Array.isArray(mod.default.actions)) throw new Error(`${declarations}: has no default export from defineActions. Fix: export default defineActions("<name>", [ ... ]).`);
  if (mod.windows === undefined) throw new Error(`${declarations}: has no Windows options. Fix: export const windows = { scheme: "ouro-shop", server: "OuroShop.Mcp", version: "1.0.0" };`);
  const options = checkOptions(mod.windows);
  if (cmd === "generate") {
    await mkdir(dir, { recursive: true });
    const files = renderWindows(mod.default, options);
    for (const [path, text] of files) await writeFile(join(dir, path), text);
    io.out(`ouro-actions-windows: wrote ${files.size} files for ${mod.default.actions.length} actions into ${dir}.\n`);
    return 0;
  }
  const problems = checkWindows(mod.default, options, await readDir(dir));
  for (const p of problems) io.err(`ouro-actions-windows: ${p}\n`);
  if (problems.length) return 1;
  io.out(`ouro-actions-windows: ${mod.default.actions.length} actions, every Windows projection matches its declaration.\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s) }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      process.stderr.write(`ouro-actions-windows: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    },
  );
}
