# ax-eval: Lane C outcomes + edit postcondition, printf/echo allowed

CLI: `~/code/tandem-worktrees/ax-probe-outcomes/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:50:11.119Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T4 Recovery (ambiguous verb: edit) | 2/2 | 6.5 | 0.5 | 1.5 | 0 | 3.5 | 168k | 30s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "Asked to edit my last message in the Launch planning group: " | 5 | 0 | 0 | 0 | 2 | 133k/251 | 25s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning to " | 8 | 1 | 3 | 0 | 5 | 203k/490 | 34s |

## Calls per run

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why Asked to edit my last message in the Launch planning group: Sam says it should say Thursday, not Friday. --json
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
  [0] m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why User asked to edit their last message in Launch planning to say Thursday, not Friday, per Sam. --json
wrong turns:
  repeated: m365tandem edit-sent --help
  repeated: m365tandem look --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
```

Answer: Edited your last message in Launch planning: “Thanks, both. Can we ship & review on Thursday?”

