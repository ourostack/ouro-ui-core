// Ouro's one action model: declare an action once, generate every surface from it, and fail CI when a surface drifts.
//
// One declaration per action (id, typed input and output, consent class, the person's label and description, the
// agent's description) projects to: a defineCommand definition (CLI, --json, MCP, in web's AX kit), an MCP tool, a
// WebMCP tool, web's defineComponentAx and bindAx entries with each control's props, an App Intent, a SwiftUI
// Button(intent:) and a Reins action. A person-only action refuses on every agent door with one typed refusal.
// Design: docs/superpowers/specs/2026-11-13-one-action-model-design.md. Adopter guide: docs/guides/actions.md.
//
// This file imports only node: modules, so an app vendors it as it is (dist/actions/ouro-actions.mts in a core
// release, pinned by hash) and runs it with Node 22.18 or later:
//   node ouro-actions.mts generate <actions.mts> <dir>      write every projection into <dir>
//   node ouro-actions.mts check <actions.mts> <dir>         fail when <dir> differs from what generate writes
//   node ouro-actions.mts compare-mcp <actions.mts> <tools.json>  fail when a live MCP tools/list differs
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The generator's version, written into every generated file; it is core's version. */
export const ACTIONS_VERSION = "0.5.0";
const GENERATOR = `ouro-actions ${ACTIONS_VERSION}`;

// ---------------------------------------------------------------------------------------------------------------
// The declaration
// ---------------------------------------------------------------------------------------------------------------

/**
 * What an action needs before it runs:
 * - `read`: changes nothing;
 * - `write`: changes only the person's own space;
 * - `consequential`: reaches other people or can't be taken back, so an agent prepares it and the person says yes;
 * - `person-only`: the person must start it themselves, and every agent door refuses it.
 */
export const CONSENTS = Object.freeze(["read", "write", "consequential", "person-only"] as const);
export type Consent = (typeof CONSENTS)[number];

interface FieldBase {
  /** The person's word for it: a form label, an App Intent parameter's title. */
  label: string;
  /** What it is, for an agent: the JSON Schema description, the CLI flag's help. */
  description: string;
  optional?: boolean;
}
export interface StringField extends FieldBase { kind: "string"; arg?: boolean }
export interface NumberField extends FieldBase { kind: "number" | "integer"; min?: number; max?: number; arg?: boolean }
export interface BooleanField extends FieldBase { kind: "boolean" }
export interface EnumField<V extends string = string> extends FieldBase { kind: "enum"; values: readonly V[]; arg?: boolean }
export type Field = StringField | NumberField | BooleanField | EnumField;
export type Fields = Readonly<Record<string, Field>>;

type Opt = { optional?: boolean };
/** Field builders; `arg: true` makes a required field a positional CLI argument instead of a flag. */
export const field = Object.freeze({
  string: <O extends Omit<StringField, "kind">>(o: O) => ({ ...o, kind: "string" as const }),
  number: <O extends Omit<NumberField, "kind">>(o: O) => ({ ...o, kind: "number" as const }),
  integer: <O extends Omit<NumberField, "kind">>(o: O) => ({ ...o, kind: "integer" as const }),
  boolean: <O extends Omit<BooleanField, "kind">>(o: O) => ({ ...o, kind: "boolean" as const }),
  enum: <const V extends string, O extends Omit<EnumField<V>, "kind">>(o: O & { values: readonly V[] }) => ({ ...o, kind: "enum" as const }),
});

type ValueOf<F> = F extends { kind: "string" } ? string
  : F extends { kind: "number" | "integer" } ? number
  : F extends { kind: "boolean" } ? boolean
  : F extends { kind: "enum"; values: readonly (infer V)[] } ? V
  : never;
type OptionalKeys<F> = { [K in keyof F]: F[K] extends Opt & { optional: true } ? K : never }[keyof F];
type RequiredKeys<F> = Exclude<keyof F, OptionalKeys<F>>;
/** The value an action's fields describe, optional fields optional. */
export type ValuesOf<F> = { [K in RequiredKeys<F>]: ValueOf<F[K]> } & { [K in OptionalKeys<F>]?: ValueOf<F[K]> };
/** An action's input type: `InputOf<typeof addShoppingListItem>`. */
export type InputOf<A> = A extends Action<infer I, Fields> ? ValuesOf<I> : never;
/** An action's output type. */
export type OutputOf<A> = A extends Action<Fields, infer O> ? ValuesOf<O> : never;

/** Why only the person does it, said to the agent, and how the person does it. One line each. */
export interface PersonOnly {
  reason: string;
  how: string;
}

