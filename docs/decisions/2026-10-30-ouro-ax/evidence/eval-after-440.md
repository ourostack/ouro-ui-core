# ax-eval: #440 cli/text-without-pipe 6297c319

CLI: `~/code/tandem-worktrees/ax-eval-440/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:47:27.995Z · AGENTS.md: `~/code/tandem-worktrees/ax-eval-out/agents-440.md`

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T2 Draft handoff | 2/2 | 6 | 0 | 1 | 0 | 3 | 118k | 20s |
| T3 Directed send others see | 2/2 | 5 | 0 | 0 | 0 | 3 | 117k | 27s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 9 | 0.5 | 1.5 | 0 | 4.5 | 192k | 31s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T2 | 1 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/243 | 20s |
| T2 | 2 | yes | draft in Sam's chat, nothing sent: "I'll take a look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/237 | 21s |
| T3 | 1 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "Riley asked me to let everyone know that t | 5 | 0 | 0 | 0 | 3 | 116k/255 | 21s |
| T3 | 2 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "Riley asked me to let you know that the ne | 5 | 0 | 0 | 0 | 3 | 116k/271 | 32s |
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "Asked to edit my last message in the Launch planning group: " | 7 | 0 | 0 | 0 | 4 | 129k/274 | 25s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning to " | 11 | 1 | 3 | 0 | 5 | 255k/628 | 38s |

## Calls per run

### T2 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example --text I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --json
  [0] m365tandem draft show Sam Example --json
wrong turns:
  repeated: m365tandem draft show Sam Example --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example --text I'll take a look at the review doc by end of day. --if-version 0 --agent copilot --reads none
  [0] m365tandem draft show Sam Example --json
wrong turns:
  repeated: m365tandem draft show Sam Example --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll take a look at the review doc by end of day.”

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 --text Riley asked me to let everyone know that the new banner is final. --agent copilot --why User asked: Riley asked me to tell the Laun
```

Answer: Sent to **Launch planning**: “Riley asked me to let everyone know that the new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send 19:00000000aaaa0000aaaa000000000001@thread.v2 --text Riley asked me to let you know that the new banner is final. --agent copilot --why User asked: Riley asked me to tell the Launch pl
```

Answer: Sent to **Launch planning**: “Riley asked me to let you know that the new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 --text Thanks, both. Can we ship & review on Thursday? --agent copilot --why Asked to edit my last message in the Launch planning group: Sam says it should sa
  [0] m365tandem look nxrlt3#1700002700000 --json
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem look nxrlt3 --limit 6
  [0] m365tandem look nxrlt3 --limit 3 --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 --text Thanks, both. Can we ship & review on Thursday? --agent copilot --why User asked to edit their last message in Launch planning to say Thursday, not Fri
  [0] m365tandem look nxrlt3#1700002700000 --json
wrong turns:
  repeated: m365tandem edit-sent --help
  repeated: m365tandem look --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
```

Answer: Edited your last message in Launch planning to say **Thursday** instead of Friday, keeping everything else unchanged.

