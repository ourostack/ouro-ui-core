# Decision: fields in the composed tree, bound to a data model by JSON Pointer

Status: accepted, 2026-11-17, under Ari's overnight authority. It extends [Ouro's composed-UI tree](2026-11-14-composed-ui-own-tree.md) and keeps its rules: every button is a declared action with its consent class, and a sender can't change what a button does.

## Why

In web's 2026-11-14 model reviews, the models that chose A2UI named what Ouro's tree lacked against it: a person can answer in an A2UI surface, and an agent's card can't ask Ouro's tree anything. GPT-6.1 Terra: "Its two-way data binding and action events give people a way to collaborate with the agent". GPT-6 Astra: "Its Basic Catalog, incremental updateDataModel messages, and bidirectional Function RPC connect human controls with explicit agent operations." Before this record the composed catalog held ten display components and the action button, so an agent that needed an answer, such as servings, an address or a choice, had to guess it or ask in chat.

## Decision

1. **Three fields join the catalog: `TextField` (text or a number, one line or several), `Checkbox` and `Select`.** Each has a `label`, an optional `hint`, and `value`: where the person's answer goes in the data model.
2. **The data model is a JSON object beside the tree, addressed by JSON Pointer (RFC 6901),** as A2UI's `@path` is. A field's `value` in the tree is an absolute pointer. A2UI's `dataModel` and `updateDataModel` fill it, and so does MCP Apps' `structuredContent.ouro.data`.
3. **A button input bound to a path a field writes stays bound in the tree,** and is read when the person presses (`resolveButton`, `personPress(button, confirmed, data)`), so the press and the confirm sheet carry what the person entered. A binding to a path no field writes resolves as before, so every earlier tree and conformance case is unchanged.
4. **Consent doesn't move.** A field writes only the data model. Nothing runs until the person presses a button, and a consequential button still shows the person what it will send before it runs.
5. **A field joins only as web and Apple draw it,** as every component does; the Windows and Android kits draw the tree once their renderers ship.

## What this changes

- Core: `COMPONENTS` gains the three fields and `PropKind` gains `path`; `getPointer`, `setPointer`, `isBinding` and `resolveButton` move into `src/composed.mts` (the A2UI adapter re-exports them); the catalog generator maps `path` to A2UI's `DataBinding`; two conformance cases (`inputs.json`, `invalid-field-value.json`).
- Web and Apple: their tree views draw the fields, keep the data model, and press with it.

## Prior art

Read on 2026-11-17.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI v1.0](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) data model and `@path` bindings | **Adopt** | JSON Pointer bindings and an `updateDataModel` stream; the adapter maps them onto Ouro's tree one to one. |
| [Adaptive Cards](https://adaptivecards.io/explorer/) `Input.Text`, `Input.Toggle`, `Input.ChoiceSet` with `Action.Submit` | **Borrow** | The long-lived shape: inputs on a card, gathered into the action when it is pressed. Ouro's version sends them only through a declared action with its consent class. |
| [json-render](https://github.com/vercel-labs/json-render) state bindings | **Watch** | Catalog-first like A2UI, with two-way bindings on its JavaScript renderers. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) | **Adopt** (unchanged) | Carries the data beside the tree in `structuredContent.ouro.data`. |
