// Writes Ouro HX's A2UI catalogs: HX's own, and an app's, whose ActionButton names exactly the app's declared actions
// and carries each one's consent class. Decision: docs/decisions/2026-11-13-a2ui-catalog.md.
//
// Apps vendor it from a release as `ouro-a2ui-catalog.mts`, beside `ouro-a2ui.mts` and `ouro-actions.mts` (the release
// rewrites the imports below to those names), and run it with Node 22.18 or later:
//   node ouro-a2ui-catalog.mts catalog [<actions.mts>] <catalog.json> [--id <catalogId>]   write the catalog
//   node ouro-a2ui-catalog.mts check [<actions.mts>] <catalog.json> [--id <catalogId>]     fail when it drifted
//   node ouro-a2ui-catalog.mts validate <catalog.json> <messages.json>   fail, in A2UI's error format, on a bad stream
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ACTIONS_VERSION, refusal, type Action, type ActionSet } from "./actions.mts";
import { A2UI_VERSION, ACTION_BUTTON, COMPONENTS, EXTENSION, HX_CATALOG_ID, pressOf, validateMessages, type CatalogAction, type ComponentSpec, type Json, type Obj, type Prop, type Refusal } from "./a2ui.mts";

const CT = "common_types.json#/$defs/";

function catalogAction(a: Action): CatalogAction {
  const input: CatalogAction["input"] = {};
  // A composed button is one of the person's doors, so a protocol-only field (an idempotency key, a server-side owner)
  // is the app's to add when it calls the tool, never the agent's to prepare. A list, group or one-of field is always
  // protocol-only.
  for (const [name, f] of Object.entries(a.input)) if (!f.protocolOnly && f.kind !== "list" && f.kind !== "group" && f.kind !== "one-of") input[name] = { label: f.label, kind: f.kind, optional: f.optional === true, ...(f.kind === "enum" ? { values: [...f.values] } : {}), ...(f.kind === "string" && f.shownAs !== undefined ? { shownAs: f.shownAs } : {}) };
  return {
    consent: a.consent,
    press: pressOf(a.consent),
    label: a.label,
    description: a.description,
    input,
    ...(a.consent === "person-only" ? { personOnly: { how: a.personOnly!.how, refusal: refusal(a) as unknown as Refusal } } : {}),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The catalog
// ---------------------------------------------------------------------------------------------------------------

const INSTRUCTIONS = [
  "Ouro HX for agent-composed UI. Compose for a person reading on a phone: one Card per thing, a Heading first, then what they need to decide, then at most one primary ActionButton.",
  "",
  "- Use only these components. Styling comes from the app's theme; there are no colours, sizes or fonts to set.",
  "- Component ids are identifiers: letters, digits and _, starting with a letter (recipe_name, not recipe-name). The root's id is root.",
  "- Put content in the data model and bind to it with {\"@path\": \"/...\"}; repeat a template over a list with children: {\"componentId\", \"path\"}.",
  "- Every Image needs a description of what it shows.",
  "- ActionButton is the only button. Name one of the app's actions; its label is the action's. Prepare its input from what the person said; when an id field has a name field (shownAs in the catalog), prepare the name too, since the person confirms by the name, not the id. For a consequential action the person sees and confirms what you prepared; a person-only action takes the person to the app's own screen, so give it no input.",
  "- This catalog has no functions. To act for the person, call the action's own tool (MCP, CLI); never try to press a button.",
].join("\n");

function propSchema(p: Prop, set: ActionSet | undefined): Obj {
  const d = { description: p.description };
  switch (p.type.kind) {
    case "string":
      return { $ref: `${CT}DynamicString`, ...d };
    case "strings":
      return { $ref: `${CT}DynamicStringList`, ...d };
    case "children":
      return { $ref: `${CT}ChildList`, ...d };
    case "enum":
      return { type: "string", enum: [...p.type.values], default: p.type.default, ...d };
    case "boolean":
      return { $ref: `${CT}DynamicBoolean`, ...d };
    case "level":
      return { type: "integer", minimum: 1, maximum: 3, default: p.type.default, ...d };
    case "terms":
      return { $ref: "#/$defs/TermList", ...d };
    case "action":
      return { type: "string", enum: (set?.actions ?? []).map((a) => a.id), ...d };
    case "input": {
      const fields = [...new Set((set?.actions ?? []).flatMap((a) => Object.keys(a.input)))].sort();
      return { type: "object", propertyNames: { enum: fields }, additionalProperties: { $ref: `${CT}DynamicValue` }, ...d };
    }
  }
}

function componentSchema(name: string, c: ComponentSpec, set: ActionSet | undefined): Obj {
  const props: Obj = { component: { const: name } };
  for (const [k, p] of Object.entries(c.props)) props[k] = propSchema(p, set);
  return {
    type: "object",
    description: c.description,
    properties: props,
    required: ["component", ...Object.entries(c.props).filter(([, p]) => p.required).map(([k]) => k)],
  };
}

/** The components a catalog has: HX's, plus ActionButton when it has actions. */
export function componentsOf(set?: ActionSet): Record<string, ComponentSpec> {
  return set && set.actions.length ? { ...COMPONENTS, ActionButton: ACTION_BUTTON } : { ...COMPONENTS };
}

export interface CatalogOptions {
  /** The app's catalog id, under a domain the app owns. Default: HX's id, or for a set a placeholder under ui.ouroboros.bot/a2ui/v1/apps/. */
  catalogId?: string;
}

/** Ouro HX's A2UI v1.0 catalog; with an action set, the app's catalog, whose ActionButton names exactly its actions. */
export function catalog(set?: ActionSet, options: CatalogOptions = {}): Obj {
  const id = options.catalogId ?? (set ? `https://ui.ouroboros.bot/a2ui/v1/apps/${set.name}/catalog.json` : HX_CATALOG_ID);
  const comps = componentsOf(set);
  const components: Obj = {};
  for (const [name, c] of Object.entries(comps)) components[name] = componentSchema(name, c, set);
  const actions: Obj = {};
  for (const a of set?.actions ?? []) actions[a.id] = catalogAction(a) as unknown as Json;
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: id,
    protocolVersion: A2UI_VERSION,
    title: set ? `Ouro HX catalog for ${set.name}` : "Ouro HX catalog",
    description: set ? `Ouro HX's components, and a button for each of the ${set.name} actions.` : "Ouro HX's components for UI an agent composes for a person.",
    catalogId: id,
    instructions: INSTRUCTIONS,
    metadata: { extensions: { [EXTENSION]: { generator: `ouro-a2ui ${ACTIONS_VERSION}`, ...(set ? { set: set.name, actions } : {}) } } },
    components,
    functions: {},
    $defs: {
      anyComponent: { oneOf: Object.keys(comps).map((n) => ({ $ref: `#/components/${n}` })), discriminator: { propertyName: "component" } },
      anyFunction: { description: "This catalog has no functions.", not: {} },
      TermList: {
        description: "Term and detail pairs, or a binding to a list of them.",
        oneOf: [
          {
            type: "array",
            items: {
              type: "object",
              properties: { term: { $ref: `${CT}DynamicString` }, detail: { $ref: `${CT}DynamicString` } },
              required: ["term", "detail"],
              additionalProperties: false,
            },
          },
          { $ref: `${CT}DataBinding` },
        ],
      },
    },
  };
}

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
/** The catalog's bytes, as `catalog` writes them. */
export const renderCatalog = (set?: ActionSet, options?: CatalogOptions) => json(catalog(set, options));

// ---------------------------------------------------------------------------------------------------------------
// The command line
// ---------------------------------------------------------------------------------------------------------------

async function loadSet(path: string): Promise<ActionSet> {
  const mod = (await import(pathToFileURL(resolve(path)).href)) as { default?: ActionSet };
  if (!mod.default || !Array.isArray(mod.default.actions)) throw new Error(`${path}: has no default export from defineActions. Fix: export default defineActions("<name>", [ ... ]).`);
  return mod.default;
}

const USAGE = "usage: node ouro-a2ui-catalog.mts catalog|check [<actions.mts>] <catalog.json> [--id <catalogId>] | validate <catalog.json> <messages.json>";

/** Runs the CLI; returns the exit code: 0 clean, 1 drift or invalid, 2 usage. */
export async function main(argv: readonly string[], io: { out(s: string): void; err(s: string): void }): Promise<number> {
  const args = [...argv];
  const idAt = args.indexOf("--id");
  const catalogId = idAt >= 0 ? args.splice(idAt, 2)[1] : undefined;
  const [cmd, ...rest] = args;
  if (cmd === "validate" && rest.length === 2) {
    // A plain list, or anything holding one as `messages`: a conformance case, or a tool result's `structuredContent.a2ui`.
    const stream = JSON.parse(await readFile(rest[1]!, "utf8")) as Json;
    const messages = stream && typeof stream === "object" && !Array.isArray(stream) && "messages" in stream ? stream.messages : stream;
    const problems = validateMessages(JSON.parse(await readFile(rest[0]!, "utf8")), messages);
    for (const p of problems) io.err(`${JSON.stringify({ version: A2UI_VERSION, error: p })}\n`);
    if (problems.length) return 1;
    io.out("ouro-a2ui-catalog: the messages validate against the catalog.\n");
    return 0;
  }
  if ((cmd === "catalog" || cmd === "check") && (rest.length === 1 || rest.length === 2)) {
    const set = rest.length === 2 ? await loadSet(rest[0]!) : undefined;
    const target = rest[rest.length - 1]!;
    const text = renderCatalog(set, catalogId ? { catalogId } : {});
    if (cmd === "catalog") {
      await writeFile(target, text);
      io.out(`ouro-a2ui-catalog: wrote the catalog to ${target}.\n`);
      return 0;
    }
    const have = await readFile(target, "utf8").catch(() => null);
    if (have === text) {
      io.out(`ouro-a2ui-catalog: ${target} matches ${set ? "its actions and " : ""}Ouro HX.\n`);
      return 0;
    }
    io.err(`ouro-a2ui-catalog: ${target} ${have === null ? "is missing" : "drifted from what catalog writes"}. Fix: run catalog; never edit it by hand.\n`);
    return 1;
  }
  io.err(`${USAGE}\n`);
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), { out: (s) => process.stdout.write(s), err: (s) => process.stderr.write(s) }).then(
    (code) => process.exit(code),
    (error: unknown) => {
      process.stderr.write(`ouro-a2ui-catalog: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    },
  );
}
