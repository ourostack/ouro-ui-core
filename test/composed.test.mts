import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadCatalog, resolveMessages } from "../src/a2ui.mts";
import { actionButtonProps, applyTreeUpdate, COMPONENTS, componentsFor, getPointer, INPUT_COMPONENTS, isDataPointer, personPress, resolveButton, setPointer, treeUpdateProblems, validateTree, type ComposedNode, type Json, type TreeProblem } from "../src/composed.mts";
import { MCP_APP_MIME, mcpAppResource, mcpAppToolMeta, mcpAppTreeResult, mcpAppTreeUpdateResult } from "../src/mcp-app.mts";

// Ouro's composed tree is the source of truth (docs/decisions/2026-11-14-composed-ui-own-tree.md): every tree the A2UI
// adapter resolves must pass the tree's own validator, and a tree that relabels a button or loosens its consent must not,
// whichever format or sender it came from.

const root = new URL("../", import.meta.url);
const read = async (p: string) => JSON.parse(await readFile(new URL(p, root), "utf8"));
const appJson = await read("standard/hx/a2ui/conformance/recipe.catalog.json");
const app = loadCatalog(appJson);
const hx = loadCatalog(await read("standard/hx/a2ui/catalog.json"));
const names = (await readdir(new URL("standard/hx/a2ui/conformance/cases/", root))).filter((f) => f.endsWith(".json")).sort();
const cases = await Promise.all(names.map(async (n) => ({ name: n, ...(await read(`standard/hx/a2ui/conformance/cases/${n}`)) })));
const catalogs = { "catalog.json": hx, "recipe.catalog.json": app } as Record<string, typeof app>;
const buttons = (cases.find((c) => c.name === "action-buttons.json")!.expect as { surfaces: Record<string, ComposedNode> }).surfaces.buttons!;
const [open, shop, share, order] = buttons.children as [ComposedNode, ComposedNode, ComposedNode, ComposedNode];
const card = (children: ComposedNode[]): ComposedNode => ({ id: "root", component: "Card", props: {}, children });
const clone = (n: ComposedNode): ComposedNode => structuredClone(n);

test("every tree the A2UI adapter resolves passes the composed tree's own validator", () => {
  const valid = cases.filter((c) => !c.name.startsWith("invalid-"));
  assert.ok(valid.length >= 6);
  for (const c of valid) {
    for (const [id, tree] of Object.entries((c.expect as { surfaces: Record<string, ComposedNode | null> }).surfaces)) {
      if (tree) assert.deepEqual(validateTree(catalogs[c.catalog]!, tree), [], `${c.name} surface ${id}`);
    }
  }
});

