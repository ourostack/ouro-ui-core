export const A2UI_VERSION = "1.0";

// A2UI_VERSION above is A2UI's protocol version these catalogs target. (No comment goes before the first statement:
// shadcn's CLI drops it when web's registry installs this file.)
//
// The A2UI v1.0 adapter for Ouro's composed UI (src/composed.mts): it reads an A2UI catalog into Ouro's, validates an A2UI
// message stream, resolves it into Ouro's composed tree, and wraps a press in A2UI's action message. Everything that is
// not A2UI's (the components, the consent rules, the tree) is composed.mts's, so dropping A2UI drops this file and
// nothing else. Decisions: docs/decisions/2026-11-14-composed-ui-own-tree.md, 2026-11-13-a2ui-catalog.md. Guide:
// docs/guides/a2ui.md.
//
// It imports only composed.mts and mcp-app.mts, so it runs in a browser, a server or a test beside them. Apps vendor it
// from a release as `ouro-a2ui.mts`, beside `ouro-composed.mts` and `ouro-mcp-app.mts`; `a2ui-catalog.mts` writes the
// catalogs.

import {
  ACTION_BUTTON,
  actionButtonProps,
  agentPressProblem,
  asText,
  COMPONENTS,
  personPress,
  type Catalog,
  type CatalogAction,
  type ComponentSpec,
  type ComposedNode,
  type Json,
  type Obj,
  type Refusal,
  type ResolveOptions,
} from "./composed.mts";

export {
  ACTION_BUTTON,
  actionButtonProps,
  asText,
  COMPONENTS,
  pressOf,
  type CatalogAction,
  type ComponentSpec,
  type Consent,
  type Json,
  type LabelContext,
  type Obj,
  type Press,
  type Prop,
  type PropKind,
  type Refusal,
  type ResolveOptions,
} from "./composed.mts";
export { MCP_APP_MIME, mcpAppResource, mcpAppToolMeta } from "./mcp-app.mts";

/** Ouro HX's catalog id; an app's catalog, with its actions, takes its own. */
export const HX_CATALOG_ID = "https://ui.ouroboros.bot/a2ui/v1/catalog.json";
/** The catalog-scope extension key that carries what each action's button does. */
export const EXTENSION = "bot_ouroboros_hx";
/** The action-egress extension key on every A2UI `action` a composed button sends. */
export const ACTION_EXTENSION = "bot_ouroboros_action";

// ---------------------------------------------------------------------------------------------------------------
// Reading a catalog back (renderers and the validator take the JSON, not the action set)
// ---------------------------------------------------------------------------------------------------------------

/** An A2UI catalog read back: Ouro's own catalog (composed.mts). */
export type LoadedCatalog = Catalog;

/** Reads a catalog this file wrote. Its component specs are HX's, so a hand-edited catalog can't widen them. */
export function loadCatalog(cat: unknown): LoadedCatalog {
  const c = cat as { catalogId?: unknown; components?: Record<string, unknown>; metadata?: { extensions?: Record<string, { actions?: Record<string, CatalogAction> }> } };
  if (!c || typeof c.catalogId !== "string" || !c.components) throw new Error("not an A2UI catalog: it has no catalogId or components. Fix: pass a catalog ouro-a2ui wrote.");
  const actions = c.metadata?.extensions?.[EXTENSION]?.actions ?? {};
  const components: Record<string, ComponentSpec> = {};
  for (const name of Object.keys(c.components)) {
    const spec = name === "ActionButton" ? ACTION_BUTTON : COMPONENTS[name];
    if (!spec) throw new Error(`catalog ${c.catalogId}: component ${name} is not Ouro HX's. Fix: regenerate it with ouro-a2ui catalog.`);
    components[name] = spec;
  }
  return { catalogId: c.catalogId, components, actions };
}

// ---------------------------------------------------------------------------------------------------------------
// The validator
// ---------------------------------------------------------------------------------------------------------------

/** A problem in A2UI's standard validation error format, plus the typed refusal when one applies. */
export interface Problem {
  code: "VALIDATION_FAILED" | "INVALID_FUNCTION_CALL" | "INTEGRITY_ERROR";
  surfaceId?: string;
  functionCallId?: string;
  /** A JSON pointer into the message stream, such as /2/updateComponents/components/0/text. */
  path: string;
  message: string;
  refusal?: Refusal;
}

