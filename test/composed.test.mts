import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { loadCatalog, resolveMessages } from "../src/a2ui.mts";
import { actionButtonProps, COMPONENTS, componentsFor, personPress, validateTree, type ComposedNode } from "../src/composed.mts";
import { MCP_APP_MIME, mcpAppResource, mcpAppToolMeta, mcpAppTreeResult } from "../src/mcp-app.mts";

// Ouro's composed tree is the source of truth (docs/decisions/2026-11-14-composed-ui-own-tree.md): every tree the A2UI
// adapter resolves must pass the tree's own validator, and a tree that relabels a button or loosens its consent must not,
// whichever format or sender it came from.

const root = new URL("../", import.meta.url);
const read = async (p: string) => JSON.parse(await readFile(new URL(p, root), "utf8"));
const app = loadCatalog(await read("standard/hx/a2ui/conformance/recipe.catalog.json"));
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
