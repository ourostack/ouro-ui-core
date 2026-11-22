import assert from "node:assert/strict";
import { test } from "node:test";
import { actionText, defineAction, defineActions, inputSchema, refusal, renderActions } from "../src/actions.mts";
import { checkOptions, checkTools, main, renderTools, toTool } from "../src/actions-tools.mts";
import shopping, { addShoppingListItem, getShoppingList, placeGroceryOrder, removeShoppingListItem, shareShoppingList, tools as options } from "./fixtures/actions/shopping.actions.mts";

const files = renderTools(shopping, options);
const list = JSON.parse(files.get("tools.json")!);
const silent = { out: () => {}, err: () => {} };

test("every action an agent may call is one function tool whose schema and description are the declaration's", () => {
  const agentDoors = shopping.actions.filter((a) => a.consent !== "person-only");
  assert.deepEqual(list.tools.map((t: { function: { name: string } }) => t.function.name), agentDoors.map((a) => a.id));
  for (const a of agentDoors) {
    const t = list.tools.find((x: { function: { name: string } }) => x.function.name === a.id);
    assert.equal(t.type, "function");
    assert.equal(t.function.description, a.agent, `${a.id}'s description is its agent text`);
    assert.deepEqual(t.function.parameters, inputSchema(a), `${a.id}'s parameters are its MCP input schema`);
  }
});

test("each tool carries its Ouro AX card, from the same declaration", () => {
  assert.deepEqual(toTool(getShoppingList, "shopping").ax, {
    id: "tool:get_shopping_list",
    group: "shopping",
    when: getShoppingList.when,
    effect: "read",
    errors: getShoppingList.errors,
    idempotent: true,
  });
  assert.deepEqual(toTool(removeShoppingListItem, "shopping").ax.destructive, true, "a destructive write says so");
  assert.equal(toTool(removeShoppingListItem, "shopping").ax.idempotent, true);
  assert.equal(toTool(addShoppingListItem, "shopping").ax.idempotent, undefined, "a write is idempotent only when declared");
  const share = toTool(shareShoppingList, "shopping").ax;
  assert.equal(share.effect, "consequential");
  assert.equal(share.confirm, actionText(shareShoppingList).confirm, "the approval question, word for word");
  assert.equal(share.destructive, true, "a consequential action is destructive already, as MCP's hint says");
  assert.equal(toTool(getShoppingList, "shopping").ax.confirm, undefined);
  assert.equal(list.tools[0].ax.group, options.group, "the group comes from the options");
});

test("a person-only action has no tool; its typed refusal and the shared error card answer a call to it", () => {
  assert.ok(!list.tools.some((t: { function: { name: string } }) => t.function.name === placeGroceryOrder.id));
  assert.deepEqual(list.refusals, { [placeGroceryOrder.id]: refusal(placeGroceryOrder) });
  assert.deepEqual(list.errors.map((e: { code: string }) => e.code), ["person-only"]);
  assert.throws(() => toTool(placeGroceryOrder, "shopping"), /person-only.*Fix:/);
  const noPersonOnly = renderTools(defineActions("solo", [getShoppingList]), {});
  assert.deepEqual(JSON.parse(noPersonOnly.get("tools.json")!).errors, [], "no shared error without a person-only action");
  assert.deepEqual(JSON.parse(noPersonOnly.get("tools.json")!).refusals, {});
});

test("an agent door without a when line fails with the fix, never a card that is weak", () => {
  const bare = defineAction({ id: "pin_recipe", consent: "write", label: "Pin", description: "Pin a recipe.", agent: "Pin one recipe.", input: {}, output: {} });
  assert.throws(() => toTool(bare, "recipes"), /pin_recipe.*when.*Fix:/);
  const person = defineAction({ id: "pay", consent: "person-only", label: "Pay", description: "Pay.", agent: "Pay.", input: {}, output: {}, personOnly: { reason: "You can't pay.", how: "with Pay" } });
  assert.doesNotThrow(() => renderTools(defineActions("pay", [person]), {}), "a person-only action needs no when");
});

test("defineAction checks when and errors, with the fix", () => {
  const base = { id: "pin_recipe", consent: "write" as const, label: "Pin", description: "Pin a recipe.", agent: "Pin one recipe.", input: {}, output: {} };
  assert.throws(() => defineAction({ ...base, when: "Two\nlines" }), /when.*one line.*Fix:/);
  assert.throws(() => defineAction({ ...base, errors: [{ code: "Not OK", means: "x", fix: "y" }] }), /error code "Not OK".*Fix:/);
  assert.throws(() => defineAction({ ...base, errors: [{ code: "gone", means: "", fix: "y" }] }), /gone.*means.*Fix:/);
  assert.throws(() => defineAction({ ...base, errors: [{ code: "gone", means: "x", fix: "y" }, { code: "gone", means: "x", fix: "y" }] }), /gone.*twice.*Fix:/);
  assert.throws(() => defineAction({ ...base, errors: [{ code: "person-only", means: "x", fix: "y" }] }), /person-only.*refusal.*Fix:/);
  assert.throws(() => defineAction({ ...base, errors: "none" as never }), /errors.*list.*Fix:/);
  assert.doesNotThrow(() => defineAction({ ...base, when: "Pick this to pin a recipe.", errors: [{ code: "not_found", means: "No such recipe.", fix: "Pass an id from search_recipes." }] }));
});

test("options a card can't use fail with a fix", () => {
  assert.deepEqual(checkOptions(undefined), {});
  assert.deepEqual(checkOptions({ group: "turn-shopping" }), { group: "turn-shopping" });
  assert.throws(() => checkOptions({ group: "Turn Shopping" }), /group.*Fix:/);
  assert.throws(() => checkOptions({ group: "x", extra: 1 }), /extra.*Fix:/);
});

test("check passes on what generate writes, and names a drift, a missing file and a stray one", () => {
  assert.deepEqual(checkTools(shopping, options, files), []);
  const drifted = new Map(files);
  drifted.set("tools.json", files.get("tools.json")!.replace(shopping.actions[0]!.agent, "Something else."));
  assert.match(checkTools(shopping, options, drifted)[0]!, /tools\.json:\d+: drifted.*Fix:/);
  assert.match(checkTools(shopping, options, new Map())[0]!, /tools\.json: missing.*Fix: run generate/);
  assert.match(checkTools(shopping, options, new Map([...files, ["extra.json", "{}"]]))[0]!, /extra\.json: not generated.*Fix: delete it/);
});

test("the CLI checks the committed fixture and refuses a bad call", async () => {
  assert.equal(await main(["check", "test/fixtures/actions/shopping.actions.mts", "test/fixtures/actions/generated-tools"], silent), 0);
  assert.equal(await main(["check", "test/fixtures/actions/shopping.actions.mts"], silent), 2);
  assert.equal(await main(["nope", "a", "b"], silent), 2);
  assert.equal(await main(["check", "test/fixtures/actions/shopping.actions.mts", "test/fixtures/actions/generated"], silent), 1, "another projection's folder is drift");
});

test("the declarations' when lines and errors leave every other projection as it was", () => {
  // when and errors are read only by this projection and actions.json, the declaration itself.
  const strip = (a: (typeof shopping.actions)[number]) => defineAction({ ...a, when: undefined, errors: undefined } as never);
  const plain = defineActions(shopping.name, shopping.actions.map(strip), { tool: shopping.tool });
  const without = (m: Map<string, string>) => new Map([...m].filter(([path]) => path !== "actions.json"));
  assert.deepEqual(without(renderActions(plain)), without(renderActions(shopping)));
});
