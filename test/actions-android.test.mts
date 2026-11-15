import assert from "node:assert/strict";
import { test } from "node:test";
import { refusal } from "../src/actions.mts";
import { checkAndroid, checkOptions, doorsOf, main, renderAndroid } from "../src/actions-android.mts";
import shopping, { android, placeGroceryOrder, shareShoppingList } from "./fixtures/actions/shopping.actions.mts";

const files = renderAndroid(shopping, android);
const kt = files.get("OuroActions.kt")!;
const silent = { out: () => {}, err: () => {} };

test("a person-only action has a person door and no AppFunction, with the reason said", () => {
  for (const a of shopping.actions) assert.deepEqual(doorsOf(a).person, { carries: true });
  const d = doorsOf(placeGroceryOrder).appFunction;
  assert.equal(d.carries, false);
  assert.match(!d.carries ? d.why : "", /person-only/);
  assert.ok(!/suspend fun placeGroceryOrder\(/.test(kt), "no AppFunction is generated for it");
});

test("doors.json names every action: no silent skip", () => {
  const doors = JSON.parse(files.get("doors.json")!).actions;
  assert.deepEqual(Object.keys(doors), shopping.actions.map((a) => a.id));
});

test("every action an agent may call is one @AppFunctionDeclaration whose instruction is the declaration's agent text", () => {
  for (const a of shopping.actions.filter((x) => doorsOf(x).appFunction.carries)) {
    assert.ok(kt.includes(`suspend fun ${a.names.camel}(`), `${a.id} has an AppFunction`);
    assert.ok(kt.includes(`@AppFunctionInstruction(${JSON.stringify(a.agent).replace(/\$/g, "\\$")})`), `${a.id}'s instruction is its agent text`);
  }
  assert.equal(kt.match(/@AppFunctionDeclaration/g)?.length, shopping.actions.filter((x) => doorsOf(x).appFunction.carries).length);
});

test("the Kotlin carries core's refusal words and the consequential consent, so the runtime refuses an agent without the person", () => {
  const r = refusal(placeGroceryOrder);
  assert.ok(kt.includes(`message = ${JSON.stringify(r.error!.message)},`), "the refusal's message, byte for byte");
  assert.ok(kt.includes(`problem = ${JSON.stringify(r.error!.problem)},`), "and its problem");
  assert.match(kt, new RegExp(`object ${shareShoppingList.names.pascal} : OuroAction<[^>]+>\\([\\s\\S]*?consent = OuroConsent\\.Consequential,`));
  assert.match(kt, /^package bot\.ouro\.shop\.actions$/m);
});

test("options a Kotlin package can't use fail with a fix", () => {
  assert.throws(() => checkOptions({ package: "Bot.Shop" }), /package is "Bot\.Shop"\. Fix:/);
  assert.throws(() => checkOptions({ package: "bot.class.shop" }), /Fix:/);
  assert.throws(() => checkOptions({ ...android, extra: 1 }), /has "extra"/);
});

test("check finds drift, a missing file and a stray one", () => {
  const found = new Map(files);
  found.set("OuroActions.kt", kt.replace("Add one item", "Add some item"));
  found.delete("doors.json");
  found.set("stray.kt", "");
  const problems = checkAndroid(shopping, android, found);
  assert.equal(problems.length, 3);
  assert.match(problems.join("\n"), /OuroActions\.kt:\d+: drifted/);
  assert.match(problems.join("\n"), /doors\.json: missing/);
  assert.match(problems.join("\n"), /stray\.kt: not generated/);
  assert.deepEqual(checkAndroid(shopping, android, files), []);
});

test("the CLI's usage error exits 2", async () => {
  assert.equal(await main([], silent), 2);
});