const IDENT = /^[\p{XID_Start}_][\p{XID_Continue}]*$/u;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isBinding = (v: unknown): v is { "@path": string } => isObj(v) && typeof v["@path"] === "string" && Object.keys(v).length === 1;
const isCall = (v: unknown) => isObj(v) && "@call" in v;
const MESSAGE_KEYS = ["createSurface", "updateComponents", "updateDataModel", "deleteSurface", "callRendererFunction", "agentFunctionResponse"];

/** Why an agent can't press a button through the screen: the message for a `callRendererFunction`. */
export const functionCallProblem = (cat: LoadedCatalog, name: unknown): { message: string; refusal?: Refusal } => agentPressProblem(cat, name);

interface Walk {
  cat: LoadedCatalog;
  problems: Problem[];
  surfaceId: string;
}

function checkDynamic(w: Walk, v: unknown, kind: "string" | "strings" | "boolean" | "value", path: string): void {
  if (isCall(v)) {
    w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: "This catalog has no functions; bind to the data model with {\"@path\"} or give the value." });
    return;
  }
  if (isBinding(v)) return;
  const ok =
    kind === "string" ? typeof v === "string"
    : kind === "boolean" ? typeof v === "boolean"
    : kind === "strings" ? Array.isArray(v) && v.every((s) => typeof s === "string")
    : v !== undefined && !(isObj(v) && Object.keys(v).some((k) => k.startsWith("@")));
  if (!ok) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: `Expected ${kind === "strings" ? "a list of strings" : kind === "value" ? "a value" : `a ${kind}`} or {"@path"}, got ${JSON.stringify(v)}.` });
}

function checkInput(w: Walk, action: CatalogAction, id: string, input: unknown, path: string): void {
  if (action.personOnly) {
    if (input !== undefined && !(isObj(input) && Object.keys(input).length === 0)) {
      w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: action.personOnly.refusal.summary, refusal: action.personOnly.refusal });
    }
    return;
  }
  if (input !== undefined && !isObj(input)) {
    w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: "input is an object of field values." });
    return;
  }
  const given = (input ?? {}) as Record<string, unknown>;
  for (const [name, v] of Object.entries(given)) {
    const f = action.input[name];
    const at = `${path}/${name}`;
    if (!f) {
      w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `${id} has no input ${name}; its fields are ${Object.keys(action.input).join(", ") || "none"}.` });
      continue;
    }
    if (isCall(v)) checkDynamic(w, v, "value", at);
    if (isBinding(v) || isCall(v)) continue;
    const ok = f.kind === "string" ? typeof v === "string" : f.kind === "boolean" ? typeof v === "boolean" : f.kind === "enum" ? typeof v === "string" && (f.values ?? []).includes(v) : typeof v === "number" && (f.kind === "number" || Number.isInteger(v));
    if (!ok) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `${f.label} is ${f.kind === "enum" ? `one of ${(f.values ?? []).join(", ")}` : f.kind === "integer" ? "an integer" : `a ${f.kind}`}, got ${JSON.stringify(v)}.` });
  }
  for (const [name, f] of Object.entries(action.input)) {
    if (!f.optional && !(name in given)) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: `${id} needs ${name} (${f.label}) prepared before the person can press it.` });
  }
}