test("a tree can't relabel a button, loosen its consent or drop its confirm sheet", () => {
  const relabeled = clone(share);
  relabeled.props.label = "Add to list";
  assert.match(validateTree(app, card([relabeled]))[0]!.message, /share_recipe's label is the catalog's "Share recipe", never the sender's/);
  const loosened = clone(share);
  loosened.props.press = "run";
  assert.ok(validateTree(app, card([loosened])).some((p) => p.path === "/children/0/props/press"));
  const unconfirmed = clone(share);
  delete unconfirmed.props.confirm;
  assert.match(validateTree(app, card([unconfirmed]))[0]!.message, /confirms, with the catalog's title/);
  const confirmsWrite = clone(shop);
  confirmsWrite.props.confirm = share.props.confirm!;
  assert.match(validateTree(app, card([confirmsWrite]))[0]!.message, /doesn't confirm/);
  const ordered = clone(order);
  ordered.props.input = { recipe: "rcp_123" };
  assert.equal(validateTree(app, card([ordered]))[0]!.refusal?.error.code, "person-only");
  const unknown = clone(open);
  unknown.props.action = "pay";
  assert.match(validateTree(app, card([unknown]))[0]!.message, /not one of the app's actions/);
});

test("a confirm sheet can't show the person one value and send another (ouro-ui-core#88)", () => {
  const forged = clone(share);
  const fields = (forged.props.confirm as { fields: Json[] }).fields as { label: string; value: string; raw?: string }[];
  fields[fields.length - 1]!.value = "friend@example.com";
  assert.match(validateTree(app, card([forged]))[0]!.message, /confirm sheet shows a row for each prepared input/);
  const dropped = clone(share);
  (dropped.props.confirm as { fields: Json[] }).fields.pop();
  assert.match(validateTree(app, card([dropped]))[0]!.message, /confirm sheet shows a row/);
  const relabeled = clone(share);
  ((relabeled.props.confirm as { fields: Json[] }).fields[0] as { label: string }).label = "Dinner";
  assert.match(validateTree(app, card([relabeled]))[0]!.message, /confirm sheet shows a row/);
  const named = clone(share);
  const first = (named.props.confirm as { fields: Json[] }).fields[0] as { value: string; raw?: string };
  first.raw = first.value;
  first.value = "My lemon orzo";
  assert.deepEqual(validateTree(app, card([named])), [], "the app's own words for an id may differ, beside the id itself");
  const hidden = clone(share);
  const sendTo = (hidden.props.confirm as { fields: Json[] }).fields[1] as { value: string; raw?: string };
  sendTo.raw = sendTo.value;
  sendTo.value = "friend@example.com";
  assert.match(validateTree(app, card([hidden]))[0]!.message, /confirm sheet shows a row/, "a field that is no id can't show other words with the real value small beside them");
  const extra = clone(share);
  (extra.props.input as Record<string, Json>).everyone = true;
  assert.match(validateTree(app, card([extra]))[0]!.message, /share_recipe has no input everyone/, "an input the catalog doesn't carry would be sent with no row");
});

test("a name a sender chooses is the catalog's only when the catalog itself has it, never an object's built-in (ouro-ui-core#91)", () => {
  for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
    const extra = clone(share);
    (extra.props.input as Record<string, Json>) = JSON.parse(`{"recipe":"rcp_123","with":"sam@example.com",${JSON.stringify(name)}:true}`);
    assert.ok(validateTree(app, card([extra])).some((p) => p.message.includes(`share_recipe has no input ${name}`)), `input ${name}`);
    assert.match(validateTree(app, card([{ id: "x", component: name, props: {}, children: [] }]))[0]!.message, /is not in this catalog/, `component ${name}`);
    const button = clone(open);
    button.props.action = name;
    assert.match(validateTree(app, card([button]))[0]!.message, /not one of the app's actions/, `action ${name}`);
  }
});

test("a pointer never reaches an object's prototype: reads find nothing, writes write nothing, and the validators refuse it", () => {
  const before = Object.getOwnPropertyNames(Object.prototype).sort();
  for (const p of ["/__proto__/polluted", "/constructor/prototype/polluted", "/a/__proto__/toString"]) {
    assert.deepEqual(setPointer({ a: {} }, p, "yes"), { a: {} });
    assert.deepEqual(setPointer({ a: {} }, p, null), { a: {} });
    assert.equal(isDataPointer(p), false);
  }
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype).sort(), before);
  assert.equal(getPointer({ a: 1 }, "/toString"), undefined, "an inherited member is no data");
  assert.equal(getPointer({ a: 1 }, "/__proto__"), undefined);
  const field = card([{ id: "f", component: "TextField", props: { label: "X", value: "/__proto__/x", type: "text", multiline: false }, children: [] }]);
  assert.match(validateTree(hx, field)[0]!.message, /JSON pointer into the data model/);
  const bound = clone(shop);
  bound.props.input = { recipe: "rcp_123", servings: { "@path": "/__proto__/servings" } };
  assert.ok(validateTree(app, card([bound])).length > 0);
});

test("a tree names only the catalog's components and their props, resolved", () => {
  assert.match(validateTree(hx, { id: "root", component: "Button", props: {}, children: [] })[0]!.message, /not in this catalog/);
  assert.match(validateTree(hx, { id: "root", component: "Text", props: { text: { "@path": "/x" }, tone: "default" }, children: [] })[0]!.message, /text is text/);
  assert.match(validateTree(hx, { id: "root", component: "Badge", props: { text: "Hi", tone: "loud" }, children: [] })[0]!.message, /one of neutral, info/);
  assert.match(validateTree(hx, { id: "root", component: "Text", props: { text: "Hi", tone: "default", colour: "red" }, children: [] })[0]!.message, /Text has no colour/);
  assert.match(validateTree(hx, { id: "root", component: "Image", props: { url: "https://x/y.jpg", aspect: "square" }, children: [] })[0]!.message, /needs description/);
  assert.match(validateTree(hx, { id: "root", component: "Separator", props: {}, children: [{ id: "a", component: "Separator", props: {}, children: [] }] })[0]!.message, /Separator has no children/);
  assert.match(validateTree(hx, { id: "root", component: "Card" })[0]!.message, /A node is/);
  assert.match(validateTree(hx, card([{ id: "a", component: "ActionButton", props: {}, children: [] }]))[0]!.message, /not in this catalog/, "HX's own catalog has no actions, so no button");
  assert.deepEqual(Object.keys(componentsFor({})), Object.keys(COMPONENTS));
});

test("a press is the action, the prepared input and that the person pressed it; a confirm only after the person confirms", () => {
  assert.deepEqual(personPress(shop), { action: "add_recipe_to_shopping_list", input: { recipe: "rcp_123", servings: 4 }, consent: "write", label: "Add ingredients to list", by: "person" });
  assert.throws(() => personPress(share), /only after the person confirms/);
  assert.equal(personPress(share, true).confirmed, true);
  assert.throws(() => personPress(order), /person-only/);
});

test("a field writes the person's answer into the data, and a button bound to it sends that answer when they press", () => {
  const c = cases.find((x) => x.name === "inputs.json")!;
  const plan = (c.expect as { surfaces: Record<string, ComposedNode> }).surfaces.plan!;
  const find = (n: ComposedNode, id: string): ComposedNode | undefined => (n.id === id ? n : n.children.map((ch) => find(ch, id)).find(Boolean));
  for (const name of INPUT_COMPONENTS) assert.ok(JSON.stringify(plan).includes(`"component":"${name}"`), `the case covers ${name}`);
  const shopBound = find(plan, "shop")!;
  const shareBound = find(plan, "share")!;
  // The person types 6 servings and an address: the data changes where each field's value points.
  let data = (c.messages[0] as { createSurface: { dataModel: Json } }).createSurface.dataModel;
  assert.equal(getPointer(data, find(plan, "servings")!.props.value as string), 4, "a field starts with what the data holds");
  data = setPointer(data, "/servings", 6);
  data = setPointer(data, "/share/with", "sam@example.com");
  assert.deepEqual(personPress(shopBound, undefined, data).input, { recipe: "rcp_lemon_orzo", servings: 6 }, "the press sends the answer, and the unbound recipe stays as resolved");
  const sheet = resolveButton(shareBound, data).props.confirm as { fields: Json[] };
  assert.deepEqual(sheet.fields, [{ label: "Recipe", value: "Lemon orzo", raw: "rcp_lemon_orzo" }, { label: "Send to", value: "sam@example.com" }], "the confirm sheet shows what the person typed");
  assert.equal(personPress(shareBound, true, data).input.with, "sam@example.com");
  assert.equal(personPress(shareBound, true, setPointer(data, "/share/with", null)).input.with, null, "an empty answer is sent as null, and the app's tool refuses it");
  assert.equal(resolveButton(find(plan, "title")!, data), find(plan, "title"), "a node with nothing bound comes back as it is");
});

test("a button bound to data no field writes reads it now, an object as it is, and never follows a value shaped like a binding", () => {
  const surface = (dataModel: Json) => [{ version: "1.0", createSurface: { surfaceId: "s", catalogId: app.catalogId, dataModel, components: [{ id: "root", component: "Card", children: ["share"] }, { id: "share", component: "ActionButton", action: "share_recipe", input: { recipe: { "@path": "/recipe" }, with: "sam@example.com" }, "@accessibility": { label: "Share it" } }] } }];
  const resolved = (dataModel: Json) => ((resolveMessages(appJson, surface(dataModel)) as { surfaces: Record<string, ComposedNode> }).surfaces.s!.children[0]!);
  const object = resolved({ recipe: { id: "r1" } });
  assert.deepEqual(object.props.input, { recipe: { id: "r1" }, with: "sam@example.com" });
  assert.deepEqual(validateTree(app, card([object])), []);
  const posing = resolved({ recipe: { "@path": "/secret" }, secret: "S" });
  assert.equal((posing.props.input as Record<string, Json>).recipe, '{"@path":"/secret"}');
  assert.equal(personPress(posing, true, { secret: "S" }).input.recipe, '{"@path":"/secret"}');
  assert.deepEqual(Object.keys(object.props).slice(-1), ["@label"], "a button's @label comes after the catalog's props, as before fields");
});

test("a field's value is a pointer into the data, and a bound input is one too", () => {
  const field = (props: Record<string, Json>): ComposedNode => card([{ id: "f", component: "TextField", props: { label: "Servings", type: "text", multiline: false, ...props }, children: [] }]);
  assert.deepEqual(validateTree(hx, field({ value: "/servings" })), []);
  assert.match(validateTree(hx, field({ value: "servings" }))[0]!.message, /value is a JSON pointer into the data model/);
  assert.match(validateTree(hx, field({}))[0]!.message, /TextField needs value/);
  const bound = clone(shop);
  bound.props.input = { recipe: "rcp_123", servings: { "@path": "servings" } };
  assert.match(validateTree(app, card([bound]))[0]!.message, /servings is a value, or \{"@path": "\/\.\.\."\}/);
});

test("a button's props come from the catalog: the agent only prepares the input", () => {
  assert.deepEqual(actionButtonProps(app, "order_ingredients", { recipe: "rcp_123" }).input, {}, "a person-only button carries no input");
  const props = actionButtonProps(app, "share_recipe", { recipe: "rcp_123", with: "sam@example.com" });
  assert.equal(props.label, "Share recipe");
  assert.equal(props.press, "confirm");
});

test("MCP Apps carries Ouro's tree itself, validated, with no A2UI in it", () => {
  const tree = card([shop]);
  const result = mcpAppTreeResult({ text: "Lemon orzo", catalog: app, tree });
  assert.deepEqual(result.structuredContent, { ouro: { version: "1", catalogId: app.catalogId, tree } });
  assert.deepEqual(result.content, [{ type: "text", text: "Lemon orzo" }]);
  const forged = clone(share);
  forged.props.press = "run";
  assert.throws(() => mcpAppTreeResult({ text: "x", catalog: app, tree: card([forged]) }), /doesn't validate/);
  assert.equal(mcpAppResource({ uri: "ui://kitchen/card", name: "Card", html: "<p>" }).contents.mimeType, MCP_APP_MIME);
  assert.deepEqual(mcpAppToolMeta("ui://kitchen/card"), { ui: { resourceUri: "ui://kitchen/card" } });
});

test("the A2UI adapter's tree is the composed tree: resolving a case gives what the tree validator accepts", async () => {
  const c = cases.find((x) => x.name === "recipe-card-agent.json")!;
  const out = resolveMessages(await read(`standard/hx/a2ui/conformance/${c.catalog}`), c.messages) as { surfaces: Record<string, ComposedNode> };
  for (const tree of Object.values(out.surfaces)) assert.deepEqual(validateTree(catalogs[c.catalog]!, tree), []);
});

test("the composed tree, its MCP Apps helpers and the A2UI adapter declare no name twice, so an app can join them into one file", async () => {
  // Web vendors the three as one registry file with the imports between them taken out (ouro-ui's
  // scripts/core-bundle.mts), so an app that adds it needs no `.mts` import paths.
  const seen = new Map<string, string>();
  for (const file of ["src/composed.mts", "src/mcp-app.mts", "src/a2ui.mts"]) {
    const source = await readFile(new URL(file, root), "utf8");
    for (const [, name] of source.matchAll(/^(?:export )?(?:const|let|function|type|interface|class|enum) ([A-Za-z_$][\w$]*)/gm)) {
      assert.equal(seen.get(name!), undefined, `${file} declares ${name}, which ${seen.get(name!)} already declares`);
      seen.set(name!, file);
    }
  }
});

test("no doc block in the modules web vendors is followed straight by another, which web's lint refuses as describing nothing", async () => {
  for (const file of ["src/composed.mts", "src/mcp-app.mts", "src/a2ui.mts"]) {
    const source = await readFile(new URL(file, root), "utf8");
    const lines = [...source.matchAll(/\*\/\n\s*\/\*\*/g)].map((m) => source.slice(0, m.index).split("\n").length);
    assert.deepEqual(lines, [], `${file} has a doc block at line ${lines.join(", ")} that another doc block follows directly`);
  }
});

const updateNames = (await readdir(new URL("standard/hx/composed/updates/", root))).filter((f) => f.endsWith(".json")).sort();
const updateCases = await Promise.all(updateNames.map(async (n) => ({ name: n, ...(await read(`standard/hx/composed/updates/${n}`)) })));
const freeze = <T,>(v: T): T => {
  if (v && typeof v === "object") for (const x of Object.values(v)) freeze(x);
  return Object.freeze(v);
};
const problemsOf = (r: ReturnType<typeof applyTreeUpdate>): TreeProblem[] => ("problems" in r ? r.problems : []);
const plan = (updateCases.find((c) => c.name === "replace-and-set.json")!.tree) as ComposedNode;

test("every tree update case gives what its expect says, from frozen inputs, and an invalid one gives only problems", () => {
  assert.ok(updateCases.length >= 5);
  for (const c of updateCases) {
    const result = applyTreeUpdate(catalogs[c.catalog]!, freeze(structuredClone(c.tree)), freeze(structuredClone(c.data)), freeze(structuredClone(c.update)));
    assert.deepEqual(result, c.expect, c.name);
    assert.equal(c.name.startsWith("invalid-"), "problems" in result, c.name);
    if ("tree" in result) assert.deepEqual(validateTree(catalogs[c.catalog]!, result.tree), [], c.name);
  }
});

test("an update replaces the one node with its id, in order, and refuses an id the tree lacks or a template's instances share", () => {
  const heading = (id: string, text: string): ComposedNode => ({ id, component: "Heading", props: { text, level: 2 }, children: [] });
  const tree = card([{ id: "box", component: "Card", props: {}, children: [heading("a", "A")] }]);
  const nested = applyTreeUpdate(hx, tree, undefined, { nodes: [{ id: "box", component: "Card", props: {}, children: [heading("b", "B")] }, heading("b", "B2")] });
  assert.deepEqual(nested, { tree: card([{ id: "box", component: "Card", props: {}, children: [heading("b", "B2")] }]), data: undefined }, "each node applies to the tree the ones before it left");
  assert.deepEqual(problemsOf(applyTreeUpdate(hx, tree, undefined, { nodes: [heading("box", "Box"), heading("a", "A2")] })).map((p) => p.path), ["/nodes/1/id"], "a node the update replaced away is no longer in the tree");
  assert.deepEqual(applyTreeUpdate(hx, tree, undefined, { nodes: [card([])] }), { tree: card([]), data: undefined }, "the root is a node like any other");
  const shared = card([heading("day", "Monday"), heading("day", "Tuesday")]);
  assert.match(problemsOf(applyTreeUpdate(hx, shared, undefined, { nodes: [heading("day", "Wednesday")] }))[0]!.message, /names 2 nodes, a template's instances; replace the node that holds them/);
  assert.match(problemsOf(applyTreeUpdate(hx, tree, undefined, { nodes: [heading("c", "C")] }))[0]!.message, /"c" is not in the tree/);
  for (const name of ["__proto__", "constructor", "toString"]) assert.match(problemsOf(applyTreeUpdate(hx, tree, undefined, { nodes: [heading(name, "X")] }))[0]!.message, /is not in the tree/, name);
});

test("an update can't relabel a button, loosen its consent or forge its confirm sheet, and a refused update applies nothing", () => {
  const tree = card([clone(shop), clone(share)]);
  const loosened = clone(share);
  loosened.props.press = "run";
  assert.ok(problemsOf(applyTreeUpdate(app, tree, {}, { nodes: [loosened] })).some((p) => p.path === "/nodes/0/props/press"));
  const forged = clone(share);
  ((forged.props.confirm as { fields: Json[] }).fields[1] as { value: string }).value = "friend@example.com";
  assert.match(problemsOf(applyTreeUpdate(app, tree, {}, { nodes: [forged] }))[0]!.message, /confirm sheet shows a row/);
  const relabeled = clone(shop);
  relabeled.props.label = "Buy now";
  const mixed = applyTreeUpdate(app, tree, { servings: 4 }, { nodes: [relabeled], data: [{ path: "/servings", value: 6 }] });
  assert.deepEqual(Object.keys(mixed), ["problems"], "the valid data in a refused update doesn't apply either");
  assert.match(problemsOf(applyTreeUpdate(app, tree, {}, { nodes: [{ id: "shop", component: "Button", props: {}, children: [] }] }))[0]!.message, /not in this catalog/);
  assert.deepEqual(problemsOf(applyTreeUpdate(app, card([relabeled]), {}, { data: [{ path: "/x", value: 1 }] })).map((p) => p.path), ["/children/0/props/label"], "a tree that was already invalid gives no tree");
});

test("an update's data path stays in the data: never a prototype, a list only at an index, and the data model an object", () => {
  const before = Object.getOwnPropertyNames(Object.prototype).sort();
  for (const path of ["/__proto__/polluted", "/constructor/prototype/polluted", "/a/__proto__", "servings", ""]) {
    assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { data: [{ path, value: true }] })).map((p) => p.path), ["/data/0/path"], path);
  }
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype).sort(), before);
  const list = { steps: ["a", "b"] };
  assert.deepEqual(applyTreeUpdate(app, plan, list, { data: [{ path: "/steps/2", value: "c" }, { path: "/steps/0", value: null }] }), { tree: plan, data: { steps: ["b", "c"] } }, "a list grows at its length, and null takes an item out");
  assert.match(problemsOf(applyTreeUpdate(app, plan, list, { data: [{ path: "/steps/5", value: "c" }] }))[0]!.message, /an index from 0 to 2/);
  assert.match(problemsOf(applyTreeUpdate(app, plan, list, { data: [{ path: "/steps/first", value: "c" }] }))[0]!.message, /an index from 0 to 2/);
  assert.deepEqual(applyTreeUpdate(app, plan, list, { data: [{ path: "/", value: { servings: 2 } }] }), { tree: plan, data: { servings: 2 } }, "/ is the whole data model");
  assert.match(problemsOf(applyTreeUpdate(app, plan, list, { data: [{ path: "/", value: 5 }] }))[0]!.message, /The data model is an object/);
  assert.deepEqual(applyTreeUpdate(app, plan, undefined, { data: [{ path: "/servings", value: 6 }] }), { tree: plan, data: { servings: 6 } }, "a tree with no data model starts one");
  assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { data: [{ path: "/x" }] })).map((p) => p.path), ["/data/0"]);
});

