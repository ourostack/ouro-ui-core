# Tandem's agent flows: what the X-ray did not see

A review of Tandem's agent flows for one person's working week, 2026-10-31, on Tandem's main branch at `4d3c5662` (which already used Ouro AX). Each flow is the `m365tandem` calls a good agent makes for one task, scripted with no model and run against a mock with made-up fixtures (Tandem's `probe/agent-flows`, 21 flows, 593 checks, about 15 seconds). Every check is one line of [`agent-flows-tandem-main.jsonl`](agent-flows-tandem-main.jsonl), in the flow-review/0 findings format. The same commit's X-ray called the CLI conformant.

## Results

593 checks, 30 failing. 185 of them are voice checks (no brand name, plain stderr, JSON alone under `--json`), and all 185 pass: main has no voice yet.

The failures the X-ray could not see, and what Ouro AX takes from each:

| Flow and step | What the flow found | In Ouro AX |
|---|---|---|
| W2 `week-flag` | `calendar --week` answered `Fix: m365tandem calendar.`, which drops the week. | `ArgSpec.values`: the fix gives the word without dashes. |
| T4 `edit` | The ambiguous `edit` answered with templates (`edit-sent <conversation>#<message id>`), not the reference the agent gave. | `{args}` and `{flags}` in an ambiguous word's meanings. |
| W2 `preview-decline`, W10 `preview`, N5 `react` | The dry run's `--json` said `audience.who: "other people"` while its text named the organizer, a contact and a sender. | `cli.audience-named`; `validateOutcome` warns. |
| W9 `search` | Search results in text carried no message refs, so an agent had to read again to act. | `cli.text-refs`. |
| W1, W3, W5, W8 `--help` | Flows used `attention` and `prep`, which the overview leaves out; another command's help pointed agents to them. | `cli.named-is-listed`. |
| H1 `send-help` | `send --help` was 11,080 bytes, over a 6,000-byte budget. | `cli.help-size`. |
| E2 `unread` | An empty `--unread` list said nothing had synced, which sent the agent to check a healthy window. | `emptyText` and the voice's `empty` slot, after the fact. |

Found by hand on the same commit: `m365tandem help all | head -1` exited 1 with a Node `Error: write EPIPE` stack trace on stderr. Ouro AX adds `quietPipes`, and `cli.no-stack-trace` now also runs the overview into a closed pipe.

## What it shows

The X-ray checks what every command must do; the flows check what a task needs. Each found failures the other could not. Ouro AX v1.3 ships both: the new claims above for the X-ray, and `ax-flows` to run an adopter's own flows in CI.

None of these is an agent evaluation, so every claim it admits is `should`.
