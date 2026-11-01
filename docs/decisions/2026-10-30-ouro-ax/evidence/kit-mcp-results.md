# ax-eval: kit MCP v3

CLI: `~/code/tandem-worktrees/ax-probe-kit/bin/m365tandem.mjs` · runs per task: 2 · 2026-10-31T00:09:29.193Z · AGENTS.md: `~/code/tandem-worktrees/ax-probe-kit/probe/ax-kit/AGENTS.mcp.md` · agency args: `--additional-mcp-config @~/code/tandem-worktrees/ax-probe-kit-eval/mcp.json`

## Per task (mean over runs)

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 6.5 | 0 | 1 | 1 | 0 | 199k | 29s |
| T3 Directed send others see | 2/2 | 2 | 0 | 0 | 0 | 0 | 78k | 17s |

## Every run

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 2 of the 3 top items | 7 | 0 | 1 | 1 | 0 | 209k/604 | 30s |
| T1 | 2 | yes | no writes; names 2 of the 3 top items | 6 | 0 | 1 | 1 | 0 | 188k/483 | 27s |
| T3 | 1 | yes | one send to Launch planning, why "The user said: "Riley asked me to tell the Launch planning group that the new ba": "Riley asked me to let everyone know that t | 2 | 0 | 0 | 0 | 0 | 77k/176 | 17s |
| T3 | 2 | yes | one send to Launch planning, why "The user asked: "Riley asked me to tell the Launch planning group that the new b": "Riley asked me to let you know that the ne | 2 | 0 | 0 | 0 | 0 | 78k/201 | 17s |

## Calls per run

### T1 run 1

```
  [0] tandem-today {"why":"What should I handle first this morning?"}
! [1] tandem-look {"conversation":"1zijq8","ids":["1700004200000","1700002100000"],"thread":true,"why":"Prioritize what to handle first this morning."}
  [0] tandem-look {"conversation":"1zijq8#1700004200000","thread":true,"why":"Prioritize what to handle first this morning."}
  [0] tandem-look {"conversation":"ej90am","limit":12,"why":"Prioritize what to handle first this morning."}
  [0] tandem-look {"conversation":"k8xi47","limit":15,"why":"Prioritize what to handle first this morning."}
  [0] tandem-look {"conversation":"1zijq8#1700002100000","thread":true,"why":"Prioritize what to handle first this morning."}
  [0] tandem-look {"conversation":"29rccb","limit":10,"why":"Check preparation needed for the next morning's 9 AM 1:1 when prioritizing the user's morning."}
wrong turns:
  exit 1: tandem-look {"conversation":"1zijq8","ids":["1700004200000","1700002100000"],"thread":true,"why":"Prioritize what to handle first this morning."}
```

Answer: **Handle Sam’s rollout-numbers request first**—it’s the only pending ask with explicit timing: “before we start” in [Weekly sync](https://teams.microsoft.com/l/message/19%3Ameeting_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%40thread.v2/1700000480000). Check whether it’s still needed; the scheduled sync has already passed. Then: 1. Review the settings mockups and give Sam a sign-off or specific changes in [Design reviews](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000?parentMessageId=1700003600000). 2. Review the draft document Sam

### T1 run 2

```
  [0] tandem-today {"why":"What should I handle first this morning?"}
! [1] tandem-look {"conversation":"1zijq8","ids":["1700004200000","1700002100000"],"thread":true,"why":"What should I handle first this morning?"}
  [0] tandem-look {"conversation":"1zijq8","limit":30,"why":"What should I handle first this morning?"}
  [0] tandem-look {"conversation":"ej90am","limit":15,"why":"What should I handle first this morning?"}
  [0] tandem-look {"conversation":"k8xi47","limit":15,"why":"What should I handle first this morning?"}
  [0] tandem-look {"conversation":"29rccb","limit":10,"why":"What should I handle first this morning?"}
wrong turns:
  exit 1: tandem-look {"conversation":"1zijq8","ids":["1700004200000","1700002100000"],"thread":true,"why":"What should I handle first this morning?"}
```

Answer: **Handle Sam’s mockup sign-off first**—it’s a direct request for your decision in [Design reviews](https://teams.microsoft.com/l/message/19%3A00000000bbbb0000bbbb000000000002%40thread.tacv2/1700004200000). Review the settings mockups and approve or flag changes. Then: 1. Check whether Sam still needs the **rollout numbers** requested before the weekly sync; that request may already be overdue. 2. Review **Sam’s draft document**. 3. Prepare the **hiring plan** discussion for your next 1:1, tomorrow at **9 AM**. Your synced clock shows Friday, Oct 30, **5:08 PM**, so I’ve treated this as your ne

### T3 run 1

```
  [0] tandem-conversations {"why":"User asked to tell the Launch planning group that the new banner is final and send it."}
  [0] tandem-send {"conversation":"nxrlt3","text":"Riley asked me to let everyone know that the new banner is final.","why":"The user said: \"Riley asked me to tell the Launch planning group that the new ba
```

Answer: Sent to **Launch planning**: “Riley asked me to let everyone know that the new banner is final.”

### T3 run 2

```
  [0] tandem-conversations {"limit":1000,"why":"Find the Launch planning group to send the user's requested banner-final announcement."}
  [0] tandem-send {"conversation":"nxrlt3","text":"Riley asked me to let you know that the new banner is final.","why":"The user asked: \"Riley asked me to tell the Launch planning group that the new banner
```

Answer: Sent to **Launch planning**: “Riley asked me to let you know that the new banner is final.”

