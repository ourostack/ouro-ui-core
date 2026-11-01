# ax-eval: flow + draft why hint

CLI: `~/work/probe-flow/bin/app.mjs` · runs per task: 2 · 2026-10-30T23:33:49.650Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T2 Draft handoff | 2/2 | 7.5 | 0 | 1 | 0 | 3.5 | 145k | 45s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T2 | 1 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/265 | 62s |
| T2 | 2 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 9 | 0 | 1 | 0 | 4 | 171k/332 | 28s |

## Calls per run

### T2 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app draft --help
  [0] app draft show Jo Park --json
  [0] app draft set Jo Park I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads none --why User asked for a reply to Jo Park promising to look at the review doc 
  [0] app draft show Jo Park --json
wrong turns:
  repeated: app draft show Jo Park --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] app --help
  [0] app draft --help
  [0] app conversations --help
  [0] app search --help
  [0] app search Jo Park --limit 5 --json
  [0] app draft show Jo Park --json
  [0] app draft set Jo Park I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --why User asked to draft a reply to Jo Park saying I'll look at th
  [0] app draft ready Jo Park --agent copilot --json
  [0] app draft show Jo Park --json
wrong turns:
  repeated: app draft show Jo Park --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