export interface ActionDef<I extends Fields = Fields, O extends Fields = Fields> {
  /** snake_case, such as `add_shopping_list_item`: the MCP and WebMCP tool name. Other names derive from it. */
  id: string;
  consent: Consent;
  /** The person's button text, and the App Intent's title. */
  label: string;
  /** The person's one sentence: the control's hint, the component AX summary. */
  description: string;
  /** The agent's description: the MCP and WebMCP description, the CLI summary, the App Intent's description. One line. */
  agent: string;
  input: I;
  output: O;
  /** Exactly when `consent` is `person-only`. */
  personOnly?: PersonOnly;
  /** For a person-only action, whether other people see its effect; it decides web's effect class. Default "private". */
  reaches?: "private" | "others";
  /** The CLI words, such as `list add`; defaults to the id in kebab case. */
  cli?: string;
}

export interface Action<I extends Fields = Fields, O extends Fields = Fields> extends Readonly<ActionDef<I, O>> {
  readonly names: Names;
  readonly cliWords: string;
}

export interface ActionSet {
  /** The set's name, such as `shopping`; it names the generated files' contents. */
  readonly name: string;
  /** The CLI tool's name, which twins start with, such as `shop`. */
  readonly tool: string;
  readonly actions: readonly Action[];
}

export interface Names {
  kebab: string;
  camel: string;
  pascal: string;
}

const ID = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
const FIELD_NAME = /^[a-z][a-zA-Z0-9]*$/;
const oneLine = (v: unknown): v is string => typeof v === "string" && v.trim() !== "" && !/[\r\n]/.test(v);

/** The names an id derives: `add_shopping_list_item` is `add-shopping-list-item`, `addShoppingListItem`, `AddShoppingListItem`. */
export function names(id: string): Names {
  const parts = id.split("_");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return { kebab: parts.join("-"), camel: parts[0] + parts.slice(1).map(cap).join(""), pascal: parts.map(cap).join("") };
}

function checkFields(where: string, fields: unknown, input: boolean): void {
  if (typeof fields !== "object" || fields === null || Array.isArray(fields)) throw new Error(`${where}: is not an object of fields. Fix: { <name>: field.string({ ... }) }, or {}.`);
  for (const [name, f] of Object.entries(fields as Record<string, Field>)) {
    const at = `${where} "${name}"`;
    if (!FIELD_NAME.test(name)) throw new Error(`${at}: a field name is camelCase letters and digits. Fix: rename it, such as "canEdit".`);
    if (!["string", "number", "integer", "boolean", "enum"].includes(f?.kind)) throw new Error(`${at}: has no kind. Fix: build it with field.string, field.number, field.integer, field.boolean or field.enum.`);
    if (!oneLine(f.label)) throw new Error(`${at}: label is empty or more than one line. Fix: the person's word for it, such as "Quantity".`);
    if (!oneLine(f.description)) throw new Error(`${at}: description is empty or more than one line. Fix: one sentence for the agent.`);
    if ("arg" in f && f.arg && (f.optional || !input)) throw new Error(`${at}: arg is only for a required input field. Fix: drop arg, or drop optional.`);
    if (f.kind === "enum" && (!Array.isArray(f.values) || f.values.length === 0 || !f.values.every((v) => /^[a-z][a-z0-9-]*$/.test(v)))) {
      throw new Error(`${at}: values is empty or not lowercase words. Fix: values: ["all", "unchecked"].`);
    }
  }
}

/** Declares one action and checks it; a problem throws one line with its fix. */
export function defineAction<const I extends Fields, const O extends Fields>(def: ActionDef<I, O>): Action<I, O> {
  const id = typeof def.id === "string" ? def.id : String(def.id);
  if (!ID.test(id)) throw new Error(`action ${JSON.stringify(id)}: the id is not snake_case. Fix: lowercase words joined by _, such as "add_shopping_list_item".`);
  const at = `action "${id}"`;
  if (!(CONSENTS as readonly string[]).includes(def.consent)) throw new Error(`${at}: consent is ${JSON.stringify(def.consent)}. Fix: one of ${CONSENTS.join(", ")}.`);
  for (const key of ["label", "description", "agent"] as const) {
    if (!oneLine(def[key])) throw new Error(`${at}: ${key} is empty or more than one line. Fix: write it in one line.`);
  }
  if (def.consent === "person-only") {
    if (!def.personOnly || !oneLine(def.personOnly.reason) || !oneLine(def.personOnly.how)) {
      throw new Error(`${at}: a person-only action needs personOnly, its reason and how, one line each. Fix: personOnly: { reason: "You can't <do it> for the person; only they can.", how: "<where the person does it>" }.`);
    }
  } else {
    if (def.personOnly !== undefined) throw new Error(`${at}: personOnly is only for consent "person-only". Fix: drop personOnly, or make the consent "person-only".`);
    if (def.reaches !== undefined) throw new Error(`${at}: reaches is only for consent "person-only"; the consent class decides who sees the others. Fix: drop reaches.`);
  }
  if (def.reaches !== undefined && def.reaches !== "private" && def.reaches !== "others") throw new Error(`${at}: reaches is ${JSON.stringify(def.reaches)}. Fix: "private" or "others".`);
  if (def.cli !== undefined && !/^[a-z][a-z0-9-]*( [a-z][a-z0-9-]*)*$/.test(def.cli)) throw new Error(`${at}: cli is not lowercase words. Fix: such as "list add".`);
  checkFields(`${at} input`, def.input, true);
  checkFields(`${at} output`, def.output, false);
  const n = names(id);
  return Object.freeze({ ...def, id, names: n, cliWords: def.cli ?? n.kebab });
}