function checkComponent(w: Walk, comp: unknown, path: string, refs: Map<string, string>, ids: Set<string>): void {
  if (!isObj(comp)) {
    w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path, message: "A component is an object with id and component." });
    return;
  }
  const { id, component } = comp;
  if (typeof id !== "string" || !IDENT.test(id)) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${path}/id`, message: `id ${JSON.stringify(id)} is not an identifier: letters, digits and _, not starting with a digit (user_card, not user-card).` });
  else ids.add(id);
  const spec = typeof component === "string" ? w.cat.components[component] : undefined;
  if (!spec) {
    w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${path}/component`, message: `${JSON.stringify(component)} is not in this catalog; use one of ${Object.keys(w.cat.components).join(", ")}.` });
    return;
  }
  if ("@catalogId" in comp && comp["@catalogId"] !== w.cat.catalogId) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${path}/@catalogId`, message: `This renderer has only the catalog ${w.cat.catalogId}.` });
  for (const key of Object.keys(comp)) {
    if (key === "id" || key === "component" || key === "@catalogId" || key === "@metadata" || key === "@accessibility") continue;
    if (!(key in spec.props)) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${path}/${key}`, message: `${component} has no ${key}${Object.keys(spec.props).length ? `; its props are ${Object.keys(spec.props).join(", ")}` : ""}.` });
  }
  if (isObj(comp["@accessibility"])) {
    for (const [k, v] of Object.entries(comp["@accessibility"])) {
      if (k === "label" || k === "description") checkDynamic(w, v, "string", `${path}/@accessibility/${k}`);
      else if (k === "hidden") checkDynamic(w, v, "boolean", `${path}/@accessibility/${k}`);
    }
  }
  for (const [key, p] of Object.entries(spec.props)) {
    const v = comp[key];
    const at = `${path}/${key}`;
    if (v === undefined) {
      if (p.required) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `${component} needs ${key}: ${p.description}` });
      continue;
    }
    const t = p.type;
    switch (t.kind) {
      case "string":
      case "strings":
      case "boolean":
        checkDynamic(w, v, t.kind, at);
        break;
      case "enum":
        if (typeof v !== "string" || !t.values.includes(v)) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `${key} is one of ${t.values.join(", ")}, got ${JSON.stringify(v)}.` });
        break;
      case "level":
        if (v !== 1 && v !== 2 && v !== 3) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `level is 1, 2 or 3, got ${JSON.stringify(v)}.` });
        break;
      case "children":
        if (Array.isArray(v)) v.forEach((c, i) => (typeof c === "string" ? refs.set(c, `${at}/${i}`) : w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${at}/${i}`, message: "A child is a component id." })));
        else if (isObj(v) && typeof v.componentId === "string" && typeof v.path === "string" && Object.keys(v).length === 2) refs.set(v.componentId, `${at}/componentId`);
        else w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: "children is a list of component ids, or a template { componentId, path }." });
        break;
      case "terms":
        if (isBinding(v)) break;
        if (!Array.isArray(v)) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: "items is a list of { term, detail }, or {\"@path\"} to one." });
        else
          v.forEach((it, i) => {
            if (!isObj(it) || Object.keys(it).some((k) => k !== "term" && k !== "detail")) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${at}/${i}`, message: "Each item is { term, detail }." });
            else
              for (const k of ["term", "detail"]) {
                if (it[k] === undefined) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: `${at}/${i}/${k}`, message: `Each item needs ${k}.` });
                else checkDynamic(w, it[k], "string", `${at}/${i}/${k}`);
              }
          });
        break;
      case "action":
        if (typeof v !== "string" || !w.cat.actions[v]) w.problems.push({ code: "VALIDATION_FAILED", surfaceId: w.surfaceId, path: at, message: `${JSON.stringify(v)} is not one of the app's actions: ${Object.keys(w.cat.actions).join(", ")}.` });
        break;
      case "input":
        break;
    }
  }
  if (component === "ActionButton" && typeof comp.action === "string" && w.cat.actions[comp.action]) checkInput(w, w.cat.actions[comp.action]!, comp.action, comp.input, `${path}/input`);
}

/**
 * Every problem in a stream of A2UI messages against a catalog: the envelope, each component and its props, every
 * child id resolving, one root per surface, no cycles, and the action rules. An empty list means it renders.
 */
