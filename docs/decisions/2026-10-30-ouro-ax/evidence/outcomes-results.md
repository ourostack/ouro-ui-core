# ax-eval: Lane C outcomes (ax-probe/outcomes)

CLI: `~/code/tandem-worktrees/ax-probe-outcomes/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:18:41.944Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 5.5 | 0 | 0 | 0 | 1 | 97k | 26s |
| T2 Draft handoff | 2/2 | 6.5 | 0 | 1 | 0 | 3 | 119k | 60s |
| T3 Directed send others see | 0/2 | 4 | 1 | 1 | 0 | 3 | 116k | 40s |
| T4 Recovery (ambiguous verb: edit) | 0/2 | 5 | 1 | 1 | 0 | 4 | 127k | 37s |
| T5 Wait for a reply | 2/2 | 4.5 | 0 | 0 | 0 | 2.5 | 110k | 29s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 3 of the 3 top items | 5 | 0 | 0 | 0 | 1 | 94k/409 | 21s |
| T1 | 2 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 0 | 0 | 1 | 100k/421 | 31s |
| T2 | 1 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 0 | 1 | 0 | 3 | 118k/232 | 50s |
| T2 | 2 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 7 | 0 | 1 | 0 | 3 | 119k/263 | 71s |
| T3 | 1 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 1 | 1 | 0 | 3 | 116k/299 | 35s |
| T3 | 2 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 1 | 1 | 0 | 3 | 116k/283 | 46s |
| T4 | 1 | no | the message was not edited | 5 | 1 | 1 | 0 | 4 | 127k/291 | 47s |
| T4 | 2 | no | the message was not edited | 5 | 1 | 1 | 0 | 4 | 127k/286 | 26s |
| T5 | 1 | yes | reported the reply; 0 repeated reads | 5 | 0 | 0 | 0 | 3 | 123k/222 | 28s |
| T5 | 2 | yes | reported the reply; 0 repeated reads | 4 | 0 | 0 | 0 | 2 | 97k/201 | 30s |

## Calls per run

### T1 run 1

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem look k8xi47 --ids 1700000480000 --json
  [0] m365tandem look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] m365tandem look ej90am --ids 1700001800000 --json
```

Answer: **Handle the settings mockups first.** Sam is waiting for your sign-off, and the Design review you organized starts at **3:30 PM—about two minutes away**. [See the request](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000). Then prioritize: 1. **Rollout numbers:** Sam requested them before the Weekly sync; check whether they’re still outstanding. 2. **Review doc:** Sam also asked you to review the draft in your direct chat. Your calendar currently shows Friday afternoon, not morning. I haven’t sent anything o

### T1 run 2

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem meeting s5wqme --json
  [0] m365tandem look k8xi47 --json
  [0] m365tandem look ej90am --json
  [0] m365tandem look 1zijq8 --json
```

Answer: **Handle the settings mockup sign-off first.** Sam explicitly asked for your approval, and the Design review you organize starts at **3:30 PM Pacific—about a minute away**. Review the [mockups thread](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000) and bring your decision or concerns. Next: follow up on Sam’s rollout-numbers request in Weekly sync, then review the draft document he asked about privately. Riley’s “see you at the review” reply needs no action. Your calendar currently shows Friday afternoon, n

### T2 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads none --json
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
  [0] m365tandem draft set Sam Example I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --json
  [0] m365tandem draft ready Sam Example --agent copilot --json
  [0] m365tandem draft show Sam Example --json
wrong turns:
  repeated: m365tandem draft show Sam Example --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll look at the review doc by end of day.” Left it for you to send.

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
wrong turns:
  denied by tool permissions: printf '%s' 'The new banner is final.' | m365tandem send '19:00000000aaaa0000aaaa000000000001@thread.v2' - --agent copilot --why 'User asked: Riley asked me to 
```

Answer: Not sent: sending requires approval unavailable in this non-interactive session. Intended message to **Launch planning**: “The new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
wrong turns:
  denied by tool permissions: printf '%s\n' 'Riley asked me to let everyone know: the new banner is final.' | m365tandem send '19:00000000aaaa0000aaaa000000000001@thread.v2' - --agent copilo
```

Answer: Not sent: sending requires approval, which wasn’t available in this non-interactive session.

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --limit 30 --json
wrong turns:
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why 'User asked to edit their last
```

Answer: The edit was blocked because approval is required in an interactive session. Your message is unchanged. Intended text: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --limit 30 --json
wrong turns:
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why 'User asked to edit their last
```

Answer: The edit was blocked because approval requires an interactive session. Your message is unchanged. Intended text: “Thanks, both. Can we ship & review on Thursday?”

### T5 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem watch --help
  [0] m365tandem conversations --json
  [0] m365tandem watch r82dfi --after 1700001080000 --json
```

Answer: **Riley replied** in your group chat with Alex, Riley, and Sam: > Offsite update: we moved to the Lakeside room, 9:30 start.

### T5 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem watch --help
  [0] m365tandem watch r82dfi --after 1700001080000 --timeout 24h --json
```

Answer: Riley replied in your group chat with Alex, Riley, and Sam: > Offsite update: we moved to the Lakeside room, 9:30 start.

