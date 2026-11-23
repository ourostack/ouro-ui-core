# Decision: Ouro UI is the whole, Ouro HX is its components, and every public surface leads with one north star

Status: accepted, 2026-11-23, on Ari's go for the public-surface launch. It extends [Ouro UI leads with its composed tree](2026-11-17-composed-tree-leads.md) and replaces none of it. It changes no code, no token and no catalog.

## Why

The public surfaces (ui.ouroboros.bot, ouroboros.bot, mendelow.me, the GitHub org profile and the READMEs) presented only the component libraries. Ari, 2026-11-23:

- "ouro ui is the parent for all this interface work; ouro hx is just the library of 'components for agents to use building interfaces for humans'"
- "ouro hx doesnt even refer to a single library cuz we have ouro hx for web, ouro hx for apple"
- The north star: "about to build any kind of interface at all? pick ouro ui and never think about it again"

And why Ouro UI exists at all: when Ari learns a way to make interfaces better, whether the screens themselves or the tools agents use to test and check them, that improvement should reach every corner of his portfolio, not only the app that taught it. That is the flywheel the surfaces now say in four words: "Learn it once. Every app gets it."

## Decision

1. **One naming system, used exactly, on every surface.**
   - **Ouro UI**: the whole kit. Everything below is part of it.
   - **Ouro HX** (human experience): components for the screens people use, per platform: Ouro HX for web, for Apple, for Windows, for Android. Never presented as the whole, and Ouro UI is never called "a React component library".
   - **Ouro AX** (agent experience): the doors agents use instead of a screen (command lines, APIs, MCP servers, App Intents, AppFunctions, Windows App Actions), a standard of checkable promises for them, and a kit that keeps the promises. A page defines "doors" where it first uses the word.
   - **Actions**: declare an action once; it becomes the button a person presses and the tool an agent calls, as a read, a write, one the person confirms first, or one only the person may start.
   - **Composed UI**: an agent sends a card as data; Ouro checks it against the app's components and actions, and each kit draws it natively.
   - **X-ray**, a family: **HX X-ray** outlines and names every component on a screen; **AX X-ray** calls every door the way an agent would and says which promises hold.
   - **Ouro check** (every page, every size, light and dark), **Ouro Feel** (how an app feels in use), **Ouro Reins** (drives an app's own screens as state and actions), **Hackamore** (drives any Mac app through its accessibility tree; part of the Ouro UI family), **Ouro Current** (each release arrives as one pull request) and **Adoption** (every product Ari maintains, checked hourly, in public).
2. **The north star leads every public surface.** The one line: "About to build an interface, for people or for agents, on any platform? Pick Ouro UI and never think about it again." It appears in full in ui.ouroboros.bot's hero and on GitHub; the other sites tell it in their own voice. The composed-tree-first order of [2026-11-17's record](2026-11-17-composed-tree-leads.md) still governs the "what it is" paragraph that follows: this record puts the decision to pick Ouro UI ahead of it and leaves its order as it was.
3. **The site is organised by part, with platforms inside each part.** ui.ouroboros.bot's header reads Ouro HX · Ouro AX · Actions · Composed UI · X-ray · Proof · Docs · GitHub. `/hx/` and `/ax/` each carry Web, Apple, Windows and Android; `/actions/`, `/composed-ui/`, `/xray/`, `/proof/` and `/hackamore/` are pages of their own; `/apple/`, `/windows/` and `/android/` are the platform deep dives, each with a `/start/` page. Old addresses forward: `/benchmark/` to `/proof/`, `/composed/` to `/composed-ui/`, `/web/` to `/hx/#web`. On ouroboros.bot the Ouro UI card comes first; on mendelow.me Ouro UI leads the selected work; on the GitHub org profile Ouro UI leads "Start with one" and Hackamore joins the Ouro UI family.
4. **Claims are counted, never superlative.** Copy says what was measured (98% of jobs done, 0 of 32 paid without the person, 712 checked trials on [the benchmark page](https://ui.ouroboros.bot/docs/agent-interfaces/)) and never "first", "only" or "nobody else". Neighbours are credited by name on the Proof page and in a credit line on the home page: "Good pieces of this exist, and we borrowed from many of them."

## What this changes

- Web (ourostack/ouro-ui): the site's header, home page and new pages, the README and llms.txt openings, and its AGENTS.md "Names" section.
- Apple, Windows and Android: their READMEs say "Ouro UI for <platform>", with Ouro HX as the components inside it.
- ouroboros.bot, mendelow.me and the GitHub org profile: Ouro UI first, in the words above.
- Core: this record. Core's own README and AGENTS.md already use "Ouro UI core" for the platform-neutral part of the whole.

## Prior art

Read on 2026-11-23, for how neighbours name and tell what they are.

| Find | Verdict | Why |
| --- | --- | --- |
| [A2UI](https://github.com/a2ui-project/a2ui) | **Borrow** (unchanged from 2026-11-17) | "UI as data" is the framing models chose it for; Composed UI says it in those terms and reads A2UI as one format in. |
| [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) | **Adopt** (unchanged) | The format hosts render; Composed UI sends its cards to any MCP Apps host. |
| [Agent-native (Builder.io)](https://github.com/BuilderIO/agent-native) | **Borrow** (the credit line) | One action projected to a UI hook, a tool and more, the same idea as Actions. It is named and credited on Proof rather than out-claimed. |
| [Vercel AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui) | **Watch** | Generative UI in React from tool results. A neighbour for the web, credited on Proof; Ouro UI's story spans native kits and agent doors too. |
| [CopilotKit](https://github.com/CopilotKit/CopilotKit) | **Watch** | Agent-in-app components and actions for React. Credited on Proof as a neighbour; no name or claim of ours depends on it. |
| The reader panel, eight reader postures over seven rounds of the copy (provenance: Ari's desk, `ouro-ui/public-surface-strategy/copy-deck-v1.md` to `copy-deck-v7.md`) | **Adopt** (as evidence) | Each version's notes say what the readers changed: the benchmark counts instead of promising ("didn't", not "can't"), "copy-in" is said only of the web, the header is organised one way (by part), and "never think about it again" answers who keeps the kit current and what happens when a piece is missing. Version 7 is the copy this record adopts. |
