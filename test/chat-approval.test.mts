import assert from "node:assert/strict";
import { test } from "node:test";
import { loadCatalog } from "../src/a2ui.mts";
import { catalog } from "../src/a2ui-catalog.mts";
import { actionText } from "../src/actions.mts";
import { approvalCard, readApproval, teamsApproval, telegramApproval, textApproval } from "../src/chat-approval.mts";
import shopping, { shareShoppingList } from "./fixtures/actions/shopping.actions.mts";

const cat = loadCatalog(catalog(shopping));
const prepared = { with: "sam@example.com", canEdit: true, message: "For Saturday's shop." };
const card = approvalCard(cat, "share_shopping_list", prepared, { id: "apr_42" });

test("a card asks the declaration's question, with a row for every value that will be sent", () => {
  assert.equal(card.title, shareShoppingList.label);
  assert.equal(card.question, actionText(shareShoppingList).confirm, "word for word, as every other surface asks it");
  assert.deepEqual(card.rows, [
    { label: "With", value: "sam@example.com" },
    { label: "Can edit", value: "true" },
    { label: "Note", value: "For Saturday's shop." },
  ]);
  assert.equal(card.approve, shareShoppingList.label, "the yes button names the action, not a bare Yes");
  assert.equal(card.decline, "Cancel");
  assert.deepEqual(card.input, prepared);
  assert.ok(Object.isFrozen(card) && Object.isFrozen(card.input) && Object.isFrozen(card.rows), "frozen: the person approves exactly this");
});

test("only a consequential action asks; anything else, or a card that can't show what it sends, fails with the fix", () => {
  assert.throws(() => approvalCard(cat, "add_shopping_list_item", { name: "oat milk" }, { id: "a" }), /add_shopping_list_item is write.*runs without asking.*Fix:/);
  assert.throws(() => approvalCard(cat, "place_grocery_order", {}, { id: "a" }), /place_grocery_order: Place order: You can't place an order/);
  assert.throws(() => approvalCard(cat, "nope", {}, { id: "a" }), /no action "nope".*Fix:/);
  assert.throws(() => approvalCard(cat, "share_shopping_list", { canEdit: true }, { id: "a" }), /needs with.*Fix:/);
  assert.throws(() => approvalCard(cat, "share_shopping_list", { ...prepared, cc: "x" }, { id: "a" }), /cc.*no row.*Fix:/);
  assert.throws(() => approvalCard(cat, "share_shopping_list", { with: { "@path": "/to" } }, { id: "a" }), /with.*bound.*Fix:/);
  assert.throws(() => approvalCard(cat, "share_shopping_list", prepared, { id: "has space" }), /id.*Fix:/);
  assert.throws(() => approvalCard(cat, "share_shopping_list", prepared, { id: "x".repeat(49) }), /id.*Fix:/);
});

test("an id shows the app's name for it, as the composed confirm sheet does", () => {
  const named = approvalCard(cat, "share_shopping_list", prepared, { id: "a", label: ({ field, value }) => (field === "with" ? `Sam (${value})` : undefined) });
  // with has no shownAs, so only an id field takes a name: every other row shows exactly what will be sent.
  assert.equal(named.rows[0]!.value, "sam@example.com");
});

test("Telegram: the card as HTML with two inline buttons whose callback data name the card", () => {
  const m = telegramApproval(card);
  assert.equal(m.parse_mode, "HTML");
  assert.equal(m.text, "<b>Share list</b>\nShare your list with this person? They will be able to see it and change it.\n\n<b>With:</b> sam@example.com\n<b>Can edit:</b> true\n<b>Note:</b> For Saturday's shop.");
  assert.deepEqual(m.reply_markup.inline_keyboard, [[{ text: "Share list", callback_data: "ouro:y:apr_42" }, { text: "Cancel", callback_data: "ouro:n:apr_42" }]]);
  const html = telegramApproval(approvalCard(cat, "share_shopping_list", { with: "<a>&b" }, { id: "x" }));
  assert.match(html.text, /<b>With:<\/b> &lt;a&gt;&amp;b/, "values are escaped");
  for (const b of html.reply_markup.inline_keyboard[0]!) assert.ok(Buffer.byteLength(b.callback_data) <= 64, "within Telegram's 64 bytes");
  assert.throws(() => telegramApproval(approvalCard(cat, "share_shopping_list", { with: "x", message: "y".repeat(5000) }, { id: "x" })), /4096.*Fix:/, "never cut what the person approves");
});

test("text: the card for a chat with no buttons, which says what to reply", () => {
  assert.equal(textApproval(card), "Share list\nShare your list with this person? They will be able to see it and change it.\n\nWith: sam@example.com\nCan edit: true\nNote: For Saturday's shop.\n\nReply yes to share list, or no to cancel.");
});

test("Teams: an Adaptive Card with the rows as facts and two submit actions naming the card", () => {
  const c = teamsApproval(card);
  assert.equal(c.type, "AdaptiveCard");
  assert.equal(c.version, "1.5");
  assert.deepEqual(c.body[0], { type: "TextBlock", text: "Share list", weight: "Bolder", wrap: true });
  assert.deepEqual(c.body[2], { type: "FactSet", facts: [{ title: "With", value: "sam@example.com" }, { title: "Can edit", value: "true" }, { title: "Note", value: "For Saturday's shop." }] });
  assert.deepEqual(c.actions, [
    { type: "Action.Submit", title: "Share list", style: "positive", data: { ouro: "y", id: "apr_42" } },
    { type: "Action.Submit", title: "Cancel", data: { ouro: "n", id: "apr_42" } },
  ]);
});

test("a reply approves only when it plainly says yes to this card; anything else never runs it", () => {
  const yes = readApproval(card, { callbackData: "ouro:y:apr_42" });
  assert.deepEqual(yes, { decision: "approve", press: { action: "share_shopping_list", input: prepared, consent: "consequential", label: "Share list", by: "person", confirmed: true } });
  assert.deepEqual(readApproval(card, { callbackData: "ouro:n:apr_42" }), { decision: "decline" });
  assert.deepEqual(readApproval(card, { callbackData: "ouro:y:apr_41" }), { decision: "not-this-card" }, "a stale card's button");
  assert.deepEqual(readApproval(card, { submit: { ouro: "y", id: "apr_42" } }).decision, "approve");
  assert.deepEqual(readApproval(card, { submit: { ouro: "y", id: "other" } }), { decision: "not-this-card" });
  for (const t of ["yes", "Yes.", " YES! ", "y", "ok", "okay", "approve", "go ahead"]) assert.equal(readApproval(card, { text: t }).decision, "approve", t);
  for (const t of ["no", "No.", "n", "cancel", "stop", "don't"]) assert.equal(readApproval(card, { text: t }).decision, "decline", t);
  for (const t of ["yes but only see it", "maybe", "", "yes no", "share with alex instead"]) assert.equal(readApproval(card, { text: t }).decision, "unclear", t);
  assert.equal(readApproval(card, {} as never).decision, "unclear");
});
