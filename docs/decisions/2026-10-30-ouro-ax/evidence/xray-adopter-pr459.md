# AX X-ray: app

Ouro AX claim set 1.0.0 (sha256 70e37a5e78c80a6b8244257c8db19fc8fa8f65061098df82e24bbb92a3e7c11f), checked by ax-xray 1.0.0 at 2026-10-31T04:39:53.555Z. Target: at 2356170dfe3ef544d14025a1c1ac31b70d5547f2; CLI `app` (92 commands, 226 calls); HTTP http://127.0.0.1:35397 (139 routes in the manifest, 104 requests).

**Conforms: every applicable must claim holds, and the inventory covers every surface checked.** Claims holding: 33 of 36 (must: 18 of 18). Checks: 768 pass, 3 fail, 3 skipped.

Calls to what other people see: allowed, the target is a proven mock (loopback: yes, isolated home: yes, no credentials: yes, mock identity: yes).

Effects the X-ray caused: POST /api/agent-actions (message.send) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (message.reply) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (reaction.add) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (reaction.remove) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (message.edit) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (message.delete) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (meeting.respond) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (conversation.markRead) (refused): 2 audit records of the refusal, nothing else.

| | Claim | Tier | Rule | Pass | Fail | Skip |
|---|---|---|---|---|---|---|
| ✗ | `cli.read-json` | should | Every read takes `--json` and prints exactly one JSON document (a stream prints JSON lines), exits 0 and writes nothing to stderr. | 29 | 2 | 2 |
| ✗ | `http.error-teaches` | should | Every error names a next action: a route, a field, or a command. | 43 | 1 | 0 |
| – | `cli.work-events` | should | The interface records an attributed work event (`work-event/1`) for each action, handoff and wait, and an agent can read them through the interface. | 0 | 0 | 1 |
| ✓ | `cli.help-parses` | must | `<cli> help --json` prints one JSON document that names every command. | 1 | 0 | 0 |
| ✓ | `cli.help-effects` | must | Help says who sees each command: only the person, or other people. | 92 | 0 | 0 |
| ✓ | `cli.inventory` | must | Every command the CLI registers is listed once in `help --json` and in the inventory the adopter generates from its command registration, and the X-ray covers exactly that set. | 1 | 0 | 0 |
| ✓ | `cli.exit-codes` | must | Exit codes are documented, and every exit code the CLI gives is one of them. | 1 | 0 | 0 |
| ✓ | `cli.unknown-flag` | must | An unknown flag fails before anything runs, and the error names the flag. | 45 | 0 | 0 |
| ✓ | `cli.ambiguous-verbs` | must | Ambiguous verbs (edit, delete, remove) don't act; they answer with the specific commands. | 3 | 0 | 0 |
| ✓ | `cli.others-need-why` | must | Every command other people see refuses to run without `--why`, and says so. | 12 | 0 | 0 |
| ✓ | `cli.wrong-ref-first` | must | A wrong reference fails before anything reaches anyone, and the error says where to get a right one. | 12 | 0 | 0 |
| ✓ | `cli.others-preview` | must | Every command other people see has a preview that acts on nothing (`--dry-run`) and names who will see it. | 12 | 0 | 0 |
| ✓ | `cli.text-as-argument` | must | A command that takes free text accepts it as one argument, not only on stdin, and its help shows that form. | 11 | 0 | 0 |
| ✓ | `cli.wait-on-refs` | must | A wait command accepts the refs the reads list: `watch <ref>` waits on the conversation a list gave. | 1 | 0 | 0 |
| ✓ | `cli.reads-stay-reads` | must | Reads change nothing. | 1 | 0 | 0 |
| ✓ | `cli.refusals-change-nothing` | must | A refused call changes nothing, except an audit record that says it was refused. | 13 | 0 | 0 |
| ✓ | `http.inventory` | must | Every route the agent port registers is in the inventory the adopter generates from its router, once, and the X-ray's routes manifest covers exactly that set. | 1 | 0 | 0 |
| ✓ | `http.wrong-ref-first` | must | A route given an id that does not exist fails and says where to get a right one. | 23 | 0 | 0 |
| ✓ | `http.others-need-why` | must | Every route that does what other people see refuses a request without a why, and names the field. | 9 | 0 | 0 |
| ✓ | `http.reads-stay-reads` | must | GET requests change nothing. | 1 | 0 | 0 |
| ✓ | `http.refusals-change-nothing` | must | A refused request changes nothing, except an audit record that says it was refused. | 9 | 0 | 0 |
| ✓ | `cli.command-help` | should | Every command answers `<command> --help` with exit 0 on stdout, and nothing on stderr. | 92 | 0 | 0 |
| ✓ | `cli.help-width` | should | No help line is wider than the width limit (100 columns by default). | 93 | 0 | 0 |
| ✓ | `cli.overview-short` | should | The overview (`--help`) fits one screen: at most 60 lines. | 1 | 0 | 0 |
| ✓ | `cli.unknown-command` | should | An unknown command fails with the usage exit code and lists the commands, or names the help that lists them. | 1 | 0 | 0 |
| ✓ | `cli.flag-suggest` | should | A misspelt flag's error names the closest real flag. | 14 | 0 | 0 |
| ✓ | `cli.missing-arg` | should | A command missing a required argument fails with the usage exit code and says what to give. | 2 | 0 | 0 |
| ✓ | `cli.one-line-error` | should | Every error is one line on stderr; stdout stays empty, or with `--json` holds the same error as one JSON document. | 61 | 0 | 0 |
| ✓ | `cli.error-teaches` | should | Every error names a next action: a command to run or a flag to add. | 61 | 0 | 0 |
| ✓ | `cli.no-stack-trace` | should | No call prints a stack trace. | 1 | 0 | 0 |
| ✓ | `cli.outcome` | should | An action's `--json` result is an outcome (`outcome/1`) that validates: its state, who can see it, a postcondition, a receipt and the next commands. | 12 | 0 | 0 |
| ✓ | `cli.wait-typed` | should | A wait's `--json` answer is a wait (`wait/1`): what happened, or, when nothing did in time, the cursor and the exact command that resumes. | 1 | 0 | 0 |
| ✓ | `http.json` | should | Every route answers JSON, with a JSON content type. | 63 | 0 | 0 |
| ✓ | `http.error-shape` | should | Every error is a JSON object with a string `error`. | 44 | 0 | 0 |
| ✓ | `http.index` | should | The API's base path answers an index of its routes. | 1 | 0 | 0 |
| ✓ | `http.unknown-route` | should | An unknown route answers 404 and says where the routes are listed. | 1 | 0 | 0 |

