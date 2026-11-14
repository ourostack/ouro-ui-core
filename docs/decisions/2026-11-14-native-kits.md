# Decision: native kits are WinUI 3 on Windows, and a component is specified once in core

Status: accepted, 2026-11-14. The strategy is Ari's; this record decides the Windows toolkit and the shared component spec, from a spike on a free `windows-latest` runner ([ouro-ui-windows#1](https://github.com/ourostack/ouro-ui-windows/pull/1), [green run](https://github.com/ourostack/ouro-ui-windows/actions/runs/43640742595)) and a frontier-model review.

## Why

Ari, 2026-11-14: "windows is way more important than android"; "no web in native, right? otherwise what's the point?"; "things like react native by nature have compromises. whole point is that we want uncompromising maximum delightfulness! web bit stays a first and easy way to only build once for all platforms, and then you can specialize on your own time". He also asked that it be "maximum delight + dry", easy to use and maintain, and "delightful for agents to build with too".

So the strategy is settled, and this record does not reopen it:

- **Web** is the build-once layer that runs everywhere.
- **Native** is one kit per platform, in that platform's own UI toolkit: SwiftUI on Apple (shipping), the toolkit this record picks on Windows, Compose on Android (paused).
- **Nothing in between:** no web views, React Native or cross-platform toolkits inside a native kit.
- **Kits share the core, never rendering:** tokens, `defineAction` and its consent classes, claims, the A2UI catalog and the conformance cases.

## Decision

1. **Windows is WinUI 3 on the Windows App SDK,** packaged as MSIX, in `ourostack/ouro-ui-windows`. WPF with its Fluent theme is the runner-up, and not used.
2. **A component is specified once, in core, and rendered natively by hand.** Core gains a component spec beside the claims: the component's API (properties, slots, events), its states and variants, the tokens it uses, the claims that apply, and its conformance cases. Each platform vendors the spec by hash, as it vendors tokens and claims, writes the component in its own toolkit, and runs the claims and cases as tests. Core may generate typed API stubs from the spec (a Swift protocol, a C# interface); it never generates rendering.
3. **Agents reach a Windows app from day one,** through two projections of the same action declaration: an App Action for each action whose inputs App Actions can carry, and an MCP server registered with the On-device Agent Registry. Person-only actions are in neither, and every agent door answers them with core's typed refusal. A packaged X-ray checks that what agents can call and what a person can press agree.

## The Windows toolkit

### What the spike measured

