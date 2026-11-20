# Decision: ItemGroup, SwipeActions, Reorderable and ConversationList are specs in core, one file each, before any kit builds them

Status: accepted, 2026-11-20, for ourostack/ouro-ui#2297 (Windows and Android have only 8 components), wave 3, lists.

## Why

Web has these four list components; Windows and Android have only Item, and core has no spec for them. A kit that builds one without a spec invents its own names, its own swipe commit point and its own screen-reader count, and the cross-kit grid cannot compare them.

## Decision

- `item-group`, `swipe-actions`, `reorderable` and `conversation-list` each get a spec in `standard/hx/components/`, one file per component.
- All four join the spoken-name, text-reflow and contrast claims. SwipeActions, Reorderable and ConversationList join the touch-target claim; SwipeActions and Reorderable join the reduced-motion claim, because they move rows. ConversationList is a scrolling list, so it has no motion claim.
- A swipe is never the only way: SwipeActions always has an actions menu button, and Reorderable always has a moves menu, so a person who cannot drag still reaches every action.
- ConversationList is the virtualised list: a kit builds only the rows in view and still reports the full count to assistive technology.
- A case's `agent.role` has no `list` role, so cases use `group` and `listitem`, and each platform's accessibility text names the native role.
- The state names are the schema's (`rest`, `hover`, `pressed`, `focused`, `disabled`, `busy`); a swiped or dragged row is `pressed`, and a selected or unread row is described under `rest`.
- The claim set goes from 0.5.0 to 0.6.0.

## Prior art

Read on 2026-11-20.

- [WinUI ListView](https://learn.microsoft.com/en-us/windows/apps/design/controls/listview-and-gridview): adopt, the Windows form of ConversationList (virtualised) and Reorderable (`CanReorderItems`).
- [WinUI SwipeControl](https://learn.microsoft.com/en-us/windows/apps/design/controls/swipe): adopt, the Windows form of SwipeActions.
- [Compose lists and grids (LazyColumn)](https://developer.android.com/develop/ui/compose/lists): adopt, the Android form of ConversationList and ItemGroup.
- [Compose SwipeToDismissBox](https://developer.android.com/develop/ui/compose/touch-input/swipe-to-dismiss): borrow, the Android swipe gesture; the menu button is ours.
- [WAI-ARIA list and listbox patterns](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/): borrow, the row count and position that a virtualised list still announces.
- [Apple Human Interface Guidelines: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables): watch, the Apple form, not built yet.
