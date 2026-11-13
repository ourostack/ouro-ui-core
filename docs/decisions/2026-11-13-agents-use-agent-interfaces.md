# Decision: agents use agent interfaces, and one action declaration feeds every surface

Status: accepted, 2026-11-13. It rests on six research reports read that day, whose key claims an independent pass checked against primary sources (10 verified, 2 partly, 0 refuted); each claim below links its primary source. The action model's design and code follow in this repository.

## Why

Ari, 2026-11-13: Ouro UI should be "the standard that all other interface builders look up to", which means it "has to be the BEST way to build interface for people and agents". The rule that every product we still maintain uses Ouro UI and gives back what it learns is proposed in web, in [ourostack/ouro-ui#999](https://github.com/ourostack/ouro-ui/pull/999); this record does not restate it.

The platform owners now rank agent interfaces above screen driving:

- Android ranks "a remote MCP server or local Android MCP" (AppFunctions, [overview](https://developer.android.com/ai/appfunctions)) as "the fastest, most reliable execution", and Computer Control, which drives the screen, as what agents "fall back" to ([Google, 2026-11-05](https://developer.android.com/blog/posts/android-intelligence-system-in-app-agents-ads)).
- Apple gives Siri no way into a third-party app except what the app declares with App Intents: "Siri can only find custom content and perform custom actions an app makes explicitly available using App Intents" ([Siri AI developer preview](https://developer.apple.com/documentation/appintents/siri-ai-developer-preview), in the iOS 27.3 beta).
- Windows routes agents through MCP agent connectors ([Learn](https://learn.microsoft.com/en-us/windows/ai/mcp/overview)); its screen-driving Agent Workspace is an experimental, admin-enabled private preview ([support](https://support.microsoft.com/en-us/windows/ai/ai-features/experimental-agentic-features)).

When an agent works on a person's screen, the same specifications keep the last step with the person. In WebMCP's declarative forms, unless a form says otherwise, the agent fills the form and the person presses Submit ([declarative API explainer](https://github.com/webmachinelearning/webmcp/blob/main/declarative-api-explainer.md)). Shopify's UCP checkout must hand back to a trusted page with `requires_escalation` and a `continue_url` ([UCP checkout](https://ucp.dev/latest/specification/shopping/checkout/)). Apple's `requestConfirmation()` is the guard "before performing any work that might be destructive or unsafe" ([doc](https://developer.apple.com/documentation/appintents/appintent/requestconfirmation())).

Ouro already declares the same action up to four times: `defineCommand` gives the CLI and MCP, `defineComponentAx` gives a control its CLI twin, `ReinsAction` gives a test node, and an App Intent gives Siri. `defineComponentAx` ([`registry/ouro/ax/component.ts`](https://github.com/ourostack/ouro-ui/blob/main/registry/ouro/ax/component.ts)) is declared in 6 of web's 98 component folders, all call components (AgentPresence, LevelMeter, LiveCaptions, MediaTile, Porthole and SnapPiP, each in its `registry/ouro/components/ouro/<name>/<name>-styles.ts`), and no app binds it (our count, 2026-11-13). Four declarations of one action can drift apart. That is part of WebKit's objection to WebMCP: an agent acting for a person is assistive technology and should use the person's interface, and a separate agent layer lets the two drift ([WebKit/standards-positions#670](https://github.com/WebKit/standards-positions/issues/670)).

## Decision

1. **Agents use agent interfaces.** An agent reaches an Ouro product through an interface built for it: a CLI, MCP, WebMCP's imperative tools, App Intents or AppFunctions. A product that makes an agent drive its screen is missing an agent interface, and that is a bug in the product.
2. **On a person's screen, an agent prepares and the person commits.** When an agent works inside a person's interface, it fills, stages and suggests; the person presses the button that makes it happen. An action whose effect the person must start themselves (paying, ordering, turning on their microphone) is the person's alone, and every agent door refuses it.
3. **Driving a GUI is for testing our own, or for gluing to someone else's, never the designed path.** Ouro Reins drives our own apps to test them, through the same entry points a button calls. Driving someone else's screen (an accessibility tree, a KVM, a signed-in browser) is glue we tolerate and log where that product has no agent interface; we never design a product so that it needs it.
4. **The direction: one action declaration feeds every surface.** Each action is declared once in core: its id, typed input and output, its consent class (read, write, consequential or person-only), the person's label and description, and the agent's description. Every surface is generated from it: the web control and its `defineComponentAx` entry, the CLI and MCP through `defineCommand`, a WebMCP tool, a SwiftUI `Button(intent:)` with its App Intent, and Reins test nodes. A check fails CI when a surface drifts from its declaration. That answers the drift half of WebKit's objection with a test instead of a promise. In our search on 2026-11-13 we found nobody doing it across web and native: Builder.io's agent-native does it on the web only, and Apple's `Button(intent:)` on Apple only (Prior art).

The consent classes, and what each surface does with them:

| Class | Meaning | An agent door |
| --- | --- | --- |
| read | Changes nothing | Runs it |
| write | Changes only the person's own space | Runs it |
| consequential | Reaches other people, or can't be taken back | Prepares it, previews who sees it, and needs the person's say before it acts |
| person-only | The person must start it themselves | Refuses with a typed refusal: an outcome `refused`, code `person-only`, the reason and how the person does it |

## What this changes

- **Claims.** The action model adds AX claims in `standard/` that a projection matches its declaration and that a person-only action refuses on every agent door.
- **Spoonjoy adopts it first**, on its web and Apple apps, once core ships the model. Its MCP already has 41 tools; the declaration becomes their source.
- **Our own records.** The 2026-11-03 platform evidence in web is corrected to match in [ourostack/ouro-ui#1005](https://github.com/ourostack/ouro-ui/pull/1005): Apple has no MCP for App Intents or Siri (Xcode 27's plug-ins do use MCP), and AppFunctions is at 1.0.0-rc01, no longer experimental.

## Prior art

Read on 2026-11-13.

| Find | Verdict | Why |
| --- | --- | --- |
| [Vercel UI SDK](https://github.com/vercel-labs/ui) (`@ui-sdk/core`, [docs](https://ui-sdk.dev/docs/agents)) | **Watch**, and **borrow** four ideas | A web-only beta, public since 2026-11-12 (`0.1.0-beta.2` under npm's `beta` tag). As an agent's main door it drives a screen, which this record rules out; as the "prepares" lane it is careful. Borrow: every change carries its source (`source: "agent"`); undo scoped to the agent's changes (`createHistory`); staged suggestions on the real controls (`stageChanges`); and refusing a label that matches more than one control. No dependency. |
| [Builder.io agent-native](https://github.com/BuilderIO/agent-native) | **Borrow** | One `defineAction` with `needsApproval` serves UI, HTTP, MCP and A2A, the closest existing "declare once". It is web only and checks no parity between a control and its tool, which is the part we add. |
| SwiftUI [`Button(_:intent:)`](https://developer.apple.com/documentation/swiftui/button/init(_:intent:)) | **Adopt** | Apple's own "one action for the button and for Siri" since iOS 17 and macOS 14: the same `AppIntent` value drives an in-app button, widgets, snippets, Shortcuts and Siri. The Apple projection generates it. |
| [`app_intents_codegen`](https://pub.dev/packages/app_intents_codegen) (Flutter) | **Watch** | Generates App Intents (Swift) and AppFunctions (Kotlin) from one annotated definition, the nearest existing "define once, iOS and Android". It shares nothing with the UI control, and its publisher is unverified. |
| [WebMCP](https://github.com/webmachinelearning/webmcp) | **Borrow** | Imperative tools are a cheap projection of the declaration, and its `readOnlyHint` and `consequentialHint` map onto our consent classes. Its declarative forms fit "prepares, person commits". An origin trial in Chrome 149 and Edge 150 only, opposed by WebKit and neutral at Mozilla ([implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)): generate it, don't depend on it. |
| [A2UI](https://a2ui.org/specification/v1.0-a2ui/) | **Watch** | v1.0 is current; apps "define their own catalog to reflect their specific design system", with official SwiftUI and React renderers. It is the agent rendering UI for a person, a separate decision; a catalog should list these actions, so it follows the action model. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) (SEP-1865) | **Watch** | Stable since 2026-01-26; hosts render an MCP server's own UI. Same direction as A2UI, same later decision. |
| [AppFunctions](https://developer.android.com/jetpack/androidx/releases/appfunctions) | **Watch** | Android's declared agent door, 1.0.0-rc01 on 2026-11-04. It is the Android projection once Ouro has an Android platform; the agent description becomes its functions' KDoc and the input's descriptions their parameters' docs, which is what Android shows the model. |
