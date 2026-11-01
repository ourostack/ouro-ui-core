# ax-eval: B xray fixes

CLI: `~/code/tandem-worktrees/ax-probe-xray/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T22:36:35.694Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 6 | 0 | 0 | 1.5 | 111k | 24s |
| T2 Draft handoff | 2/2 | 7 | 0.5 | 0 | 3 | 119k | 25s |
| T3 Directed send others see | 0/2 | 3.5 | 0 | 0 | 2.5 | 104k | 24s |
| T4 Recovery (ambiguous verb: edit) | 0/2 | 5 | 0.5 | 0 | 3 | 164k | 31s |
| T5 Wait for a reply | 1/2 | 6 | 2.5 | 0.5 | 2 | 198k | 75s |

## Every run

| Task | Run | Success | Reason | Calls | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 0 | 2 | 126k/530 | 27s |
| T1 | 2 | yes | no writes; names 3 of the 3 top items | 6 | 0 | 0 | 1 | 95k/459 | 22s |
| T2 | 1 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 8 | 0 | 0 | 3 | 121k/337 | 24s |
| T2 | 2 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 6 | 1 | 0 | 3 | 118k/233 | 27s |
| T3 | 1 | no | 0 completed sends to Launch planning (want 1); log: none | 3 | 0 | 0 | 2 | 92k/258 | 23s |
| T3 | 2 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 0 | 0 | 3 | 115k/259 | 25s |
| T4 | 1 | no | the message was not edited | 4 | 0 | 0 | 2 | 133k/297 | 24s |
| T4 | 2 | no | the message was not edited | 6 | 1 | 0 | 4 | 195k/537 | 38s |
| T5 | 1 | no | the answer does not report the reply | 6 | 3 | 0 | 2 | 210k/987 | 84s |
| T5 | 2 | yes | reported the reply; 0 repeated reads | 6 | 2 | 1 | 2 | 184k/348 | 66s |

## Calls per run

### T1 run 1

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem look --help
  [0] m365tandem look ej90am --limit 10 --json
  [0] m365tandem look k8xi47 --limit 10 --json
  [0] m365tandem look 1zijq8 --limit 20 --json
```

Answer: **Handle the design review first.** Your calendar shows it starting at **3:30 PM today—about now**, rather than this morning; you’re the organizer. 1. **Review the settings mockups and decide on sign-off.** [Sam explicitly asked for your approval](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000)—bring your decision or concerns to the review. 2. **Follow up on the rollout numbers.** [Sam requested them before the weekly sync](https://teams.microsoft.com/l/message/19%3Ameeting_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

### T1 run 2

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem look k8xi47 --ids 1700000480000 --json
  [0] m365tandem look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] m365tandem look ej90am --ids 1700001800000 --json
  [0] m365tandem meeting s5wqme --json
```

Answer: **Handle the design review first.** Your calendar shows it starting now at **3:30 PM Pacific**—rather than morning—and you’re the organizer. Sam is waiting for your [sign-off on the settings mockups](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000); review them and bring your decision or blockers. Then prioritize: 1. **Rollout numbers:** Sam asked for them before the weekly sync. Check whether that request still needs closing out. 2. **Review-doc draft:** Sam also directly asked you to look it over; no deadl

### T2 run 1

```
  [0] m365tandem --help
  [0] m365tandem draft --help
  [0] m365tandem conversations --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem look Sam Example --json
  [0] m365tandem draft set ej90am I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --json
  [0] m365tandem draft ready ej90am --agent copilot --json
  [0] m365tandem draft show ej90am --json
```

Answer: Saved a draft in your chat with Sam Example: “I'll look at the review doc by end of day.” Left unsent for you.

### T2 run 2

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

### T3 run 1

```
  [0] m365tandem --help
  [0] m365tandem search Launch planning --json
  [0] m365tandem send --help
```

Answer: Not sent: sending requires approval unavailable in this non-interactive session. Intended message to **Launch planning**: “Riley asked me to let everyone know: the new banner is final.”

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
```

Answer: Not sent: sending requires approval that isn’t available in this non-interactive session. Intended message to **Launch planning**: “The new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look nxrlt3 --json
```

Answer: I found your last message, but the edit was blocked because approval requires an interactive session. No change was made. Intended text: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look nxrlt3 --json
wrong turns:
  repeated: m365tandem edit-sent --help
```

Answer: I found your last message in Launch planning, but the edit was blocked by a permission requirement. It remains unchanged: “Thanks, both. Can we ship & review on Friday?” The intended correction is **Thursday**.

### T5 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem watch --help
! [2] m365tandem watch r82dfi --timeout 8h --json
! [2] m365tandem watch chat:r82dfi --timeout 8h --json
! [130] m365tandem watch
wrong turns:
  exit 2: m365tandem watch r82dfi --timeout 8h --json
  exit 2: m365tandem watch chat:r82dfi --timeout 8h --json
  exit 130: m365tandem watch
```

Answer: I found the group chat with Alex, Riley, and Sam. I’m watching for the next reply. I found your group chat with Alex, Riley, and Sam, but continuous reply monitoring requires approval unavailable in this session. No reply alert has been set up.

### T5 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem watch --help
! [2] m365tandem watch chat:r82dfi --timeout 8h --json
! [130] m365tandem watch
  [0] m365tandem look r82dfi --json
wrong turns:
  exit 2: m365tandem watch chat:r82dfi --timeout 8h --json
  exit 130: m365tandem watch
```

Answer: Riley just replied in your group chat with Alex, Riley, and Sam: > Offsite update: we moved to the Lakeside room, 9:30 start.

