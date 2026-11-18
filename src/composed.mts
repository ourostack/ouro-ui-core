export const COMPOSED_VERSION = "1";

// COMPOSED_VERSION above is the version of Ouro's composed-UI tree. (No comment goes before the first statement:
// shadcn's CLI drops it when web's registry installs this file.)
//
// Ouro's own composed UI: what an agent may put on a person's screen, independent of the format it arrived in. It holds
// the component specs, the action and consent rules for a composed button, the tree every renderer draws, the
// validator for that tree, and what a press sends. Decision: docs/decisions/2026-11-14-composed-ui-own-tree.md.
//
// Formats are adapters at the edge. A2UI (src/a2ui.mts) turns a message stream into this tree, and MCP Apps
// (src/mcp-app.mts) carries a tree, or an A2UI stream, to a host. A renderer draws the tree and nothing else, so adding or
// dropping a format costs one adapter, never a renderer or a catalog.
//
// It imports nothing, so it runs in a browser, a server or a test as it is. Apps vendor it from a release as
// `ouro-composed.mts`, beside each adapter they use.

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export type Obj = { [k: string]: Json };

// ---------------------------------------------------------------------------------------------------------------
// The components
// ---------------------------------------------------------------------------------------------------------------

/** A prop's kind: what the validator checks and what the resolver produces. */
export type PropKind =
  | { kind: "string" } // DynamicString
  | { kind: "strings" } // DynamicStringList
  | { kind: "children" } // ChildList
  | { kind: "enum"; values: readonly string[]; default: string }
  | { kind: "boolean"; default: boolean } // DynamicBoolean
  | { kind: "level"; default: number } // integer 1 to 3
  | { kind: "terms" } // [{ term, detail }] or a binding to one
  | { kind: "action" } // ActionButton.action
  | { kind: "input" } // ActionButton.input
  | { kind: "path" }; // DataBinding: where a field writes the person's answer, a JSON pointer

export interface Prop {
  description: string;
  required?: boolean;
  type: PropKind;
}

export interface ComponentSpec {
  /** For an agent: what it is and when to use it. One line. */
  description: string;
  props: Readonly<Record<string, Prop>>;
}

const TONES = ["neutral", "info", "success", "warning", "danger"] as const;

/**
 * Ouro HX's catalog components, named as on web. A component joins only when web and Apple both render it and a
 * conformance case covers it. `ActionButton` joins an app's catalog, with the app's actions.
 */
