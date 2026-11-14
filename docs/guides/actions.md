# Adopting the one action model

For an app team (Spoonjoy first) moving its actions onto one declaration each. The why is [the decision record of 2026-11-13](../decisions/2026-11-13-agents-use-agent-interfaces.md); the design is [the spec](../superpowers/specs/2026-11-13-one-action-model-design.md); the promises are [the action claims](../../standard/ax/actions.md).

You declare each action once in TypeScript. `ouro-actions.mts generate` writes its CLI command, MCP and WebMCP tools, web control props and component AX entry, App Intent, SwiftUI `Button(intent:)` and Reins action into a folder you commit. `check` and `compare-mcp` fail your CI when anything drifts from the declarations.

## 1. Vendor the generator

Take `ouro-actions.mts` and `actions.claims.json` from a [core release](https://github.com/ourostack/ouro-ui-core/releases) (0.6.1 or later; 0.6.0 lacks the intent options below), the way platforms take the Apple claims: copy them into your repository and record the release tag and each file's SHA-256 from the release's `dist-manifest.json` (`dist/actions/ouro-actions.mts`, `dist/ax/actions.claims.json`). Never edit the copies. It needs Node 22.18 or later and nothing else.

```sh
gh release download v0.6.1 --repo ourostack/ouro-ui-core --pattern ouro-actions.mts --pattern actions.claims.json --pattern dist-manifest.json --dir tools/ouro-actions
```

## 2. Declare

One file exports the set as its default export. Import from your vendored copy.

```ts
import { defineAction, defineActions, field } from "../tools/ouro-actions/ouro-actions.mts";   // from actions/shopping.actions.mts

export const addShoppingListItem = defineAction({
  id: "add_shopping_list_item",   // snake_case; it is the MCP tool name, so keep your existing tool names
  consent: "write",               // read | write | consequential | person-only
  label: "Add to list",           // the person's button text
  description: "Add an item to your shopping list.",   // the person's one sentence
  agent: "Add one item to the person's shopping list. Give the name as the person said it; leave quantity and unit out when they gave none.",
  input: {
    name: field.string({ label: "Item", description: "What to buy, as the person said it.", arg: true }),
    quantity: field.number({ label: "Quantity", description: "How many or how much.", optional: true, min: 0 }),
    unit: field.string({ label: "Unit", description: "The unit of the quantity, such as g, cups or cans.", optional: true }),
  },
  output: { id: field.string({ label: "Item id", description: "The new item's id." }) },
  cli: "list add",                // optional; defaults to the id in kebab case
});

export default defineActions("shopping", [addShoppingListItem /* , ... */], { tool: "spoonjoy" });
```

Choosing the consent class:

- **read** changes nothing.
- **write** changes only the person's own things (their list, their recipes).
- **consequential** reaches other people or can't be undone (sharing, publishing, deleting someone's access). Agents prepare it; the person says yes: the CLI needs `--why` and previews with `--dry-run`, MCP marks it destructive, WebMCP consequential, and the App Intent asks `requestConfirmation()`.
- **person-only** is what only the person may start (paying, ordering, turning on their microphone). Add `personOnly: { reason, how }`, one line each, said to the agent. No agent door offers it; each answers with the typed refusal, which is exactly web's refused outcome: `state` `refused`, error code `person-only`, exit 2, and a message that gives the reason and how the person does it.

Two field options shape the doors a field reaches:

- `ask` (input only): the one-line question Siri asks when a required value is missing, such as `"What should I add to your shopping list?"`. It becomes the App Intent parameter's `requestValueDialog`.
- `protocolOnly: true` (an optional input): a field only programs send, such as an idempotency key or a server-side owner. MCP, WebMCP and the CLI carry it; the App Intent and Reins, which stand for the person, leave it out, and the Swift input passes `nil`. Use it to keep an existing MCP tool's inputs while the person's doors stay clean.

