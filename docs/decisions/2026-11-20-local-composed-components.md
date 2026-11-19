# Decision: an app extends the composed-UI catalog with its own validated components

Status: accepted, 2026-11-20, under Ari's overnight authority. It answers a finding of the [model interviews](2026-11-19-model-interviews.md): [ourostack/ouro-ui#2317](https://github.com/ourostack/ouro-ui/issues/2317).

## Why

The models read the composed-UI catalog as a ceiling: a fixed set of Ouro HX components, so an app with a card of its own has to ask for a release or leave the catalog. The loader refused every component that wasn't HX's so a hand-edited catalog couldn't widen them, which was right for safety and wrong for adoption.

## Decision

An app declares its own components as a named export `components` from its actions file. Core checks them (`localComponentProblems`) and writes them into the catalog and into the Ouro extension of its metadata. The loader accepts a component that is HX's, `ActionButton`, or declared there and valid; any other still throws.

- A local component is data: a capitalised name, a description, typed props. Its props are string, strings, boolean, enum, level, terms and children.
- It can't hold an action, an input or a path, because those carry consent and data. A button stays `ActionButton`.
- It can't take HX's name or `ActionButton`, so a catalog can't replace what HX specifies.
- The app draws it with a renderer it registers. Core says nothing about drawing.

## Prior art

Read on 2026-11-20.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI catalogs](https://a2ui.org/) | **Adopt** | A catalog is where a client lists the components it can draw, and an app brings its own. |
| [shadcn/ui registry](https://ui.shadcn.com/docs/registry) | **Borrow** | An app adds its own items beside the library's under a name of its own. |
| [Custom elements](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements) | **Watch** | Names must not collide with built-ins, the rule used here. |
