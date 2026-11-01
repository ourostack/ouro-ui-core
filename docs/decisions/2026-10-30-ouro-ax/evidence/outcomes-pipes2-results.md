# ax-eval: Lane C outcomes + edit postcondition, printf/echo allowed

CLI: `~/work/probe-outcomes/bin/app.mjs` · runs per task: 2 · 2026-10-30T23:50:11.119Z · AGENTS.md: docs/agent-guide.md paragraph

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
  [0] app --help
  [0] app conversations --json
  [0] app edit-sent --help
  [0] app look nxrlt3 --json
  [0] app edit-sent nxrlt3#1700002700000 - --agent copilot --why Asked to edit my last message in the Launch planning group: Jo says it should say Thursday, not Friday. --json
```

Answer: Edited your last message in Launch planning to: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] app --help
  [0] app conversations --json
  [0] app edit-sent --help
  [0] app look --help
  [0] app edit-sent --help
  [0] app look --help
  [0] app look nxrlt3 --json
  [0] app edit-sent nxrlt3#1700002700000 - --agent copilot --why User asked to edit their last message in Launch planning to say Thursday, not Friday, per Jo. --json
wrong turns:
  repeated: app edit-sent --help
  repeated: app look --help
  denied by tool permissions: app conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && app edit-sent --help && app look --help
```

Answer: Edited your last message in Launch planning: “Thanks, both. Can we ship & review on Thursday?”

