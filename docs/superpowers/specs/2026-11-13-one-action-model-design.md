# One action model: design

Date: 2026-11-13. Direction set by [the decision record of the same day](../../decisions/2026-11-13-agents-use-agent-interfaces.md). Ari delegated the design calls ("you make the design calls and record them, without asking"); every call below is the builder's, recorded here.

## Intent

Today one action is declared up to four times: `defineCommand` (CLI, `--json`, MCP) and `defineComponentAx` (a control's agent twin) in web, `ReinsAction` in Apple's Reins, and an App Intent for Siri. Declare it once, generate every surface from it, and fail CI when a surface drifts from its declaration.

- **Goal:** one declaration per action, in core, from which every surface comes; person-only actions refuse on every agent door with one typed refusal; a drift check an app runs in CI; proven on a synthetic fixture shaped like Spoonjoy's shopping list; released so Spoonjoy can adopt it.
- **Non-goals:** changing web's or Apple's kits (they consume what core generates, unchanged); Android AppFunctions and Windows App Actions (the declaration covers what they need; their projections come with those platforms); A2UI catalogs and MCP Apps (decision 3 of the position, later); running the actions (apps keep their own handlers).
- **Anti-goals:** a runtime dependency apps must install from npm (core is not on npm; platforms vendor release files by hash); generated code an app has to edit; a check that passes when a hand-written surface disagrees with the declaration.

## Approaches

1. **A generator with committed output, plus live comparisons (chosen).** Core ships one self-contained file, `ouro-actions.mts`, which an app vendors by hash. The app declares its actions in TypeScript; `node ouro-actions.mts generate` writes every projection into a folder the app commits; `check` regenerates and fails on any difference; `compare-mcp` checks a live MCP `tools/list` against the declarations. Fits core's release model (files attached to a GitHub release, vendored by hash), needs no package registry, and gives Swift, which cannot import TypeScript, real source.
2. **A runtime library each platform imports.** Web would import the declarations and build controls at runtime; Apple would read JSON at launch. Rejected: App Intents must be Swift types known at compile time, so Apple needs generated code anyway, and a runtime library means publishing core to npm.
3. **Declarations in JSON, generators per platform repository.** Rejected: drift moves into the generators, three implementations of one mapping, and JSON loses TypeScript's typed input.

## The declaration

```ts
const addShoppingListItem = defineAction({
  id: "add_shopping_list_item",            // snake_case; the MCP and WebMCP tool name
  consent: "write",                        // read | write | consequential | person-only
  label: "Add to list",                    // the person's button text; the App Intent's title
  description: "Add an item to your shopping list.", // the person's one sentence: tooltip, accessibility hint
  agent: "Add one item to the person's shopping list, ...", // the agent's description: MCP, WebMCP, CLI summary, IntentDescription
  input: {
    name: field.string({ label: "Item", description: "What to buy, as the person said it.", arg: true }),
    quantity: field.number({ label: "Quantity", description: "How many.", optional: true, min: 0 }),
    unit: field.string({ label: "Unit", description: "The unit, such as g or cups.", optional: true }),
  },
  output: { id: field.string({ ... }), name: field.string({ ... }) },
  cli: "list add",                         // optional; default is the id in kebab case
});
```

- Field kinds: `string`, `number`, `integer`, `boolean`, `enum` (with `values`). Each has a label (the person's), a description (the agent's), `optional`, and for numbers `min`/`max`. `arg: true` makes a required field a CLI positional argument; the rest are flags. TypeScript infers the input type (`InputOf<typeof action>`).
- A person-only action carries `personOnly: { reason, how }` (one line each, said to the agent, as web's `PersonOnly`) and may say `reaches: "others"`; `defineAction` throws unless `personOnly` is present exactly when `consent` is `person-only`.
- `defineActions(name, [..])` makes the set an app generates from; ids, CLI words and derived Swift names must be unique.
- Names derive from the id: kebab `add-shopping-list-item` (CLI default, `data-ax-action`, component action id), camel `addShoppingListItem` (Reins), Pascal `AddShoppingListItem` (Swift types).

## Consent classes, mapped onto every surface

| Class | CLI (`defineCommand`) | MCP annotations | WebMCP | Component AX | App Intent |
| --- | --- | --- | --- | --- | --- |
| read | `effect: "private"`, `readOnly` | `readOnlyHint` | `readOnlyHint` | agent action, private | plain intent |
| write | `effect: "private"` | none of the hints | none | agent action, private | plain intent |
| consequential | `effect: "others"` (web's kit then needs `--why` and previews with `--dry-run`) | `destructiveHint`, `openWorldHint` | `consequentialHint` | agent action, others | `requestConfirmation()` before it acts |
| person-only | a `personOnly` word that refuses | not listed; a call answers the typed refusal | not registered; a call answers the typed refusal | `personOnly` with its reason, `refuseAs` the CLI words | no App Intent; a plain `Button(action:)` |

The MCP annotations are exactly web's `effectAnnotations(effect, readOnly)`, so core and web cannot disagree. Builder's call: consequential maps to web's "others", because web's kit already makes an "others" command preview who sees it and state why (prepare, then commit).

## The typed refusal

One shape on every door, web's `Outcome` with state `refused` and its `AxErrorShape`:

```json
{ "ax": 1, "action": "place-grocery-order", "state": "refused",
  "error": { "code": "person-only", "exit": 2, "thing": "place-grocery-order", "problem": "<reason>", "fix": null, "message": "..." },
  "how": "<how the person does it>" }
```

Exit 2 is web's `usage` exit, which `refused` maps to (`DEFAULT_OUTCOME_EXITS`). Swift gets `OuroActionRefusal` (an `Error` with the same fields) and `OuroActions.refusal(for:)`, for bridges (SwiftMCP, Reins) that are asked for a person-only id.

Builder's call on Reins: Reins is the test door that stands in for the person's finger (the decision record's point 3), so a Reins node includes person-only actions. Production agent doors (CLI, MCP, WebMCP, App Intents) refuse them.

## The projections (felt number: 7 from one declaration)

`generate` writes, into the app's folder:

1. `commands.json`: each action's `defineCommand` definition without `run` (name, summary, effect, readOnly, args, flags, output), and the CLI's `personOnly` words.
2. `mcp.json`: MCP `tools` (name, title, description, `inputSchema`, `outputSchema`, annotations) and `refusals`.
3. `webmcp.json`: WebMCP tool descriptors (name, description, `inputSchema`, annotations) and `refusals`.
4. `web.ts`: for `defineComponentAx`, the actions array; for `bindAx`, the twins and `refuseAs`; and each control's props (`data-ax-action`, `title`, `aria-label`) to spread on a React button. Web's `expectAxRendered` already checks `data-ax-action`.
5. and 6. `OuroActions.swift`: per action, an `Input` and `Output` struct, an App Intent whose `perform()` calls a handler the app sets at launch, and a SwiftUI view that wraps `Button(_:intent:)` (iOS 17, macOS 14). Person-only actions get a `Button(action:)` view and no intent.
7. `OuroActionsReins.swift`: `ReinsInput` conformances with explicit schemas, and a `ReinsAction` factory per action, so a Reins node's actions come from the same declarations. Separate file, since it imports `OuroReins`.

Plus `actions.json`, the declarations themselves, so a reviewer sees the source of truth next to its projections. Every file starts with a header naming the generator's version and the declaration set.

## The drift check

- `node ouro-actions.mts check <declarations.mts> <dir>` regenerates in memory and fails, exit 1, naming each file that differs, is missing or is extra, and the first differing line. An app runs it in CI. The fixture runs it in core's CI as `pnpm actions:check`.
- `node ouro-actions.mts compare-mcp <declarations.mts> <tools.json>` reads a live server's `tools/list` result and fails on a declared tool that is missing or differs (description, input schema, annotations), a person-only action that is listed, and an undeclared tool. This catches drift in a hand-written server before it moves to generated tools.
- AX claims in `standard/ax/actions.claims.json`, with a page `actions.md`: `action.one-declaration`, `action.projections-match`, `action.person-only-refuses`, `action.consequential-confirms`, `action.agent-description`. `must` only with a stated hazard and its check, as every Ouro claim set.

## Proof

A synthetic fixture shaped like Spoonjoy's shopping list (`test/fixtures/actions/shopping.actions.mts`) with one action per class: `get_shopping_list` (read), `add_shopping_list_item` (write; item name, optional quantity and unit), `share_shopping_list` (consequential), `place_grocery_order` (person-only). Its generated folder is committed; `pnpm actions:check` runs in CI; the apple job type-checks the generated Swift with `swiftc`, with Reins' sources from a pinned ouro-ui-apple tag. A pull request that edits one generated file shows CI failing.

## Release

- `pnpm tokens` also writes `dist/actions/ouro-actions.mts` (byte for byte `src/actions.mts`, which imports nothing) and `dist/ax/actions.claims.json`, both in `dist-manifest.json`; the release attaches both. Version 0.5.0.
- The adopter guide is `docs/guides/actions.md`: vendor by hash, declare, generate, bind handlers on each platform, run `check` and `compare-mcp` in CI.

## Left to the builder

File layout inside `src/`, message wording, and test granularity.
