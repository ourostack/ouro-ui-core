# ax-eval: main ffdecc01, printf/echo allowed (supplement)

CLI: `~/code/tandem-worktrees/ax-eval/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:04:29.586Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T3 Directed send others see | 1/2 | 7 | 0 | 1 | 1 | 3.5 | 172k | 32s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 9 | 1 | 2.5 | 0 | 4.5 | 254k | 88s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T3 | 1 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "The new banner is final." | 6 | 0 | 1 | 1 | 3 | 140k/404 | 29s |
| T3 | 2 | no | --why does not say Riley asked: "User asked me to tell the Launch planning group that the new banner is final and send it." | 8 | 0 | 1 | 1 | 4 | 202k/394 | 34s |
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "Asked to edit my last message in the Launch planning group: " | 10 | 1 | 3 | 0 | 5 | 279k/714 | 78s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning to " | 8 | 1 | 2 | 0 | 4 | 229k/496 | 97s |

## Calls per run

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
! [2] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --intent b4698
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --intent t1-17
wrong turns:
  exit 2: m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 - --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new 
```

Answer: Sent to **Launch planning**: “The new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem send --help
  [0] m365tandem conversations --json
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --limit 10 --json
! [2] m365tandem send nxrlt3 - --agent copilot --why User asked me to tell the Launch planning group that the new banner is final and send it. --intent 6f8bd2f2-launch-banner-final --json
  [0] m365tandem send nxrlt3 - --agent copilot --why User asked me to tell the Launch planning group that the new banner is final and send it. --json
wrong turns:
  exit 2: m365tandem send nxrlt3 - --agent copilot --why User asked me to tell the Launch planning group that the new banner is final and send it. --intent 6f8bd2f2-launc
```

Answer: Sent to **Launch planning**: “Riley asked me to let everyone know that the new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem look nxrlt3 --limit 6
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why Asked to edit my last message in the Launch planning group: Sam says it should say Thursday, not Friday. --json
  [0] m365tandem look nxrlt3#1700002700000 --json
wrong turns:
  repeated: m365tandem edit-sent --help
  repeated: m365tandem look --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem edit-sent --help
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why User asked to edit their last message in Launch planning to say Thursday, not Friday, per Sam. --json
  [0] m365tandem look nxrlt3#1700002700000 --json
wrong turns:
  repeated: m365tandem edit-sent --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