export function validateMessages(catalogJson: unknown, messages: unknown): Problem[] {
  const cat = loadCatalog(catalogJson);
  const problems: Problem[] = [];
  if (!Array.isArray(messages)) return [{ code: "VALIDATION_FAILED", path: "", message: "Send a list of A2UI messages." }];
  const surfaces = new Map<string, Map<string, { comp: Record<string, unknown>; path: string }>>();
  messages.forEach((m, i) => {
    const at = `/${i}`;
    if (!isObj(m) || m.version !== A2UI_VERSION) {
      problems.push({ code: "VALIDATION_FAILED", path: `${at}/version`, message: `Every message has "version": "${A2UI_VERSION}".` });
      return;
    }
    const keys = Object.keys(m).filter((k) => k !== "version");
    const key = keys[0];
    if (keys.length !== 1 || !key || !MESSAGE_KEYS.includes(key)) {
      problems.push({ code: "VALIDATION_FAILED", path: at, message: `A message has exactly one of ${MESSAGE_KEYS.join(", ")}.` });
      return;
    }
    const body = m[key];
    if (!isObj(body)) {
      problems.push({ code: "VALIDATION_FAILED", path: `${at}/${key}`, message: `${key} is an object.` });
      return;
    }
    if (key === "callRendererFunction") {
      const call = isObj(body.callFunction) ? body.callFunction["@call"] : undefined;
      const p = functionCallProblem(cat, call);
      problems.push({ code: "INVALID_FUNCTION_CALL", functionCallId: typeof body.functionCallId === "string" ? body.functionCallId : "", path: `${at}/callRendererFunction/callFunction`, message: p.message, ...(p.refusal ? { refusal: p.refusal } : {}) });
      return;
    }
    if (key === "agentFunctionResponse") {
      problems.push({ code: "INVALID_FUNCTION_CALL", path: `${at}/agentFunctionResponse`, message: "This catalog's renderers call no agent functions, so there is nothing to answer." });
      return;
    }
    const surfaceId = body.surfaceId;
    if (typeof surfaceId !== "string" || surfaceId === "") {
      problems.push({ code: "VALIDATION_FAILED", path: `${at}/${key}/surfaceId`, message: "surfaceId is a non-empty string." });
      return;
    }
    const w: Walk = { cat, problems, surfaceId };
    if (key === "createSurface") {
      if (surfaces.has(surfaceId)) problems.push({ code: "INTEGRITY_ERROR", surfaceId, path: `${at}/createSurface/surfaceId`, message: `Surface ${surfaceId} already exists; delete it first or use another id.` });
      if (body.catalogId !== cat.catalogId) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/createSurface/catalogId`, message: `catalogId is ${cat.catalogId}.` });
      if ("theme" in body) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/createSurface/theme`, message: "A2UI v1.0 has no theme; the app's HX theme styles the surface." });
      if ("dataModel" in body && !isObj(body.dataModel)) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/createSurface/dataModel`, message: "dataModel is an object." });
      surfaces.set(surfaceId, new Map());
    } else if (!surfaces.has(surfaceId)) {
      problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/${key}/surfaceId`, message: `Create surface ${surfaceId} before ${key}.` });
      return;
    }
    if (key === "deleteSurface") {
      surfaces.delete(surfaceId);
      return;
    }
    if (key === "updateDataModel") {
      if (body.path !== undefined && (typeof body.path !== "string" || (body.path !== "" && !body.path.startsWith("/")))) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/updateDataModel/path`, message: "path is a JSON pointer starting with /." });
      if (!("value" in body)) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/updateDataModel/value`, message: "updateDataModel needs value (null deletes)." });
      return;
    }
    const list = body.components;
    if (list === undefined && key === "createSurface") return;
    if (!Array.isArray(list)) {
      problems.push({ code: "VALIDATION_FAILED", surfaceId, path: `${at}/${key}/components`, message: "components is a list." });
      return;
    }
    const byId = surfaces.get(surfaceId)!;
    list.forEach((c, j) => {
      const cpath = `${at}/${key}/components/${j}`;
      const ids = new Set<string>();
      checkComponent(w, c, cpath, new Map(), ids);
      if (isObj(c) && typeof c.id === "string") byId.set(c.id, { comp: c, path: cpath });
    });
  });
  // The tree each surface ends with: every child resolves, one root, no cycles.
  for (const [surfaceId, byId] of surfaces) {
    if (byId.size === 0) continue;
    if (!byId.has("root")) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: "", message: "One component must have id root; it is what the surface shows." });
    for (const { comp, path } of byId.values()) {
      for (const [child, at] of childRefs(comp, path)) {
        if (!byId.has(child)) problems.push({ code: "VALIDATION_FAILED", surfaceId, path: at, message: `No component has id ${child}.` });
        if (child === "root") problems.push({ code: "VALIDATION_FAILED", surfaceId, path: at, message: "root can't be a child." });
      }
    }
    const seen = new Set<string>();
    const visit = (id: string, stack: string[]): void => {
      if (stack.includes(id)) {
        problems.push({ code: "VALIDATION_FAILED", surfaceId, path: byId.get(id)!.path, message: `The tree loops: ${[...stack, id].join(" > ")}.` });
        return;
      }
      if (seen.has(id) || !byId.has(id)) return;
      for (const [child] of childRefs(byId.get(id)!.comp, "")) visit(child, [...stack, id]);
      seen.add(id);
    };
    if (byId.has("root")) visit("root", []);
  }
  return problems;
}

