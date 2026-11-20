import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { refusal, renderActions } from "../src/actions.mts";
import { checkOptions, checkWindows, doorsOf, main, renderWindows } from "../src/actions-windows.mts";
import shopping, { placeGroceryOrder, windows } from "./fixtures/actions/shopping.actions.mts";

const files = renderWindows(shopping, windows);
const parsed = (name: string) => JSON.parse(files.get(name)!);
const silent = { out: () => {}, err: () => {} };

test("every action has a person door, and a person-only one has no agent door, with the reason said", () => {
  for (const a of shopping.actions) assert.deepEqual(doorsOf(a).person, { carries: true });
  const d = doorsOf(placeGroceryOrder);
  assert.equal(d.mcp.carries, false);
  assert.equal(d.appAction.carries, false);
  assert.match(!d.mcp.carries ? d.mcp.why : "", /person-only/);
});

test("an action whose required input App Actions can't carry is MCP-only, and doors.json says why", () => {
  const doors = parsed("doors.json").actions;
  const { text, ...add } = doors["add_shopping_list_item"];
  assert.deepEqual(add, { person: { carries: true }, mcp: { carries: true }, appAction: { carries: true } });
  assert.equal(text.label, "Add to list", "each action also carries its declared words");
  assert.deepEqual(doors["get_shopping_list"].appAction, { carries: true }, "an optional enum is left out, not a reason to skip");
  assert.deepEqual(Object.keys(doors), shopping.actions.map((a) => a.id), "doors.json names every action: no silent skip");
});

test("App Actions register only the actions their door carries, each through the app's scheme with the invocation token", () => {
  const actions = parsed("app-actions.json").actions;
  assert.deepEqual(actions.map((a: { id: string }) => a.id), ["Ouro.GetShoppingList", "Ouro.AddShoppingListItem", "Ouro.RemoveShoppingListItem", "Ouro.ShareShoppingList"]);
  const add = actions[1];
  assert.equal(add.invocation.uri, "ouro-shop://action/add_shopping_list_item?name=${name.Text}&unit=${unit.Text}&token=${$.Token}");
  assert.deepEqual(add.inputs, [{ name: "name", kind: "Text" }, { name: "unit", kind: "Text", required: false }]);
  assert.ok(!JSON.stringify(actions).includes("place_grocery_order"));
});

test("the MCP bundle's static tools/list is core's mcp.json, so the registry and the live server can't differ", () => {
  const core = JSON.parse(renderActions(shopping).get("mcp.json")!);
  const manifest = parsed("mcpb.manifest.json");
  assert.deepEqual(manifest._meta["com.microsoft.windows"].static_responses["tools/list"].tools, core.tools);
  assert.equal(manifest.server.entry_point, "OuroShop.Mcp.exe");
});

test("the C# carries core's refusal byte for byte, each input schema, and the catalog", () => {
  const cs = files.get("OuroActions.g.cs")!;
  assert.ok(cs.includes(JSON.stringify(refusal(placeGroceryOrder))));
  assert.match(cs, /public static readonly OuroActionInfo ShareShoppingList = new\(\n {8}Id: "share_shopping_list",\n {8}Consent: OuroConsent\.Consequential,/);
  assert.match(cs, /Actions: new\[\] \{ GetShoppingList, AddShoppingListItem, RemoveShoppingListItem, ShareShoppingList, PlaceGroceryOrder \}\);/);
  assert.match(cs, /^namespace Ouro\.Actions\.Generated;$/m);
  assert.ok(renderWindows(shopping, { ...windows, namespace: "OuroShop.Actions" }).get("OuroActions.g.cs")!.includes("namespace OuroShop.Actions;"));
});

test("options that a package can't use fail with a fix", () => {
  assert.throws(() => checkOptions({ scheme: "Ouro Shop", server: "x", version: "1" }), /scheme is "Ouro Shop"\. Fix: .*version is "1"\. Fix:/);
  assert.throws(() => checkOptions({ ...windows, extra: 1 }), /has "extra"/);
});

test("check finds drift, a missing file and a stray one", () => {
  const found = new Map(files);
  found.set("doors.json", "{}\n");
  found.delete("app-actions.json");
  found.set("stray.json", "{}");
  const problems = checkWindows(shopping, windows, found);
  assert.equal(problems.length, 3);
  assert.match(problems.join("\n"), /doors\.json:1: drifted/);
  assert.match(problems.join("\n"), /app-actions\.json: missing/);
  assert.match(problems.join("\n"), /stray\.json: not generated/);
});

test("the committed fixture output matches the declarations (pnpm actions:windows:check)", async () => {
  for (const [name, text] of files) assert.equal(await readFile(new URL(`./fixtures/actions/generated-windows/${name}`, import.meta.url), "utf8"), text, name);
  const decl = new URL("./fixtures/actions/shopping.actions.mts", import.meta.url).pathname;
  const dir = new URL("./fixtures/actions/generated-windows/", import.meta.url).pathname;
  assert.equal(await main(["check", decl, dir], silent), 0);
  assert.equal(await main(["check", decl], silent), 2);
});
