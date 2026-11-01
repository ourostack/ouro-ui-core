# Does the X-ray predict what agents hit?

The test of this probe: when the X-ray flags a claim and the fix makes it hold, do real agents do better? Measured with the shared Ouro AX evaluation (`ax-eval`, the app's branch `probe/eval`): a real agent (`copilot --no-config-plugins`, model gpt-6.1-sol), a fresh mock app per run, only `shell(app)` allowed, five tasks, two runs each, 2026-10-30, host load average 60-110.

## Results

| Variant | X-ray (claims holding, must) | T1 triage | T2 draft | T3 send | T4 edit | T5 wait | Success | Wrong turns | Denied | Tokens (sum of task means) |
|---|---|---|---|---|---|---|---|---|---|---|
| main `ffdecc01` (Lane E baseline) | 21 of 31, 19 of 28 | 2/2 | 2/2 | 0/2 | 0/2 | 1/2 | 5/10 | 12 | 6 | 771k |
| v1: fixes for standard 0.1's failures (`4f683e54`) | 26 of 29 at 0.1 | 2/2 | 2/2 | 0/2 | 0/2 | 1/2 | 5/10 | 7 | not counted | 696k |
| v2: plus fixes for the two claims the baseline added (`26485501`) | 28 of 31, 25 of 28 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 10/10 | 3 | 0 | 664k |

v1 ran on an earlier version of the runner, which did not yet count calls the allow-list denied as wrong turns.

## What it shows

- Standard 0.1, written from the app's principles, did not predict outcomes. Its failing claims on main (unknown flags ignored, no `--dry-run`, no route index, 404s that do not teach) named none of the 12 wrong turns in the baseline. Fixing all of them raised the X-ray score from 75.6% to 99% of checks (standard 0.1) and changed no task outcome (5/10 before and after). In 30 agent runs no agent passed a misspelt flag or used `--dry-run`.
- The baseline's failures had two causes the 0.1 claims did not cover: text went in only on stdin, so `printf … | app send … -` was denied by the recommended allow-list (T3, T4); and `watch` refused the conversation ref the agent held (T5). Standard 0.2 adds them as `cli.text-as-argument` and `cli.wait-on-refs`. They name 7 of the 12 baseline wrong turns.
- Fixing those two claims took the same agent from 5/10 to 10/10, wrong turns from 12 to 3, and denied calls from 6 to 0. Main independently fixed the first (`--text` and `--file`, by 62f53c8b); the X-ray shows `cli.text-as-argument` holding on main from that commit.
- The claims that already held on main matched what agents did: they read help first (every run), recovered from one-line errors that name the fix, and never hit an ambiguous `edit`.

Variance is large with two runs per task: treat one or two calls, or under about 30% in tokens, as noise. The success change (5/10 to 10/10) holds across every T3, T4 and T5 run.

## The lesson for the standard

A claim earns its place by predicting an agent failure. The X-ray is cheap and exact about whether a claim holds; only an agent evaluation says whether the claim matters. Ouro AX should grow its claims from evaluation failures, and drop or demote claims that never move an outcome.
