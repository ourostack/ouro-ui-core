# Decision: Ouro AX for Apple

Status: accepted, 2026-11-03. Workstream W4 of the program in which Ouro HX and Ouro AX gain Apple as a platform. It adds a target to [Ouro AX](2026-10-30-ouro-ax.md) and moves nothing: web's standard, X-ray and kit stay where they are until the repository split.

## Decision

1. **On Apple, the agent is Siri, and the interface is App Intents.** Ouro AX for Apple has four surface types: `app-intent` (actions, including tool intents and App Shortcuts), `app-entity` (the things actions act on), `view-annotation` (entities marked as on screen) and `app-skill` (the `SKILL.md` guidance an app ships for Siri). The standard is [`standard/ax/surfaces/apple.md`](../../standard/ax/surfaces/apple.md), and its claims are data in [`apple.claims.json`](../../standard/ax/surfaces/apple.claims.json), version 0.1.0.
2. **Same claim fields as web, plus two.** Every claim has web's ax-claims fields, plus `appliesTo`, the surface types it covers (fixed interface 4 of the program plan), and `checkedBy`, which of five lanes can prove it: `app-intents-metadata`, `app-intents-testing`, `skills-lint`, `siri-evaluations` or `person`. `checkedBy` is new because an App Intents report must keep apart what a machine proved from what only Siri runs or a person can show, and a reader of the data needs that split without parsing the `check` sentence.
3. **Every claim starts as `should`.** Web's admission rule applies unchanged: a claim becomes `must` only when an evaluation (here, a SiriEvaluations run) reproduces the failure it forbids and the fix removes it, or when it states a hazard with an executable check. No claim here has either yet.
4. **The X-ray is black-box in two stages, both by bundle identifier.** `ouro-ax-xray`, in ourostack/ouro-ui-apple, imports nothing from the app:
   - **Metadata.** It reads `Metadata.appintents/extract.actionsdata` in the built app. That file is the App Intents metadata the build compiles and the system registers, so it is a complete inventory of the intents, parameters, entities, queries and App Shortcuts, with their titles and descriptions. Reading it needs no device.
   - **Behaviour.** It runs Apple's AppIntentsTesting against the live app, from a test bundle: entity queries by identifier, `spotlightQuery`, `viewAnnotations()`, export and re-import, and intents whose required parameters are all entities, given references that nothing can match, which must be refused with an error that names the fix. Those refusal runs are the only intents it performs, and only on a disposable device: an app that resolves a made-up identifier to a real entity would run the intent for real, which is itself the failure, so the X-ray never does this on a person's data.
   - The report has web's ax-xray shape (JSON, Markdown and HTML), pinned to the claim set's version and hash and to the app's commit. It names, lane by lane, what was proved, what needs SiriEvaluations and what needs a person.
5. **Core publishes the claim set byte for byte.** `pnpm tokens` checks the file and writes it to `dist/ax/apple.claims.json`, listed in `dist-manifest.json`. The release attaches it, and platforms vendor it under `core-provenance.json`, as they vendor tokens.

## Admitted claims (0.1.0)

Thirty claims, all `should`: twelve checked from metadata, five by AppIntentsTesting, four by the skills linter, five by SiriEvaluations and four by a person. The full list, with each rule, check, fix and Apple source, is the standard's page.

- **Intents:** `intent.title`, `intent.description`, `intent.parameter-title`, `intent.parameter-description`, `intent.tool`, `intent.tool-not-on-schema`, `intent.shortcuts`, `intent.error-names-fix`, `intent.confirms-what-others-see`, `intent.reads-in-shortcuts`, `intent.siri-calls`, `intent.siri-says-what-happened`.
- **Entities:** `entity.type-name`, `entity.properties`, `entity.property-description`, `entity.private-properties`, `entity.findable`, `entity.indexed`, `entity.ids-resolve`, `entity.transferable`, `entity.transfer-round-trip`, `entity.display-representation`, `entity.siri-finds`.
- **Onscreen:** `annotation.onscreen`, `annotation.siri-onscreen`.
- **App skills:** `skill.bundle-shape`, `skill.names`, `skill.frontmatter`, `skill.body`, `skill.loads`.

## App skills are not a skill for coding agents

Web's guide [Why Ouro HX needs no skill](https://github.com/ourostack/ouro-ui/blob/main/docs/guides/why-no-skill.md) argues that Ouro HX ships no skill for the coding agents that build with it: the guidance lives in the components' own types and messages. That stays true here. Ouro HX for Apple and OuroAX ship no skill for coding agents either.

An **app skill** is something else. It is product content: a `SKILL.md` that an app ships inside its own bundle, for Siri, telling Siri how to chain that app's own tools for a longer task (Apple's [guide](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills)). Its reader is Siri at run time, and its author is the app. Ouro AX's `app-skill` claims are about those files, the way its `cli` claims are about an app's help text. The two records do not conflict: one says what our libraries ship to developers' agents (nothing), the other says what an app should ship to Siri (well-formed skills).

## What we found building it

These are the engineering facts the design rests on, each checked on 2026-11-03 with Xcode 27.2 (27B52) on macOS 27.0 (26A428):