function childRefs(comp: Record<string, unknown>, path: string): [string, string][] {
  const out: [string, string][] = [];
  const v = comp.children;
  if (Array.isArray(v)) v.forEach((c, i) => typeof c === "string" && out.push([c, `${path}/children/${i}`]));
  else if (isObj(v) && typeof v.componentId === "string") out.push([v.componentId, `${path}/children/componentId`]);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// The reference resolver: what every renderer must show
// ---------------------------------------------------------------------------------------------------------------

/** A resolved node is a node of Ouro's composed tree (composed.mts); A2UI's sourceComponentId is its id. */
export type Resolved = ComposedNode;

interface Surface {
  catalogId: string;
  components: Map<string, Record<string, unknown>>;
  data: Json;
}

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

/** Writes a JSON pointer, creating objects on the way; null deletes. */
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

/** Applies a stream to surfaces. Throws on a stream the validator would reject; validate first. */
export function applyMessages(messages: readonly unknown[], surfaces = new Map<string, Surface>()): Map<string, Surface> {
  for (const m of messages as Record<string, Record<string, unknown>>[]) {
    if (m.createSurface) {
      const b = m.createSurface;
      const s: Surface = { catalogId: String(b.catalogId), components: new Map(), data: (b.dataModel as Json) ?? {} };
      for (const c of (b.components as Record<string, unknown>[]) ?? []) s.components.set(String(c.id), c);
      surfaces.set(String(b.surfaceId), s);
    } else if (m.updateComponents) {
      const s = surfaces.get(String(m.updateComponents.surfaceId))!;
      for (const c of m.updateComponents.components as Record<string, unknown>[]) s.components.set(String(c.id), c);
    } else if (m.updateDataModel) {
      const s = surfaces.get(String(m.updateDataModel.surfaceId))!;
      s.data = setPointer(s.data, String(m.updateDataModel.path ?? "/"), m.updateDataModel.value as Json);
    } else if (m.deleteSurface) surfaces.delete(String(m.deleteSurface.surfaceId));
  }
  return surfaces;
}

/** Resolves a pointer in a scope: absolute from the root, relative from the template item's path. */
const scoped = (scope: string, p: string) => (p.startsWith("/") ? p : p === "" ? scope : `${scope}/${p}`);

function resolveValue(data: Json, scope: string, v: unknown): Json | undefined {
  if (isBinding(v)) return getPointer(data, scoped(scope, v["@path"]));
  return v as Json;
}

/** One surface as every renderer must show it. */
export function resolveSurface(catalogJson: unknown, surface: Surface, options: ResolveOptions = {}): Resolved | null {
  const cat = loadCatalog(catalogJson);
  const root = surface.components.get("root");
  if (!root) return null;
  const node = (comp: Record<string, unknown>, scope: string): Resolved => {
    const name = String(comp.component);
    const spec = cat.components[name]!;
    const props: Obj = {};
    const children: Resolved[] = [];
    for (const [key, p] of Object.entries(spec.props)) {
      const raw = comp[key];
      const t = p.type;
      switch (t.kind) {
        case "string":
          if (raw !== undefined || p.required) props[key] = asText(resolveValue(surface.data, scope, raw));
          break;
        case "strings": {
          const v = resolveValue(surface.data, scope, raw);
          props[key] = Array.isArray(v) ? v.map((x) => asText(x)) : [];
          break;
        }
        case "boolean": {
          const v = raw === undefined ? t.default : resolveValue(surface.data, scope, raw);
          props[key] = v === true;
          break;
        }
        case "enum":
          props[key] = typeof raw === "string" ? raw : t.default;
          break;
        case "level":
          props[key] = typeof raw === "number" ? raw : t.default;
          break;
        case "terms": {
          const v = resolveValue(surface.data, scope, raw);
          const base = isBinding(raw) ? scoped(scope, raw["@path"]) : scope;
          props[key] = Array.isArray(v)
            ? v.map((it, i) => ({
                term: asText(resolveValue(surface.data, isBinding(raw) ? `${base}/${i}` : scope, isObj(it) ? it.term : undefined)),
                detail: asText(resolveValue(surface.data, isBinding(raw) ? `${base}/${i}` : scope, isObj(it) ? it.detail : undefined)),
              }))
            : [];
          break;
        }
        case "children": {
          if (Array.isArray(raw)) {
            for (const id of raw) {
              const c = surface.components.get(String(id));
              if (c) children.push(node(c, scope));
            }
          } else if (isObj(raw)) {
            const base = scoped(scope, String(raw.path));
            const list = getPointer(surface.data, base);
            const tpl = surface.components.get(String(raw.componentId));
            if (Array.isArray(list) && tpl) list.forEach((_, i) => children.push(node(tpl, `${base}/${i}`)));
          }
          break;
        }
        case "action":
        case "input":
          break;
      }
    }
    if (name === "ActionButton") {
      const id = String(comp.action);
      const input: Obj = {};
      if (!cat.actions[id]!.personOnly && isObj(comp.input)) for (const [k, v] of Object.entries(comp.input)) input[k] = resolveValue(surface.data, scope, v) ?? null;
      Object.assign(props, actionButtonProps(cat, id, input, options));
    }
    if (isObj(comp["@accessibility"]) && comp["@accessibility"].label !== undefined) props["@label"] = asText(resolveValue(surface.data, scope, comp["@accessibility"].label));
    return { id: String(comp.id), component: name, props, children };
  };
  return node(root, "");
}

/** Every surface a stream leaves, resolved; the validator's problems instead when it has any. */
export function resolveMessages(catalogJson: unknown, messages: readonly unknown[], options: ResolveOptions = {}): { surfaces: Record<string, Resolved | null> } | { problems: Problem[] } {
  const problems = validateMessages(catalogJson, messages);
  if (problems.length) return { problems };
  const surfaces: Record<string, Resolved | null> = {};
  for (const [id, s] of applyMessages(messages)) surfaces[id] = resolveSurface(catalogJson, s, options);
  return { surfaces };
}

/**
 * The A2UI `action` message a composed button sends when the person presses it (after confirming, for a
 * consequential one). A person-only button never sends one: it hands the person to the app's own screen.
 */
export function actionMessage(args: { surfaceId: string; sourceComponentId: string; button: Resolved; timestamp: string; confirmed?: boolean }): Obj {
  const press = personPress(args.button, args.confirmed);
  return {
    version: A2UI_VERSION,
    action: {
      name: press.action,
      surfaceId: args.surfaceId,
      sourceComponentId: args.sourceComponentId,
      timestamp: args.timestamp,
      userMessage: press.label,
      context: press.input,
      metadata: { extensions: { [ACTION_EXTENSION]: { consent: press.consent, by: press.by, ...(press.confirmed ? { confirmed: true } : {}) } } },
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// MCP Apps: a tool result that carries an A2UI stream (src/mcp-app.mts carries Ouro's tree itself)
// ---------------------------------------------------------------------------------------------------------------

/**
 * A tool result carrying A2UI messages: `content` is the text an agent and a text-only host read, and
 * `structuredContent.a2ui` the surface the view renders. Throws, with the problems, when the messages don't validate.
 */
export function mcpAppToolResult(args: { text: string; catalog: unknown; messages: readonly unknown[] }) {
  const problems = validateMessages(args.catalog, args.messages);
  if (problems.length) throw new Error(`the A2UI messages don't validate: ${problems.map((p) => `${p.path} ${p.message}`).join("; ")}`);
  return {
    content: [{ type: "text" as const, text: args.text }],
    structuredContent: { a2ui: { version: A2UI_VERSION, catalogId: loadCatalog(args.catalog).catalogId, messages: args.messages as Json[] } },
  };
}