- **`multiline: true`** on an input string field (core 0.9.0): the value is long text, such as Markdown or a message. The App Intent's parameter takes `String.IntentInputOptions(multiline: true)`, so Shortcuts opens a multiline editor, and the description MCP, WebMCP and the CLI show ends "It may run over several lines." Not for a positional `arg`, an `entity` or a `protocolOnly` field. Declarations without it generate the same bytes as before.

Three more options carry what a real App Intent needs (core 0.6.1; none of them changes MCP, the CLI or web):

- **`entity: "MarkdownDocumentEntity"`** on an input string field: the App Intent's parameter is your App Entity, so Shortcuts shows its picker and phrases can name it. `Input`, MCP and the CLI keep a string, the entity's `id`. The type must be `public`, with `init(id: String)` and `id: String`.
- **`returned: true`** on one required output field (string, number, integer or boolean): the intent hands it to Shortcuts as its result (`ReturnsValue`), with the dialog. A failure still throws, since there is no value to hand on.
- **`opensApp: true`** on the action: the intent opens the app when it runs (`openAppWhenRun`).

`defineAction` throws, with the fix, on a declaration a surface can't carry: an input named like one of web's kit flags (`json`, `help`, `why`, `whyFile`, `dryRun`, `agent`, `quiet`) or the App Intent's members (`input`, `perform`); `arg: true` on anything but a required string; or an id web reserves for the person (`share`, `unmute`, `camera`, `camera_on`, `answer`, `decline`, `admit`, `record`) without `consent: "person-only"`.

The full example, one action per class, is core's [`test/fixtures/actions/shopping.actions.mts`](../../test/fixtures/actions/shopping.actions.mts), and what it generates is [`test/fixtures/actions/generated/`](../../test/fixtures/actions/generated/).

## 3. Generate, and commit what it writes

```sh
node tools/ouro-actions/ouro-actions.mts generate actions/shopping.actions.mts actions/generated
```

| File | What it is | Who uses it |
| --- | --- | --- |
| `actions.json` | The declarations | Reviewers |
| `commands.json` | `defineCommand` definitions without `run`, and the CLI's `personOnly` words | Your CLI: spread each into `defineCommand({ ...def, run })` |
| `mcp.json` | MCP `tools` and `refusals` | Your MCP server's `tools/list`; answer a call to a `refusals` name with that refusal |
| `webmcp.json` | WebMCP tool descriptors and `refusals` | `registerTool` on your pages, where WebMCP exists |
| `web.ts` | `componentAx`, `twins`, `controls` | `defineComponentAx`, `bindAx`, and the props on each control |
| `OuroActions.swift` | Inputs, outputs, handlers, App Intents, buttons, `OuroActions.refusal(for:)` | Your Apple app target |
| `OuroActionsReins.swift` | `ReinsInput` conformances and a `ReinsAction` per action | Your Reins nodes (needs `OuroReins`) |

Never edit a generated file: change the declaration and generate again.

## 4. Bind each platform to one handler

**Web.** Spread a control's props on the button that takes the action, so web's `expectAxRendered` finds it, and build the component's agent side from the generated entries:

```tsx
import { componentAx, controls, twins } from "@/actions/generated/web";
const shoppingListAx = defineComponentAx({ component: "ShoppingList", reads: [], actions: componentAx.actions });
const ui = bindAx(shoppingListAx, twins);   // into the X-ray inventory's `ui`
<Button {...controls["add-shopping-list-item"].props} onClick={add}>{controls["add-shopping-list-item"].label}</Button>
```

`componentAx.actions` lists every action of the set; pass the ones that component draws (`componentAx.actions.filter(...)`) when the set spans several components.

**CLI.** Build each command from `commands.json` with your own `run`, and add the `personOnly` words to `defineCli({ personOnly })`. Flags are kebab-case, as web's are (`canEdit` is `--can-edit`), and web hands `run()` the flags by those names, so pass the input through the generated `fromCli` first: `run: (input) => handlers.shareShoppingList(fromCli("share-shopping-list", input))`.