export const COMPONENTS: Readonly<Record<string, ComponentSpec>> = Object.freeze({
  Card: {
    description: "A raised surface that groups one thing's content; its children stack vertically.",
    props: { children: { description: "What the card holds, top to bottom.", required: true, type: { kind: "children" } } },
  },
  Stack: {
    description: "Lays children out in a column or a row with HX spacing.",
    props: {
      children: { description: "What the stack holds, in order.", required: true, type: { kind: "children" } },
      direction: { description: "vertical stacks top to bottom; horizontal lays out a row that wraps.", type: { kind: "enum", values: ["vertical", "horizontal"], default: "vertical" } },
      gap: { description: "Space between children, from HX's spacing scale.", type: { kind: "enum", values: ["none", "small", "medium", "large"], default: "medium" } },
    },
  },
  Heading: {
    description: "A title. Level 1 is a card's or page's title, 2 a section, 3 a subsection.",
    props: {
      text: { description: "The heading's words.", required: true, type: { kind: "string" } },
      level: { description: "1, 2 or 3.", type: { kind: "level", default: 2 } },
    },
  },
  Text: {
    description: "A paragraph of plain text.",
    props: {
      text: { description: "The words, plain text without Markdown.", required: true, type: { kind: "string" } },
      tone: { description: "muted for secondary text such as a byline or a note.", type: { kind: "enum", values: ["default", "muted"], default: "default" } },
    },
  },
  Image: {
    description: "A picture with a description for people who can't see it.",
    props: {
      url: { description: "The image's https URL.", required: true, type: { kind: "string" } },
      description: { description: "What the picture shows, for a screen reader; never \"image of\".", required: true, type: { kind: "string" } },
      aspect: { description: "The frame's shape; the picture fills it.", type: { kind: "enum", values: ["landscape", "square", "portrait", "wide"], default: "landscape" } },
    },
  },
  Badge: {
    description: "A short label for a status or a category, such as \"Vegetarian\".",
    props: {
      text: { description: "One to three words.", required: true, type: { kind: "string" } },
      tone: { description: "neutral unless the label is a status.", type: { kind: "enum", values: TONES, default: "neutral" } },
    },
  },
  List: {
    description: "A list of short plain-text items, such as ingredients or steps.",
    props: {
      items: { description: "The items, in order.", required: true, type: { kind: "strings" } },
      ordered: { description: "true numbers the items, for steps that happen in order.", type: { kind: "boolean", default: false } },
    },
  },
  DescriptionList: {
    description: "Pairs of a term and its detail, such as \"Time\" and \"25 min\".",
    props: { items: { description: "The pairs, each { term, detail }.", required: true, type: { kind: "terms" } } },
  },
  Separator: {
    description: "A hairline between groups of content.",
    props: {},
  },
  Alert: {
    description: "A message the person should notice: a warning, an error, a success or information.",
    props: {
      title: { description: "One line saying what happened.", required: true, type: { kind: "string" } },
      text: { description: "What to do about it, if anything.", type: { kind: "string" } },
      tone: { description: "How serious it is.", type: { kind: "enum", values: ["info", "success", "warning", "danger"], default: "info" } },
    },
  },
  TextField: {
    description: "A field the person types an answer into. It starts with what the data model holds at value and writes their answer there; bind an ActionButton's input to the same path, and pressing it sends what they typed.",
    props: {
      label: { description: "What the field asks for, in a few words, such as \"Servings\".", required: true, type: { kind: "string" } },
      value: { description: "Where the answer goes, as a JSON pointer into the data model, such as /servings.", required: true, type: { kind: "path" } },
      hint: { description: "One line under the field saying what to enter, when the label isn't enough.", type: { kind: "string" } },
      type: { description: "text for words; number when the answer is a number, which the field writes as one.", type: { kind: "enum", values: ["text", "number"], default: "text" } },
      multiline: { description: "true for a longer answer over several lines, such as a note.", type: { kind: "boolean", default: false } },
    },
  },
  Checkbox: {
    description: "A yes-or-no choice the person ticks. It starts with what the data model holds at value and writes true or false there.",
    props: {
      label: { description: "The choice, said so that ticking it means yes, such as \"Make it vegetarian\".", required: true, type: { kind: "string" } },
      value: { description: "Where the answer goes, as a JSON pointer into the data model, such as /vegetarian.", required: true, type: { kind: "path" } },
      hint: { description: "One line under the choice, when the label isn't enough.", type: { kind: "string" } },
    },
  },
  Select: {
    description: "One choice from a short list. It starts with what the data model holds at value and writes the chosen option there, as text.",
    props: {
      label: { description: "What the person is choosing, in a few words, such as \"Oven\".", required: true, type: { kind: "string" } },
      value: { description: "Where the choice goes, as a JSON pointer into the data model, such as /oven.", required: true, type: { kind: "path" } },
      options: { description: "The choices, in order, as the person reads them.", required: true, type: { kind: "strings" } },
      hint: { description: "One line under the list, when the label isn't enough.", type: { kind: "string" } },
    },
  },
});

/** The components a person answers with: each writes to the data model at its `value`. */
export const INPUT_COMPONENTS: readonly string[] = Object.freeze(["TextField", "Checkbox", "Select"]);

export const ACTION_BUTTON: ComponentSpec = {
  description: "A button for one of the app's declared actions. Its label and what pressing it does come from the action, so you choose only the action, the input you prepared and its emphasis.",
  props: {
    action: { description: "The action's id.", required: true, type: { kind: "action" } },
    input: { description: "The input you prepared, by field name; a value may bind to the data model with {\"@path\"}, and one bound to a field the person fills in is read when they press. Never give input to a person-only action.", type: { kind: "input" } },
    emphasis: { description: "primary for the one main action on a surface; secondary for the rest.", type: { kind: "enum", values: ["primary", "secondary"], default: "secondary" } },
  },
};

// ---------------------------------------------------------------------------------------------------------------
// The action and consent rules for a composed button
// ---------------------------------------------------------------------------------------------------------------

/** An action's consent class (src/actions.mts). */
export type Consent = "read" | "write" | "consequential" | "person-only";
/** What pressing an action's button does: run it, confirm then run it, or hand the person to the app's own screen. */
export type Press = "run" | "confirm" | "handoff";

