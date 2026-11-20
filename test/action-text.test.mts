import assert from "node:assert/strict";
import { test } from "node:test";
import { actionText, CONFIRM_META, defineAction, field, renderActions } from "../src/actions.mts";
import { renderAndroid } from "../src/actions-android.mts";
import { renderWindows } from "../src/actions-windows.mts";
import { catalog } from "../src/a2ui-catalog.mts";
import { loadCatalog } from "../src/a2ui.mts";
import { actionButtonProps, validateTree } from "../src/composed.mts";
import shopping, { android, placeGroceryOrder, shareShoppingList, windows } from "./fixtures/actions/shopping.actions.mts";

const core = renderActions(shopping);
const win = renderWindows(shopping, windows);
const droid = renderAndroid(shopping, android);
const cat = catalog(shopping) as { metadata: { extensions: Record<string, { actions: Record<string, { label: string; description: string; confirm?: string }> }> } };
const card = Object.values(cat.metadata.extensions)[0]!.actions;
const read = (files: Map<string, string>, name: string) => files.get(name)!;
const json = (files: Map<string, string>, name: string) => JSON.parse(read(files, name));

test("a declared confirm is the question on every surface that asks, and the label and description are the declaration's everywhere", () => {
  const t = actionText(shareShoppingList);
  assert.equal(t.confirm, "Share your list with this person? They will be able to see it and change it.");
  const id = shareShoppingList.id;

  const mcp = json(core, "mcp.json").tools.find((x: { name: string }) => x.name === id);
  assert.equal(mcp.title, t.label);
  assert.equal(mcp.description, t.agent);
  assert.equal(mcp._meta[CONFIRM_META], t.confirm);

  const wm = json(core, "webmcp.json").tools.find((x: { name: string }) => x.name === id);
  assert.equal(wm.title, t.label);
  assert.equal(wm._meta[CONFIRM_META], t.confirm);

  const web = read(core, "web.ts");
  assert.ok(web.includes(`label: ${JSON.stringify(t.label)}, description: ${JSON.stringify(t.description)}, consent: "consequential", confirm: ${JSON.stringify(t.confirm)}`), "the control carries label, description and confirm");

  const swift = read(core, "OuroActions.swift");
  assert.ok(swift.includes(`IntentDescription(${JSON.stringify(t.description)})`), "the App Intent describes itself in the person's words");
  assert.ok(swift.includes(JSON.stringify(t.confirm)), "the App Intent asks the declared question");
  assert.ok(!swift.includes("requestConfirmation()"), "the App Intent never falls back to the system's own wording");

  assert.deepEqual(card[id], { ...card[id], label: t.label, description: t.description, confirm: t.confirm }, "the card catalog carries the declared words");

  const wMcp = json(win, "mcpb.manifest.json")._meta["com.microsoft.windows"].static_responses["tools/list"].tools.find((x: { name: string }) => x.name === id);
  assert.equal(wMcp._meta[CONFIRM_META], t.confirm);
  assert.ok(read(win, "OuroActions.g.cs").includes(`Label: ${JSON.stringify(t.label)}`) && read(win, "OuroActions.g.cs").includes(`Description: ${JSON.stringify(t.description)}`));
  assert.deepEqual(json(win, "doors.json").actions[id].text, t, "Windows documents the declared words beside its doors until the runtime asks them");
  assert.deepEqual(json(droid, "doors.json").actions[id].text, t, "Android documents the declared words beside its doors until the runtime asks them");
  assert.ok(read(droid, "OuroActions.kt").includes(`label = ${JSON.stringify(t.label)}`) && read(droid, "OuroActions.kt").includes(`description = ${JSON.stringify(t.description)}`));
});

test("without a declared confirm the question is the description, and only a consequential action has one", () => {
  const plain = defineAction({ id: "send_note", consent: "consequential", label: "Send note", description: "Send the note to your household.", agent: "Send the note.", input: { text: field.string({ label: "Note", description: "The note.", arg: true }) }, output: {} });
  assert.equal(actionText(plain).confirm, plain.description);
  assert.equal(actionText(placeGroceryOrder).confirm, undefined);
  assert.equal(actionText(shopping.actions.find((a) => a.consent === "read")!).confirm, undefined);
});

test("confirm is refused on anything but a consequential action, and over its length", () => {
  const base = { label: "Read", description: "Read it.", agent: "Read it.", input: {}, output: {} };
  assert.throws(() => defineAction({ id: "read_it", consent: "read", confirm: "Sure?", ...base } as never), /confirm is only for consent "consequential".*Fix:/);
  assert.throws(() => defineAction({ id: "send_it", consent: "consequential", confirm: "x".repeat(201), ...base } as never), /over 200 characters.*Fix:/);
});

test("the confirm card asks the declared question, and the validator refuses a card that words it differently", () => {
  const cat = loadCatalog(catalog(shopping));
  const props = actionButtonProps(cat, "share_shopping_list", { with: "sam@example.com" });
  const confirm = props["confirm"] as { title: string; description: string };
  assert.equal(confirm.title, shareShoppingList.label);
  assert.equal(confirm.description, actionText(shareShoppingList).confirm);
  const button = { id: "b", component: "ActionButton", props, children: [] };
  const tree = (b: typeof button) => ({ id: "root", component: "Card", props: {}, children: [b] });
  assert.deepEqual(validateTree(cat, tree(button)), []);
  const drifted = structuredClone(button);
  (drifted.props["confirm"] as { description: string }).description = shareShoppingList.description;
  assert.match(validateTree(cat, tree(drifted))[0]!.message, /confirms, with the catalog's title and description/);
});