## What fails, and the fix

### `cli.read-json`: Every read takes `--json` and prints exactly one JSON document (a stream prints JSON lines), exits 0 and writes nothing to stderr.

Why: One parseable answer per call is the cheapest thing for an agent to consume.

Fix: Give the read a `--json` that prints the same data the text shows, as one document.

- **draft show**: `app draft show --json` → exit 1; stderr: app: the person has no conversation open right now. Name one instead: its [id] from "app conversations".
- **people**: `app people c:00000000bbbb0000bbbb000000000002 --json` → exit 1; stderr: app: the app knows nobody in "c:00000000bbbb0000bbbb000000000002" yet: the chat service lists no members for it and no one has written there.

### `http.error-teaches`: Every error names a next action: a route, a field, or a command.

Why: `not found` alone leaves the agent guessing.

Fix: Say where to go: `no such conversation; GET /api/conversations lists them`.

- **GET /api/resolve**: "link-form" names no route, flag or command

## Every surface

| Surface | Holds | Fails | Skipped |
|---|---|---|---|
| cli · help | `cli.help-parses` |  |  |
| cli · inventory | `cli.inventory` |  |  |
| cli · today | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · status | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · update | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · conversations | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · look | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · emoji | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · people | `cli.help-effects` `cli.command-help` `cli.unknown-flag` | `cli.read-json` |  |
| cli · folders | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · groups | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · apps | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · focus | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · search | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · agenda | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · calendar | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · categories | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · meeting | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · transcript | `cli.help-effects` `cli.command-help` `cli.missing-arg` |  |  |
| cli · recordings | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · activity | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · activity seen | `cli.help-effects` `cli.command-help` |  |  |
| cli · log | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · draft show | `cli.help-effects` `cli.command-help` `cli.unknown-flag` | `cli.read-json` |  |
| cli · draft status | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · draft set | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · draft append | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · draft ready | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · draft needs-collab | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · draft discard | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft send | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft post | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft submit | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft approve | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft accept | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft reject | `cli.help-effects` `cli.command-help` |  |  |
| cli · draft review | `cli.help-effects` `cli.command-help` |  |  |
| cli · show | `cli.help-effects` `cli.command-help` |  |  |
| cli · open | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · attention add | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention done | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention dismiss | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention snooze | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention reopen | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention pin | `cli.help-effects` `cli.command-help` |  |  |
| cli · attention unpin | `cli.help-effects` `cli.command-help` |  |  |
| cli · prep | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · prep note | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · prep pin | `cli.help-effects` `cli.command-help` |  |  |
| cli · prep unpin | `cli.help-effects` `cli.command-help` |  |  |
| cli · prep edit | `cli.help-effects` `cli.command-help` |  |  |
| cli · prep dismiss | `cli.help-effects` `cli.command-help` |  |  |
| cli · prep approve | `cli.help-effects` `cli.command-help` |  |  |
| cli · note | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · notes | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · layout | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout catalog | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout set | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout apply | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout accept | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout approve | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout save | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout forget | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout dismiss | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout profile | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout list | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout check | `cli.help-effects` `cli.command-help` |  | `cli.read-json` |
| cli · layout propose | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout derive | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout explain | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · layout diff | `cli.help-effects` `cli.command-help` `cli.missing-arg` |  |  |
| cli · layout use | `cli.help-effects` `cli.command-help` |  |  |
| cli · layout undo | `cli.help-effects` `cli.command-help` |  |  |
| cli · matters | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · matters explain | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · matters propose | `cli.help-effects` `cli.command-help` |  |  |
| cli · matters set | `cli.help-effects` `cli.command-help` `cli.text-as-argument` |  |  |
| cli · matters clear | `cli.help-effects` `cli.command-help` |  |  |
| cli · categorize | `cli.help-effects` `cli.command-help` |  |  |
| cli · watch | `cli.help-effects` `cli.command-help` |  |  |
| cli · outcome | `cli.help-effects` `cli.command-help` |  | `cli.read-json` |
| cli · send | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · reply | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · react | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · unreact | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · edit-sent | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · delete-sent | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · mark-read | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · answer-invite | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · accept | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · tentative | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · decline | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · join | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` `cli.others-preview` `cli.outcome` |  |  |
| cli · --help | `cli.help-width` `cli.overview-short` |  |  |
| cli · today --help | `cli.help-width` |  |  |
| cli · status --help | `cli.help-width` |  |  |
| cli · update --help | `cli.help-width` |  |  |
| cli · conversations --help | `cli.help-width` |  |  |
| cli · look --help | `cli.help-width` |  |  |
| cli · emoji --help | `cli.help-width` |  |  |
| cli · people --help | `cli.help-width` |  |  |
| cli · folders --help | `cli.help-width` |  |  |
| cli · groups --help | `cli.help-width` |  |  |
| cli · apps --help | `cli.help-width` |  |  |
| cli · focus --help | `cli.help-width` |  |  |
| cli · search --help | `cli.help-width` |  |  |
| cli · agenda --help | `cli.help-width` |  |  |
| cli · calendar --help | `cli.help-width` |  |  |
| cli · categories --help | `cli.help-width` |  |  |
| cli · meeting --help | `cli.help-width` |  |  |
| cli · transcript --help | `cli.help-width` |  |  |
| cli · recordings --help | `cli.help-width` |  |  |
| cli · activity --help | `cli.help-width` |  |  |
| cli · activity seen --help | `cli.help-width` |  |  |
| cli · log --help | `cli.help-width` |  |  |
| cli · draft show --help | `cli.help-width` |  |  |
| cli · draft status --help | `cli.help-width` |  |  |
| cli · draft set --help | `cli.help-width` |  |  |
| cli · draft append --help | `cli.help-width` |  |  |
| cli · draft ready --help | `cli.help-width` |  |  |
| cli · draft needs-collab --help | `cli.help-width` |  |  |
| cli · draft discard --help | `cli.help-width` |  |  |
| cli · draft send --help | `cli.help-width` |  |  |
| cli · draft post --help | `cli.help-width` |  |  |
| cli · draft submit --help | `cli.help-width` |  |  |
| cli · draft approve --help | `cli.help-width` |  |  |
| cli · draft accept --help | `cli.help-width` |  |  |
| cli · draft reject --help | `cli.help-width` |  |  |
| cli · draft review --help | `cli.help-width` |  |  |
| cli · show --help | `cli.help-width` |  |  |
| cli · open --help | `cli.help-width` |  |  |
| cli · attention --help | `cli.help-width` |  |  |
| cli · attention add --help | `cli.help-width` |  |  |
| cli · attention done --help | `cli.help-width` |  |  |
| cli · attention dismiss --help | `cli.help-width` |  |  |
| cli · attention snooze --help | `cli.help-width` |  |  |
| cli · attention reopen --help | `cli.help-width` |  |  |
| cli · attention pin --help | `cli.help-width` |  |  |
| cli · attention unpin --help | `cli.help-width` |  |  |
| cli · prep --help | `cli.help-width` |  |  |
| cli · prep note --help | `cli.help-width` |  |  |
| cli · prep pin --help | `cli.help-width` |  |  |
| cli · prep unpin --help | `cli.help-width` |  |  |
| cli · prep edit --help | `cli.help-width` |  |  |
| cli · prep dismiss --help | `cli.help-width` |  |  |
| cli · prep approve --help | `cli.help-width` |  |  |
| cli · note --help | `cli.help-width` |  |  |
| cli · notes --help | `cli.help-width` |  |  |
| cli · layout --help | `cli.help-width` |  |  |
| cli · layout catalog --help | `cli.help-width` |  |  |
| cli · layout set --help | `cli.help-width` |  |  |
| cli · layout apply --help | `cli.help-width` |  |  |
| cli · layout accept --help | `cli.help-width` |  |  |
| cli · layout approve --help | `cli.help-width` |  |  |
| cli · layout save --help | `cli.help-width` |  |  |
| cli · layout forget --help | `cli.help-width` |  |  |
| cli · layout dismiss --help | `cli.help-width` |  |  |
| cli · layout profile --help | `cli.help-width` |  |  |
| cli · layout list --help | `cli.help-width` |  |  |
| cli · layout check --help | `cli.help-width` |  |  |
| cli · layout propose --help | `cli.help-width` |  |  |
| cli · layout derive --help | `cli.help-width` |  |  |
| cli · layout explain --help | `cli.help-width` |  |  |
| cli · layout diff --help | `cli.help-width` |  |  |
| cli · layout use --help | `cli.help-width` |  |  |
| cli · layout undo --help | `cli.help-width` |  |  |
| cli · matters --help | `cli.help-width` |  |  |
| cli · matters explain --help | `cli.help-width` |  |  |
| cli · matters propose --help | `cli.help-width` |  |  |
| cli · matters set --help | `cli.help-width` |  |  |
| cli · matters clear --help | `cli.help-width` |  |  |
| cli · categorize --help | `cli.help-width` |  |  |
| cli · watch --help | `cli.help-width` |  |  |
| cli · outcome --help | `cli.help-width` |  |  |
| cli · send --help | `cli.help-width` |  |  |
| cli · reply --help | `cli.help-width` |  |  |
| cli · react --help | `cli.help-width` |  |  |
| cli · unreact --help | `cli.help-width` |  |  |
| cli · edit-sent --help | `cli.help-width` |  |  |
| cli · delete-sent --help | `cli.help-width` |  |  |
| cli · mark-read --help | `cli.help-width` |  |  |
| cli · answer-invite --help | `cli.help-width` |  |  |
| cli · accept --help | `cli.help-width` |  |  |
| cli · tentative --help | `cli.help-width` |  |  |
| cli · decline --help | `cli.help-width` |  |  |
| cli · join --help | `cli.help-width` |  |  |
| cli · ax-xray-no-such-command | `cli.unknown-command` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · remove | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · transcript (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout diff (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · today --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · status --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · update --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · conversations --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · conversations --limt | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · emoji --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · emoji --limt | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · folders --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · folders --allx | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · groups --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · groups --hiddn | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · apps --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · apps --lookp | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · focus --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · agenda --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · calendar --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · calendar --categry | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · categories --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · recordings --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · recordings --sine | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · activity --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · activity --allx | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · log --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · log --limt | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · draft show --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · draft status --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · attention --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · attention --allx | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · prep --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout catalog --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout catalog --brif | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · layout profile --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout list --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout derive --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · layout explain --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · matters --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · look --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · look --limt | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · people --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · search --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · search --limt | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · meeting --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · meeting --freh | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · matters explain --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · 31 reads, their flag probes and the missing-argument probes | `cli.reads-stay-reads` |  |  |
| cli · watch <conversation> | `cli.wait-on-refs` |  |  |
| cli · watch <conversation> --json | `cli.wait-typed` |  |  |
| cli · send (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · send (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · reply (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · reply (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · react (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · react (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · unreact (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · unreact (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit-sent (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit-sent (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete-sent (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete-sent (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · mark-read (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · mark-read (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · answer-invite (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · answer-invite (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · accept (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · accept (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · tentative (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · tentative (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · decline (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · decline (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · join (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · join (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · events |  |  | `cli.work-events` |
| cli · the whole run | `cli.refusals-change-nothing` |  |  |
| cli · all 226 calls | `cli.no-stack-trace` `cli.exit-codes` |  |  |
| http · inventory | `http.inventory` |  |  |
| http · GET /api | `http.index` `http.json` |  |  |
| http · GET /api/ax-xray-no-such-route | `http.unknown-route` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/health | `http.json` |  |  |
| http · GET /api/update | `http.json` |  |  |
| http · GET /api/state | `http.json` |  |  |
| http · GET /api/freshness | `http.json` |  |  |
| http · GET /api/wait | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/conversations | `http.json` |  |  |
| http · GET /api/conversations/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/conversations/{id}/messages | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/conversations/{id}/artifacts | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/conversations/{id}/transcript | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/focus | `http.json` |  |  |
| http · GET /api/drafts | `http.json` |  |  |
| http · GET /api/drafts/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/log | `http.json` |  |  |
| http · GET /api/search | `http.json` |  |  |
| http · GET /api/resolve | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/layout | `http.json` |  |  |
| http · GET /api/layout/catalog | `http.json` |  |  |
| http · GET /api/layout/list | `http.json` |  |  |
| http · GET /api/usage | `http.json` |  |  |
| http · GET /api/layout/v3 | `http.json` |  |  |
| http · GET /api/settings | `http.json` |  |  |
| http · GET /api/actions | `http.json` |  |  |
| http · GET /api/agent-actions | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/agent-actions/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/activity | `http.json` |  |  |
| http · GET /api/activity/seen/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/activity/seen-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/attention | `http.json` |  |  |
| http · GET /api/prep | `http.json` |  |  |
| http · GET /api/prep/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/agenda | `http.json` |  |  |
| http · GET /api/meetings | `http.json` |  |  |
| http · GET /api/meetings/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/meetings/{id}/recap | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/meetings/{id}/transcript | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/meetings/{id}/notes | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/recordings | `http.json` |  |  |
| http · GET /api/recordings/{ref} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/calendar | `http.json` |  |  |
| http · GET /api/matters | `http.json` |  |  |
| http · GET /api/matters/proposals | `http.json` |  |  |
| http · GET /api/categories | `http.json` |  |  |
| http · GET /api/calendar/categorize | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/calendar/categorize/{id} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/people | `http.json` |  |  |
| http · GET /api/people/presence | `http.json` |  |  |
| http · GET /api/people/avatars | `http.json` |  |  |
| http · GET /api/folders | `http.json` |  |  |
| http · GET /api/groups | `http.json` |  |  |
| http · GET /api/apps | `http.json` |  |  |
| http · GET /api/untitled | `http.json` |  |  |
| http · GET /api/emoji | `http.json` |  |  |
| http · GET /api/emoji/status | `http.json` |  |  |
| http · GET /api/emoji/catalog | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/fresh-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/recap-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/attendees | `http.json` |  |  |
| http · GET /api/sync/chat-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/profile-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/org-work | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/lifecycle | `http.json` |  |  |
| http · 68 GET requests | `http.reads-stay-reads` |  |  |
| http · POST /api/agent-actions (message.send) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (message.send) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.send) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.reply) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (message.reply) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.reply) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (reaction.add) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (reaction.add) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (reaction.add) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (reaction.remove) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (reaction.remove) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (reaction.remove) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.edit) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (message.edit) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.edit) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.delete) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (message.delete) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.delete) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (meeting.respond) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (meeting.respond) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (meeting.respond) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (conversation.markRead) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (conversation.markRead) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (conversation.markRead) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/meetings/{id}/join | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/meetings/{id}/join (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/meetings/{id}/join (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
