# Decision: an agent updates a composed tree by id and by JSON Pointer, instead of resending it

Status: accepted, 2026-11-18, under Ari's overnight authority. It extends [Ouro's composed-UI tree](2026-11-14-composed-ui-own-tree.md) and [fields in the composed tree](2026-11-17-composed-fields.md), and keeps their rules: every button is a declared action with its consent class, and a sender can't change what a button does.

## Why

In web's [model reviews](https://github.com/ourostack/ouro-ui/blob/main/docs/guides/model-reviews.md), five of the models that chose A2UI named its streaming: an agent sends `updateComponents` (replace components by id) and `updateDataModel` (set a value at a JSON Pointer) instead of resending the whole interface. The A2UI adapter (`src/a2ui.mts`) already applies those messages, so web's `A2UISurface` streams. Ouro's own tree, carried in MCP Apps' `structuredContent.ouro`, had no update: to change one line of a card, an agent resent the whole tree, and a view that drew it again from scratch lost what the person had typed.

## Decision

1. **An update is `{ nodes?, data? }` (`TreeUpdate` in `src/composed.mts`).** Each of `nodes` replaces the tree's node with the same id, children and all. Each of `data` is `{ path, value }`: it sets the value at a JSON Pointer in the data model, and `null` deletes the key, as A2UI's `updateDataModel` does; `/` is the whole data model, which stays an object. Nodes apply in order, each to the tree the ones before it left, then data, in order.
2. **An id names exactly one node.** An id the tree lacks is a problem, never ignored, because an agent that thinks it changed a card when it didn't would tell the person something false. An id that a template's instances share is refused too: replacing every instance with one subtree would give each the same data, so the fix is to replace the node that holds them, by its own id. Adding a node is replacing its parent.
3. **All or nothing, and never weaker than a whole tree.** `applyTreeUpdate(catalog, tree, data, update)` gives the new tree and data, or every problem and no change. An update is JSON all the way down (a `NaN` would arrive as `null`, a delete), each replacement node is validated against the catalog, each data path must pass `isDataPointer` (absolute, and never `__proto__`, `constructor` or `prototype`), a list is written only at an index from 0 to its length, and the tree it gives passes `validateTree`. So an update can't relabel a button, loosen its consent or forge a confirm row any more than a whole tree can. It changes neither input.
4. **MCP Apps carries an update in `structuredContent.ouro.update`** (`mcpAppTreeUpdateResult` in `src/mcp-app.mts`), beside `version` and `catalogId`, in place of `tree`. The sender checks what needs no tree (`treeUpdateProblems`: the shape, each node and each path); the view applies it to the tree it draws, which checks the ids and the result. `COMPOSED_VERSION` stays `"1"`: an update is a new kind of result, and a view that knows no updates finds no `tree` in it and says the result had no card, rather than drawing something else.
5. **What the person entered stays.** A renderer keeps the person's answers across an update, except at a path whose value the update set, where the agent's value wins. That is each renderer's to do; web's is in `ComposedSurface`.
6. **Conformance.** `standard/hx/composed/updates/` holds the cases: each gives a catalog, a tree, its data and an update, and `expect` is the tree and data it gives or each problem's path and message. `pnpm a2ui:generate` writes each `expect` with `applyTreeUpdate`, and a case named `invalid-*` must fail. Every renderer that applies updates runs them: web now, and Apple, Windows and Android when their renderers do.

## What this changes

- Core: `TreeUpdate`, `treeUpdateProblems` and `applyTreeUpdate` in `src/composed.mts`; `mcpAppTreeUpdateResult` in `src/mcp-app.mts`; five update cases; release 0.19.0.
- Web: `OuroMcpApp` applies a result's `update` to the tree it shows, and `ComposedSurface` keeps the person's answers across a new tree or data.
- Apple, Windows and Android: port `applyTreeUpdate` and run the update cases when their composed renderers take MCP results.

## Prior art

Read on 2026-11-18.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI v1.0](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) `updateComponents` and `updateDataModel` | **Adopt** (the semantics) | Replace by id; set a value at a JSON Pointer, `null` deletes the key, and `/` replaces the whole data model. Ouro's nodes are nested where A2UI's components are a flat list, so replacing a node replaces its children, and adding a node is replacing its parent. |
| [JSON Patch, RFC 6902](https://www.rfc-editor.org/rfc/rfc6902) | **Ignore** | Six operations (`add`, `remove`, `replace`, `move`, `copy`, `test`) over one document, with array positions that shift. An agent would have to address a node by its position in `children`, which changes as the tree does; ids don't. Setting a value at a pointer covers what an agent changes in the data model. |
| [JSON Merge Patch, RFC 7396](https://www.rfc-editor.org/rfc/rfc7396) | **Borrow** (the null) | `null` deletes, the same convention A2UI uses. Merging a whole document is more than an update needs, and it can't replace a list item. |
| [htmx out-of-band swaps](https://htmx.org/attributes/hx-swap-oob/) | **Borrow** | The server sends elements that replace the page's elements with the same id, and htmx fires `htmx:oobErrorNoTarget` when none has it. Ouro's update makes that a problem the sender reads, not an event in the view. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) | **Adopt** (unchanged) | The host passes each tool result to the view, so an update rides in the same `structuredContent.ouro` as a tree. |
