# ax-eval: flow (work events + watch <conversation>)

CLI: `~/code/tandem-worktrees/ax-probe-flow/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-30T23:14:25.486Z · AGENTS.md: docs/agent-guide.md paragraph

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 7 | 0 | 0 | 0 | 1 | 128k | 100s |
| T2 Draft handoff | 2/2 | 7.5 | 0 | 0.5 | 0 | 3 | 120k | 50s |
| T3 Directed send others see | 0/2 | 3.5 | 1 | 1 | 0 | 2.5 | 104k | 54s |
| T4 Recovery (ambiguous verb: edit) | 0/2 | 5.5 | 1.5 | 2 | 0 | 4 | 150k | 56s |
| T5 Wait for a reply | 2/2 | 4.5 | 0 | 0 | 0 | 2.5 | 110k | 40s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 0 | 0 | 1 | 125k/552 | 115s |
| T1 | 2 | yes | no writes; names 2 of the 3 top items | 8 | 0 | 0 | 0 | 1 | 129k/620 | 84s |
| T2 | 1 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 8 | 0 | 0 | 0 | 3 | 120k/268 | 44s |
| T2 | 2 | yes | draft in Sam's chat, nothing sent: "I'll look at the review doc by end of day." | 7 | 0 | 1 | 0 | 3 | 118k/255 | 56s |
| T3 | 1 | no | 0 completed sends to Launch planning (want 1); log: none | 3 | 1 | 1 | 0 | 2 | 92k/235 | 41s |
| T3 | 2 | no | 0 completed sends to Launch planning (want 1); log: none | 4 | 1 | 1 | 0 | 3 | 115k/291 | 67s |
| T4 | 1 | no | the message was not edited | 5 | 1 | 1 | 0 | 4 | 127k/289 | 69s |
| T4 | 2 | no | the message was not edited | 6 | 2 | 3 | 0 | 4 | 172k/455 | 44s |
| T5 | 1 | yes | reported the reply; 0 repeated reads | 4 | 0 | 0 | 0 | 2 | 97k/191 | 42s |
| T5 | 2 | yes | reported the reply; 0 repeated reads | 5 | 0 | 0 | 0 | 3 | 122k/286 | 38s |

## Calls per run

### T1 run 1

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] m365tandem look k8xi47 --ids 1700000480000 --json
  [0] m365tandem look ej90am --ids 1700001800000 --json
  [0] m365tandem agenda --json
```

Answer: **Start with the settings mockups:** Sam explicitly asked for your sign-off in [Design reviews](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000). Review them and give approval or concrete blockers. Then: 1. **Check the rollout-numbers request** in [Weekly sync](https://teams.microsoft.com/l/message/19%3Ameeting_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%40thread.v2/1700000480000). It’s still flagged for you, though the meeting has passed—confirm whether it remains outstanding. 2. **Review Sam’s draft d

### T1 run 2

```
  [0] m365tandem --help
  [0] m365tandem today --json
  [0] m365tandem look ej90am --ids 1700001800000 --json
  [0] m365tandem look k8xi47 --ids 1700000480000 --json
  [0] m365tandem look 1zijq8 --ids 1700004200000,1700002100000 --json
  [0] m365tandem agenda --json
  [0] m365tandem look 1zijq8 --ids 1700003600000 --json
  [0] m365tandem meeting 7kgx81 --transcript --turns 2 --json
```

Answer: **First, close out the updated doc you promised Sam by Friday.** Today is Friday, and your next 1:1 is tomorrow at 9 AM. Confirm it was delivered; if not, prioritize finishing it. Sam also has an outstanding request to review a draft—don’t assume it’s the same document. Then tackle: 1. **Settings mockup sign-off:** Sam explicitly asked for your approval in [Design reviews](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000). 2. **Rollout numbers:** Check whether Sam’s request in Weekly sync still needs a follow

### T2 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem look Sam Example --json
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set ej90am I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads 1700001800000 --json
  [0] m365tandem draft ready ej90am --agent copilot --json
  [0] m365tandem draft show ej90am --json
```

Answer: Saved an unsent draft in your chat with Sam Example: “I'll look at the review doc by end of day.”

### T2 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem draft --help
  [0] m365tandem draft show Sam Example --json
  [0] m365tandem draft set Sam Example I'll look at the review doc by end of day. --if-version 0 --agent copilot --reads none --json
  [0] m365tandem draft ready Sam Example --agent copilot --json
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
wrong turns:
  denied by tool permissions: printf '%s' 'Riley asked me to let you know that the new banner is final.' | m365tandem send '19:00000000aaaa0000aaaa000000000001@thread.v2' - --agent copilot -
```

Answer: Not sent: sending requires approval that isn’t available in this non-interactive session.

### T3 run 2

```
  [0] m365tandem --help
  [0] m365tandem search --help
  [0] m365tandem send --help
  [0] m365tandem search Launch planning --json
wrong turns:
  denied by tool permissions: printf '%s' 'The new banner is final.' | m365tandem send '19:00000000aaaa0000aaaa000000000001@thread.v2' - --agent copilot --why 'Asked me to tell the Launch pl
```

Answer: Not sent: sending requires approval that wasn’t available in this non-interactive session. Message for **Launch planning**: “The new banner is final.”

### T4 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --help
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look Launch planning --limit 30 --json
wrong turns:
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why 'Asked to edit my last message
```

Answer: The edit was blocked by a permission approval requirement. Your message is unchanged; the intended text is: “Thanks, both. Can we ship & review on Thursday?”

### T4 run 2

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem edit-sent --help
  [0] m365tandem look --help
  [0] m365tandem look nxrlt3 --json
  [0] m365tandem edit-sent --help
wrong turns:
  repeated: m365tandem edit-sent --help
  denied by tool permissions: m365tandem conversations --json | jq '.[] | select(.title | test("Launch planning"; "i"))' && m365tandem edit-sent --help && m365tandem look --help
  denied by tool permissions: printf '%s' 'Thanks, both. Can we ship & review on Thursday?' | m365tandem edit-sent nxrlt3#1700002700000 - --agent copilot --why "User asked to edit their last
```

Answer: The edit was blocked by a permission requirement, so your message is unchanged. Intended correction: “Thanks, both. Can we ship & review on Thursday?”

### T5 run 1

```
  [0] m365tandem --help
  [0] m365tandem conversations --json
  [0] m365tandem watch --help
  [0] m365tandem watch r82dfi --agent copilot --why Tell me when someone replies in my group chat with Alex, Riley, and Sam. --json
```

Answer: Riley replied: “Offsite update: we moved to the Lakeside room, 9:30 start.”

### T5 run 2

```
  [0] m365tandem --help
  [0] m365tandem watch --help
  [0] m365tandem conversations --help
  [0] m365tandem conversations --json
  [0] m365tandem watch r82dfi --agent copilot --why Tell me when someone replies in my group chat with Alex, Riley, and Sam. --timeout 8h --json
```

Answer: I’ll watch your chat with Alex, Riley, and Sam for the next reply, for up to 8 hours. Riley replied in your group chat: “Offsite update: we moved to the Lakeside room, 9:30 start.”

