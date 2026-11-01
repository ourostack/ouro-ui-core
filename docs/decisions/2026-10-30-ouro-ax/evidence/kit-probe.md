# Lane A (kit) final report, 2026-10-30 ~17:10 PT

Thesis: Ouro AX is a copy-in kit like HX. One TypeScript command definition gives parser, help and `help --json`, `--json` output, exit codes, effect class with `--why`, and the same command as an MCP tool; every refusal is one line ending `Fix: <exact command>`.

Built: ouro-ui branch ax-probe/kit, `registry/ouro/ax/` items ax-errors, ax-exit-codes, ax-effects, ax-command, ax-help, ax-output, ax-cli, ax-mcp, ax-lint, umbrella ouro-ax, plus test items and example; zero deps, 36 tests; scripts/registry.mts generates them. Tandem draft PR #431: ouro-add.ts copies kit into src/cli/ax/; 18 of 54 commands declared (others pass through, counted by ax-lint); help overview generated and byte-identical; help --json gains input schemas; `m365tandem mcp`; test/ax-kit.test.ts; `look --since-id` now refused with a fix. CI green.

Measurement (success · calls · wrong turns · tokens), main is pre-#440:

| Task | main | Kit CLI | Kit MCP |
|---|---|---|---|
| T1 triage | 2/2 · 5 · 0 · 97k | 2/2 · 6 · 0 · 124k | 2/4 · 6 · 0.75 · 183k |
| T2 draft | 2/2 · 7 · 1 · 125k | 2/2 · 7 · 1 · 138k | 2/2 · 3 · 0 · 103k |
| T3 send | 0/2 · 4 · 1 · 116k | 1/2 · 4 · 0 · 93k | 4/4 · 2.3 · 0 · 86k |
| T4 edit | 0/2 · 6 · 2.5 · 179k | 2/2 · 6 · 0 · 126k | 2/2 · 4 · 0 · 138k |
| T5 wait | 1/2 · 8 · 1.5 · 254k | 1/2 · 7 · 1 · 261k | 0/2 · 4.5 · 3 · 143k |

Findings: usage generated from the definition fixed sends (help had shown stdin; quoted text first fixed it). Agents invented `--intent` tokens because help showed the flag; now refused with the send to run. MCP wins on others-see actions (2-4 calls, no wrong turns, no allow-list); loses on triage (wording/token cost of JSON reads) and waiting (watch only takes meetings). Measuring found two MCP bugs (intent callback never called; reads without message ids), fixed.

Strength: CLI and MCP can't drift; adoptable one command at a time with ax-lint coverage. Weakness: owns only the surface, not outcomes or waits; refusals from existing code still CLI-shaped with no Fix: over MCP; can't fix missing capability (T5).

Work measurement: fits bottom-up (stable command name, effect, --why, named exit code let the factory label wrong turns by error code); joining to plan needs a work-event shape (Lane D).

Left: two worktrees; `.ax-tsc` (33 MB) in tandem worktree, `.ax-deps` (24 MB) in ouro-ui worktree; ax-probe-kit-eval/mcp.json. Eval run folders deleted.
