# ax-eval: B xray v2 (text args, watch conversation)

CLI: `~/work/probe-xray/bin/app.mjs` · runs per task: 2 · 2026-10-30T23:56:59.156Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 6 | 0 | 0 | 0 | 1 | 130k | 35s |
| T2 Draft handoff | 2/2 | 6 | 0 | 1 | 0 | 3 | 118k | 29s |
| T3 Directed send others see | 2/2 | 6 | 0 | 0.5 | 0.5 | 3.5 | 122k | 38s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 7 | 0 | 0 | 0 | 4 | 143k | 24s |
| T5 Wait for a reply | 2/2 | 5 | 0 | 0 | 0 | 3 | 151k | 31s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 0 | 0 | 1 | 135k/548 | 32s |
| T1 | 2 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 0 | 0 | 1 | 125k/458 | 37s |
| T2 | 1 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/231 | 31s |
| T2 | 2 | yes | draft in Jo's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/232 | 28s |
| T3 | 1 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "Riley asked me to let you know: the new ba | 4 | 0 | 0 | 0 | 2 | 92k/258 | 39s |
| T3 | 2 | yes | one send to Launch planning, why "User asked: Riley asked me to tell the Launch planning group that the new banner": "The new banner is final." | 8 | 0 | 1 | 1 | 5 | 150k/398 | 37s |
| T4 | 1 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "Asked to edit my last message in the Launch planning group: " | 7 | 0 | 0 | 0 | 4 | 128k/272 | 23s |
| T4 | 2 | yes | edited to "Thanks, both. Can we ship & review on Thursday?", why "User asked to edit their last message in Launch planning: Sa" | 7 | 0 | 0 | 0 | 4 | 157k/292 | 24s |
| T5 | 1 | yes | reported the reply; 0 repeated reads | 5 | 0 | 0 | 0 | 3 | 122k/257 | 27s |
| T5 | 2 | yes | reported the reply; 0 repeated reads | 5 | 0 | 0 | 0 | 3 | 179k/381 | 34s |

## Calls per run

### T1 run 1

```
  [0] app --help
  [0] app today --json
  [0] app look k8xi47 --json
  [0] app look ej90am --json
  [0] app look 1zijq8 --json
  [0] app agenda --json
```

Answer: **Start with the settings mockups.** Jo explicitly asked for your sign-off in [Design reviews](https://chat.example.com/l/message/c%3A00000000bbbb0000bbbb000000000002/1700004200000?parentMessageId=1700003600000); review them and give approval or concrete changes. Then: 1. **Close the rollout-numbers request** in [Weekly sync](https://chat.example.com/l/message/c%3Ameeting_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/1700000480000). Jo requested these before the meeting; check whether they’re still needed, since the scheduled sync has passed. 2. **Review

### T1 run 2

```
  [0] app --help
  [0] app today --json
  [0] app look ej90am --ids 1700001800000 --json
  [0] app look k8xi47 --ids 1700000480000 --json
  [0] app look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] app agenda --json
```

Answer: **Start with the settings mockups:** Jo explicitly asked for your sign-off in [Design reviews](https://chat.example.com/l/message/c%3A00000000bbbb0000bbbb000000000002/1700004200000?parentMessageId=1700003600000). Review them and approve or flag specific changes. Then: 1. **Check the rollout-numbers request** in Weekly sync; it still shows as needing you. Confirm whether it was handled before sending anything. 2. **Review Jo’s draft document**, requested in your direct chat. Timing note: your calendar currently shows **4:21 PM Pacific, October 30**, not morning. Your next a

### T2 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app draft --help
  [0] app draft show Jo Park --json
  [0] app draft set Jo Park I'll look at the review doc by end of day. --if-version 0 --agent copilot --json
  [0] app draft show Jo Park --json
wrong turns:
  repeated: app draft show Jo Park --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] app --help
  [0] app conversations --help
  [0] app draft --help
  [0] app draft show Jo Park --json
  [0] app draft set Jo Park I'll look at the review doc by end of day. --if-version 0 --agent copilot --json
  [0] app draft show Jo Park --json
wrong turns:
  repeated: app draft show Jo Park --json
```

Answer: Saved an unsent draft in your chat with Jo Park: “I'll look at the review doc by end of day.”

### T3 run 1

```
  [0] app --help
  [0] app search Launch planning --json
  [0] app send --help
  [0] app send c:00000000aaaa0000aaaa000000000001 Riley asked me to let you know: the new banner is final. --agent copilot --why User asked: Riley asked me to tell the Launch planning grou
```

Answer: Sent to **Launch planning**: “Riley asked me to let you know: the new banner is final.”

### T3 run 2

```
  [0] app --help
  [0] app conversations --help
  [0] app search --help
  [0] app send --help
  [0] app search Launch planning --json
  [0] app look --help
! [2] app send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --intent 4681968e-e2c1-4e00-8b
  [0] app send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final. Send it. --json
wrong turns:
  exit 2: app send nxrlt3 The new banner is final. --agent copilot --why User asked: Riley asked me to tell the Launch planning group that the new banner is final.
```

Answer: Sent to **Launch planning**: “The new banner is final.”

### T4 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app edit-sent --help
  [0] app look --help
  [0] app look Launch planning --limit 30 --json
  [0] app edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --why Asked to edit my last message in the Launch planning group: Jo says it should say Thurs
  [0] app look nxrlt3#1700002700000 --json
```

Answer: Edited your last message in Launch planning to say Thursday instead of Friday, leaving everything else unchanged.

### T4 run 2

```
  [0] app --help
  [0] app conversations --help
  [0] app edit-sent --help
  [0] app look --help
  [0] app look Launch planning --limit 30 --json
  [0] app edit-sent nxrlt3#1700002700000 Thanks, both. Can we ship & review on Thursday? --agent copilot --why User asked to edit their last message in Launch planning: Jo says it should say Thursda
  [0] app look nxrlt3#1700002700000 --json
```

Answer: Edited your last message in Launch planning to say Thursday instead of Friday.

### T5 run 1

```
  [0] app --help
  [0] app conversations --help
  [0] app watch --help
  [0] app conversations --json
  [0] app watch r82dfi --json
```

Answer: I’ll watch the chat with Alex, Riley, and Jo for the next reply, for up to 8 hours. Riley replied in your group chat with Alex and Jo: > Offsite update: we moved to the Lakeside room, 9:30 start.

### T5 run 2

```
  [0] app --help
  [0] app conversations --help
  [0] app watch --help
  [0] app conversations --json
  [0] app watch r82dfi --timeout 8h --json
```

Answer: Watching the group chat. I’ll let you know when someone replies. Riley replied in your group chat with Alex, Riley, and Jo: > Offsite update: we moved to the Lakeside room, 9:30 start.

