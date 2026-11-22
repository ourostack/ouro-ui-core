// The chat adapter for a consequential action's approval: the card a person approves in a chat, from the action model,
// drawn for Telegram, Microsoft Teams and any chat that carries only text, and the reply read back into the person's
// press. Decision: docs/decisions/2026-11-22-chat-approval-cards.md.
//
// A card is the composed confirm sheet (composed.mts `actionButtonProps`) in a chat: the action's label, its confirm
// question word for word, a row with the person's label for every value that will be sent, and two answers, the
// action's label and Cancel. It is frozen with the exact input, and the app runs that input and nothing else: an agent
// that wants to change a value asks again with a new card. A reply approves only when it plainly says yes to this card;
// anything else is a decline, a stale card or unclear, and runs nothing.
//
// It imports only composed.mts. Apps vendor it from a release as `ouro-chat-approval.mts`, beside `ouro-composed.mts`.

import { actionButtonProps, isObj, own, type Catalog, type Obj, type PersonPress, type ResolveOptions } from "./composed.mts";

/** One approval, as a person reads it in any chat. */
export interface ApprovalCard {
  /** The app's id for this approval, which its answers carry: letters, digits, _ and -, at most 48. */
  readonly id: string;
  readonly action: string;
  /** The action's label. */
  readonly title: string;
  /** The action's confirm question, word for word. */
  readonly question: string;
  /** Each value that will be sent, with the person's label for it. */
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  /** The yes answer: the action's label, so the person presses what happens. */
  readonly approve: string;
  readonly decline: string;
  /** The exact input the person approves. */
  readonly input: Readonly<Obj>;
}

const ID = /^[A-Za-z0-9_-]{1,48}$/;

const deepFreeze = <T,>(v: T): T => {
  if (typeof v === "object" && v !== null) {
    for (const x of Object.values(v)) deepFreeze(x);
    Object.freeze(v);
  }
  return v;
};

/**
 * The card for a consequential action and the input an agent prepared. Throws, with the fix, for an action that
 * doesn't ask (a read or write runs; a person-only one refuses, with its refusal's words), an id a chat can't carry,
 * a required value left out, a value the catalog has no row for, or a value bound to a form, which a chat doesn't have.
 */
export function approvalCard(cat: Catalog, action: string, prepared: Obj, options: { id: string } & ResolveOptions): ApprovalCard {
  const a = own(cat.actions, action);
  if (a === undefined) throw new Error(`no action "${action}" in catalog ${cat.catalogId}. Fix: one of ${Object.keys(cat.actions).join(", ")}.`);
  if (a.personOnly) throw new Error(`${action}: ${a.personOnly.refusal.error.message}`);
  if (a.press !== "confirm") throw new Error(`${action} is ${a.consent}, which runs without asking; only a consequential action asks the person. Fix: run it, or declare it consequential.`);
  if (typeof options.id !== "string" || !ID.test(options.id)) throw new Error(`approval id ${JSON.stringify(options.id)}: a chat button carries letters, digits, _ and -, at most 48. Fix: such as "apr_42".`);
  if (!isObj(prepared)) throw new Error(`${action}: the prepared input is not an object. Fix: { field: value }.`);
  for (const [k, v] of Object.entries(prepared)) {
    if (own(a.input, k) === undefined) throw new Error(`${action}: ${k} would be sent with no row on the card, since the catalog has no such input. Fix: send only ${Object.keys(a.input).join(", ")}.`);
    if (isObj(v) && typeof v["@path"] === "string") throw new Error(`${action}: ${k} is bound to a form field, which a chat doesn't have. Fix: prepare its value.`);
  }
  for (const [k, f] of Object.entries(a.input)) if (!f.optional && !Object.hasOwn(prepared, k)) throw new Error(`${action} needs ${k} (${f.label}). Fix: prepare it before asking.`);
  const confirm = actionButtonProps(cat, action, prepared, options).confirm as { title: string; description: string; fields: { label: string; value: string }[] };
  return deepFreeze({
    id: options.id,
    action,
    title: confirm.title,
    question: confirm.description,
    rows: confirm.fields.map((r) => ({ label: r.label, value: r.value })),
    approve: a.label,
    decline: "Cancel",
    input: structuredClone(prepared),
  });
}

const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Telegram's longest message. */
export const TELEGRAM_MAX = 4096;