test("an update is { nodes?, data? }, and its result shares no object with the inputs", () => {
  assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { tree: plan })).map((p) => p.path), ["/tree"]);
  assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, null)).map((p) => p.path), [""]);
  assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { nodes: {}, data: "x" })).map((p) => p.path), ["/nodes", "/data"]);
  const node: ComposedNode = { id: "title", component: "Heading", props: { text: "New", level: 1 }, children: [] };
  const data = { servings: { count: 4 } };
  const result = applyTreeUpdate(app, plan, data, { nodes: [node] }) as { tree: ComposedNode; data: { servings: { count: number } } };
  result.tree.children[0]!.props.text = "Changed";
  result.tree.children[1]!.props.label = "Changed";
  result.data.servings.count = 9;
  assert.equal(node.props.text, "New");
  assert.equal(plan.children[1]!.props.label, "Servings");
  assert.equal(data.servings.count, 4);
  const value = { count: 6 };
  const set = applyTreeUpdate(app, plan, {}, { data: [{ path: "/servings", value }] }) as unknown as { data: { servings: { count: number } } };
  const whole = applyTreeUpdate(app, plan, {}, { data: [{ path: "/", value }] }) as unknown as { data: { count: number } };
  assert.notEqual(set.data.servings, value, "a value the update sets is copied, not shared");
  assert.notEqual(whole.data, value);
  assert.deepEqual(treeUpdateProblems(app, { nodes: [node], data: [{ path: "/servings", value: null }] }), []);
});

