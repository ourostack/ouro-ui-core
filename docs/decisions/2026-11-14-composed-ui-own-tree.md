# Decision: Ouro's composed-UI tree is the source of truth, and A2UI and MCP Apps are adapters at the edge

Status: accepted, 2026-11-14. It supersedes [Ouro HX is an A2UI catalog](2026-11-13-a2ui-catalog.md) where the two differ, and keeps everything that record decided about consent: every button is a declared action, pressing it follows the consent class, and an agent can't press a button through the screen.

## Why

Ari, 2026-11-14: "if we couple our cart to a horse, that it's a horse that we know will actually stay the most relevant - don't want to prematurely adopt a standard that might go away and never see real adoption." And on the strategy as a whole: "maximum delight + dry!!! keep it easily usable and maintainable. must be delightful for agents to build with too".

The 2026-11-13 record made Ouro HX "an A2UI v1.0 catalog". The rules that matter were already Ouro's own: the components and their props, the consent class of each button, the confirm sheet, the person-only handoff and the tree every renderer must draw. But they lived inside `src/a2ui.mts`, so a renderer, a catalog or MCP Apps support could only be reached through A2UI. Agent-composed UI has several live formats and none has won yet (A2UI, MCP Apps, json-render, the OpenAI Apps SDK, Apple's snippets). Coupling to one would make dropping it, or adding another, a rewrite.

## Decision

1. **Ouro's composed tree and catalog are the source of truth.** `src/composed.mts` holds them and imports nothing: the component specs (`COMPONENTS`, `ACTION_BUTTON`), the action and consent rules (`CatalogAction`, `pressOf`, `actionButtonProps`, the confirm sheet's rows), the tree every renderer draws (`ComposedNode`), its validator (`validateTree`) and what a press asks the app to do (`personPress`). Its version is `COMPOSED_VERSION`, independent of any format's.
2. **The tree checks itself.** `validateTree(catalog, tree)` accepts a tree only when each component is the catalog's, each prop is resolved and of its kind, and each `ActionButton`'s label, consent, press, confirm sheet and handoff are exactly what the catalog says. A sender can't relabel a button or loosen its consent in any format.
3. **Formats are adapters.** An adapter turns its format into the tree and wraps a press in its format's message, and does nothing else.
   - **A2UI** (`src/a2ui.mts`): reads an A2UI catalog into Ouro's, validates a message stream in A2UI's error format, resolves it into the tree, and wraps `personPress` in A2UI's `action` message. It re-exports what it used to define, so existing importers keep working.
   - **MCP Apps** (`src/mcp-app.mts`): the `ui://` resource, the tool's `_meta` and a tool result. A result may carry the tree itself, as `structuredContent.ouro` (`mcpAppTreeResult`), or an A2UI stream, as `structuredContent.a2ui` (A2UI's `mcpAppToolResult`). MCP Apps is the transport; it no longer depends on A2UI.
   - Adding a format (json-render, for example) is one new adapter file; dropping one deletes its file. No renderer and no catalog changes.
4. **Renderers draw the tree.** Web and Apple each split their renderer into a tree view, which takes a `ComposedNode` and the press callbacks, and thin format entry points (`A2UISurface` and `OuroA2UI` for A2UI, `OuroMcpApp` for MCP Apps).
5. **Conformance stays one set of cases.** The shared cases in `standard/hx/a2ui/conformance/` already end in Ouro's tree; `test/composed.test.mts` checks that every tree they resolve to passes `validateTree`, and that forged trees fail it. A future format's adapter is checked by resolving its own inputs to the same trees.
6. **Release files.** The release ships `ouro-composed.mts` (byte for byte), and `ouro-mcp-app.mts` and `ouro-a2ui.mts` with their imports renamed to those names (`scripts/build.mts` fails on any other import).
7. **Positioning.** Ouro UI's README and site open with what is Ouro's own: one action declaration for people and agents, consent built in, and the X-ray. The formats it works with are listed below that, under "Works with", MCP Apps first.

## Which formats, and how firmly

The evidence, gathered on 2026-11-14 from primary sources (npm's download API, GitHub, each format's own docs), decides which adapters exist. This record makes each one cheap to add or drop; the verdicts are reviewed whenever the evidence moves. Downloads are October 2026 against April 2026, from `https://api.npmjs.org/downloads/point/<period>/<package>`; read them as direction, not users.