/** The set an app generates from. Ids, CLI words and derived names must be unique, so no two surfaces collide. */
export function defineActions(name: string, actions: readonly Action[], options: { tool?: string } = {}): ActionSet {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`action set ${JSON.stringify(name)}: the set name is lowercase words joined by -. Fix: such as "shopping".`);
  const tool = options.tool ?? name;
  if (!/^[a-z][a-z0-9-]*$/.test(tool)) throw new Error(`action set "${name}": tool is ${JSON.stringify(tool)}. Fix: the CLI's name, such as "shop".`);
  const seen = new Map<string, string>();
  for (const a of actions) {
    const keys: [string, string][] = [["id", a.id], ["kebab name", a.names.kebab], ["camel name", a.names.camel], ["Swift name", a.names.pascal], ["CLI words", a.cliWords]];
    for (const [what, value] of keys) {
      const key = `${what}=${value}`;
      const other = seen.get(key);
      if (other === a.id) throw new Error(`action set "${name}": action "${a.id}" is used twice. Fix: list each action once.`);
      if (other !== undefined) throw new Error(`action set "${name}": actions "${other}" and "${a.id}" share the ${what} "${value}". Fix: rename one, or give it its own cli words.`);
    }
    for (const [what, value] of keys) seen.set(`${what}=${value}`, a.id);
  }
  return Object.freeze({ name, tool, actions: Object.freeze([...actions]) });
}

// ---------------------------------------------------------------------------------------------------------------
// Consent onto each surface, and the typed refusal
// ---------------------------------------------------------------------------------------------------------------

/** Web's effect class: consequential reaches others; read and write are the person's own. */
export function effectOf(a: Action): "private" | "others" {
  if (a.consent === "consequential") return "others";
  if (a.consent === "person-only") return a.reaches ?? "private";
  return "private";
}

/** MCP tool annotations, exactly web's `effectAnnotations(effect, readOnly)`. */
export function annotationsOf(a: Action): { readOnlyHint: boolean; destructiveHint: boolean; openWorldHint: boolean } {
  const others = effectOf(a) === "others";
  return { readOnlyHint: a.consent === "read", destructiveHint: others, openWorldHint: others };
}

export interface Refusal {
  ax: 1;
  action: string;
  state: "refused";
  error: { code: "person-only"; exit: 2; thing: string; problem: string; fix: null; message: string };
  how: string;
}

/**
 * The answer every agent door gives a person-only action: web's outcome `refused` with an `AxErrorShape` whose code is
 * `person-only` and exit 2 (web's `usage`, which `refused` maps to), plus how the person does it.
 */
