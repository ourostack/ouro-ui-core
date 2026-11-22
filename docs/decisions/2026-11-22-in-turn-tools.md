# Decision: ouro-actions emits in-turn tools, each with its Ouro AX card

Status: accepted, 2026-11-22. Part of Ari's 2026-11-21 harness mandate: every Ouro agent interface is declared once, found by the Ouro AX census and judged by agents.

## Why

An agent harness hands its model function tools inside a turn. In ourostack/ouroboros each tool's JSON schema and its Ouro AX card (`ToolDoorCard` in `src/repertoire/tools-base.ts`) are written by hand, side by side, so they can disagree. The one action model already declares everything both need: the agent's description, the typed input, the consent class and the confirm question. What it lacked was the card's `when` line and its error cards.

## Decision

1. **An action may declare `when` and `errors`** (`src/actions.mts`). `when` is one line saying when an agent should pick it over its neighbours; `errors` are `{ code, means, fix }`, one line each, with unique codes. `person-only` is the refusal's own code, so a declaration can't take it. No projection but `actions.json`, the declaration itself, changes when an app adds them.
2. **A new projection, `src/actions-tools.mts`, writes `tools.json`**: one OpenAI chat function tool (`{ type: "function", function: { name, description, parameters } }`) per action an agent may call, with `ax`, its card in the census's `DoorCard` shape (ourostack/ouro-ui `scripts/ouro-census/types.mts`). `parameters` is the MCP input schema, `description` the agent text, `effect` the consent, `confirm` the consequential question word for word, and `destructive` and `idempotent` follow MCP's hints (a read is idempotent). Beside the tools: `errors`, the error cards every tool shares, and `refusals`, the person-only actions' typed refusals.
3. **A person-only action has no tool,** as it has no App Intent or AppFunction. A harness that is asked for one by name answers its refusal, whose code the shared `person-only` card lists.
4. **An action an agent may call needs `when`;** generate fails without it, naming the action and the fix, so a projection never writes a weak card.
5. **It is its own file,** released as `dist/actions/ouro-actions-tools.mts` beside `ouro-actions.mts`, like the Windows and Android projections, so an app that doesn't use it sees no new generated file. `pnpm actions:tools:check` guards the fixture.

The DoorCard shape itself doesn't change. A change to it is agreed with the census first.

## Prior art

- [OpenAI function calling](https://platform.openai.com/docs/guides/function-calling): **adopt.** The tool shape the harness already sends (`OpenAI.ChatCompletionFunctionTool`), and the one Ouro AX's X-ray reads from a harness's `tools/list` (`--tools`, ourostack/ouro-ui `registry/ouro/ax/xray.ts`).
- [Anthropic tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview): **borrow.** `name`, `description` and `input_schema` take the same three values; the harness's provider layer converts, so core writes one shape.
- [MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools): **borrow.** The same input schema and the same `refusals` beside the list as `mcp.json`, so an in-turn call and an MCP call to one action can't differ.
- [Vercel AI SDK `tool()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool): **watch.** A typed tool beside its handler in code; a JSON file suits a harness that vendors a release and loads tools by name.
- The harness's own `ToolDoorCard` and the census's `DoorCard`: **adopt.** The card is theirs, unchanged.