**MCP.** Serve your tools from `mcp.json`, and answer a call to a name in its `refusals` with that refusal. `mcp.json` is the one MCP door: don't also run web's `mcpTools()` over the commands, which would publish the same actions under other names (`list_add`) and descriptions, a second door that drifts.

**Apple.** Add both Swift files to the app target. `OuroActions.swift` needs iOS 17 and macOS 14 (for `Button(intent:)`); `OuroActionsReins.swift` needs ouro-ui-apple's `OuroReins`, which needs iOS 18 and macOS 15, so put it in the target that already links Reins. Set each handler once at launch; the intent, the button and Reins all call it:

```swift
AddShoppingListItemAction.perform = { input in
    let item = try await store.add(name: input.name, quantity: input.quantity, unit: input.unit)
    return AddShoppingListItemOutput(id: item.id)
}
// In a view:
AddShoppingListItemButton(AddShoppingListItemInput(name: "oat milk"))
// In a Reins node:
ReinsNode("list", encoding: state, actions: [.addShoppingListItem(), .placeGroceryOrder()])
```

Each agent door's App Intent provides a dialog, which is what Siri and Shortcuts say. Set `<Action>Action.dialog` to say the result in your words, or turn an error into words (rethrow it to let the system show it); unset, the intent says "Done." and a failure throws:

```swift
AddShoppingListItemAction.dialog = { input, result in
    _ = try result.get()
    return IntentDialog(stringLiteral: "Added \(input.name) to your shopping list.")
}
```

An action that runs before its handler is set throws `OuroActionNotBound`. Reins includes person-only actions, because Reins stands in for the person's finger in tests; no production agent door does.

## 5. Check in CI

```sh
node tools/ouro-actions/ouro-actions.mts check actions/shopping.actions.mts actions/generated
node tools/ouro-actions/ouro-actions.mts compare-mcp actions/shopping.actions.mts tools-list.json
```

`check` fails, exit 1, naming each file that differs, is missing or wasn't generated, at its first differing line. `compare-mcp` takes your running server's `tools/list` result (add `--undeclared <names.json>`, a JSON array of tool names, while you move a server tool by tool) and fails on a declared tool that is missing or has another description, input schema or annotations, a person-only action listed as a tool, or a tool nobody declared and the undeclared list doesn't name. The list can only shrink: a name on it that is now declared, or no longer served, fails too. Run it while your MCP server is still hand-written, so drift shows before you move it onto `mcp.json`. Exit 2 is a usage error.

## What Spoonjoy changes to adopt it

1. Vendor `ouro-actions.mts` from the release, by hash.
2. Declare its MCP tools as actions, keeping their names as ids, and pick each one's consent class. Start with the tools whose inputs are flat strings, numbers, booleans and lowercase enums, such as `add_shopping_list_item`. Fields today are flat: a tool with nested input (`create_recipe`'s steps and their ingredients) or enum values outside lowercase words (`upload_recipe_image`'s `image/jpeg`) waits for array, object and free enum fields in core, which Spoonjoy asks for through ouro-ui#999's give-back. Ordering and paying, if Spoonjoy grows them, are person-only.
3. Generate into a committed folder; add `check`, and `compare-mcp` against the server's `tools/list`, to CI.
4. Fix what `compare-mcp` finds, then serve the MCP tools from `mcp.json`.
5. Web: put the generated props and `componentAx` on the shopping list's controls.
6. Apple: add the two Swift files, set the handlers at launch, swap the list's buttons for the generated ones, and build its Reins nodes from the generated `ReinsAction`s.
7. Report back what was hard to Ouro UI, as web's give-back rule asks ([ourostack/ouro-ui#999](https://github.com/ourostack/ouro-ui/pull/999)).