| Format | Evidence | Verdict |
| --- | --- | --- |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) | An official MCP extension, under the Linux Foundation's Agentic AI Foundation. Rendered by 13 hosts in [MCP's client matrix](https://modelcontextprotocol.io/extensions/client-matrix) (Claude, ChatGPT, VS Code, Microsoft 365 Copilot, Cursor and others) and by Gemini Enterprise. `@modelcontextprotocol/ext-apps`: 24.9M a month, from 4.86M. | **First-class adapter.** It leads the "works with" list. |
| [A2UI](https://github.com/a2ui-project/a2ui) | v1.0 since 2026-11-06. Google ships it in Gemini Enterprise and an AndroidX artifact, but every production host we found is attested only by Google, most of its committers work at Google, and it is in no foundation. `@a2ui/react`: 705k a month, from 30k; `@a2ui/web_core`: 4.45M, mostly pulled in by CopilotKit. | **Supported adapter**, kept. Raise it if it joins a foundation or a non-Google host documents it; lower it if Google's own hosts move to MCP Apps. |
| [json-render](https://github.com/vercel-labs/json-render) | Vercel Labs, pre-1.0, one maintainer wrote most of it. `@json-render/core`: 9.58M a month, from 1.38M. | **Watch.** One adapter file when an adopter asks. |
| [AG-UI](https://github.com/ag-ui-protocol/ag-ui) | A transport that carries other formats' payloads, not a UI tree. | **Watch**, no adapter. |
| [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt) | ChatGPT now builds on MCP Apps. | **Ignore** as a separate format; MCP Apps covers it. |
| [OpenUI](https://github.com/thesysdev/openui) (Thesys) | One vendor, no host we could verify. | **Watch.** |
| Apple [`CardSnippet`](https://developer.apple.com/documentation/appintents/cardsnippet) | A render target for SwiftUI on every Apple OS, not a format an agent sends. | **Later projection** of the Apple tree view. |

## What this changes

- Core: `src/composed.mts` and `src/mcp-app.mts` are new; `src/a2ui.mts` becomes the adapter and imports them. The catalogs and conformance cases are unchanged, byte for byte.
- Web: vendors the three files from a core release, adds the tree view, and lets `OuroMcpApp` draw `structuredContent.ouro`.
- Apple: splits `OuroA2UI`'s renderer into a tree view and the A2UI entry point.
- Apps that vendor `ouro-a2ui.mts` vendor `ouro-composed.mts` and `ouro-mcp-app.mts` beside it from 0.11.0 ([the guide](../guides/a2ui.md#1-vendor-the-files)).

## Prior art

Read on 2026-11-14.

| Find | Verdict | Why |
| --- | --- | --- |
| [Microsoft Adaptive Cards](https://adaptivecards.io/) | **Borrow** (a precedent, not an adapter) | The longest-lived declarative card format (Teams, Outlook, Windows). Its hosts render one card schema with their own native look, the "specify once, render natively" shape this record gives Ouro's own tree. Its lesson for us: the host-config split between content and styling is what lasted. |
| [A2UI v1.0](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) | **Adopt** (supported adapter) | Unchanged from the 2026-11-13 record: the protocol, its catalog format and its error format, behind `src/a2ui.mts`. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) (SEP-1865) | **Adopt** (first-class adapter) | The format most hosts render. Now carries Ouro's tree directly, so it no longer depends on A2UI. |
| [json-render](https://github.com/vercel-labs/json-render) | **Watch** | Catalog-first like A2UI. One adapter file from our tree when adoption justifies it. |
| [OpenUI](https://github.com/thesysdev/openui) | **Watch** | A compact UI language for models; one vendor so far. |
| [`@openai/apps-sdk-ui`](https://github.com/openai/apps-sdk-ui) | **Borrow** (the idea; no adapter) | A design system shipped as an agent-hosted app kit, as `OuroMcpApp` is. |
| [AG-UI](https://github.com/ag-ui-protocol/ag-ui) | **Watch** | A transport between an agent and its app; it carries other formats' payloads, so it needs no adapter of its own. |
| Apple [`CardSnippet`](https://developer.apple.com/documentation/appintents/cardsnippet) | **Watch** | Siri shows app-authored SwiftUI cards with intent-bound buttons. The tree view could render one, as a later projection. |
| [Vercel UI SDK](https://github.com/vercel-labs/ui) | **Borrow** | Per-change provenance, kept as `by: "person"` on every press. |
