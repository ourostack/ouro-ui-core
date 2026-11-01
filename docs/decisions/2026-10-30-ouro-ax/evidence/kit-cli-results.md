# ax-eval: kit CLI v3

CLI: `~/code/tandem-worktrees/ax-probe-kit/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-31T00:07:54.858Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T3 Directed send others see | 1/2 | 4 | 0 | 0 | 0 | 2 | 93k | 18s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 6 | 0 | 0 | 0 | 3.5 | 126k | 22s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T3 | 1 | yes | one send to Launch planning, why "The user asked: Riley asked me to tell the Launch planning group that the new ba": "The new banner is final." | 4 | 0 | 0 | 0 | 2 | 93k/207 | 19s |
| T3 | 2 | no | --why does not say Riley asked: "The user asked me to tell the Launch planning group that the new banner is final and send it." | 4 | 0 | 0 | 0 | 2 | 93k/222 | 17s |
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning: Sa" | 7 | 0 | 0 | 0 | 4 | 128k/281 | 21s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "Asked to edit my last message in the Launch planning group: " | 5 | 0 | 0 | 0 | 3 | 123k/245 | 23s |

## Calls per run

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send --help
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 The new banner is final. --agent copilot --why The user asked: Riley asked me to tell the Launch planning group that the new banner is fin
```

Answer: Sent to **Launch planning**: “The new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send --help
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 Riley asked me to let everyone know: the new banner is final. --agent copilot --why The user asked me to tell the Launch planning group th
```

Answer: Sent to **Launch planning**: “Riley asked me to let everyone know: the new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --limit 30 --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --why User asked to edit their last message in Launch planning: Sam says it should say Thursda
  [0] m365tandem look nxrlt3#1700002700000 --json
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look Launch planning --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --why Asked to edit my last message in the Launch planning group: Sam says it should say Thurs
```

Answer: Edited your last message in Launch planning: “Thanks, both. Can we ship & review on Thursday?”

