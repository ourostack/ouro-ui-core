import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadCatalog, resolveMessages } from "../src/a2ui.mts";
import { actionButtonProps, COMPONENTS, componentsFor, getPointer, INPUT_COMPONENTS, isDataPointer, personPress, resolveButton, setPointer, validateTree, type ComposedNode, type Json } from "../src/composed.mts";
import { MCP_APP_MIME, mcpAppResource, mcpAppToolMeta, mcpAppTreeResult } from "../src/mcp-app.mts";

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
