# Ouro Feel's spec

Ouro Feel measures how an Ouro app feels in real use. This spec is the part every stack shares: the scenarios, the launch stages, the measures and how they are judged, the seeded data and the report. A driver runs the scenarios on one stack and reports under these names, so web and native numbers compare side by side. The design is the decision record [Ouro Feel](../../docs/decisions/2026-11-04-ouro-feel.md); the data is [`feel.spec.json`](feel.spec.json), and the section below is rendered from it (`pnpm feel:page`).

## For a driver

- Use the scenario ids, measure names, launch stage names and report fields here, unchanged. A name a driver needs and this spec lacks is added here first, in its own pull request.
- Judge a count or a distance on every run, and a time on the median of at least 3 runs, reporting every run's value.
- Build data from the seed, with the PRNG below, and check it against the test vector. Use made-up data only.
- Report counts and timings only, never content.
- A component's budgets use these names. Ouro HX's definition of done includes a component's Feel budgets on every stack it ships on, once that stack's driver exists.

The web driver is in web, `ourostack/ouro-ui`, under `feel/`. Native drivers (Apple in `ourostack/ouro-ui-apple`, then Windows) are on hold until web works for everyone (Ari, 2026-11-04), and their standards will be stricter.

## The spec

Version 0.1.0.

### Scenarios

| Scenario | Scope | What happens | Measures | Drivers |
| --- | --- | --- | --- | --- |
| `history-prepend` | component: message-list | A page of 200 older messages arrives above a reader who is up in a 200-message conversation. | `jumps`, `shifts`, `anchorShiftPx`, `anchorMovePx`, `blankFrames`, `forcedLayouts`, `layoutReads`, `rowsMounted`, `longestFrameMs` | web built |
| `launch-cold` | app | Start the app when its process is not running, and time each launch stage from t0. | `launchToFirstFrameMs`, `launchToFirstLayoutMs`, `launchToFirstRowMs`, `firstRowMs`, `launchToRowMs` | web planned, apple planned |
| `launch-warm` | app | Open the app's window when its process is already running, and time each launch stage from t0. | `launchToFirstFrameMs`, `launchToFirstLayoutMs`, `launchToFirstRowMs`, `firstRowMs` | web planned, apple planned |
| `switch` | app | Open the conversations at the top of the list in turn, by a real click, each timed to the frame its messages are in view. | `blankFrames`, `jumps`, `longestFrameMs` | web planned, apple planned |
| `scroll` | app | Flick a trackpad, with momentum, up the longest conversation to its start while older history loads, then back down to the newest. | `blankFrames`, `jumps`, `shifts`, `anchorShiftPx`, `deadInput`, `inputToMotionP95Ms`, `longestFrameMs` | web planned, apple planned |
| `typing` | app | Click in the reply box and type a sentence one key at a time, never sending it. | `keyToPaintP95Ms`, `longestFrameMs` | web planned, apple planned |
| `typing-120wpm` | app | Type at 120 words a minute in the reply box while new messages arrive. | `keyToPaintP95Ms`, `longestFrameMs` | web planned, apple planned |
| `network-drop` | app | Lose the network while reading and writing, then get it back. | `blankFrames`, `jumps` | web planned, apple planned |
| `wake` | app | Put the machine to sleep with the app open, wake it, and read the conversation that was open. | `blankFrames`, `jumps`, `longestFrameMs` | web planned, apple planned |

### Measures

- Counts and distances: every run: one run over the limit fails.
- Times: the median of at least 3 runs, reported with every run's value and the range.

| Measure | Unit | Status | What it counts |
| --- | --- | --- | --- |
| `jumps` | count | built | Frames where the reader's row (the row in the middle of the list's view, followed from frame to frame) moved 100 px or more outside what the input explains: with no input, against the input, or beyond the input's own distance, including between flicks. |
| `shifts` | count | built | The same unexplained moves of 8 px or more. |
| `anchorShiftPx` | px | built | The jumps added up. |
| `anchorMovePx` | px | built | How far the reader's row got from where it started, net of the input, at its farthest. |
| `jumpsStrict` | count | built | Moves of the reader's row of over 2 px with no input in the last 300 ms, against the wheel, or beyond the wheel's summed movement in that time. |
| `blankFrames` | count | built | Frames where none of 5 points down the list lands on a message, list item or day divider, while the list holds rows. |
| `blankFramesInset` | count | built | Frames with no row inside the list's view inset 40 px, or a loading placeholder in view. |
| `deadInput` | count | built | Wheel or scroll events that moved nothing for 100 ms, away from the list's ends. |
| `forcedLayouts` | count | built | Layout passes the app forced before the frame was due: on web, layout reads made while a change was waiting to be laid out; natively, layout passes run outside the display cycle. |
| `layoutReads` | count | built | Layout reads in the scenario (web only). |
| `rowsMounted` | count | built | Rows added to the page or view tree. |
| `longestFrameMs` | ms | built | The longest gap between two painted frames. |
| `launchToFirstFrameMs` | ms | planned | The firstFrame mark: from t0 to the first painted frame that is not blank. |
| `launchToFirstLayoutMs` | ms | planned | The firstLayout mark: from t0 to the live app's own frame and skeleton painted. |
| `launchToFirstRowMs` | ms | planned | The firstRow mark: from t0 to the first readable row painted. |
| `launchToAuthReturnMs` | ms | planned | The authReturn mark: from t0 to the return from the identity provider, only when the launch went there. |
| `firstRowMs` | ms | planned | From navigation start to the first readable row painted, two frames after it is in the DOM or view tree: the first app gate's measure. |
| `launchToRowMs` | ms | planned | launch-cold's harness-relative time from the launch to the first row, kept as the first app gate has it for now. |
| `inputToMotionP95Ms` | ms | planned | The 95th percentile, over a scenario's wheel or scroll inputs, of the time from the input to the first painted frame where the list moved its way. |
| `keyToPaintP95Ms` | ms | planned | The 95th percentile, over a scenario's keys, of the time from the key to the first painted frame after its text changed. |
| `hangs` | count | planned | Times the main thread did not answer input for 250 ms or more. |
| `commitsPerInput` | count | planned | Renders per input: React commits on web, SwiftUI body passes natively. |