- **AppIntentsTesting has no metadata API.** Its public interface (`AppIntentsTesting.swiftinterface` in Xcode 27.2) looks definitions up by name only: it cannot list an app's intents or read their titles, descriptions or parameters. That is why the metadata lane reads the bundle's compiled metadata, and why the inventory comes from there.
- **AppIntentsTesting runs inside a test bundle, against a launched app.** Apple's [essentials article](https://developer.apple.com/documentation/appintentstesting/testing-your-app-intents-code) puts it in a UI testing bundle that launches the app. So the X-ray's behaviour stage is a test-plan template, not code inside the command. The command builds and runs that template, then merges its result.
- **Xcode 27.2's AppIntentsTesting needs a 27.2 OS.** Loaded on macOS 27.0 or in the iOS 27.1 simulator runtime, it stops at launch: `AppIntentsTypeSupport` lacks a symbol it needs (`PropertyContainerElement.valueExpression`). The behaviour stage therefore runs with an Xcode whose AppIntentsTesting matches the OS it runs on; ouro-ui-apple's [X-ray decision](https://github.com/ourostack/ouro-ui-apple/blob/main/docs/decisions/2026-11-03-ax-xray.md) records which pairs its CI uses.
- **macOS UI tests need Automation Mode,** which `automationmodetool` says needs an administrator's authentication to enable. On macOS the behaviour stage therefore runs as a plain test bundle with no host app, which needs no Automation Mode, and the command launches the app itself.
- **Xcode 27.2's `@Property` takes no `description:`.** Property descriptions arrive with the 27.3 SDK. `entity.property-description` is skipped for metadata built with an earlier SDK, and the report says so, rather than failing every app for something it cannot yet write.
- **The metadata format is undocumented.** The X-ray reads only the fields it needs, records the generator's version, and is tested against a fixture app built by the same Xcode. In ouro-ui-apple's fixture app, an enumerable string query's `capabilities` is 71 and a plain query's 66, so the X-ray reads bit 1 as enumerable and bit 4 as string search (inferred, and pinned by the fixture's test).

## Not decided here

- Which claims become `must`. That waits for SiriEvaluations runs, which need a 27.3 beta OS on an Apple Intelligence device.
- Whether `checkedBy` moves back to web's claims too. Web's claims are all checked by one X-ray today.
- Apple's finer skill rules: a name of at most 64 characters with no leading, trailing or doubled hyphen, a one-line description of at most 1,024 characters, and one skills bundle per target. `skill.names`, `skill.frontmatter` and `skill.bundle-shape` cover them once the linter reports them.
- Dynamic options as a way to find entities. `entity.findable` counts only the index, listing and string search, so an app that relies on a parameter's dynamic options fails it today.
- A claim on intent donations, which Apple names as a behavioural cue. The X-ray has no way to observe donations from outside yet.

## Prior art

Read on 2026-11-03.

| Find | Verdict | Why |
|---|---|---|
| Web's [ax-xray and ax-claims](https://github.com/ourostack/ouro-ui/tree/main/registry/ouro/ax) | **Adopt** | The report shape, the admission rule, canonical-JSON hashing and "never import the interface's code". |
| Apple's [AppIntentsTesting](https://developer.apple.com/documentation/appintentstesting) | **Adopt** | The out-of-process runner Siri and Shortcuts use; the behaviour lane is built on it. |
| Apple's [SiriEvaluations](https://developer.apple.com/documentation/sirievaluations) | **Adopt** | The only way to measure Siri itself; its scenario sets are AX's evaluation tasks on Apple. |
| Apple's [verification order](https://developer.apple.com/documentation/appintents/verifying-your-app-intents-implementation) (AppIntentsTesting, Shortcuts, Spotlight, Siri) | **Borrow** | The lanes, and what is left for a person, follow it. |
| Xcode 27.3's Siri Integration Advisor ([preview doc](https://developer.apple.com/documentation/appintents/siri-ai-developer-preview)) | **Watch** | Apple's own suggestions in the IDE; once it has a command-line form, the X-ray could carry its findings. |
| [os_intents_cli](https://pub.dev/packages/os_intents_cli) `doctor` | **Borrow** | Reads `extract.actionsdata` from a built bundle as the system's view of an app's intents, and checks drift in CI: the same idea as our metadata lane. It also notes that the format is undocumented. |
| [action-relay](https://github.com/tarqd/action-relay) | **Ignore** | Parses `extract.actionsdata` into MCP tools, but running intents needs SIP and AMFI off. |
| Google [AppFunctions](https://developer.android.com/ai/appfunctions) and its [agent skill](https://github.com/android/skills/tree/main/device-ai/appfunctions) | **Watch** | Android's equivalent surface; the claims would carry over when Ouro AX gains Android. |
| Windows [On-device Agent Registry](https://learn.microsoft.com/en-us/windows/ai/mcp/overview) | **Watch** | Windows registers app MCP servers; web's `mcp` claims would apply there. |
| [Agent Skills](https://agentskills.io) | **Adopt**, through Apple's subset | App skills are a subset of it; the linter enforces Apple's subset. |
