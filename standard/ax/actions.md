# Ouro AX: what an action promises

**One declaration per action, and every surface generated from it.** An app declares each action once with `defineAction` (core's `src/actions.mts`, released as `ouro-actions.mts`): its id, typed input and output, consent class, the person's label and description, and the agent's description. `generate` writes its CLI command, MCP and WebMCP tools, web control and component AX entry, App Intent, SwiftUI `Button(intent:)` and Reins action; `check` and `compare-mcp` fail CI when one drifts. The design is [the decision record of 2026-11-13](../../docs/decisions/2026-11-13-agents-use-agent-interfaces.md); how to adopt it is [the guide](../../docs/guides/actions.md).

The claims are data in [`actions.claims.json`](actions.claims.json), version 0.1.0, published as `dist/ax/actions.claims.json`. The rules are Ouro AX's: a claim is one checkable rule with its reason, source, check and fix, and it is `must` only when it states a hazard with a check, or an evaluation reproduced the failure. `appliesTo` names projections: cli, mcp, webmcp, web-control, app-intent, swiftui-button and reins.

The claims section below is generated from the data with `pnpm actions:page`; edit the JSON, not the page.

## The claims

### `action.one-declaration`

**should**, for cli, mcp, webmcp, web-control, app-intent, swiftui-button, reins. Every surface of an action (its CLI command, MCP and WebMCP tools, web control, App Intent, SwiftUI button and Reins action) is generated from one defineAction declaration.

- Why: Declared four times, one action's surfaces disagree, and an agent and a person see different products.
- Source: <https://github.com/ourostack/ouro-ui-core/blob/main/docs/decisions/2026-11-13-agents-use-agent-interfaces.md>.
- Checked by: An app's actions file passes defineActions, and its generated folder passes `node ouro-actions.mts check`.
- Fix: Declare the action with defineAction, add it to the set, run generate, and build the surface from the generated file.

### `action.projections-match`

**must**, for cli, mcp, webmcp, web-control, app-intent, swiftui-button, reins. Every committed projection equals what its declaration generates, and a live MCP server's tools/list equals the declared tools; CI fails on any difference.

- Why: A surface that drifts from its declaration lets an agent do what a person can't, or the reverse, without anyone seeing it.
- Source: <https://github.com/WebKit/standards-positions/issues/670>. WebKit opposes WebMCP partly because a separate agent layer lets agent and human abilities drift apart; a check that fails on drift is the answer.
- Checked by: `node ouro-actions.mts check <actions.mts> <dir>` and `node ouro-actions.mts compare-mcp <actions.mts> <tools.json>` in the app's CI; core's own CI runs `pnpm actions:check` on the shopping fixture (test/actions.test.mts proves both checks fail on drift).
- Fix: Change the declaration and run generate; never edit a generated file, and serve MCP tools from mcp.json.

### `action.person-only-refuses`

**must**, for cli, mcp, webmcp, web-control, app-intent. A person-only action has no agent door: the CLI refuses its words, MCP and WebMCP don't list it and answer a call with the typed refusal (outcome refused, code person-only, exit 2, its reason and how the person does it), web's component AX declares it personOnly, and it has no App Intent.

- Why: An agent that can start what only the person may start, such as paying or turning on their microphone, acts in their name without their say.
- Source: <https://developer.apple.com/documentation/appintents/toolintent>. Apple's ToolIntent guidance (iOS 27.3 beta) lists intents with side effects a person needs to start explicitly, such as placing an order and paying for it, as poor tools.
- Checked by: test/actions.test.mts ("the generated JSON lists person-only actions only as refusals, on every agent door") and apple/actions-check (no App Intent, OuroActions.refusal(for:)).
- Fix: Declare the action consent "person-only" with personOnly { reason, how }, and run generate.

### `action.consequential-confirms`

**must**, for cli, mcp, webmcp, web-control, app-intent. A consequential action is prepared by the agent and committed by the person: web's effect is "others" (the CLI needs --why and previews with --dry-run), MCP marks it destructive and open-world, WebMCP marks it consequential, and its App Intent asks requestConfirmation() before it acts.

- Why: An effect other people see, or one that can't be taken back, must not happen on an agent's say alone.
- Source: <https://developer.apple.com/documentation/appintents/appintent/requestconfirmation()>. Apple's requestConfirmation() is the guard before performing any work that might be destructive or unsafe; WebMCP's consequentialHint and UCP's requires_escalation serve the same purpose on the web.
- Checked by: test/actions.test.mts (consent classes onto annotations, the CLI's effect, and requestConfirmation only in the consequential intent).
- Fix: Declare the action consent "consequential" and run generate.

### `action.agent-description`

**should**, for cli, mcp, webmcp, app-intent. Each action carries an agent description, one line written for a model, apart from the person's label and description; the agent doors use it and the person's controls don't.

- Why: A model chooses a tool and fills its parameters from its description; a button's two words don't tell it when to use the action.
- Source: <https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri>. Siri tells intents apart and fills their parameters from the title and description on each intent and parameter.
- Checked by: defineAction refuses an action without a one-line agent description.
- Fix: agent: "<when to use it and what it does, for a model>".
