# Decision: Message, ReactionBar, MessageList and Composer are specs in core, one file each, before any kit builds them

Status: accepted, 2026-11-21, for ourostack/ouro-ui#2297 (Windows and Android have only 8 components), wave 5, chat.

## Why

Web has the chat components, and Windows and Android have none. A kit that builds a message list without a spec invents its own reading order and its own rule for announcing new messages, and the cross-kit grid cannot compare them.

## Decision

- `message`, `reaction-bar`, `message-list` and `composer` each get a spec in `standard/hx/components/`, one file per component. TypingIndicator and ChatHeader stay out of this wave.
- All four join the spoken-name, text-reflow and contrast claims. ReactionBar, MessageList and Composer join the touch-target claim, because each has buttons a finger presses. Message has none.
- MessageList joins `announce.urgency`: it announces each new message from someone else once, politely, and never the history it opens with or the person's own messages.
- A message is one stop in the reading order, named "author, time, text, state", so a screen reader reads a conversation in the order it was sent.
- The composer's send button always has a name and is reached by Tab after the box, and `sendOn` is `enter` or `modenter`, because a spec enum value holds lowercase letters and digits only.
- Web's windowing, quotes, attachments, avatars and the post and reply variants are deviations on the web entry, not properties, until a kit needs them.
- The claim set goes from 0.6.0 to 0.7.0.

## Prior art

Read on 2026-11-21.

- [WAI-ARIA log role](https://www.w3.org/TR/wai-aria-1.2/#log): borrow, for the polite announcement; web uses a region with a separate live region.
- [WinUI ListView](https://learn.microsoft.com/en-us/windows/apps/design/controls/listview-and-gridview) and [UIA notifications](https://learn.microsoft.com/en-us/windows/apps/design/accessibility/ui-automation-notification-events): adopt, the Windows list and the announcement.
- [Compose lists and grids (LazyColumn)](https://developer.android.com/develop/ui/compose/lists) and [live regions](https://developer.android.com/develop/ui/compose/accessibility/semantics): adopt, the Android list and the announcement.
- [WinUI TextBox](https://learn.microsoft.com/en-us/windows/apps/design/controls/text-box): borrow, the Composer's multi-line box; the frame and Send button are ours.
- [Apple Human Interface Guidelines: messaging](https://developer.apple.com/design/human-interface-guidelines/messages): watch, the Apple form.
