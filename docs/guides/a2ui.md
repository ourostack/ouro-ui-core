# Agent-composed UI: Ouro's tree, sent as itself, through MCP Apps or as A2UI

For an app team whose agent should show a person a card they can read and act on. The why is [the decision record of 2026-11-13](../decisions/2026-11-13-a2ui-catalog.md), and [2026-11-14's](../decisions/2026-11-14-composed-ui-own-tree.md), which makes Ouro's composed tree the source of truth and A2UI and MCP Apps adapters to it. It builds on [the one action model](actions.md): do that first.

The interface your agent composes is Ouro's own composed tree (`ouro-composed.mts`): interface as validated data, limited to your catalog, where every button is one of your declared actions with its consent class. Web's and Apple's kits draw it natively (`ComposedSurface` on each); the Windows and Android kits don't draw it yet. The agent can send the tree itself, in an MCP tool result's `structuredContent.ouro`, or send A2UI messages, which the A2UI adapter turns into the same tree; MCP Apps and A2UI are formats the tree speaks, not the format Ouro composes in ([the 2026-11-17 record](../decisions/2026-11-17-composed-tree-leads.md)). The steps below take the A2UI route, which has the most tooling today.

Your agent writes [A2UI v1.0](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) messages against Ouro HX's catalog. Web's `a2ui-surface` and Apple's `OuroA2UI` render them with Ouro HX. The only buttons are your declared actions, and pressing one follows its consent class: read and write run, consequential asks the person to confirm what the agent prepared, and person-only takes them to your app's own screen.

## 1. Vendor the files

From a [core release](https://github.com/ourostack/ouro-ui-core/releases) (0.7.0 or later), copy `ouro-composed.mts`, `ouro-mcp-app.mts`, `ouro-a2ui.mts`, `ouro-a2ui-catalog.mts` and `ouro-actions.mts` into one folder, and record the tag and each file's SHA-256 from `dist-manifest.json`. Never edit the copies. `ouro-composed.mts` imports nothing; the others import each other by those names. (Before 0.11.0, `ouro-a2ui.mts` stood alone.)

```sh
gh release download v0.11.0 --repo ourostack/ouro-ui-core --pattern 'ouro-a2ui*.mts' --pattern ouro-composed.mts --pattern ouro-mcp-app.mts --pattern ouro-actions.mts --pattern dist-manifest.json --dir tools/ouro-actions
```

## 2. Generate your catalog from your actions

```sh
node tools/ouro-actions/ouro-a2ui-catalog.mts catalog actions/kitchen.actions.mts a2ui/catalog.json --id https://example.com/a2ui/catalog.json
node tools/ouro-actions/ouro-a2ui-catalog.mts check actions/kitchen.actions.mts a2ui/catalog.json --id https://example.com/a2ui/catalog.json   # in CI
```

The catalog is HX's components plus `ActionButton`, whose `action` is exactly your action ids. Without `--id` its `catalogId` is `https://ui.ouroboros.bot/a2ui/v1/apps/<set>/catalog.json`. Give the catalog file to your agent: its `instructions` are written for the model.

## 3. Validate what the agent wrote, before anything renders

```sh
node tools/ouro-actions/ouro-a2ui-catalog.mts validate a2ui/catalog.json messages.json
```

Or in code, `validateMessages(catalog, messages)`. Each problem is in A2UI's validation error format (`VALIDATION_FAILED`, `surfaceId`, `path`, one-sentence `message`), so you can hand them back to the model to correct itself. Input prepared for a person-only action fails with the action model's typed refusal.

## 4. Return it as an MCP App

Build web's `OuroMcpApp` view once for your catalog, from a checkout of [ouro-ui](https://github.com/ourostack/ouro-ui) at a release tag, and commit the file:

```sh
node scripts/mcp-app.mts build --catalog ../kitchen/a2ui/catalog.json --out ../kitchen/a2ui/view.html \
  --handoff-url 'https://kitchen.example.com/recipes?do={action}' --name Kitchen
```

It writes one HTML file with its script, its styles and your catalog inline, so it loads under MCP Apps' default content security policy. `--handoff-url` is where a person-only button sends the person, with `{action}` replaced by the action id; without it the card tells them what to do in your app. Rebuild it when the catalog changes.

```ts
import { readFileSync } from "node:fs";
import { mcpAppResource, mcpAppToolMeta, mcpAppToolResult } from "../tools/ouro-actions/ouro-a2ui.mts";

const ouroMcpAppHtml = readFileSync("a2ui/view.html", "utf8");

const card = mcpAppResource({ uri: "ui://kitchen/card", name: "Recipe card", html: ouroMcpAppHtml });  // listing + contents
server.registerTool("show_recipe", { /* ... */ _meta: mcpAppToolMeta("ui://kitchen/card") }, async ({ recipe }) =>
  mcpAppToolResult({ text: `Here is ${name}.`, catalog, messages }));       // validates, then puts the stream in structuredContent.a2ui
```

The view renders `structuredContent.a2ui` with Ouro HX. A server that builds Ouro's composed tree itself, with no A2UI, returns `mcpAppTreeResult({ text, catalog: loadCatalog(catalog), tree })` from `ouro-mcp-app.mts` instead, and the view draws `structuredContent.ouro` the same way (web's `OuroMcpApp` from the release after core 0.11.0). Either way, and when the person presses a button it calls that action's own MCP tool through the host (after they confirm, for a consequential one). If your cards show images from your own site, add that origin to the contents: `{ ...card.contents, _meta: { ui: { csp: { resourceDomains: ["https://kitchen.example.com"] } } } }`. Web's [`OuroMcpApp` docs](https://ui.ouroboros.bot/docs/ouro-mcp-app/) have the rest.

## What every renderer must do

`standard/hx/a2ui/conformance/cases/` holds message streams and the tree each must resolve to, including each button's label, consent, press (`run`, `confirm`, `handoff`) and resolved input, or the problems an invalid stream gives. Each valid case's `expect` is Ouro's composed tree (`ComposedNode` in `src/composed.mts`), which `validateTree` accepts; a renderer's tree view draws that tree whatever format it came from. `pnpm a2ui:generate` writes the `expect` of each case from the A2UI adapter's resolver in `src/a2ui.mts`; `pnpm a2ui:check` fails when they drift. `recipe-card-agent.json` is a card a model composed, unedited; its `source` names the model and the prompt.

A confirm sheet's rows (`props.confirm.fields`) are `{ label, value }`, and `raw` too when the value is a name standing in for an id: show `value` as the row, and `raw` small beside it. A field's `shownAs` (in the catalog's action input) names the sibling input that carries the name, so a renderer with only the catalog resolves it the way `resolveSurface` does (`confirm-names.json` is the case). To name an id from your own data instead, pass `resolveMessages(catalog, messages, { label: ({ action, field, value, input }) => title })`; it wins over what the agent prepared, since the agent's text is the one thing the person can't check. Without either, the row shows the id, as before.

A field the person fills in (`TextField`, `Checkbox`, `Select`) carries `value`, an absolute JSON pointer into the data model: show what the data holds there, and write the person's answer back to it with `setPointer`. Keep the data model beside the tree, starting from the surface's `dataModel` (or MCP Apps' `structuredContent.ouro.data`). A button input bound to a path a field writes stays `{"@path"}` in the tree, and so does its confirm row (`bind`, with an empty `value`); one bound to a path no field writes is resolved, as before. When the person presses, call `resolveButton(button, data)` for the confirm sheet and `personPress(button, confirmed, data)` for the press, so both carry what the person entered (`inputs.json` is the case).

When pressed, a button sends A2UI's `action` named after the action id, with the input as `context` and `metadata.extensions.bot_ouroboros_action` = `{ consent, by: "person", confirmed }`. `actionMessage()` builds it, and refuses a person-only button or an unconfirmed consequential one. A renderer answers every `callRendererFunction` with `INVALID_FUNCTION_CALL` (`functionCallProblem()` gives the message): an agent acts through the action's own tool, never through the screen.
