# One Action Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One action declaration in core generates 7 projections (CLI, MCP, WebMCP, web control and component AX, App Intent, `Button(intent:)`, Reins), with a typed person-only refusal and a drift check that fails CI.

**Architecture:** `src/actions.mts` is one self-contained module (no imports but `node:`), vendored by apps from a release. It holds `defineAction`/`defineActions`/`field`, the pure renderers, `checkGenerated` and `compareMcp`, and a CLI (`generate`, `check`, `compare-mcp`) run when the file is the entry point. A fixture shaped like Spoonjoy's shopping list proves it in CI.

**Tech Stack:** TypeScript run by Node ≥ 22.18 type stripping (erasable syntax only: no enums, no parameter properties), `node:test`, `swiftc -typecheck` on macOS.

**Spec:** `docs/superpowers/specs/2026-11-13-one-action-model-design.md`

## Global Constraints

- `src/actions.mts` imports only `node:` modules; it is published byte for byte as `dist/actions/ouro-actions.mts`.
- Ids are snake_case `^[a-z][a-z0-9]*(_[a-z0-9]+)*$`; kebab, camel and Pascal derive from them.
- MCP annotations equal web's `effectAnnotations`: read `{readOnlyHint:true,destructiveHint:false,openWorldHint:false}`, write all false, consequential `{false,true,true}`.
- Refusal: `{ ax: 1, action: <kebab>, state: "refused", error: { code: "person-only", exit: 2, thing: <cli words>, problem: reason, fix: null, message }, how }`.
- Generated files start with a header line naming `ouro-actions <version>` and the set name; output is deterministic (sorted keys where order is not the declaration's).
- Swift: Swift 6 language mode, iOS 17 / macOS 14 for `Button(_:intent:)`.
- No AI attribution in commits.

## Review Focus

- An optional number field left out: Swift `Double?`, CLI flag not required, JSON Schema not in `required`. Test in Task 2.
- A declaration whose label or descriptions contain quotes, backslashes or newlines: Swift string literals and JSON stay valid; newlines refused by `defineAction`. Test in Tasks 1 and 3.
- Two actions whose kebab, camel or CLI words collide: `defineActions` throws naming both. Test in Task 1.
- `check` against a folder with an extra stale file or a missing file: both reported. Test in Task 4.
- `compare-mcp` against a live list that lists the person-only tool: reported as a finding. Test in Task 4.

---

### Task 1: Declaration and validation

**Files:** Create `src/actions.mts`; Test `test/actions.test.mts`.

**Produces:** `field.string|number|integer|boolean|enum(opts)`, `defineAction(def): Action`, `defineActions(name, actions): ActionSet`, `InputOf<A>`, `names(id): { kebab, camel, pascal }`, `refusal(action): Refusal`, `effectOf(action)`, `annotationsOf(action)`.

- [ ] Tests: a valid write action round-trips; `consent: "person-only"` without `personOnly` throws `/personOnly/`; `personOnly` on another class throws; a newline in `agent` throws; a bad id throws; duplicate kebab/CLI words across actions throw naming both; `names("add_shopping_list_item")` is `{kebab:"add-shopping-list-item", camel:"addShoppingListItem", pascal:"AddShoppingListItem"}`; `refusal` matches the Global Constraints shape; annotations per class as above.
- [ ] Run `node --test test/actions.test.mts`, see failures; implement; see pass; commit.

### Task 2: JSON projections (commands, MCP, WebMCP, web, actions.json)

**Files:** Modify `src/actions.mts`; Test `test/actions.test.mts`; Create `test/fixtures/actions/shopping.actions.mts`.

**Produces:** `toCommand(a)`, `toMcpTool(a)`, `toWebMcpTool(a)`, `inputSchema(a)`, `outputSchema(a)`, `renderActions(set): Map<string,string>` with keys `actions.json`, `commands.json`, `mcp.json`, `webmcp.json`, `web.ts`.

- [ ] Fixture: `get_shopping_list` (read), `add_shopping_list_item` (write; `name` string arg, `quantity` number optional min 0, `unit` string optional; output `id`, `name`), `share_shopping_list` (consequential; `with` string arg), `place_grocery_order` (person-only; reason "You can't place an order or pay for the person; only they can.", how "with Place order on the shopping list").
- [ ] Tests: `inputSchema(add)` is `{type:"object",properties:{name:{type:"string",description},quantity:{type:"number",minimum:0,description},unit:{...}},required:["name"],additionalProperties:false}`; `toCommand(add)` has `args:[{name:"name",required:true}]`, flags quantity/unit not required, `effect:"private"`; `toCommand(share).effect === "others"`; `mcp.json` tools exclude `place_grocery_order` and `refusals.place_grocery_order` is the refusal; webmcp `share_shopping_list.annotations.consequentialHint === true`; `web.ts` contains `"data-ax-action": "add-shopping-list-item"` and a `personOnly` entry for `place-grocery-order` with `refuseAs` its CLI words.
- [ ] Red, implement, green, commit.

### Task 3: Swift projections

**Files:** Modify `src/actions.mts`; Test `test/actions.test.mts`; `scripts/apple-check.sh`.

**Produces:** `renderActions` also writes `OuroActions.swift` and `OuroActionsReins.swift`.

- [ ] Tests: Swift contains `struct AddShoppingListItemIntent: AppIntent`, `var quantity: Double?`, `Button(intent:`, `try await requestConfirmation()` only in `ShareShoppingListIntent`, no `PlaceGroceryOrderIntent`, `OuroActionRefusal`; Reins file contains `static func addShoppingListItem(` and `placeGroceryOrder`; a label with `"` is escaped.
- [ ] `apple-check.sh`: generate the fixture to a temp folder and `swiftc -typecheck -swift-version 6` `OuroActions.swift`; then the Reins file with OuroReins' `Sources/OuroReins/*.swift` from ouro-ui-apple at a pinned tag.
- [ ] Red, implement, green (`node --test`, `sh scripts/apple-check.sh`), commit.

### Task 4: Drift check, live MCP compare, CLI

**Files:** Modify `src/actions.mts`; Test `test/actions.test.mts`; Create `test/fixtures/actions/generated/*` (by running generate); `package.json` scripts `actions:generate`, `actions:check`; `.github/workflows/ci.yml` test job runs `pnpm actions:check`.

**Produces:** `checkGenerated(set, files: Map<string,string>): string[]`, `compareMcp(set, tools: unknown): string[]`, CLI `node src/actions.mts generate|check|compare-mcp`.

- [ ] Tests: identical files → `[]`; one changed line → a finding naming the file and line; missing and extra files reported; `compareMcp` with generated tools → `[]`, with a changed description, a missing tool, an undeclared tool, the person-only tool listed → one finding each; CLI `check` exits 1 with findings on stderr and 0 when clean (spawn `node`).
- [ ] Red, implement, generate fixture, green, commit.

### Task 5: Claims, release wiring, guide, record

**Files:** Create `standard/ax/actions.claims.json`, `standard/ax/actions.md`, `docs/guides/actions.md`; Modify `scripts/build.mts`, `.github/workflows/release.yml`, `package.json` (0.5.0), `AGENTS.md`, `README.md`, the decision record (amendment: built), Test `test/actions-claims.test.mts`.

- [ ] Claims (fields `id, tier, rule, why, evidence{basis,source,finding}, check, fix`): `action.one-declaration` (should), `action.projections-match` (must, hazard), `action.person-only-refuses` (must, hazard), `action.consequential-confirms` (must, hazard), `action.agent-description` (should). `checkActionClaimSet` in `src/actions.mts`? No: in `src/action-claims.mts`, reusing `claimSetHash` style; test it checks clean, `must` without hazard fails, page ids equal data ids.
- [ ] `build.mts` writes `dist/actions/ouro-actions.mts` (bytes of `src/actions.mts`) and `dist/ax/actions.claims.json`; release attaches both.
- [ ] Guide: vendor by hash, declare, generate, bind (web, Apple, Reins), CI `check` + `compare-mcp`, what Spoonjoy changes.
- [ ] Full verification: `pnpm typecheck && pnpm tokens && pnpm test && pnpm actions:check && pnpm apple:check`; commit.