test("an update is JSON all the way down, and a tree given broken gives problems, never a throw", () => {
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  for (const [value, path] of [[NaN, "/data/0/value"], [Infinity, "/data/0/value"], [() => 1, "/data/0/value"], [new Date(0), "/data/0/value"], [[1, , 3], "/data/0/value/1"], [cyclic, "/data/0/value/self"], [{ "a/b": undefined }, "/data/0/value/a~1b"]] as const) {
    assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { data: [{ path: "/x", value }, { path: "/y", value: 1 }] })).map((p) => p.path), [path], String(path));
  }
  const fn = clone(shop);
  (fn.props.input as Record<string, unknown>).recipe = () => "rcp";
  assert.deepEqual(problemsOf(applyTreeUpdate(app, plan, {}, { nodes: [fn] })).map((p) => p.path), ["/nodes/0/props/input/recipe"]);
  const heading: ComposedNode = { id: "root", component: "Heading", props: { text: "X", level: 1 }, children: [] };
  for (const broken of [{ id: "root", component: "Card", props: {} }, card([null as unknown as ComposedNode])]) {
    assert.ok(problemsOf(applyTreeUpdate(app, broken as ComposedNode, undefined, { nodes: [heading] })).length > 0);
  }
});

test("MCP Apps carries an update to the tree the view draws, checked at the sender", () => {
  const update = { nodes: [{ id: "title", component: "Heading", props: { text: "Lemon orzo for six", level: 1 }, children: [] }], data: [{ path: "/servings", value: 6 }] };
  const result = mcpAppTreeUpdateResult({ text: "Six servings", catalog: app, update });
  assert.deepEqual(result.structuredContent, { ouro: { version: "1", catalogId: app.catalogId, update } });
  assert.deepEqual(result.content, [{ type: "text", text: "Six servings" }]);
  const relabeled = clone(shop);
  relabeled.props.label = "Buy now";
  assert.throws(() => mcpAppTreeUpdateResult({ text: "x", catalog: app, update: { nodes: [relabeled] } }), /doesn't validate: \/nodes\/0\/props\/label/);
  assert.throws(() => mcpAppTreeUpdateResult({ text: "x", catalog: app, update: { data: [{ path: "/__proto__/x", value: 1 }] } }), /\/data\/0\/path/);
  assert.throws(() => mcpAppTreeUpdateResult({ text: "x", catalog: app, update: { data: [{ path: "/servings", value: NaN }] } }), /\/data\/0\/value An update is JSON/, "NaN would arrive as null, a delete");
});