export function refusal(a: Action): Refusal {
  if (a.consent !== "person-only" || !a.personOnly) throw new Error(`action "${a.id}" is not person-only, so nothing refuses it. Fix: refuse only person-only actions.`);
  const problem = a.personOnly.reason;
  return {
    ax: 1,
    action: a.names.kebab,
    state: "refused",
    error: { code: "person-only", exit: 2, thing: a.cliWords, problem, fix: null, message: `${a.cliWords}: ${problem}` },
    how: a.personOnly.how,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// JSON projections
// ---------------------------------------------------------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function fieldSchema(f: Field): Record<string, Json> {
  const s: Record<string, Json> = { type: f.kind === "enum" ? "string" : f.kind, description: f.description };
  if (f.kind === "enum") s["enum"] = [...f.values];
  if ((f.kind === "number" || f.kind === "integer") && f.min !== undefined) s["minimum"] = f.min;
  if ((f.kind === "number" || f.kind === "integer") && f.max !== undefined) s["maximum"] = f.max;
  return s;
}

function objectSchema(fields: Fields): { type: "object"; properties: Record<string, Json>; required: string[]; additionalProperties: false } {
  const entries = Object.entries(fields);
  return {
    type: "object",
    properties: Object.fromEntries(entries.map(([k, f]) => [k, fieldSchema(f)])),
    required: entries.filter(([, f]) => !f.optional).map(([k]) => k),
    additionalProperties: false,
  };
}

/** The input's JSON Schema, shared by MCP, WebMCP and the CLI's `help --json`. */
export const inputSchema = (a: Action) => objectSchema(a.input);
/** The output's JSON Schema. */
export const outputSchema = (a: Action) => objectSchema(a.output);

export interface CommandJson {
  name: string;
  summary: string;
  effect: "private" | "others";
  readOnly?: true;
  args?: { name: string; description: string; required: true }[];
  flags?: Record<string, Record<string, Json>>;
  output?: string;
}

function flagSpec(f: Field): Record<string, Json> {
  const s: Record<string, Json> = { type: f.kind === "integer" ? "number" : f.kind, description: f.description };
  if (f.kind === "enum") s["values"] = [...f.values];
  if (f.kind === "number" || f.kind === "integer") {
    if (f.min !== undefined) s["min"] = f.min;
    if (f.max !== undefined) s["max"] = f.max;
  }
  if (!f.optional) s["required"] = true;
  return s;
}

/** The action as web's `defineCommand` definition, without `run`. A person-only action has none; it is a refusing word. */
export function toCommand(a: Action): CommandJson {
  if (a.consent === "person-only") throw new Error(`action "${a.id}" is person-only: it is a word the CLI refuses, not a command. Fix: use the commands file's personOnly.`);
  const cmd: CommandJson = { name: a.cliWords, summary: a.agent, effect: effectOf(a) };
  if (a.consent === "read") cmd.readOnly = true;
  const fields = Object.entries(a.input);
  const args = fields.filter(([, f]) => "arg" in f && f.arg).map(([name, f]) => ({ name, description: f.description, required: true as const }));
  const flags = Object.fromEntries(fields.filter(([, f]) => !("arg" in f && f.arg)).map(([name, f]) => [name, flagSpec(f)]));
  if (args.length) cmd.args = args;
  if (Object.keys(flags).length) cmd.flags = flags;
  const out = Object.keys(a.output);
  if (out.length) cmd.output = `{ ${out.join(", ")} }`;
  return cmd;
}

export interface McpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: ReturnType<typeof objectSchema>;
  outputSchema?: ReturnType<typeof objectSchema>;
  annotations: ReturnType<typeof annotationsOf>;
}

/** The MCP tool. */
export function toMcpTool(a: Action): McpTool {
  const tool: McpTool = { name: a.id, title: a.label, description: a.agent, inputSchema: inputSchema(a), annotations: annotationsOf(a) };
  if (Object.keys(a.output).length) tool.outputSchema = outputSchema(a);
  return tool;
}

/** The WebMCP tool descriptor, for `registerTool`, with the hints WebMCP defines. */
export function toWebMcpTool(a: Action) {
  return { name: a.id, description: a.agent, inputSchema: inputSchema(a), annotations: { readOnlyHint: a.consent === "read", consequentialHint: a.consent === "consequential" } };
}

const header = (set: ActionSet) => ({ generator: GENERATOR, set: set.name });
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
const agentDoors = (set: ActionSet) => set.actions.filter((a) => a.consent !== "person-only");
const refusals = (set: ActionSet) => Object.fromEntries(set.actions.filter((a) => a.consent === "person-only").map((a) => [a.id, refusal(a)]));
const lit = (s: string) => JSON.stringify(s);

function twinOf(set: ActionSet, a: Action): string {
  const args = Object.entries(a.input).filter(([, f]) => "arg" in f && f.arg).map(([name]) => `<${name}>`);
  return [set.tool, a.cliWords, ...args].join(" ");
}

