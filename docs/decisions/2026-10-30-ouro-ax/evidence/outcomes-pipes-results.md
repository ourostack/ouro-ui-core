# ax-eval: Lane C outcomes, printf/echo allowed (supplement)

CLI: `~/code/tandem-worktrees/ax-probe-outcomes/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:31:37.631Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T3 Directed send others see | 2/2 | 5.5 | 0 | 0.5 | 0.5 | 3 | 129k | 25s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 8.5 | 0.5 | 1.5 | 0 | 4.5 | 207k | 39s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T3 | 1 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "The new banner is final." | 5 | 0 | 0 | 0 | 3 | 116k/241 | 22s |
| T3 | 2 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "The new banner is final." | 6 | 0 | 1 | 1 | 3 | 141k/365 | 27s |
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning to " | 10 | 1 | 3 | 0 | 5 | 256k/656 | 48s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning: Sa" | 7 | 0 | 0 | 0 | 4 | 158k/305 | 31s |

## Calls per run

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --json
```

Answer: Sent to **Launch planning**: “The new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
! [2] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --intent 6494f
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --json
wrong turns:
  exit 2: m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new 
```

Answer: Sent to **Launch planning**: “The new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem look nxrlt3 --limit 5 --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why User asked to edit their last message in Launch planning to say Thursday, not Friday, per Sam. --json
  [0] m365tandem look nxrlt3#1700002700000 --json
wrong turns:
  repeated: m365tandem edit-sent --help
  repeated: m365tandem look --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
```

Answer: Edited your last message in Launch planning to say: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --limit 20 --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why User asked to edit their last message in Launch planning: Sam says it should say Thursday, not Friday. --json
  [0] m365tandem look nxrlt3#1700002700000 --json
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