The same small app (a text field, two buttons, a status line) in WinUI 3 and in WPF Fluent, .NET 10, 8 launches each, on Windows Server 2025 (build 26100), 4 vCPU. Launch is to the first action button in the UI Automation tree; press is a UI Automation Invoke to the status text changing ([measure.md](https://github.com/ourostack/ouro-ui-windows/actions/runs/43640742595), runs [43640165261](https://github.com/ourostack/ouro-ui-windows/actions/runs/43640165261) and [43640742595](https://github.com/ourostack/ouro-ui-windows/actions/runs/43640742595)):

| Measure | WinUI 3 | WinUI 3 (MSIX) | WPF Fluent |
| --- | --- | --- | --- |
| Warm launch to button, median (ms), two runs | 355, 390 | 427, 441 | 453, 465 |
| Cold launch to button, one sample (ms), two runs | 416, 589 | 432, 480 | 939, 480 |
| Private bytes, median (MB) | 27.8 | 27.6 | 31.8 |
| Working set, median (MB) | 101.2 | 101.1 | 87.4 |
| Press to status, median / p95 (ms) | 2.2 / 2.4 | 2.1 / 8.5 | 2.7 / 3.3 |
| Clean build (s) | 40 | | 2 |

On this runner the two toolkits are comparable. WinUI 3 led on warm launch, private memory and press latency in both runs, but by margins close to the gap between the runs, on a 3-control app in a virtual machine with no GPU. Cold launch is one sample per run and moved by 450 ms, so it decides nothing. Launch here means the button is in the UI Automation tree, not the first painted frame, and a UI Automation Invoke is not a physical press. Output sizes aren't compared, because the builds deploy differently (WinUI here carries the Windows App SDK; WPF uses the .NET already installed). Not measured: frame pacing, Mica and Acrylic (the server runner draws neither), high contrast, and memory in a real app. The Windows v0.1.0 plan measures these with core's Feel spec on a Windows 11 client.

So the measurements don't pick the toolkit; they show WinUI 3 costs nothing in feel. The choice rests on the next section: Microsoft's direction, Fluent materials WPF can't choose, and WPF's Fluent theme still being experimental.

### What Microsoft says and does

- Microsoft calls WinUI 3 "the recommended native UI framework for building new Windows desktop applications" ([Learn](https://learn.microsoft.com/windows/apps/winui/winui3/), 2026-10-02).
- The Windows App SDK ships about monthly; 2.6.5 shipped 2026-11-03 ([releases](https://github.com/microsoft/WindowsAppSDK/releases)).
- WPF's Fluent theme is still experimental (diagnostic `WPF0001`), and Microsoft says "Fluent UI style support is still in progress" ([.NET 10 WPF](https://learn.microsoft.com/dotnet/desktop/wpf/whats-new/net100)); WPF has no API to pick Mica Alt or Acrylic ([dotnet/wpf#10044](https://github.com/dotnet/wpf/issues/10044)).
- App Actions and the On-device Agent Registry need package identity and are open to any packaged desktop app ([App Actions](https://learn.microsoft.com/windows/ai/app-actions/), [MCP on Windows](https://learn.microsoft.com/windows/ai/mcp/overview)). Neither favours a toolkit, so the agent side does not decide this.
- Unverified, from secondary reporting: File Explorer and other shell surfaces use WinUI, and the Start menu moved from React Native to WinUI.

### Risks we accept

- `microsoft-ui-xaml` does not take outside code yet ([discussion #10700](https://github.com/microsoft/microsoft-ui-xaml/discussions/10700)), so we report bugs; we cannot fix them upstream.
- The Windows App SDK adds about 150 MB unpackaged. MSIX and the Store's framework package remove that for people who install from the Store or winget.
- A WinUI build takes about 40 s on the runner against WPF's 2 s.

## Specified once, rendered natively

### What core holds and what a platform holds

| Core (`standard/hx/components/<name>.spec.json`) | Each platform |
| --- | --- |
| API: properties with types and defaults, slots, events | the component in its toolkit (SwiftUI, WinUI, Compose) |
| States (rest, hover, pressed, focused, disabled, busy) and variants | how each state looks and moves |
| The tokens each part uses, by token name | the native value of each token (core already generates them: `dist/apple`, `dist/windows`, `dist/android`) |
| The claims that apply (`appliesTo` in `components.claims.json`) | one test per claim, named by the claim's `checks.<platform>` |
| Conformance cases: an input and what a person and an agent must observe | a runner that renders each case and reads it the way people's assistive tech and agents do |
| The action it binds to, if any (`defineAction`) | the native door (`Button(intent:)` on Apple; the generated `OuroActions` on Windows) |

A new component costs one core spec plus one native rendering per platform; nothing else is written twice. A platform proves parity by running the same claims and cases, and a platform that skips a claim shows "not run" in the parity table, which CI generates from each platform's test report.

### How a platform vendors it

As Apple does: `core-provenance.json` at the repository root names the core tag and the SHA-256 of every file taken, and CI fails when a vendored file differs from the release ([ouro-ui-apple](https://github.com/ourostack/ouro-ui-apple/blob/main/core-provenance.json)). Windows uses the same file and the same check.

### What core adds

1. `standard/hx/components/<name>.spec.json` and its schema, starting with Button, Badge, Card and Item, Apple's first set ([ouro-ui-apple 1.0 decision](https://github.com/ourostack/ouro-ui-apple/blob/main/docs/decisions/2026-11-14-apple-1-0.md)).
2. `"windows"` (and later `"android"`) in `HX_PLATFORMS` (`src/hx-claims.mts`), and a `checks.windows` entry on each claim, describing the spike's check: the UI Automation tree plus the control's `ItemStatus` report.
3. A Windows projection of `defineAction`: `app-actions.json` (App Actions schema version 3), the MCP bundle manifest with ODR's static responses equal to `mcp.json`, and `OuroActions.g.cs`, moved from the spike's `spikes/shared/windows-actions.mts` into `src/ouro-actions.mts` beside `OuroActions.swift`.
4. A C# compile of `dist/windows/OuroTokens.cs` and `OuroTokens.xaml` in CI. They shipped in [v0.11.0](https://github.com/ourostack/ouro-ui-core/releases/tag/v0.11.0) with HX claims 0.2.0, which cover Badge, Card and Item.
5. A rule for actions an agent door can't carry. App Actions take no numbers or booleans, so the Windows projection already leaves such an action out of `app-actions.json` and writes the reason into `app-actions.skipped.json`. Core makes that a per-door eligibility result every projection reports, never a silent skip and never a coercion to text.

What this record does not change: Apple's shipping kit keeps its components and API. Adopting the spec there means adding `core-provenance.json` entries and a test per spec, which is the shared-spec pattern and nothing more.

## Agents on Windows

The spike's [X-ray](https://github.com/ourostack/ouro-ui-windows/actions/runs/43640742595) passed all 10 checks:

- `add_shopping_list_item` (write) is a button a person presses, an MCP tool, and a registered App Action whose URI launch runs it.
- `place_grocery_order` (person-only) is a button a person presses, has no MCP tool and no App Action, and both a direct MCP call and a spoofed App Action launch get core's typed refusal.
- Core's `compareMcp` finds no drift between the packaged server's live `tools/list` and `mcp.json`.
- The MSIX installs with both app extensions, `com.microsoft.windows.ai.actions` and `com.microsoft.windows.ai.mcpServer`, and the MCP server answers through its execution alias in 210 ms.

The runner cannot show the last mile: Windows Server 2025 has no App Actions catalog service (`ActionCatalog.GetAllActions` fails with 0x80080005), and the On-device Agent Registry needs Windows build 26220.7262 or later. Proving those needs a Windows 11 client, which the free runners are not.

### UI Automation is an agent door too

The frontier review's sharpest point (below): the person-only button is reachable through UI Automation, which is how the X-ray itself pressed it, and how a computer-use agent or an accessibility-driven OS agent would. Windows cannot tell a screen reader user's Invoke from an agent's, so the refusal holds at the MCP and App Action doors but not at the button. Core's 2026-11-13 record tolerates screen-driving as glue, so this is a gap in what "person-only" promises, not a bug in the spike. Closing it means asking Windows for proof of the person (Windows Hello through `UserConsentVerifier`) before a person-only action runs. That would change the consent model on every platform, Apple's shipping kit included, so it goes to Ari as a decision. Windows v0.1.0 builds the hook and leaves it off until he decides.

### Which actions become App Actions

App Actions carry text, files, photos, documents, tables and contacts, never numbers or booleans ([entities](https://learn.microsoft.com/windows/ai/app-actions/actions-json)). The projection skips an action whose required input is neither, and writes why into `app-actions.skipped.json`; MCP still carries it. Microsoft scopes App Actions to verbs that make sense across apps, so a kit should publish a few, while MCP carries all of them.

## Frontier review

We put both questions and the spike's evidence to the ten models Ouro UI's model reviews use. Each got one round, the same neutral prompt and no tools. The prompt asked for a pick, a runner-up and where the evidence is weak, and stated no preference. This review is separate from the model-reviews harness; its packet, script and raw replies are in the desk's evidence folder for this task.

| Model | Toolkit | Runner-up | Design |
| --- | --- | --- | --- |
| Claude Opus 5.5, Claude Opus 5, Claude Sonnet 5.5 | WinUI 3 | WPF Fluent | A (this record's) |
| GPT-6.1 Sol, GPT-6 Astra, GPT-6.1 Terra | WinUI 3 | WPF Fluent | A |
| Gemini 4 Carbon, Gemini 4 Hydrogen, Grok 4.7 | WinUI 3 | WPF Fluent | A |
| MiniMax M3 | no answer (timed out after 20 minutes) | | |

All 9 models that answered agree. Where they differ is on what to add:

- **Measurements.** Several models (Sonnet 5.5, Opus 5, Grok 4.7, Terra) say the numbers show "comparable", not "faster", and that the size row compared unlike deployments. This record now says so.
- **UI Automation bypasses person-only.** Opus 5.5 and Gemini 4 Carbon raise this; Grok 4.7 asks for a stable UI Automation contract. It's handled above.
- **Runtime contract at the shared entry point.** Sol, Astra, Terra and Opus 5 ask for caller identity, input validation after URI decoding, idempotency and replay handling, cancellation, and an audit record, and for a confirmation path for `consequential` actions that an agent can't drive.
- **The spec's contents.** Every model lists versioning and migration rules, an accessibility contract (role, name sources, keyboard and focus) mapped per platform (ARIA, UIA, Apple's traits), explicit states, and documented per-platform deviations. Opus 5.5 adds that the Windows kit should be ordinary templated WinUI controls (`Control` subclasses with `ControlTemplate`, `VisualState` and `ThemeResource` keys), so XAML, code-behind and Microsoft.UI.Reactor apps can all use them.
- **Self-reported checks.** Terra notes that press scale and label height come from the control's own report, which proves the code path, not the pixels. A pixel check joins the claims runner in v0.1.0.

## Agent experience

Ari asked that the kit be delightful for agents to build with. To measure it, a fresh agent got one line ("add a Badge to the WinUI 3 kit, matching Ouro UI's Badge elsewhere, and make it pass core's claims in CI") and no hints.

- It finished in about 16 minutes, green on its first CI run ([run 43642429901](https://github.com/ourostack/ouro-ui-windows/actions/runs/43642429901), branch `spike/badge-dx`, not merged).
- It read about 22 files across four repositories, created 2 files, changed 3, and added 199 lines.
- Badge rendered, and its three claims (`name.spoken`, `text.reflows`, `contrast.text`) passed on Windows. Neither CI nor the compiler raised an error.
- It had to guess or copy from elsewhere what a spec would have given it:
  - The Badge's API, which it took from web and Apple, which differ: web has static, button and link modes, and Apple is static only.
  - Its tones, of which it shipped 2 of 5 because the spike's token stub has only two.
  - Its radius, from Apple's source.
  - Its maximum width, wrapping and UI Automation shape, which it invented.
  - Which claims apply. Core's `main` had added Badge to three claims, but the latest release (v0.10.0) had not, so it hard-coded them.

Its own suggestion for the next agent: release core with those claims and the Windows tokens, and make the claims checker take a component name. The release is done ([v0.11.0](https://github.com/ourostack/ouro-ui-core/releases/tag/v0.11.0)). The component spec in this record removes the guessing.

## Windows v0.1.0

Agents first, then the four components Apple shipped first.

1. **Agent side.** Move the Windows projection into core (above) and release it. `ouro-ui-windows` takes `OuroActions.g.cs`, the App Actions registration and the MCP bundle manifest from that release, recorded in `core-provenance.json`, and keeps the packaged X-ray in CI. The shared entry point validates input after URI decoding, takes an idempotency key, and records each call. A `consequential` action brings the app forward and asks the person before it runs. Person-only actions get a hook for Windows Hello, off until Ari decides.
2. **Tokens and claims.** Vendor `OuroTokens.cs`, `OuroTokens.xaml` and claims 0.2.0 from core v0.11.0, in place of the spike's stub and claims 0.1.0.
3. **Button,** from core's spec, as a templated WinUI control, with its five `must` claims as tests (passing in the spike) and a pixel check beside the self-reported ones. One claims runner takes the component's name.
4. **Badge, Card, Item,** each from its core spec, with the claims that apply.
5. **Feel and the last mile on a Windows 11 client:** core's Feel spec (`standard/feel/feel.spec.json` already names a `windows` driver) for frame pacing, Mica and high contrast, and the App Actions catalog and the On-device Agent Registry finding the package. The free runners are Windows Server, so this needs a client machine.
6. **Release** as a NuGet package and a signed MSIX sample on GitHub releases.

## Prior art

| Find | What we take | Call |
| --- | --- | --- |
| [WinUI 3 / Windows App SDK](https://learn.microsoft.com/windows/apps/winui/winui3/) | the Windows toolkit | adopt |
| [WPF Fluent theme](https://learn.microsoft.com/dotnet/desktop/wpf/whats-new/net100) | runner-up; measured and passed over | watch |
| [Microsoft.UI.Reactor](https://www.nuget.org/packages/Microsoft.UI.Reactor) | declarative WinUI where every rendered control is a real WinUI control, with tokens mapped to WinUI resource keys | borrow the token mapping; watch the rest (preview) |
| [Windows App Actions](https://learn.microsoft.com/windows/ai/app-actions/) | one agent door, generated from `defineAction` | adopt |
| [MCP on Windows, On-device Agent Registry](https://learn.microsoft.com/windows/ai/mcp/overview) and [microsoft/mcp-on-windows-samples](https://github.com/microsoft/mcp-on-windows-samples) | the other agent door, and the MCP bundle manifest's static responses | adopt |
| [Fluent UI's per-platform repositories](https://github.com/microsoft/fluentui-apple) | one design language, one native repository per platform | adopt (as in the 2026-11-03 record) |
| [fluentui-token-pipeline](https://github.com/microsoft/fluentui-token-pipeline) | one token source generating native values; now archived | ignore (we have our own, already shipping) |
| [SwiftUI `Button(_:intent:)`](https://developer.apple.com/documentation/swiftui/button/init(_:intent:)) | a native control bound to the agent's action | adopt (Apple already does) |
| [React Native for Windows](https://github.com/microsoft/react-native-windows), [.NET MAUI](https://github.com/dotnet/maui), [Uno Platform](https://github.com/unoplatform/uno), [Avalonia](https://github.com/AvaloniaUI/Avalonia), [Flutter](https://github.com/flutter/flutter), [Compose Multiplatform](https://github.com/JetBrains/compose-multiplatform) | one codebase across platforms | ignore: "things like react native by nature have compromises. whole point is that we want uncompromising maximum delightfulness!" (Ari) |
| [WebView2](https://learn.microsoft.com/microsoft-edge/webview2/), [Tauri](https://github.com/tauri-apps/tauri), [Electron](https://github.com/electron/electron), PWAs | web inside a native shell | ignore: "no web in native, right? otherwise what's the point?" (Ari); the web kit already serves these |