export const pressOf = (consent: Consent): Press => (consent === "person-only" ? "handoff" : consent === "consequential" ? "confirm" : "run");

/** The typed refusal every agent door answers a person-only action with (src/actions.mts `refusal`), as JSON. */
export interface Refusal {
  ax: "outcome/1";
  action: string;
  state: "refused";
  summary: string;
  error: { code: "person-only"; exit: number; thing: string; problem: string; fix: null; message: string };
  [k: string]: unknown;
}

/** An action as the catalog carries it, for renderers that have only the catalog. */
export interface CatalogAction {
  consent: Consent;
  press: Press;
  label: string;
  description: string;
  input: Record<string, { label: string; kind: "string" | "number" | "integer" | "boolean" | "enum"; optional: boolean; values?: string[]; shownAs?: string }>;
  /** For a person-only action: where the person does it, and the refusal every agent door answers. */
  personOnly?: { how: string; refusal: Refusal };
}

/** What a renderer needs from a catalog, in any format: its id, its components and what each action's button does. */
export interface Catalog {
  catalogId: string;
  components: Record<string, ComponentSpec>;
  actions: Record<string, CatalogAction>;
}

/** HX's components, plus ActionButton when the catalog has actions. A catalog can't widen HX's specs. */
export const componentsFor = (actions: Readonly<Record<string, CatalogAction>>): Record<string, ComponentSpec> =>
  Object.keys(actions).length ? { ...COMPONENTS, ActionButton: ACTION_BUTTON } : { ...COMPONENTS };

/** Why an agent can't press a button through the screen, whatever the format asked: agents use their own doors. */
export function agentPressProblem(cat: Catalog, name: unknown): { message: string; refusal?: Refusal } {
  const a = typeof name === "string" ? cat.actions[name] : undefined;
  if (a?.personOnly) return { message: a.personOnly.refusal.summary, refusal: a.personOnly.refusal };
  if (a) return { message: `${name} is an action, and agents run actions through their own tool (MCP ${name}), not through the person's screen.` };
  return { message: `This catalog has no functions an agent may call${typeof name === "string" ? `, so ${name} is not one` : ""}.` };
}

// ---------------------------------------------------------------------------------------------------------------
// The tree every renderer draws
// ---------------------------------------------------------------------------------------------------------------

/** A value bound to the data model: `{ "@path": "/servings" }`. In a tree, the path is absolute. */
export const isBinding = (v: unknown): v is { "@path": string } => isObj(v) && typeof v["@path"] === "string" && Object.keys(v).length === 1;

