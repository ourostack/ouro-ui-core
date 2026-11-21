# Decision: Table is a spec in core before any kit builds it

Status: accepted, 2026-11-21, for ourostack/ouro-ui#2297 (Windows and Android have only 8 components), wave 6, the data grid.

## Why

Web has a Table, and Windows and Android have no data grid. A kit that builds one without a spec invents its own header reading, its own sort announcement and its own rule for a row that is a link, and the cross-kit grid cannot compare them.

## Decision

- `table` gets a spec in `standard/hx/components/table.spec.json`, with seven cases: basic, hidden caption, sortable, sorted, row links, empty and a custom empty message.
- It joins the spoken-name, text-reflow, contrast and touch-target claims. A sortable header and a linked row are controls a finger presses.
- The agent tree is a group named by the caption, with one child per column header (a heading, or a button when the column sorts), then one `listitem` per row named by its cells in order, joined by commas. A linked row is a button named by its row header. A sorted header's name carries ", sorted ascending" or ", sorted descending". The schema's roles stay as they are: each kit's `accessibility` entry names the native table roles (UI Automation Table, Compose CollectionInfo).
- Native kits take string cells and report `sort` and `press`. Web's cell renderers, alignment, wrap, row keys and external links are deviations on the web entry until a kit needs them.
- The claim set goes from 0.7.0 to 0.8.0.

## Prior art

Read on 2026-11-21.

- [WAI-ARIA table, columnheader and aria-sort](https://www.w3.org/TR/wai-aria-1.2/#aria-sort): adopt, the header and sort reading web uses.
- [WinUI DataGrid and the UIA Table pattern](https://learn.microsoft.com/en-us/windows/apps/design/accessibility/ui-automation-overview): adopt, the Windows table semantics; the Community Toolkit DataGrid is watched, not depended on.
- [Compose CollectionInfo and CollectionItemInfo](https://developer.android.com/reference/kotlin/androidx/compose/ui/semantics/CollectionInfo): adopt, the Android row and column semantics.
- [Compose lazy lists and grids](https://developer.android.com/develop/ui/compose/lists): borrow, scrolling inside its own region.
- [Apple Human Interface Guidelines: tables](https://developer.apple.com/design/human-interface-guidelines/tables): watch, the Apple form.