function renderWeb(set: ActionSet): string {
  const comment = `// Generated by ${GENERATOR} from the "${set.name}" action set. Don't edit; run generate.`;
  const ax = set.actions.map((a) => {
    const side = a.consent === "person-only" ? `personOnly: ${lit(a.personOnly!.reason)}` : "agent: true";
    return `    { id: ${lit(a.names.kebab)}, summary: ${lit(a.description)}, effect: ${lit(effectOf(a))}, ${side} },`;
  });
  const twins = agentDoors(set).map((a) => `    ${lit(a.names.kebab)}: ${lit(twinOf(set, a))},`);
  const refuse = set.actions.filter((a) => a.consent === "person-only").map((a) => `    ${lit(a.names.kebab)}: ${lit(`${set.tool} ${a.cliWords}`)},`);
  const controls = set.actions.map((a) =>
    `  ${lit(a.names.kebab)}: { label: ${lit(a.label)}, description: ${lit(a.description)}, consent: ${lit(a.consent)}, props: { "data-ax-action": ${lit(a.names.kebab)} } },`,
  );
  return [
    comment,
    "//",
    "// componentAx goes into web's defineComponentAx as a component's actions; twins goes into bindAx; spread a",
    "// control's props on the control that takes the action, so web's expectAxRendered finds it.",
    `export const generated = ${JSON.stringify(header(set))} as const;`,
    "",
    "export const componentAx = {",
    "  actions: [",
    ...ax,
    "  ],",
    "} as const;",
    "",
    "export const twins = {",
    "  actions: {",
    ...twins,
    "  },",
    "  refuseAs: {",
    ...refuse,
    "  },",
    "} as const;",
    "",
    "export const controls = {",
    ...controls,
    "} as const;",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------------------------
// Swift projections: App Intents, Button(intent:), Reins
// ---------------------------------------------------------------------------------------------------------------

const swiftLit = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const SWIFT_KEYWORDS = new Set(["as", "break", "case", "catch", "class", "continue", "default", "defer", "do", "else", "enum", "extension", "fallthrough", "false", "for", "func", "guard", "if", "import", "in", "init", "inout", "internal", "is", "let", "nil", "operator", "private", "protocol", "public", "repeat", "rethrows", "return", "self", "Self", "static", "struct", "subscript", "super", "switch", "throw", "throws", "true", "try", "typealias", "var", "where", "while"]);
const swiftId = (name: string) => (SWIFT_KEYWORDS.has(name) ? `\`${name}\`` : name);
const caseName = (v: string) => swiftId(names(v.replace(/-/g, "_")).camel);
const enumType = (a: Action, field: string) => `${a.names.pascal}${field.charAt(0).toUpperCase()}${field.slice(1)}`;

function swiftType(a: Action, name: string, f: Field): string {
  const base = f.kind === "string" ? "String" : f.kind === "number" ? "Double" : f.kind === "integer" ? "Int" : f.kind === "boolean" ? "Bool" : enumType(a, name);
  return f.optional ? `${base}?` : base;
}

function swiftStruct(a: Action, typeName: string, fields: Fields): string[] {
  const entries = Object.entries(fields);
  const lines = [`public struct ${typeName}: Codable, Sendable, Hashable {`];
  for (const [n, f] of entries) lines.push(`    public var ${swiftId(n)}: ${swiftType(a, n, f)}`);
  const params = entries.map(([n, f]) => `${swiftId(n)}: ${swiftType(a, n, f)}${f.optional ? " = nil" : ""}`).join(", ");
  lines.push(`    public init(${params}) {`);
  for (const [n] of entries) lines.push(`        self.${n} = ${swiftId(n)}`);
  lines.push("    }", "}");
  return lines;
}

function swiftEnums(a: Action, intent: boolean): string[] {
  const out: string[] = [];
  for (const [n, f] of Object.entries(a.input)) {
    if (f.kind !== "enum") continue;
    const t = enumType(a, n);
    out.push(`public enum ${t}: String, Codable, Sendable, Hashable, CaseIterable${intent ? ", AppEnum" : ""} {`);
    for (const v of f.values) out.push(`    case ${caseName(v)} = ${swiftLit(v)}`);
    if (intent) {
      out.push(`    public static let typeDisplayRepresentation: TypeDisplayRepresentation = ${swiftLit(f.label)}`);
      out.push(`    public static let caseDisplayRepresentations: [${t}: DisplayRepresentation] = [`);
      for (const v of f.values) out.push(`        .${caseName(v)}: ${swiftLit(v)},`);
      out.push("    ]");
    }
    out.push("}", "");
  }
  return out;
}

function renderSwift(set: ActionSet): string {
  const L: string[] = [
    `// Generated by ${GENERATOR} from the "${set.name}" action set. Don't edit; run generate.`,
    "//",
    "// Each action has an Input and an Output, a handler the app sets once at launch (`<Action>Action.perform`), and a",
    "// SwiftUI button. An agent door gets an App Intent whose perform() calls the same handler, and the button is",
    "// Button(_:intent:), so a press, Siri, Shortcuts and Reins all take one path. A person-only action gets no App",
    "// Intent, so no agent can reach it, and OuroActions.refusal(for:) answers a bridge that asks for it.",
    "import AppIntents",
    "import SwiftUI",
    "",
    "public enum OuroActionConsent: String, Sendable {",
    '    case read, write, consequential, personOnly = "person-only"',
    "}",
    "",
    "/// The typed refusal of a person-only action: the same fields as web's refused outcome.",
    "public struct OuroActionRefusal: Error, Sendable, Equatable {",
    "    public let action: String",
    '    public let code = "person-only"',
    "    public let thing: String",
    "    public let reason: String",
    "    public let how: String",
    "}",
    "",
    "/// An action ran before the app set its handler.",
    "public struct OuroActionNotBound: Error, Sendable, Equatable {",
    "    public let action: String",
    "}",
    "",
    `/// The "${set.name}" action set.`,
    "public enum OuroActions {",
    "    public static let consent: [String: OuroActionConsent] = [",
    ...set.actions.map((a) => `        ${swiftLit(a.id)}: .${a.consent === "person-only" ? "personOnly" : a.consent},`),
    "    ]",
    "",
    "    /// The refusal for a person-only action, by its id, kebab or camel name; nil for any other action.",
    "    public static func refusal(for action: String) -> OuroActionRefusal? {",
    "        switch action {",
  ];
  for (const a of set.actions.filter((x) => x.consent === "person-only")) {
    L.push(`        case ${swiftLit(a.id)}, ${swiftLit(a.names.kebab)}, ${swiftLit(a.names.camel)}:`);
    L.push(`            return OuroActionRefusal(action: ${swiftLit(a.names.kebab)}, thing: ${swiftLit(a.cliWords)}, reason: ${swiftLit(a.personOnly!.reason)}, how: ${swiftLit(a.personOnly!.how)})`);
  }
  L.push("        default:", "            return nil", "        }", "    }", "}", "");

  for (const a of set.actions) {
    const P = a.names.pascal;
    const agentDoor = a.consent !== "person-only";
    L.push(`// MARK: ${a.id} (${a.consent})`, "");
    L.push(...swiftEnums(a, agentDoor));
    L.push(...swiftStruct(a, `${P}Input`, a.input), "");
    L.push(...swiftStruct(a, `${P}Output`, a.output), "");
    L.push(`/// ${a.label}: ${a.description}`);
    L.push("@MainActor", `public enum ${P}Action {`);
    L.push(`    public static let id = ${swiftLit(a.id)}`);
    L.push(`    /// The app's handler; every door calls it.`);
    L.push(`    public static var perform: (@MainActor @Sendable (${P}Input) async throws -> ${P}Output)?`, "");
    L.push(`    public static func run(_ input: ${P}Input) async throws -> ${P}Output {`);
    L.push(`        guard let perform else { throw OuroActionNotBound(action: id) }`);
    L.push("        return try await perform(input)", "    }", "}", "");
    const fields = Object.entries(a.input);
    if (agentDoor) {
      L.push(`public struct ${P}Intent: AppIntent {`);
      L.push(`    public static let title: LocalizedStringResource = ${swiftLit(a.label)}`);
      L.push(`    public static let description = IntentDescription(${swiftLit(a.agent)})`, "");
      for (const [n, f] of fields) {
        L.push(`    @Parameter(title: ${swiftLit(f.label)}, description: ${swiftLit(f.description)})`);
        L.push(`    public var ${swiftId(n)}: ${swiftType(a, n, f)}`);
      }
      if (fields.length) L.push("");
      L.push("    public init() {}", "");
      L.push(`    public init(_ input: ${P}Input) {`, "        self.init()");
      for (const [n] of fields) L.push(`        self.${n} = input.${swiftId(n)}`);
      L.push("    }", "");
      L.push(`    public var input: ${P}Input {`, `        ${P}Input(${fields.map(([n]) => `${swiftId(n)}: ${swiftId(n)}`).join(", ")})`, "    }", "");
      L.push("    @MainActor", "    public func perform() async throws -> some IntentResult {");
      if (a.consent === "consequential") L.push("        // Consequential: the person says yes before it acts.", "        try await requestConfirmation()");
      L.push(`        _ = try await ${P}Action.run(input)`, "        return .result()", "    }", "}", "");
    }
    L.push(`/// The control for ${a.id}: ${agentDoor ? "Button(_:intent:), the same intent Siri and Shortcuts run" : "a plain Button, since no agent may start it"}.`);
    L.push("@available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, *)");
    L.push(`public struct ${P}Button<Label: View>: View {`);
    L.push(`    public let input: ${P}Input`, "    let label: Label", "");
    L.push(`    public init(_ input: ${P}Input, @ViewBuilder label: () -> Label) {`, "        self.input = input", "        self.label = label()", "    }", "");
    L.push("    public var body: some View {");
    if (agentDoor) L.push(`        Button(intent: ${P}Intent(input)) { label }`);
    else L.push(`        Button { Task { _ = try? await ${P}Action.run(input) } } label: { label }`);
    L.push(`            .accessibilityHint(Text(verbatim: ${swiftLit(a.description)}))`, "    }", "}", "");
    L.push("@available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, *)");
    L.push(`extension ${P}Button where Label == Text {`);
    L.push(`    public init(_ input: ${P}Input) {`, `        self.init(input) { Text(verbatim: ${swiftLit(a.label)}) }`, "    }", "}", "");
  }
  return `${L.join("\n").replace(/\n+$/, "")}\n`;
}

function reinsSchema(a: Action, f: Field): string {
  if (f.kind === "enum") return `.oneOf([${f.values.map(swiftLit).join(", ")}])`;
  return f.kind === "boolean" ? ".boolean" : `.${f.kind}`;
}

function renderReins(set: ActionSet): string {
  const L: string[] = [
    `// Generated by ${GENERATOR} from the "${set.name}" action set. Don't edit; run generate.`,
    "//",
    "// Reins actions from the same declarations: each calls the handler a press and an App Intent call. Reins is the",
    "// test door that stands in for the person's finger, so person-only actions are here too.",
    "import OuroReins",
    "",
  ];
  for (const a of set.actions) {
    const P = a.names.pascal;
    const fields = Object.entries(a.input);
    const props = fields.map(([n, f]) => `${swiftLit(n)}: ${reinsSchema(a, f)}`).join(", ");
    const required = fields.filter(([, f]) => !f.optional).map(([n]) => swiftLit(n)).join(", ");
    L.push(`extension ${P}Input: ReinsInput {`);
    L.push(`    public static var reinsSchema: ReinsSchema { .object(properties: [${props || ":"}], required: [${required}]) }`, "}", "");
  }
  L.push("extension ReinsAction {");
  for (const a of set.actions) {
    const P = a.names.pascal;
    L.push(`    /// ${a.label}: ${a.description}`);
    L.push(`    public static func ${a.names.camel}() -> ReinsAction {`);
    L.push(`        ReinsAction(${swiftLit(a.names.camel)}, ${swiftLit(a.label)}, input: ${P}Input.self) { input in _ = try await ${P}Action.run(input) }`);
    L.push("    }", "");
  }
  L[L.length - 1] = "}";
  return `${L.join("\n")}\n`;
}

// ---------------------------------------------------------------------------------------------------------------
// Every projection, the drift check and the live comparison
// ---------------------------------------------------------------------------------------------------------------

/** Every file generate writes, by name. Deterministic: the same set renders the same bytes. */
export function renderActions(set: ActionSet): Map<string, string> {
  const files = new Map<string, string>();
  files.set("actions.json", json({ ...header(set), tool: set.tool, actions: set.actions.map(({ names: _n, cliWords: _c, ...def }) => def) }));
  files.set("commands.json", json({ ...header(set), tool: set.tool, commands: agentDoors(set).map(toCommand), personOnly: Object.fromEntries(set.actions.filter((a) => a.consent === "person-only").map((a) => [a.cliWords, { reason: a.personOnly!.reason, how: a.personOnly!.how }])) }));
  files.set("mcp.json", json({ ...header(set), tools: agentDoors(set).map(toMcpTool), refusals: refusals(set) }));
  files.set("webmcp.json", json({ ...header(set), tools: agentDoors(set).map(toWebMcpTool), refusals: refusals(set) }));
  files.set("web.ts", renderWeb(set));
  files.set("OuroActions.swift", renderSwift(set));
  files.set("OuroActionsReins.swift", renderReins(set));
  return files;
}

/** Every way `found` differs from what the set generates: a missing, extra or different file, at its first differing line. */
export function checkGenerated(set: ActionSet, found: ReadonlyMap<string, string>): string[] {
  const expected = renderActions(set);
  const problems: string[] = [];
  for (const [path, text] of expected) {
    const have = found.get(path);
    if (have === undefined) {
      problems.push(`${path}: missing. Fix: run generate.`);
      continue;
    }
    if (have === text) continue;
    const a = text.split("\n");
    const b = have.split("\n");
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    problems.push(`${path}:${i + 1}: drifted from its declaration: expected ${JSON.stringify(a[i] ?? "<end of file>")}, found ${JSON.stringify(b[i] ?? "<end of file>")}. Fix: change the declaration and run generate; never edit a generated file.`);
  }
  for (const path of found.keys()) if (!expected.has(path)) problems.push(`${path}: not generated from any declaration. Fix: delete it, or declare what it holds.`);
  return problems;
}

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])) : v;
const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

