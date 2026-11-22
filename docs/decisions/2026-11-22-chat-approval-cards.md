# Decision: a chat asks for approval with a card from the action model

Status: accepted, 2026-11-22. Part of Ari's 2026-11-21 harness mandate. Its card records the decision "approval cards generated from action declarations".

## Why

When an Ouro agent prepares a consequential action in a chat, the person approves it there. In ourostack/ouroboros the Telegram approval's fallback is `Approve <tool> with exact arguments <JSON>?` (`formatTelegramApprovalPrompt`, `src/senses/telegram-approval-runtime.ts`), which shows a person raw JSON. The action model already holds the person's words: the action's label, its `confirm` question and each input's label. The composed confirm sheet (`actionButtonProps` in `src/composed.mts`) already turns them into rows.

## Decision

1. **`src/chat-approval.mts` is a format adapter.** It imports only `composed.mts`, as the MCP Apps and A2UI adapters do, and ships as `dist/composed/ouro-chat-approval.mts`.
2. **`approvalCard(catalog, action, prepared, { id })`** builds the card from the composed confirm sheet: the action's label as its title, the `confirm` question word for word, a row with the person's label for every value it sends, and two answers. The yes answer is the action's label, so the person presses what happens. The no answer is Cancel. It refuses, with the fix, a read or write (they run without asking), a person-only action (with its refusal's words), a required value left out, a value the catalog has no row for, a value bound to a form, and an id a chat button can't carry.
3. **The card is frozen with its exact input.** `readApproval` turns an approval into the person's press (`PersonPress`, `confirmed: true`) with that input. An agent that wants another value asks again with a new card, which gets a new id.
4. **Three drawings:** Telegram (HTML text and an inline keyboard whose callback data is `ouro:y:<id>` or `ouro:n:<id>`, within Telegram's 64 bytes), Microsoft Teams (an Adaptive Card 1.5 with the rows as a FactSet and two `Action.Submit`s) and text, for iMessage and SMS, which says what to reply. A Telegram card over 4,096 characters throws rather than cut a value the person approves.
5. **A reply approves only when it plainly says yes to this card.** The yes can be a button carrying the card's id, or a whole text message that is one yes word. A button from another card gives `not-this-card`, and "yes but only let them see it" gives `unclear`. Both run nothing.

The harness owns its approval store, its expiry and its delivery. Its adoption is the step after a core release.

## Prior art

- [Telegram Bot API inline keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup): **adopt.** Callback data is at most 64 bytes, and messages at most 4,096 characters ([sendMessage](https://core.telegram.org/bots/api#sendmessage)).
- [Adaptive Cards](https://adaptivecards.io/explorer/) in Microsoft Teams: **adopt.** `FactSet` for the rows and `Action.Submit` for the answers.
- [Slack Block Kit confirmation dialogs](https://api.slack.com/reference/block-kit/composition-objects#confirm): **borrow.** A title, the question and a confirm button that names the action. There is no Slack drawing until a harness sense needs one.
- [Apple App Intents `requestConfirmation`](https://developer.apple.com/documentation/appintents/appintent/requestconfirmation()): **borrow.** The same question, asked before the action runs, as the App Intent projection already does.
- [A2UI](https://a2ui.org/) and [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) confirm sheets: **adopt.** Core's own composed confirm sheet, which this card reuses row for row.
