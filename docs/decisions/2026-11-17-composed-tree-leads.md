# Decision: Ouro UI leads with its composed tree, beside the one action, and A2UI and MCP Apps are formats the tree speaks

Status: accepted, 2026-11-17, under Ari's overnight authority. It supersedes item 7 ("Positioning") of [Ouro's composed-UI tree is the source of truth](2026-11-14-composed-ui-own-tree.md) and keeps the rest of that record. It changes no code and no catalog.

## Why

Ari, 2026-11-17: "we'll also want to keep iterating until 'model reviews' has 'all models prefer ouro ui' etc" and "dont just tweak the test, iterate on ouro ui itself until it's what agents actually want!!!!"

In web's [model reviews](https://github.com/ourostack/ouro-ui/blob/main/docs/guides/model-reviews.md) of 2026-11-14, 7 of the 8 models that answered chose A2UI, and every one of their pull quotes gave the same reason: an agent sends interface as validated data, limited to a catalog, and native renderers draw it. Ouro has that contract already: `src/composed.mts` validates every tree against a catalog, takes each button's label and consent from the app's declared actions, and refuses a forged tree. But item 7 put the composed tree under "Works with", and web's README and llms.txt called A2UI and MCP Apps "the formats agents compose interfaces in". The models took that at its word. Claude Opus 5.5, after reading [core's A2UI guide](../guides/a2ui.md), wrote that "Ouro treats A2UI as the base layer"; Grok 4.7 (2026-11-13) found "no shared surface an agent composes for a person". The findings behind this record are in the 2026-11-14 transcripts under web's `scripts/model-reviews/results/`.

Two models also said what they would miss in A2UI: Ouro's consent classes (Grok 4.7: "I still want Ouro UI's consent classes"; GPT-6.1 Sol: "Ouro UI offers more explicit consent classes and generated action surfaces, which I would miss"). The composed tree is where those classes reach an agent-composed card, so the story is one thing: agents compose a card in Ouro's tree, people press its buttons with the action's consent, and agents call the same actions through their own doors.

## Decision

1. **Ouro UI's README, llms.txt and site open with the composed tree beside the one action.** The order, after the opening line ("Delightful interfaces, by agents, for everyone."): agents compose interfaces as data in Ouro's tree, which the platform kits draw natively (web and Apple today; Windows and Android once their renderers ship, and copy names the platforms that do); every button in it is a declared action with its consent class; and the same declaration gives agents their own doors and the X-ray checks both.
2. **A2UI and MCP Apps are formats the tree speaks, never the format Ouro composes in.** Copy says so in those words or close to them: an agent may send Ouro's tree directly (MCP Apps' `structuredContent.ouro`) or send A2UI messages, which the adapter turns into the same tree. No surface calls A2UI or MCP Apps "the formats agents compose interfaces in".
3. **The composed tree has a guide of its own,** linked from the README, llms.txt and the site, that says what the tree is, how it is validated, what each button does by consent class, which platforms draw it and how each format maps onto it.
4. Item 7's MCP Apps-first order stands within the formats list.

## What this changes

- Web: the composed-UI guide, `WORKS_WITH` in the site's copy, the AX section, and once the home page's new opening merges, the README and llms.txt.
- Core: [the A2UI guide](../guides/a2ui.md) opens by saying the tree is Ouro's, and A2UI one way in.

## Prior art

Read on 2026-11-17.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI](https://github.com/a2ui-project/a2ui) ("UI as data") | **Borrow** (the framing) | Its pitch is the reason the models chose it: interface as validated data, catalog-limited, drawn natively. Ouro's tree is the same shape with consent added, so Ouro says it in those terms. A2UI stays a supported adapter. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) | **Adopt** (unchanged) | The format most hosts render; it carries Ouro's tree directly. |
| [Microsoft Adaptive Cards](https://adaptivecards.io/) | **Borrow** (unchanged) | One card schema, each host's native look: the shape Ouro's tree already has. |
| [Agent-native (Builder.io)](https://github.com/BuilderIO/agent-native) | **Watch** | `defineAction` projects one action to a UI hook, a tool, HTTP, MCP and a CLI; models liked it and noted it has no native rendering and no composed surface. Ouro has both. |
| [json-render](https://github.com/vercel-labs/json-render) | **Watch** (unchanged) | Catalog-first like A2UI, JavaScript renderers only. |
