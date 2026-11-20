# Proposal: what Ouro's checks prove, and how an agent gets evidence from people

Status: decided 2026-11-19. The coordinator made the three calls below; layers 1 and 2 ship first, then layer 3. It answers two findings of the [model interviews](2026-11-19-model-interviews.md): [ourostack/ouro-ui#2289](https://github.com/ourostack/ouro-ui/issues/2289) and [ourostack/ouro-ui#2290](https://github.com/ourostack/ouro-ui/issues/2290).

## Why

Ouro says its checks are how an agent shows that a screen works for the people who'll use it. All eight models that answered the interviews disagreed, and their reasons hold up. Passing checks shows a screen isn't broken, not that it's good. Claude Opus 5.5: "Green means 'not obviously broken', not 'good'." GPT-6.2 Sol: "The screen can pass every one of those checks while people still mistake 'Saved' for 'Published'." GPT-6.2 Astra cited Ouro's own record: a commit the X-ray called conformant still failed 30 of 593 scripted flow checks.

All eight also said the only real proof is watching representative people do the task, and that a person has to run it. Grok 4.7: "I can make the hypothesis tighter. I cannot be the check." In the pre-mortem every model admitted that its "show it's good" step had been a plan nobody ran. Their workaround was a handoff that separates what was checked from what still needs a person. MAI Code 2: "The handoff should therefore include what was tested, what was not, and the concrete evidence needed before calling it good."

That is a design question for Ouro, not a wording one. An agent told that Ouro's checks prove a screen is good will discount them the first time a person gets lost on a green screen. And an agent that can't get evidence from people will keep shipping screens nobody watched being used.

## Proposal

Three layers, each answering a different question. Ouro owns the floor, makes the human check cheap to run, and lets the app learn from real use without collecting anyone's content.

### 1. The floor, named as the floor

Ouro's checks (Ouro check, the X-ray, the conformance matrix, the test kit, AX conformance) prove the mechanical floor: states, focus, names, contrast, targets, motion, the same action behaving the same at every door. Every report says so, and ends with what it couldn't see.

- **Ouro check gains a "needs a person" section.** For each page it lists the questions only a person can answer, drawn from what is on the page: a destructive action asks whether the person knows what will be lost; a form asks whether they know it saved; a consequential action asks whether the confirmation says who will see it. The questions come from the components, which know what they are.
- **The docs and llms.txt say "floor", not "good".** The issue drain owns that wording; this record gives it the line to use.

This layer needs no new product decision, and can ship first.

### 2. A usability handoff an agent writes and a person runs

The models can design a test, write the tasks and analyse the results; they can't sit beside a person. Ouro makes that split the product.

- **`ouro check --handoff` writes a session kit** for the screens that changed: each task drawn from the app's declared actions and flows (the action declarations and `ax-flows` already name them), an outcome question per task ("what appointment do you have now?" rather than "did that work?"), what to watch for, and a plan for five people, after Nielsen.
- **Results come back as a small file the agent reads:** per person and task, whether they succeeded, how long it took, where they hesitated, and their own words. Ouro check reads it on the next run, so a screen that people failed stays failed until it changes.
- **Optionally, a counts-only session record:** the moments a session's screens reported (layer 3), with the person's permission, beside the observer's notes. Never a screen recording.

### 3. Evidence from real use, counts only

Ouro components know their meaning, so they can count the moments that mean a person was confused, without reading anything the person typed: a field that showed an error and was then abandoned, a confirm sheet cancelled, an undo straight after a press, a press on a disabled control, a dialog closed without its action, a search with no results, the same control pressed again and again. Ouro Feel already measures how a screen feels in test runs; this is its counterpart in real use.

- **Counts per component part and screen,** with no content, no identifiers and no timestamps finer than a day.
- **Off by default.** The app turns it on, and sends the counts where it chooses: its own endpoint, or OpenTelemetry. Ouro runs no collector.
- **An agent reads them to rank what to fix,** and Ouro check shows the screen's counts beside its findings.

This layer is a product and privacy call, decided 2026-11-19 as written here.

### What Ouro won't do

- **Agents standing in for people.** Every model said it knows its own labels too well to judge them; a panel of agents is a review, not evidence from people.
- **Recording what people see or type.** Session replay captures content. A counts-only record answers the same "where did they get lost" question without it.

## Decided 2026-11-19

The coordinator's calls, as decided:

1. **The word is "floor".** Ouro says its checks prove the mechanical floor, and names what they can't see.
2. **The handoff is part of Ouro check.** It is `ouro check --handoff`, not a kit of its own.
3. **Layer 3 exists exactly as proposed.** Counts only, off by default, no Ouro collector, no content, no identifiers. It is built after layers 1 and 2 ship.

## How we'll know

The next interview run asks the same pre-registered questions. This works if the models describe Ouro's validation as a floor, a handoff and real-use counts, and if, in the build task, they run Ouro check and write the handoff without being told to. It hasn't worked if they still say Ouro claims more than its checks can prove.

## Prior art

Read on 2026-11-19.

| Find | Verdict | Why |
| --- | --- | --- |
| [Nielsen: test with five users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/) | **Adopt** | Small, repeated rounds of watching people find most of a screen's problems; the handoff's default plan. |
| [System Usability Scale](https://measuringu.com/sus/) and [UMUX-Lite](https://measuringu.com/umux-lite/) | **Borrow** | Short standard questionnaires; UMUX-Lite's two questions fit the end of a handoff session. |
| [Google's HEART framework](https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/) | **Borrow** | Goals, signals and metrics: real-use counts only matter when tied to a task's goal. |
| [Clarity's rage, dead and quick-back clicks](https://learn.microsoft.com/en-us/clarity/insights/semantic-metrics) | **Borrow** | Confusion read from behaviour. Ouro's components can name the meaning a page-level tool has to guess. |
| [Apple MetricKit](https://developer.apple.com/documentation/metrickit) | **Borrow** | Aggregated counts delivered to the app, which decides where they go. |
| [Web Vitals](https://web.dev/articles/vitals) | **Borrow** | A few named real-user measures with thresholds, which is how Ouro Feel's measures already work. |
| [Plausible](https://plausible.io/privacy-focused-web-analytics) | **Borrow** | Counts without personal data or identifiers. |
| [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | **Watch** | A place an app may already send counts. |
| [rrweb](https://github.com/rrweb-io/rrweb) | **Ignore** | Session replay records what people see and type, which this proposal rules out. |
