# Decision: ThreadRail, a thread beside its conversation

Status: accepted, 2026-11-13. The code lives in web, `ourostack/ouro-ui` ([ourostack/ouro-ui#519](https://github.com/ourostack/ouro-ui/issues/519)); this record says what the rail is, how it behaves, and why.

## Why

A consuming app's Threads channel opens a message's thread in a rail beside the channel's flow, as Slack, Teams, Mattermost and Element do. Ouro HX had `Sheet` (modal, over the page) and `Resizable` panes, but nothing for a rail that shares the window with a list and keeps the list usable. The app built its own candidate (`ThreadRail`, with a `ThreadLayout` that places the list and the rail) and asked for it in Ouro.

## Decision

1. **It is a labelled complementary landmark, not a dialog.** `ThreadRail` renders `<aside>` named by its header's heading, or by `label` when no title is shown. A rail stays open while the person works in the list beside it, so it never traps focus, has no backdrop and does not close when focus leaves it. A dialog role would tell screen readers the rest of the page is out of reach, which is false here. The label is required, and it doesn't repeat the role ("Thread", not "Thread sidebar").
2. **Focus goes in when it opens and back when it closes.** On mount the rail moves focus to `initialFocus` (the app's reply box, as Mattermost and Google Chat do) or, without one, to the rail itself. `autoFocus={false}` leaves focus where it is, for a rail the app restores on load. When the rail closes with focus inside it, focus returns to the element that had it before the rail opened (the message's "2 replies" button, as Slack's ← does), or to `returnFocus` when the app names one.
3. **Escape closes it, after anything inside that wants Escape.** A keydown of Escape inside the rail calls `onClose` unless the event was already handled (`defaultPrevented`) or it came from a text field, a menu, a listbox or a dialog. Google Chat uses Escape only to leave a field, and Base UI's menus, selects and dialogs handle their own Escape first. The close button's tooltip names the key, and the button carries `aria-keyshortcuts="Escape"`.
4. **The header names the thread.** A heading (`title`, or `label` when there is none), an optional `detail` line (its first words) and `meta` ("2 replies"), and the close button: an icon `Button` with a `Tooltip`, named by `closeLabel` (default "Close thread"). The thread itself is the app's: its `MessageList` and reply box go in as children, as Stream's `Thread` takes them.
5. **`ThreadLayout` collapses by the width it has, not the window's.** It places the list and the rail side by side and, below a container width (860px by default, from the consuming app), puts the rail over the list. The narrow form stays non-modal, as the rail is, and marks the covered list `inert`, so Tab can't reach what can't be seen. A container query, as Element's thread view measures its own width, because a rail often sits inside a pane narrower than the window. It ships in its own pull request after the rail.

## Not now

- A `context` slot on `Message` ("Replied in thread:" with a quoted message) and call-event rows as `Message role="system"` came from the same work. They are changes to Message, tracked on ourostack/ouro-ui#519, and wait until the rail ships.
- Keyboard shortcuts to move between the list and the rail (Slack's F6, Ctrl/⌘+.) are the app's: it owns the keys of its own window.

## Prior art

| Find | Mark | Why |
| --- | --- | --- |
| [Mattermost's right-hand sidebar](https://github.com/mattermost/mattermost/blob/master/webapp/channels/src/components/sidebar_right/sidebar_right.tsx): a labelled region that saves focus on open, focuses its first control or itself, and restores focus on close | adopt | The closest match to our behaviour, with its source to read |
| [Slack with a screen reader](https://slack.com/help/articles/360000411963-Use-Slack-with-a-screen-reader): → opens a thread, ← returns to its message | borrow | The return target: the control that opened the thread |
| [Element's `BaseCard`](https://github.com/element-hq/element-web/blob/develop/apps/web/src/components/views/right_panel/BaseCard.tsx) and [`ThreadView`](https://github.com/element-hq/element-web/blob/develop/apps/web/src/components/structures/ThreadView.tsx) | borrow | A close button named by a `closeLabel` with a tooltip, and a breakpoint measured on the card, not the window |
| [Google Chat's shortcuts](https://support.google.com/chat/answer/7649271): Escape leaves a field and closes nothing | borrow | Fields take Escape first |
| [Stream Chat React's `Thread` and `ThreadHeader`](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) | borrow | Children are the app's list and composer; "name · 2 replies" in the header; "Close thread" |
| [Primer's `PageLayout.Pane`](https://github.com/primer/react/blob/main/packages/react/src/PageLayout/PageLayout.tsx) | borrow | Layout slots and a labelled pane; its narrow form follows the viewport, which we don't |
| [Android's list-detail and supporting-pane layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts) | borrow | Narrow, the detail takes the space the list had |
| [Base UI's non-modal `Dialog`](https://base-ui.com/react/components/dialog) | watch | Its dismissal is right, its `dialog` role is not, for a rail that persists |
| [Fluent UI's `InlineDrawer` and `OverlayDrawer`](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-drawer/library/src/components/OverlayDrawer/useOverlayDrawer.tsx) | watch | The inline and overlay pair is our shape, but the inline drawer has no landmark |
| [shadcn/ui's `Sidebar`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx) | ignore | Narrow, it becomes a modal sheet at a window breakpoint; a rail beside a list is neither |
| [WAI-ARIA APG landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) | adopt | `complementary` for a section that makes sense apart from the main content, labelled when there is more than one, without repeating the role |
| [Record inspector panels: dialog or region?](https://www.accessible-data-interfaces.com/accessible-data-tables-grid-systems/master-detail-and-split-views/record-inspector-panels-dialog-or-region/) | borrow | A persistent panel is a region, not a dialog, and doesn't trap focus |