/**
 * Every way a live MCP server's tools differ from the declarations: a declared tool missing or with another
 * description, input schema or annotations; a person-only action listed as a tool; a tool nobody declared. `tools` is
 * a `tools/list` result (`{ tools: [...] }`) or its array.
 */
export function compareMcp(set: ActionSet, tools: unknown): string[] {
  const list = Array.isArray(tools) ? tools : (tools as { tools?: unknown })?.tools;
  if (!Array.isArray(list)) return ["tools: is not a tools/list result. Fix: pass the server's tools/list result, { tools: [...] }."];
  const live = new Map<string, Record<string, unknown>>();
  for (const t of list as Record<string, unknown>[]) live.set(String(t["name"]), t);
  const problems: string[] = [];
  for (const a of set.actions) {
    const t = live.get(a.id);
    if (a.consent === "person-only") {
      if (t) problems.push(`${a.id}: is person-only but the server lists it as a tool. Fix: unlist it; a call answers the refusal in mcp.json.`);
      continue;
    }
    if (!t) {
      problems.push(`${a.id}: declared but the server doesn't list it. Fix: serve the tool from mcp.json.`);
      continue;
    }
    const want = toMcpTool(a);
    if (t["description"] !== want.description) problems.push(`${a.id}: description drifted: expected ${JSON.stringify(want.description)}, found ${JSON.stringify(t["description"])}. Fix: serve the declaration's agent description.`);
    if (!same(t["inputSchema"], want.inputSchema)) problems.push(`${a.id}: input schema drifted: expected ${JSON.stringify(sortKeys(want.inputSchema))}, found ${JSON.stringify(sortKeys(t["inputSchema"]))}. Fix: serve the declaration's input schema.`);
    const ann = (t["annotations"] ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(want.annotations)) if ((ann[k] ?? false) !== v) problems.push(`${a.id}: annotation ${k} is ${JSON.stringify(ann[k] ?? null)}, the consent class "${a.consent}" says ${v}. Fix: serve the declaration's annotations.`);
  }
  for (const name of live.keys()) if (!set.actions.some((a) => a.id === name)) problems.push(`${name}: the server lists a tool no declaration has. Fix: declare it with defineAction.`);
  return problems;
}

