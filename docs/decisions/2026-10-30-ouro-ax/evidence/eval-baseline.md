# ax-eval: main ffdecc01 (baseline)

CLI: `~/work/ax-eval/bin/app.mjs` · runs per task: 2 · 2026-10-30T22:20:51.115Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 5 | 0 | 0 | 0 | 1 | 97k | 50s |
| T2 Draft handoff | 2/2 | 7 | 0 | 1 | 0 | 2.5 | 125k | 41s |
| T3 Directed send others see | 0/2 | 4 | 1 | 1 | 0 | 3 | 116k | 36s |
| T4 Recovery (ambiguous verb: edit) | 0/2 | 6 | 1.5 | 2.5 | 0 | 3.5 | 179k | 42s |
| T5 Wait for a reply | 1/2 | 8 | 0.5 | 1.5 | 0 | 4.5 | 254k | 140s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 3 of the 3 top items | 5 | 0 | 0 | 0 | 1 | 99k/403 | 51s |
| T1 | 2 | yes | no writes; names 3 of the 3 top items | 5 | 0 | 0 | 0 | 1 | 94k/404 | 50s |
| T2 | 1 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/234 | 45s |
| T2 | 2 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 8 | 0 | 1 | 0 | 2 | 131k/307 | 37s |
| T3 | 1 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 1 | 1 | 0 | 3 | 115k/272 | 40s |
| T3 | 2 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 1 | 1 | 0 | 3 | 115k/243 | 32s |
| T4 | 1 | no | the message was not edited | 4 | 1 | 1 | 0 | 2 | 133k/292 | 40s |
| T4 | 2 | no | the message was not edited | 8 | 2 | 4 | 0 | 5 | 224k/627 | 44s |
| T5 | 1 | yes | reported the reply; 0 repeated reads | 8 | 0 | 0 | 0 | 5 | 188k/479 | 83s |
| T5 | 2 | no | the answer does not report the reply | 8 | 1 | 3 | 0 | 4 | 319k/1349 | 197s |

## Calls per run

### T1 run 1

```
  [0] app --help
  [0] app today --json
  [0] app look ej90am --json
  [0] app look 1zijq8 --json
  [0] app look k8xi47 --json
```

Answer: **Start with the settings mockups.** Jo explicitly needs your sign-off, and the Design review you organize starts at **3:30 PM—about 20 minutes away**. Review them and prepare either approval or specific blockers. [Open request](https://chat.example.com/l/message/c%3A00000000bbbb0000bbbb000000000002/1700004200000?parentMessageId=1700003600000). Then handle: 1. **Rollout numbers:** Jo’s Weekly sync request is still flagged as needing attention; check whether it remains outstanding. 2. **Review doc draft:** Jo also asked you to look it over in your direct chat. Your synced 

### T1 run 2

```
  [0] app --help
  [0] app today --json
  [0] app look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] app look k8xi47 --ids 1700000480000 --json
  [0] app look ej90am --ids 1700001800000 --json
```

Answer: **Handle the settings mockups first.** [Jo is waiting for your sign-off](https://chat.example.com/l/message/c%3A00000000bbbb0000bbbb000000000002/1700004200000?parentMessageId=1700003600000), and the design review you organized starts in about 18 minutes, at **3:30 PM Pacific**. Then: 1. Review the draft document Jo asked about in your direct chat. 2. Check whether the rollout numbers requested in Weekly sync still need a follow-up—the request remains flagged. Your calendar shows it’s already afternoon locally. The pending brown-bag and social invites can wait behind those 

### T2 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app draft --help
  [0] app draft show Jo Park --json
  [0] app draft set Jo Park I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads none --json
  [0] app draft show Jo Park --json
wrong turns:
  repeated: app draft show Jo Park --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] app --help
  [0] app help draft
  [0] app conversations --json
  [0] app look ej90am --json
  [0] app draft show ej90am --json
  [0] app draft set ej90am I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --json
  [0] app draft ready ej90am --agent copilot --json
  [0] app draft show ej90am --json
wrong turns:
  repeated: app draft show ej90am --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

### T3 run 1

```
  [0] app --help
  [0] app search --help
  [0] app send --help
  [0] app search Launch planning --json
wrong turns:
  denied by tool permissions: printf '%s' 'The new banner is final.' | app send 'c:00000000aaaa0000aaaa000000000001' - --agent copilot --why "User asked: Riley asked me to 
```

Answer: Not sent: permission approval was required but unavailable in this non-interactive session. Intended message to Launch planning: “The new banner is final.”

### T3 run 2

```
  [0] app --help
  [0] app search --help
  [0] app send --help
  [0] app search Launch planning --json
wrong turns:
  denied by tool permissions: printf '%s' 'The new banner is final.' | app send 'c:00000000aaaa0000aaaa000000000001' - --agent copilot --why "User asked: Riley asked me to 
```

Answer: Not sent: permission approval was required but unavailable in this non-interactive session.

### T4 run 1

```
  [0] app --help
  [0] app conversations --json
  [0] app edit-sent --help
  [0] app look nxrlt3 --json
wrong turns:
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | app edit-sent nxrlt3#1700002700000 - --agent copilot --why "User asked to edit their last
```

Answer: The edit was blocked because approval wasn’t available in this non-interactive session. Your message is unchanged. Intended text: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] app --help
  [0] app conversations --json
  [0] app edit-sent --help
  [0] app look --help
  [0] app edit-sent --help
  [0] app look --help
  [0] app look nxrlt3 --json
  [0] app look nxrlt3 --limit 4 --json
wrong turns:
  repeated: app edit-sent --help
  repeated: app look --help
  denied by tool permissions: app conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && app edit-sent --help && app look --help
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | app edit-sent nxrlt3#1700002700000 - --agent copilot --why "User asked to edit their last
```

Answer: I found your last message, but the edit was blocked by a permission requirement. It remains unchanged: “Thanks, both. Can we ship & review on Friday?”

### T5 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app watch --help
  [0] app conversations --json
  [0] app help watch
  [0] app look --help
! [130] app watch
  [0] app look r82dfi --limit 5 --json
```

Answer: I found the group chat with Alex, Riley, and Jo. I’ll watch for the next reply. Riley replied in your group chat: “Offsite update: we moved to the Lakeside room, 9:30 start.”

### T5 run 2

```
  [0] app --help
  [0] app conversations --help
  [0] app watch --help
  [0] app conversations --json
! [2] app watch r82dfi --timeout 8h --json
! [2] app watch conversation:r82dfi --timeout 8h --json
! [130] app watch
  [0] app look --help
wrong turns:
  exit 2: app watch r82dfi --timeout 8h --json
  exit 2: app watch conversation:r82dfi --timeout 8h --json
  denied by tool permissions: python -u - <<'PY'
import json
import select
import subprocess
import time

chat_id = 'c:00000000cccc0000cccc000000000003'
baseline_id = '17000010800
```

Answer: I found the group chat with Alex, Riley, and Jo. I’m waiting for a new reply there. I found the chat with Alex, Riley, and Jo, but permission to run the reply monitor was denied. No notification watch is active.