/** Reads a JSON pointer (RFC 6901). A missing value is undefined. */
export function getPointer(data: Json, pointer: string): Json | undefined {
  if (pointer === "" || pointer === "/") return data;
  let cur: Json | undefined = data;
  for (const raw of pointer.replace(/^\//, "").split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(cur)) cur = /^\d+$/.test(key) ? cur[Number(key)] : undefined;
    else if (cur && typeof cur === "object") cur = (cur as Obj)[key];
    else return undefined;
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** Writes a JSON pointer, creating objects on the way; null deletes. It returns a copy and leaves `data` as it was. */
export function setPointer(data: Json, pointer: string, value: Json): Json {
  if (pointer === "" || pointer === "/") return value === null ? {} : value;
  const keys = pointer.replace(/^\//, "").split("/").map((k) => k.replace(/~1/g, "/").replace(/~0/g, "~"));
  const root: Json = data && typeof data === "object" ? structuredClone(data) : {};
  let cur = root as Obj | Json[];
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    const container = cur as Obj & Json[];
    const index = Array.isArray(cur) && /^\d+$/.test(k) ? Number(k) : k;
    if (last) {
      if (value === null) {
        if (Array.isArray(cur) && typeof index === "number") cur.splice(index, 1);
        else delete (cur as Obj)[k];
      } else (container as unknown as Record<string | number, Json>)[index] = value;
      return;
    }
    const next = (container as unknown as Record<string | number, Json>)[index];
    if (!next || typeof next !== "object") (container as unknown as Record<string | number, Json>)[index] = {};
    cur = (container as unknown as Record<string | number, Json>)[index] as Obj;
  });
  return root;
}

/** A value as text: numbers and booleans as written, null and missing as "", others as JSON (A2UI's conversion too). */
export function asText(v: Json | undefined): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

/**
 * The rows of a confirm sheet: each prepared input with the person's label. An id shows its name (the app's resolver,
 * else the sibling `shownAs` names, else the value itself), with the id as `raw` when the name replaced it; a name
 * field that stands in for an id has no row of its own.
 */
/** The input fields a confirm sheet has a row for, in order: each prepared one, less a name that stands in for an id. */
function confirmKeys(a: CatalogAction, input: Obj): string[] {
  const names = new Set(Object.entries(a.input).filter(([k, f]) => k in input && f.shownAs !== undefined && f.shownAs in a.input).map(([, f]) => f.shownAs!));
  return Object.keys(a.input).filter((k) => k in input && !names.has(k));
}

function confirmFields(action: string, a: CatalogAction, input: Obj, options: ResolveOptions): { label: string; value: string; raw?: string; bind?: string }[] {
  return confirmKeys(a, input)
    .map((k) => [k, a.input[k]!] as const)
    .map(([k, f]) => {
      // The person's own answer, read when they press (resolveButton): it shows as they wrote it.
      const bound = input[k];
      if (isBinding(bound)) return { label: f.label, value: "", bind: bound["@path"] };
      const raw = asText(input[k]);
      const sibling = f.shownAs !== undefined ? input[f.shownAs] : undefined;
      const prepared = typeof sibling === "string" && sibling.trim() !== "" ? sibling.trim() : undefined;
      // Only an id field (one with shownAs) shows a name; every other row shows exactly what will be sent.
      const value = (f.shownAs !== undefined ? (options.label?.({ action, field: k, value: raw, input }) ?? prepared) : undefined) ?? raw;
      return value === raw ? { label: f.label, value } : { label: f.label, value, raw };
    });
}

/** What a resolver is asked to name: one prepared input of a button that confirms. */
export interface LabelContext {
  action: string;
  field: string;
  /** The prepared value, as text: the id. */
  value: string;
  /** Every prepared input of the button. */
  input: Obj;
}

export interface ResolveOptions {
  /**
   * The app's own word for an id, from its own data, such as a recipe's title for `rcp_lemon_orzo`; undefined to leave it
   * to the field's `shownAs`, then to the value itself. It is asked for each id field a confirm sheet shows (one whose
   * catalog input has `shownAs`), and wins over what the agent prepared, since the agent's text is the one thing the
   * person can't check. Every other row shows exactly what will be sent.
   */
  label?: (context: LabelContext) => string | undefined;
}

/**
 * A node of the composed tree: the component, its props with every value resolved and every default filled, and its
 * children. An adapter produces it; every renderer draws exactly it. An ActionButton's label, consent, press, confirm
 * sheet and handoff come from the catalog (`actionButtonProps`), never from the format.
 */
export interface ComposedNode {
  /** The component's id, which a press names as its source. A template's instances share it. */
  id: string;
  component: string;
  props: Obj;
  children: ComposedNode[];
}

/** The props of an ActionButton for an action and the input an agent prepared: everything else comes from the catalog. */
export function actionButtonProps(cat: Catalog, action: string, prepared: Obj, options: ResolveOptions = {}): Obj {
  const a = cat.actions[action]!;
  const input: Obj = a.personOnly ? {} : prepared;
  const props: Obj = { action, label: a.label, consent: a.consent, press: a.press, input };
  if (a.press === "confirm") props.confirm = { title: a.label, description: a.description, fields: confirmFields(action, a, input, options) };
  if (a.personOnly) props.handoff = a.personOnly.how;
  return props;
}

/** A problem in a composed tree: a JSON pointer into it, and one sentence; the typed refusal when one applies. */
export interface TreeProblem {
  path: string;
  message: string;
  refusal?: Refusal;
}

/** A JSON object (not null, not an array). The A2UI adapter uses it too, so the modules declare no name twice. */
export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const BUTTON_PROPS = ["action", "label", "consent", "press", "input", "confirm", "handoff", "emphasis", "@label"];

function checkProp(problems: TreeProblem[], key: string, p: Prop, v: unknown, at: string): void {
  const t = p.type;
  const bad = (expected: string) => problems.push({ path: at, message: `${key} is ${expected}, got ${JSON.stringify(v)}.` });
  switch (t.kind) {
    case "string":
      if (typeof v !== "string") bad("text");
      break;
    case "strings":
      if (!Array.isArray(v) || !v.every((s) => typeof s === "string")) bad("a list of text");
      break;
    case "boolean":
      if (typeof v !== "boolean") bad("true or false");
      break;
    case "enum":
      if (typeof v !== "string" || !t.values.includes(v)) bad(`one of ${t.values.join(", ")}`);
      break;
    case "level":
      if (v !== 1 && v !== 2 && v !== 3) bad("1, 2 or 3");
      break;
    case "path":
      if (typeof v !== "string" || !v.startsWith("/")) bad("a JSON pointer into the data model, such as /servings");
      break;
    case "terms":
      if (!Array.isArray(v) || !v.every((it) => isObj(it) && typeof it.term === "string" && typeof it.detail === "string" && Object.keys(it).length === 2)) bad("a list of { term, detail } text");
      break;
    case "children":
    case "action":
    case "input":
      break;
  }
}

/**
 * A confirm sheet's rows against the rows the catalog gives for the prepared input: the same fields, in order, with the
 * catalog's labels, and each row showing what will be sent (its `raw`, or its `value` when it has none) or, for a bound
 * input, the same binding. Only the words shown for an id may differ, since the app's own resolver names it.
 */
function confirmRowProblems(problems: TreeProblem[], id: string, a: CatalogAction, input: Obj, rows: unknown[], at: string): void {
  const expected = confirmFields(id, a, input, {});
  const keys = confirmKeys(a, input);
  const bad = () => problems.push({ path: at, message: `${id}'s confirm sheet shows a row for each prepared input, with its label and the value that will be sent; the catalog's rows are ${JSON.stringify(expected)}.` });
  if (rows.length !== expected.length) return void bad();
  rows.forEach((row, i) => {
    const want = expected[i]!;
    if (!isObj(row) || row.label !== want.label) return void bad();
    if (want.bind !== undefined) {
      if (row.bind !== want.bind || row.raw !== undefined) bad();
    } else if (row.bind !== undefined || typeof row.value !== "string") bad();
    // An id field may show a name, with the id beside it; any other row shows exactly what will be sent.
    else if (a.input[keys[i]!]!.shownAs !== undefined ? (row.raw ?? row.value) !== (want.raw ?? want.value) : row.value !== want.value || row.raw !== undefined) bad();
  });
}

/**
 * Every problem in a composed tree against a catalog: each component is the catalog's, each prop is resolved and of its
 * kind, and each ActionButton is exactly what the catalog says its action's button is, so no adapter and no sender can
 * relabel a button or loosen its consent. An empty list means it renders.
 */
export function validateTree(cat: Catalog, node: unknown, path = ""): TreeProblem[] {
  const problems: TreeProblem[] = [];
  const visit = (n: unknown, at: string): void => {
    if (!isObj(n) || typeof n.id !== "string" || typeof n.component !== "string" || !isObj(n.props) || !Array.isArray(n.children)) {
      problems.push({ path: at, message: "A node is { id, component, props, children }." });
      return;
    }
    const spec = cat.components[n.component];
    if (!spec) {
      problems.push({ path: `${at}/component`, message: `${JSON.stringify(n.component)} is not in this catalog; use one of ${Object.keys(cat.components).join(", ")}.` });
      return;
    }
    const props = n.props;
    const allowed = n.component === "ActionButton" ? BUTTON_PROPS : [...Object.keys(spec.props).filter((k) => spec.props[k]!.type.kind !== "children"), "@label"];
    for (const key of Object.keys(props)) if (!allowed.includes(key)) problems.push({ path: `${at}/props/${key}`, message: `${n.component} has no ${key}.` });
    if (props["@label"] !== undefined && typeof props["@label"] !== "string") problems.push({ path: `${at}/props/@label`, message: "@label is text." });
    for (const [key, p] of Object.entries(spec.props)) {
      if (p.type.kind === "children" || p.type.kind === "action" || p.type.kind === "input") continue;
      const v = props[key];
      if (v === undefined) {
        if (p.required) problems.push({ path: `${at}/props/${key}`, message: `${n.component} needs ${key}: ${p.description}` });
        continue;
      }
      checkProp(problems, key, p, v, `${at}/props/${key}`);
    }
    if (n.component === "ActionButton") {
      const id = props.action;
      const a = typeof id === "string" ? cat.actions[id] : undefined;
      if (!a || typeof id !== "string") problems.push({ path: `${at}/props/action`, message: `${JSON.stringify(id)} is not one of the app's actions: ${Object.keys(cat.actions).join(", ")}.` });
      else {
        const input = props.input;
        if (!isObj(input)) problems.push({ path: `${at}/props/input`, message: "input is an object of field values." });
        else if (a.personOnly && Object.keys(input).length) problems.push({ path: `${at}/props/input`, message: a.personOnly.refusal.summary, refusal: a.personOnly.refusal });
        else {
          for (const [k, v] of Object.entries(input)) {
            // A field the catalog doesn't carry would be sent without a row on the confirm sheet.
            if (!(k in a.input)) problems.push({ path: `${at}/props/input/${k}`, message: `${id} has no input ${k}; its fields are ${Object.keys(a.input).join(", ") || "none"}.` });
            if (isObj(v) && "@path" in v && !(isBinding(v) && v["@path"].startsWith("/"))) problems.push({ path: `${at}/props/input/${k}`, message: `${k} is a value, or {"@path": "/..."} bound to the data model.` });
          }
          const expected = actionButtonProps(cat, id, input as Obj);
          for (const key of ["label", "consent", "press", "handoff"]) {
            if (JSON.stringify(props[key]) !== JSON.stringify(expected[key])) problems.push({ path: `${at}/props/${key}`, message: `${id}'s ${key} is the catalog's ${JSON.stringify(expected[key] ?? null)}, never the sender's.` });
          }
          if (a.press === "confirm") {
            const c = props.confirm;
            if (!isObj(c) || c.title !== a.label || c.description !== a.description || !Array.isArray(c.fields)) problems.push({ path: `${at}/props/confirm`, message: `${id} confirms, with the catalog's title and description and a row per prepared input.` });
            else confirmRowProblems(problems, id, a, input as Obj, c.fields, `${at}/props/confirm/fields`);
          } else if (props.confirm !== undefined) problems.push({ path: `${at}/props/confirm`, message: `${id} doesn't confirm; only a consequential action does.` });
        }
      }
    }
    if (spec.props.children === undefined && n.children.length) problems.push({ path: `${at}/children`, message: `${n.component} has no children.` });
    n.children.forEach((c, i) => visit(c, `${at}/children/${i}`));
  };
  visit(node, path);
  return problems;
}

/** What a press asks the app to do, in any format: the action, the prepared input, and that the person pressed it. */
export interface PersonPress {
  action: string;
  input: Obj;
  consent: Consent;
  /** The button's label, as the person read it. */
  label: string;
  by: "person";
  confirmed?: true;
}

/**
 * A button as it stands when the person presses it: each input bound to the data model (`{"@path"}`) replaced by what
 * `data` holds there now (null when nothing), and each bound row of its confirm sheet showing that value. A renderer
 * calls it with its current data before it shows the confirm sheet or presses.
 */
export function resolveButton(button: ComposedNode, data: Json): ComposedNode {
  const p = button.props;
  if (!isObj(p.input) || !Object.values(p.input).some(isBinding)) return button;
  const input: Obj = Object.fromEntries(Object.entries(p.input).map(([k, v]) => [k, isBinding(v) ? (getPointer(data, v["@path"]) ?? null) : v]));
  const props: Obj = { ...p, input };
  if (isObj(p.confirm) && Array.isArray(p.confirm.fields)) {
    const fields = p.confirm.fields.map((row) => (isObj(row) && typeof row.bind === "string" ? { label: row.label as Json, value: asText(getPointer(data, row.bind)) } : row));
    props.confirm = { ...p.confirm, fields };
  }
  return { ...button, props };
}

/**
 * What pressing a composed button asks the app to do (after confirming, for a consequential one). A person-only button
 * never asks: it hands the person to the app's own screen. An adapter wraps it in its format's message. With `data`,
 * an input bound to a field the person filled in is read from it (resolveButton).
 */
export function personPress(button: ComposedNode, confirmed?: boolean, data?: Json): PersonPress {
  const p = (data === undefined ? button : resolveButton(button, data)).props;
  if (p.press === "handoff") throw new Error(`${String(p.action)} is person-only; its button hands the person to the app, so it sends no action.`);
  if (p.press === "confirm" && confirmed !== true) throw new Error(`${String(p.action)} is consequential; send its action only after the person confirms.`);
  return { action: p.action as string, input: p.input as Obj, consent: p.consent as Consent, label: p.label as string, by: "person", ...(p.press === "confirm" ? { confirmed: true as const } : {}) };
}