### Launch

Cases and components are kebab-case; marks and measures are camelCase. A run reports its marks raw, in a marks object: each mark's full name (web.navigationStart) and its ms from t0. Only the shared marks become measures, as launchTo<Mark>Ms from t0; driver and app marks (web.*, native.*, <app>.*) appear only in marks.

- t0 on macOS: The kernel's process start: kp_proc.p_starttime.
- t0 on Windows: The kernel's process start: GetProcessTimes' creation time.
- Optional: spawnMs, the harness's spawn time, as a mark from the same clock.

| Shared mark | Required | What it marks |
| --- | --- | --- |
| `processStart` | yes | The app's process started: t0. |
| `firstFrame` | yes | The first painted frame that is not blank, which may be a native snapshot. The web driver uses the page's first-contentful-paint until a native first frame exists. |
| `firstLayout` | yes | The live app's own frame and skeleton painted. |
| `firstRow` | yes | The first readable row painted, two frames after it is in the DOM or view tree. |
| `authReturn` | no | Back from the identity provider, only when the launch went there. |

| Driver mark | What it marks |
| --- | --- |
| `web.environmentCreated` | The shell created the web view's environment, as WebView2 does before its view. |
| `web.viewCreated` | The shell created its web view. |
| `web.loadRequested` | The shell asked the web view to load the page. |
| `web.navigationStart` | The page's performance.timeOrigin, Navigation Timing's start, which firstRowMs counts from. |
| `web.htmlRequested` | The page's HTML was requested: Navigation Timing's requestStart. |
| `web.htmlResponseStart` | The first byte of the page's HTML arrived: Navigation Timing's responseStart. |
| `web.navigationCommit` | The engine's commit callback: WKNavigationDelegate's didCommit, or WebView2's equivalent. |
| `web.htmlLoaded` | The page's HTML has arrived. |
| `web.scriptsLoaded` | The page's scripts have loaded. |
| `web.scriptRun` | The page's own script started running. |
| `web.runtimeReady` | The app's runtime in the page is ready. |
| `native.appLaunched` | The app finished launching. |
| `native.windowShown` | The app's window is on screen. |
| `native.notifyPermission` | The app asked for, or read, its permission to show notifications. |

- An app's own marks: `<app>.<mark>`. An app documents its own marks in its own docs, not in this spec.
- A variant, such as a hang or a service start, is a run dimension, not a suffix on a measure's name: a report has one entry per variant, and every entry uses the same measure names.
- Dimensions: `service` is `running` or `started`; `launch` is `first`, `afterUpdate`, `repeat`.
- launch-warm reports launchToFirstFrameMs, launchToFirstLayoutMs, launchToFirstRowMs and firstRowMs; launch-cold reports the same, and its harness-relative launchToRowMs as it is for now. Each time is the median of at least 3 runs with its spread, beside every mark the launch hit.
- os_signpost: OSSignposter, with subsystem the app's bundle id and category `feel`. A mark is an event named stage, whose message is the mark's name; a case is an interval named case, whose message is the case's name. Names and counts only.

### Seed

- PRNG: mulberry32: state += 0x6d2b79f5; t = state; t = imul(t ^ t >>> 15, t | 1); t ^= t + imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 2^32, in unsigned 32-bit arithmetic.
- Test vector: seed 1 gives 0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741, 0.9683778982143849.
- Made up only: people with invented names, agents with role names such as inbox-agent, never anything from a real account.

### Report

`feel-report.json` holds one entry per scenario and engine: `case`, `variant`, `component`, `engine`, `engineVersion`, `os`, `t0`, `settled`, `measures`, `marks`, `pass`, `shots`. Each measure has `unit`, `runs`, `median`, `spread`, `limit`, `pass`. t0 says where the launch's zero came from: "kernel" (the process start the OS records) or "harness" (when the harness spawned the app, an upper bound). Counts and timings only, never the page's or the view's content.

### Drivers

| Driver | Where | How | Status |
| --- | --- | --- | --- |
| web | ourostack/ouro-ui (`feel/`) | A probe script first in the page's head, driven by HTTP long-poll; engines WKWebView and WebView2 decide, Playwright's WebKit and Chromium are first looks. | building |
| apple | ourostack/ouro-ui-apple | XCUITest drives the scenario; CADisplayLink times frames and samples the reader's row; os_signpost marks the launch stages; XCTest's measure runs time measures at least 3 times. | on hold |
| windows | not yet | WinUI, later. | on hold |