/** The card as a Telegram `sendMessage`'s text, parse mode and inline keyboard. Callback data is `ouro:y:<id>` or `ouro:n:<id>`. */
export function telegramApproval(card: ApprovalCard) {
  const text = [`<b>${html(card.title)}</b>`, html(card.question), ...(card.rows.length ? ["", ...card.rows.map((r) => `<b>${html(r.label)}:</b> ${html(r.value)}`)] : [])].join("\n");
  if (text.length > TELEGRAM_MAX) throw new Error(`${card.action}: the card is ${text.length} characters, over Telegram's ${TELEGRAM_MAX}, and the person must see every value they approve. Fix: send a shorter value, or ask on a surface that holds it.`);
  return {
    text,
    parse_mode: "HTML" as const,
    reply_markup: { inline_keyboard: [[{ text: card.approve, callback_data: `ouro:y:${card.id}` }, { text: card.decline, callback_data: `ouro:n:${card.id}` }]] },
  };
}

/** The card as text, for a chat with no buttons (iMessage, SMS): it ends by saying what to reply. */
export function textApproval(card: ApprovalCard): string {
  return [card.title, card.question, ...(card.rows.length ? ["", ...card.rows.map((r) => `${r.label}: ${r.value}`)] : []), "", `Reply yes to ${card.approve.toLowerCase()}, or no to ${card.decline.toLowerCase()}.`].join("\n");
}

/** The card as a Microsoft Teams Adaptive Card (1.5): the rows as facts, and two submit actions whose data name the card. */
export function teamsApproval(card: ApprovalCard) {
  return {
    type: "AdaptiveCard" as const,
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.5" as const,
    body: [
      { type: "TextBlock", text: card.title, weight: "Bolder", wrap: true },
      { type: "TextBlock", text: card.question, wrap: true },
      { type: "FactSet", facts: card.rows.map((r) => ({ title: r.label, value: r.value })) },
    ],
    actions: [
      { type: "Action.Submit", title: card.approve, style: "positive", data: { ouro: "y", id: card.id } },
      { type: "Action.Submit", title: card.decline, data: { ouro: "n", id: card.id } },
    ],
  };
}

/** A reply to a card: a Telegram button's callback data, a Teams submit's data, or a text message. */
export type ApprovalReply = { callbackData: string } | { submit: unknown } | { text: string };

/** What a reply decides. Only `approve` runs the action, with the card's exact input. */
export type ApprovalDecision = { decision: "approve"; press: PersonPress } | { decision: "decline" } | { decision: "not-this-card" } | { decision: "unclear" };

const YES = new Set(["yes", "y", "ok", "okay", "approve", "go ahead"]);
const NO = new Set(["no", "n", "cancel", "stop", "don't", "dont", "decline"]);

/** What a reply to `card` decides. A text reply decides only when the whole message is one plain yes or no. */
export function readApproval(card: ApprovalCard, reply: ApprovalReply): ApprovalDecision {
  let answer: "y" | "n" | undefined;
  if (isObj(reply) && typeof (reply as { callbackData?: unknown }).callbackData === "string") {
    const m = /^ouro:([yn]):(.+)$/.exec((reply as { callbackData: string }).callbackData);
    if (!m) return { decision: "unclear" };
    if (m[2] !== card.id) return { decision: "not-this-card" };
    answer = m[1] as "y" | "n";
  } else if (isObj(reply) && "submit" in reply) {
    const d = (reply as { submit: unknown }).submit;
    if (!isObj(d) || (d.ouro !== "y" && d.ouro !== "n")) return { decision: "unclear" };
    if (d.id !== card.id) return { decision: "not-this-card" };
    answer = d.ouro;
  } else if (isObj(reply) && typeof (reply as { text?: unknown }).text === "string") {
    const t = (reply as { text: string }).text.trim().toLowerCase().replace(/[.!\s]+$/, "").replace(/’/g, "'");
    answer = YES.has(t) ? "y" : NO.has(t) ? "n" : undefined;
    if (answer === undefined) return { decision: "unclear" };
  } else return { decision: "unclear" };
  if (answer === "n") return { decision: "decline" };
  return { decision: "approve", press: { action: card.action, input: structuredClone(card.input) as Obj, consent: "consequential", label: card.approve, by: "person", confirmed: true } };
}

