# ax-eval: flow + draft why hint

CLI: `~/code/tandem-worktrees/ax-probe-flow/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:33:49.650Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T2 Draft handoff | 2/2 | 7.5 | 0 | 1 | 0 | 3.5 | 145k | 45s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T2 | 1 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/265 | 62s |
| T2 | 2 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 9 | 0 | 1 | 0 | 4 | 171k/332 | 28s |

## Calls per run

### T2 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads none --why User asked for a reply to Sam Example promising to look at the review doc 
  [0] m365tandem draft show Sam Example --json
wrong turns:
  repeated: m365tandem draft show Sam Example --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] m365tandem --help
  [0] m365tandem draft --help
  [0] m365tandem conversations --help
  [0] m365tandem search --help
  [0] m365tandem search Sam Example --limit 5 --json
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --why User asked to draft a reply to Sam Example saying I'll look at th
  [0] m365tandem draft ready Sam Example --agent copilot --json
  [0] m365tandem draft show Sam Example --json
wrong turns:
  repeated: m365tandem draft show Sam Example --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll look at the review doc by end of day.”