// ---------------------------------------------------------------------------------------------------------------
// The CLI
// ---------------------------------------------------------------------------------------------------------------

async function loadSet(path: string): Promise<ActionSet> {
  const mod = (await import(pathToFileURL(resolve(path)).href)) as { default?: ActionSet };
  const set = mod.default;
  if (!set || !Array.isArray(set.actions) || typeof set.name !== "string") throw new Error(`${path}: has no default export from defineActions. Fix: export default defineActions("<name>", [ ... ]).`);
  return set;
}

async function readDir(dir: string): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return found;
  }
  for (const name of entries.sort()) if (!name.startsWith(".")) found.set(name, await readFile(join(dir, name), "utf8"));
  return found;
}

const USAGE = "usage: node ouro-actions.mts generate|check <actions.mts> <dir> | compare-mcp <actions.mts> <tools.json>";

/** Runs the CLI; returns the exit code: 0 clean, 1 drift, 2 usage. */
export async function main(argv: readonly string[], io: { out(s: string): void; err(s: string): void }): Promise<number> {
  const [cmd, declarations, target] = argv;
  if (!cmd || !declarations || !target || !["generate", "check", "compare-mcp"].includes(cmd)) {
    io.err(`${USAGE}\n`);
    return 2;
  }
  const set = await loadSet(declarations);
  if (cmd === "generate") {
    await mkdir(target, { recursive: true });
    const files = renderActions(set);
    for (const [path, text] of files) await writeFile(join(target, path), text);
    io.out(`ouro-actions: wrote ${files.size} files for ${set.actions.length} actions into ${target}.\n`);
    return 0;
  }
  const problems = cmd === "check" ? checkGenerated(set, await readDir(target)) : compareMcp(set, JSON.parse(await readFile(target, "utf8")));
  for (const p of problems) io.err(`ouro-actions: ${p}\n`);
  if (problems.length) return 1;
  io.out(`ouro-actions: ${set.actions.length} actions, ${cmd === "check" ? "every projection matches its declaration" : "the live tools match their declarations"}.\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s) }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      process.stderr.write(`ouro-actions: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(2);
    },
  );
}
