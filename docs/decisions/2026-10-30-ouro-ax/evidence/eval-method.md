# ax-eval: the shared Ouro AX evaluation

Every probe measures the same way with this runner: the five core tasks, a real agent (`copilot`, fresh session, only the interface you allow, never approve-all), a fresh mock app per run, and scoring from the end state. The baseline for the app's current main is at the bottom.

## Status (read first)

- 16:50 PT: the runner works. The current baseline for T2-T4 is "Baseline after #440"; T1 and T5 still use the first baseline. Draft PR: adopter#437 (branch `probe/eval`).
- The agent runs with `copilot --no-config-plugins` (none of the host's plugins, skills, hooks or extensions). With the host's plugins, every prompt-mode run with `--allow-tool` hung after startup (`ExtensionDeniedError` for plugin extensions in the agent log, then nothing). Runs started before 15:15 PT are void. These numbers are for a plain agent and are not comparable with the plugin-loaded runs in docs/ax-progress.md.
- `run.ts` stops a run with no output for 5 minutes (whole process group) and runs it once more.
- 16:05 PT: locks are now first come first served (a ticket in `.ax-locks/queue/`). Before this, a runner that released the agent lock took it again at once, so one lane's whole series ran before anyone else's. Runners started before 16:05 still behave that way; restart yours between series to get the queue.
- Disk on this Mac is nearly full; delete your `--out` run folders once you've recorded numbers.

Code: branch `probe/eval` of the first adopter's repository, folder `probe/ax-eval/` (`run.ts`, `tasks.ts`, `serve.ts`). Worktree: `~/work/ax-eval`.

## Usage

Run it from the eval worktree (or copy `probe/ax-eval/` into yours) and point `--cli` at your own checkout's CLI. The mock is started from that same checkout (`--root`, default: the folder above `bin/`), so daemon and model changes on your branch are measured too.

```
cd ~/work/ax-eval
node probe/ax-eval/run.ts \
  --cli ~/work/<your-lane>/bin/app.mjs \
  --out ~/work/<your-lane>-eval-out \
  --tasks T1,T2,T3,T4,T5 --runs 2 \
  --label "<your variant>" \
  [--agents-md <file>]                 # the agent's AGENTS.md; default: the paragraph from main's docs/agent-guide.md
  [--agent-args "<extra args>"]       # added to `copilot`, e.g. "--additional-mcp-config @/abs/path/mcp.json"
  [--allow-tool <tool>]...             # replaces the default shell(app); repeat for several
  [--mcp-prefix <tool name prefix>]    # MCP tools whose name starts with this count as interface calls
  [--timeout-min 15]
  [--no-lock]                          # only for a stub agent (AX_E2E_AGENT); never for a real agent

node probe/ax-eval/run.ts --rescore <out>   # score a finished evaluation again from its saved end states
```

- `--out` must be outside every repository. Each run leaves `<out>/<task>/run-<n>/` (AGENTS.md, prompt, `calls.jsonl`, `events.jsonl`, `end-state.json`) and `<out>/results.json` and `<out>/results.md` (tables plus every run's calls and answer). Delete the folder when you have recorded your numbers.
- Locks are automatic: each agent run takes `~/work/.ax-locks/agent` (one agent run at a time across lanes) and a heavy slot (`slot-1` or `slot-2`), first come first served through tickets in `.ax-locks/queue/`, and releases both when the agent exits, also on Ctrl-C. Don't take them yourself around `run.ts`.
- A full five-task, two-run evaluation is 10 agent runs, about 1-3 minutes each on a quiet machine, longer on this one. Run fewer tasks while iterating (`--tasks T3 --runs 1`).
- MCP variant (Lane A): pass your server with `--agent-args "--additional-mcp-config @<abs path>"`, allow its tools with `--allow-tool <server-name>` (and keep or drop `shell(app)`), and set `--mcp-prefix <server-name>` so its calls count. Your server must talk only to the mock: the harness sets `APP_URL` (the mock's agent port) and `APP_HOME` in the agent's environment; read those, and refuse anything else (`probe/ax-e2e/guard.ts` `assertMockDaemon`). MCP calls are taken from the transcript (`tool.execution_start`/`tool.execution_complete`); a call with `success: false` counts as an error.
- Nothing else to install: it runs on Node 22.18+ with no `node_modules` (type stripping).

## What a run is

1. `serve.ts` starts a mock app from your checkout: probe/ax-e2e/serve-mock.ts (agent port + page port, made-up fixtures synced every 5 s), plus: its own daemon home with the writes switch on; the window's own agent-action executor (`src/page/agent-actions.ts`), so a send, reply or edit an agent queues is performed against the mock chat service as the app's window would and shows up in `look`; an open window event stream (so the CLI does not say the window is down); fixture client ids padded to 13 digits so the person's own messages are editable; and a control port the agent is not told about (`GET /state`, `POST /inject`).
2. The agent runs in `<run>/work` with `AGENTS.md`, `app` on `PATH` through a wrapper that re-checks the mock (guard.ts) and logs every call with its exit code, time and first 4,000 characters of output: `copilot --no-config-plugins --session-id <new> -s --output-format json --allow-tool 'shell(app)' -p "<prompt>"`, no approve-all, in a plain terminal's environment (the Copilot app's own variables such as `COPILOT_CLI_ENABLED_FEATURE_FLAGS` and its trampoline are removed).
3. After the agent exits, the harness reads the end state from the mock (`app log --json`, `app draft status --json`, and the mock chat service's messages) and scores it.

## The tasks (fixtures: src/page/mock/fixtures.ts)

| Task | Prompt | Success |
|---|---|---|
| T1 Triage (read only) | "What should I handle first this morning?" | No action-log entry by an agent and no message sent; the answer names at least 2 of the 3 top "Needs you" items: Jo's mention in Design reviews (`/design reviews?/`), Jo's question about the review doc in the Jo Park chat (`/review doc\|jo's question\|jo asked/`), the mention in the Weekly sync meeting chat (`/weekly sync/`). |
| T2 Draft handoff | "Draft a reply in my chat with Jo Park saying I'll look at the review doc by end of day, and leave it for me to send." | A draft in the Jo Park chat (`ej90am`) whose text has "review doc" and "end of day"/"EOD"/"today"; no draft elsewhere; no action other people see; nothing sent. |
| T3 Directed send others see | "Riley asked me to tell the Launch planning group that the new banner is final. Send it." | Exactly one completed `message.send` to Launch planning (`nxrlt3`), its `--why` names Riley, the sent text has "banner" and "final"; no other action others see; nothing sent elsewhere. |
| T4 Recovery (ambiguous verb) | "Edit my last message in the Launch planning group: Jo says it should say Thursday, not Friday." | The person's own message "Thanks, both. Can we ship & review on Friday?" (`nxrlt3#1700002700000`) is edited (`edit-sent`) to say Thursday and not Friday; no new message; no other action others see. The obvious first try, `app edit ...`, exits 2 with the one line naming `edit-sent`; "Recoveries" and "Help calls" show whether the agent got there from the error or from help. |
| T5 Wait | "Tell me when someone replies in my group chat with Alex, Riley, and Jo." | The harness posts Riley's reply "Offsite update: we moved to the Lakeside room, 9:30 start." in that chat (`r82dfi`) 10 s after the agent starts a `watch` (or an MCP tool whose name has watch/wait), or 75 s after its first call, whichever is first. Success: the answer reports it ("Lakeside"), no action others see, and at most 3 repeated identical calls (more is blind polling). If the agent ends before the reply is posted, it fails. |

## Metrics (per run; the table shows the mean over runs)

- **Success**: the task's rule above, from the end state and the agent's final answer (the last non-empty assistant message plus the `task_complete` summary). A run that times out (15 min) fails. A run whose transcript and calls stop growing for 5 minutes is stalled: stopped and run once more.
- **Calls**: every `app` run (and every MCP call with `--mcp-prefix`), help included.
- **Denied**: shell commands the agent tried that its tool permissions refused (`tool.execution_complete` with error code `denied`), so they never reached the interface. With only `shell(app)` allowed, `printf ... | app send ... -` is refused: the pipe's first command is not `app`.
- **Wrong turns**: denied commands, plus calls that are any of: an error (exit code other than 0 and 5; 5 is "waited and it didn't happen"; a bare `watch` stream the agent stopped, exit 130, is not an error; MCP `success: false`), a repeat (the same command line as an earlier call), or undone later (`draft discard` after `draft set/append` in the same conversation, `delete-sent` after `send` there, `unreact` after `react`). A call that is several of these counts once.
- **Recoveries**: an error followed directly by a call that succeeds, is not help, and is not the same command line.
- **Help calls**: `help ...`, or any call with `--help` or `-h`.
- **Tokens**: from the last `session.usage_checkpoint` event in the transcript (`data.accountingSnapshot.modelMetrics.<model>.usage.inputTokens` + `outputTokens`, summed over models). Input counts the whole prompt of every model call, cached part included; on this host about 25k of each call's input is the agent's own system prompt, plugins and tool list, so compare differences, not absolutes.
- **Wall time**: from starting `copilot` to its exit (includes its ~20-40 s startup).

Scoring rules are fixed as of the baseline. If they change, the baseline is re-run and this file says so.

## Baseline: the app's main

main at `ffdecc01`, default AGENTS.md (the docs/agent-guide.md paragraph), only `shell(app)` allowed, 2 runs per task, 2026-10-30 15:15-15:22 PT. Model: `gpt-6.1-sol` (the host's managed default), one premium request per run. Load average on the host was 60-110 during the runs.

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T1 Triage (read only) | 2/2 | 5 | 0 | 0 | 0 | 1 | 97k | 50s |
| T2 Draft handoff | 2/2 | 7 | 0 | 1 | 0 | 2.5 | 125k | 41s |
| T3 Directed send others see | 0/2 | 4 | 1 | 1 | 0 | 3 | 116k | 36s |
| T4 Recovery (ambiguous verb: edit) | 0/2 | 6 | 1.5 | 2.5 | 0 | 3.5 | 179k | 42s |
| T5 Wait for a reply | 1/2 | 8 | 0.5 | 1.5 | 0 | 4.5 | 254k | 140s |

Every run (each run's calls and answer: `baseline-results.md` beside this file; raw end states and transcripts in `~/work/ax-eval-out/baseline/`, so `--rescore` still works):

| Task | Run | Success | Reason | Calls | Denied | Wrong turns | Recoveries | Help | Tokens in/out | Wall |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 1 | yes | no writes; names 3 of the 3 top items | 5 | 0 | 0 | 0 | 1 | 99k/403 | 51s |
| T1 | 2 | yes | no writes; names 3 of the 3 top items | 5 | 0 | 0 | 0 | 1 | 94k/404 | 50s |
| T2 | 1 | yes | draft in Jo's chat, nothing sent | 6 | 0 | 1 | 0 | 3 | 118k/234 | 45s |
| T2 | 2 | yes | draft in Jo's chat, nothing sent | 8 | 0 | 1 | 0 | 2 | 131k/307 | 37s |
| T3 | 1 | no | no send: `printf ... \| app send` denied | 4 | 1 | 1 | 0 | 3 | 115k/272 | 40s |
| T3 | 2 | no | no send: same | 4 | 1 | 1 | 0 | 3 | 115k/243 | 32s |
| T4 | 1 | no | not edited: the `edit-sent` pipe denied | 4 | 1 | 1 | 0 | 2 | 133k/292 | 40s |
| T4 | 2 | no | not edited: a `jq` pipe and the `edit-sent` pipe denied | 8 | 2 | 4 | 0 | 5 | 224k/627 | 44s |
| T5 | 1 | yes | bare `watch` (stream), stopped it, `look`, reported Riley's reply | 8 | 0 | 0 | 0 | 5 | 188k/479 | 83s |
| T5 | 2 | no | tried `watch r82dfi` and `watch conversation:r82dfi` (exit 2: watch takes only meeting:<ref>), bare `watch` for 141 s, then a denied Python poller; reported nothing | 8 | 1 | 3 | 0 | 4 | 319k/1349 | 197s |

What the baseline shows:

- Reads work: T1 and T2 pass every time in 5-8 calls. Every run starts with `--help`, as the AGENTS.md paragraph says, and most read a command's help before using it (1-5 help calls per run).
- Everything other people see fails for one reason: text goes in on stdin (`send ... -`, `edit-sent ... -`), and the recommended allow-list (`shell(app)`, docs/agent-guide.md) refuses `printf ... | app ...` because the pipe's first command is not `app`. Agents never tried a here-document. They reported the block truthfully and changed nothing. This is a real AX defect on main, not a harness artifact: the guide's own setup cannot send.
- T4's ambiguity was never hit: no agent tried bare `edit`; each read help first and went straight to `edit-sent` (then was denied). Recovery from a one-line error is untested by this baseline; a variant that removes help-first behavior would test it.
- Waiting has no conversation-level interface: `watch <object>` takes only `meeting:<ref>`, so agents fall back to the bare event stream, which runs until stopped. One run read the stream, saw activity, and checked with `look`; the other gave up.
- Tokens are dominated by the agent's own context: about 25k input per model call before any app output, and 66-90% of input is cache reads.

Supplement: the same main, T3 and T4 with `--allow-tool 'shell(printf)' --allow-tool 'shell(echo)'` added, so the stdin pipe is allowed (2 runs each, 15:45-16:04 PT):

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T3 Directed send others see | 1/2 | 7 | 0 | 1 | 1 | 3.5 | 172k | 32s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 9 | 1 | 2.5 | 0 | 4.5 | 254k | 88s |

- With the pipe allowed, the send and the edit work: both T3 runs sent exactly one message to Launch planning and both T4 runs edited the right message to Thursday, and both T4 runs then read the message back to check.
- T3 run 2 failed only on the why: `--why "User asked me to tell the Launch planning group that the new banner is final and send it."` does not say Riley asked. The rule wants the why to carry who asked; `--why`'s help does not ask for that.
- Both T3 runs first passed a made-up `--intent` (the help describes intent tokens for recovery), got `app: --intent takes one token shaped t1-<13-digit epoch ms>-<22 to 43 base64url characters>.` (exit 2), and recovered on the next call by dropping it. The help invites a flag the agent should not use on a first send.
- Use this supplement, not the main baseline, to compare a variant that changes how text gets in, if you also allow `printf`/`echo`. Use the main baseline for the recommended setup.

## Baseline after #440 (main 6297c319)

This is the baseline for T2, T3 and T4 from now on. #440 ("Agent CLI: give text with --text or --file, no pipe needed") lets every text-taking command take `--text <s>`, `--file <path>` and `--why-file` as plain arguments, and help and hints lead with them.

Which code: these runs used the #440 branch head `6297c319` (detached worktree), started before the merge. #440 landed on main as the squash commit `1c8cfffa`. Its CLI (`src/cli/`) and `docs/agent-guide.md` are identical to `6297c319`; the other differences in what the runner loads are the window-away-for-sign-in route in the daemon (not used by these tasks) and one fixture wording (Jo's question now reads "can you look at the review doc before the Q&A?" instead of "...review doc <draft>?"). So I kept the runs and did not re-run on `1c8cfffa`.

Setup as the first baseline: default AGENTS.md (the docs/agent-guide.md paragraph from that commit, unchanged), only `shell(app)` allowed, 2 runs per task, gpt-6.1-sol, 2026-10-30 16:20-16:47 PT.

| Task | Success | Calls | Denied | Wrong turns | Recoveries | Help calls | Tokens (in+out) | Wall time |
|---|---|---|---|---|---|---|---|---|
| T2 Draft handoff | 2/2 | 6 | 0 | 1 | 0 | 3 | 118k | 20s |
| T3 Directed send others see | 2/2 | 5 | 0 | 0 | 0 | 3 | 117k | 27s |
| T4 Recovery (ambiguous verb: edit) | 2/2 | 9 | 0.5 | 1.5 | 0 | 4.5 | 192k | 31s |

Every run (calls and answers: `after-440-results.md` beside this file):

| Task | Run | Success | Calls | Denied | Wrong turns | Help | Tokens in/out | Wall | Notes |
|---|---|---|---|---|---|---|---|---|---|
| T2 | 1 | yes | 6 | 0 | 1 | 3 | 118k/243 | 20s | repeated `draft show` to check |
| T2 | 2 | yes | 6 | 0 | 1 | 3 | 118k/237 | 21s | same |
| T3 | 1 | yes | 5 | 0 | 0 | 3 | 116k/255 | 21s | `send <id> --text ... --why "User asked: Riley asked me..."` |
| T3 | 2 | yes | 5 | 0 | 0 | 3 | 116k/271 | 32s | same shape |
| T4 | 1 | yes | 7 | 0 | 0 | 4 | 129k/274 | 25s | `edit-sent nxrlt3#1700002700000 --text ...`, then read it back |
| T4 | 2 | yes | 11 | 1 | 3 | 5 | 255k/628 | 38s | a `conversations --json \| jq` pipe denied, two repeated help reads, then the edit |

What changed against the first baseline (main `ffdecc01`):

- T3 went from 0/2 to 2/2 and T4 from 0/2 to 2/2 with the recommended allow-list. Every send and edit used `--text`; no agent piped text, so nothing was denied on the action itself. Both T3 whys named Riley.
- T3 also got shorter and cleaner: 5 calls and no wrong turns per run (before: 4 calls ending in a denied pipe; with pipes allowed: 7 calls, one made-up `--intent` error each). No agent passed `--intent` this time.
- T2 is unchanged in outcome (2/2), with 6 calls in both runs (before: 6 and 8).
- The one denial left is an agent's own `| jq` filter in T4 run 2, not an app input; the help-repeat pattern in that run is the same as before.
- T4's ambiguous `edit` was still never tried: agents read `--help` first and went straight to `edit-sent`.
- T3 sent "Riley asked me to let everyone know that the new banner is final." rather than the bare fact; the task's content rule (banner + final) passes either way.

## Variance

Two runs per task is evidence, not a benchmark; a third baseline run was not made because four lanes share one agent lock. In the baseline, the same task varied by up to 2x in calls (T2: 6 vs 8; T4: 4 vs 8) and 1.7x in tokens (T5: 188k vs 319k), and T5 passed once and failed once. Treat a difference of one or two calls, or under about 30% in tokens, as noise unless it holds over more runs. Compare success first, then denied and wrong turns.
