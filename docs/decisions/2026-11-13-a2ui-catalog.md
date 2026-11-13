# Decision: Ouro HX is an A2UI catalog, and agent-composed UI carries the action model's consent

Status: accepted, 2026-11-13. It follows [agents use agent interfaces](2026-11-13-agents-use-agent-interfaces.md), whose Prior art marked A2UI and MCP Apps "watch" until the action model existed. The action model shipped in core 0.5.0, so this record makes that later decision.

## Why

Ari, 2026-11-13: Ouro UI should be "the BEST way to build interface for people and agents". In our model-reviews baseline, 6 of 8 frontier models chose A2UI over Ouro UI, and each of those 6 gave as its reason that Ouro UI has no way for an agent to compose UI for a person (Grok 4.7: "no shared surface an agent composes for a person"). The raw results are in the desk task `ouro-ui/agents-and-interfaces-position`, `research/07-model-reviews-baseline.md`; the script is [ourostack/ouro-ui#1007](https://github.com/ourostack/ouro-ui/pull/1007).

A2UI is a protocol, not a rival design system. Its v1.0 specification says: "While the Basic Catalog is useful for starting out, most production applications will define their own catalog to reflect their specific design system" ([A2UI protocol v1.0, "The component catalog"](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md#the-component-catalog)). MCP Apps carries no catalog at all: a server returns its own HTML, and a design system ships as the app's components, as [`@openai/apps-sdk-ui`](https://github.com/openai/apps-sdk-ui) does for ChatGPT apps. So the move is not to compete with either. It is to make Ouro HX the best catalog for A2UI and the best kit for MCP Apps, so that "A2UI with Ouro UI" is the obvious pick.

Neither protocol says what a button an agent placed is allowed to do. A2UI's `Button` takes an `action` whose event name and `userMessage` the agent writes, and MCP Apps leaves approval to each host ([SEP-1865](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx), "Sandbox proxy", item 8: the host "MAY decide to block some messages or subject them to further user approval"). Ouro already answers that question for every other surface with the action model's consent classes. Composed UI should get the same answer.

## Decision

1. **Ouro HX ships an A2UI v1.0 catalog.** Its `catalogId` is `https://ui.ouroboros.bot/a2ui/v1/catalog.json`. Core holds it: `src/a2ui.mts` declares it and generates `standard/hx/a2ui/catalog.json`, and a test fails when the committed file drifts. Platforms vendor it from a release by hash, as they do the claims.
2. **Component names are web's names.** The first set is what an agent needs for a card a person reads and acts on: `Card`, `Stack`, `Heading`, `Text`, `Image`, `Badge`, `List`, `DescriptionList`, `Separator`, `Alert` and `ActionButton`. A component joins the catalog only when web and Apple both render it and core's conformance cases cover it.
3. **No styling on the wire.** Props take HX's own small enums (a `Stack`'s `gap`, a `Badge`'s `tone`, an `ActionButton`'s `emphasis`), never colours, sizes or fonts. A2UI v1.0 removed theme properties so that styling "defer[s] ... entirely to the target framework's native theme" (protocol v1.0, "Changes from previous versions"); HX's theme is that native theme.
4. **Every button is a declared action.** There is no free `Button` with an agent-written event. `ActionButton` names an action from the app's action set; its label, its description and its consent class come from the declaration, never from the agent. The agent may only prepare its `input`. An agent therefore cannot place a button that says "Add to list" and places an order. An app's catalog is generated from its action set (`ouro-a2ui.mts catalog <actions.mts>`), so `ActionButton.action` is exactly the set's ids, and its `catalogId` is the app's own.
5. **Pressing it follows the consent class:**

   | Class | Pressing the button |
   | --- | --- |
   | read, write | Runs the action with the prepared input. |
   | consequential | Opens a confirmation built from the declaration: the label, the person's description, and each field's label beside its prepared value. The action runs only when the person confirms. |
   | person-only | Never runs from composed UI. The button takes the person to the app's own screen for it (the declaration's `how`). A surface that prepares input for a person-only action fails validation with the action model's typed refusal. |

   Every resulting A2UI `action` message is named after the action's id, its `context` is the input, and its `metadata.extensions.bot_ouroboros_action` records the consent class and that the person pressed it (`by: "person"`), borrowing per-change provenance from Vercel's UI SDK.
6. **An agent can't press a button through the screen.** The catalog declares no agent-callable functions. A renderer answers any `callRendererFunction` with A2UI's `INVALID_FUNCTION_CALL`; when it names one of the app's actions, the message says to use that action's agent door, and for a person-only action it carries the typed refusal. Agents use agent interfaces; composed UI is for the person.
7. **One validator, before anything renders.** `ouro-a2ui.mts validate` checks a message stream against the catalog and the action rules, and reports problems in A2UI's standard validation error format (`VALIDATION_FAILED` with `surfaceId`, `path` and a one-sentence `message`), so an agent can correct itself in A2UI's prompt, generate and validate loop.
8. **Our own small renderers, proved against one set of cases.** Web's renderer is a registry item in ourostack/ouro-ui and Apple's is a target in ourostack/ouro-ui-apple. Neither depends on A2UI's official renderers. Core's conformance cases (`standard/hx/a2ui/conformance/`) give a message stream and the platform-neutral tree it must resolve to, including what each button does; every case is also validated against A2UI's own v1.0 JSON Schemas in core's CI. Both renderers pass the same cases, which is our web and Apple parity check for composed UI.
9. **MCP Apps through the same catalog.** Core gives an MCP server the helpers to declare a `ui://` resource (`text/html;profile=mcp-app`), link a tool to it, and return A2UI messages in the tool result's `structuredContent`. Web ships the view, `OuroMcpApp`, which speaks the MCP Apps bridge, renders the surface with HX, and calls the action's own MCP tool when the person presses a write button (after confirming, for a consequential one). The host's `theme` sets light or dark; Ouro's tokens stay the app's look.

## What this changes

- Core: `src/a2ui.mts` (vendored by apps as `ouro-a2ui.mts`, beside `ouro-actions.mts`), the catalog, its conformance cases and the MCP Apps helpers, released together.
- Web: the `a2ui-surface` renderer and the `mcp-app` kit, and a docs page.
- Apple: the `OuroA2UI` target and its SwiftUI renderer.
- The proof uses synthetic data shaped like a Spoonjoy recipe. Spoonjoy itself adopts this in its own repositories.

## Prior art

Read on 2026-11-13.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI v1.0](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) | **Adopt** | The protocol, unchanged: `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`, `@path` bindings, list templates, the catalog format and its validation error format. Current since 2026-11-06 ([versions.json](https://github.com/a2ui-project/a2ui/blob/main/specification/versions.json)). We add no message types; our rules ride in its `extensions`. |
| A2UI's official renderers ([`@a2ui/react`](https://www.npmjs.com/package/@a2ui/react) 0.15.0, [`A2UISwiftUI`](https://github.com/a2ui-project/a2ui/tree/main/swift/swiftui)) | **Watch** | Both can register a custom catalog. We don't depend on them yet: the consent rules must sit in the renderer, ouro-ui-apple has no third-party dependencies, and A2UI's Swift package is tagged only `v0.10.0+swift` with `swift-json-schema` and `Yams` behind it. Revisit when they reach 1.0; the shared conformance cases make a switch checkable. |
| A2UI's [Basic Catalog](https://github.com/a2ui-project/a2ui/tree/main/catalogs/basic/v1) | **Borrow** | Its component shapes (`children` as a `ChildList`, `Image` with a required description) where ours match. Its free `Button` with an agent-written `action` is what decision 4 replaces. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) (SEP-1865, spec 2026-01-26, SDK v2.1.0 on 2026-11-10) | **Adopt** | The `ui://` resource, `_meta.ui.resourceUri`, the `ui/initialize` handshake and `ui/notifications/tool-result`, spoken directly over `postMessage` as the spec allows, so the view needs no SDK. |
| [`@openai/apps-sdk-ui`](https://github.com/openai/apps-sdk-ui) (MIT, 0.2.2) | **Borrow** | The precedent for a design system shipped as an agent-hosted app kit: tokens, accessible components, a provider. Ours differs in carrying the action model's consent, and in rendering one A2UI tree rather than hand-written JSX. |
| [json-render](https://github.com/vercel-labs/json-render) (Apache-2.0, 0.22.0, about 19.6k stars) | **Watch** | Catalog-first like A2UI, with a shadcn catalog and an MCP Apps path. Our catalog JSON could be projected to its `defineCatalog`; not until someone asks. |
| Apple [`CardSnippet`](https://developer.apple.com/documentation/appintents/cardsnippet) and [interactive snippets](https://developer.apple.com/documentation/appintents/displaying-static-and-interactive-snippets) | **Watch** | Siri shows app-authored SwiftUI cards, with buttons bound to App Intents. The same catalog components could render a `CardSnippet` view, whose buttons are the action model's `Button(intent:)`. That is a later projection, behind the iOS 27.3 SDK. |
| [AG-UI](https://github.com/ag-ui-protocol/ag-ui) | **Ignore** for now | A2UI's named transport binding. A transport choice belongs to the app; the catalog doesn't depend on it. |
| [Vercel UI SDK](https://github.com/vercel-labs/ui) | **Borrow** | Per-change provenance (`source: "agent"`), here as `by: "person"` on every action a composed button sends. |
