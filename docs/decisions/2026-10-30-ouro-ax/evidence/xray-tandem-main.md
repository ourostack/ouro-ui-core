# AX X-ray: m365tandem

Ouro AX claim set 1.0.0 (sha256 70e37a5e78c80a6b8244257c8db19fc8fa8f65061098df82e24bbb92a3e7c11f), checked by ax-xray 1.0.0 at 2026-10-31T02:37:13.600Z. Target: at 1c72b11d4b3c08d709b0f2b2a7707ecd13e8c560; CLI `m365tandem` (39 commands, 137 calls); HTTP http://127.0.0.1:62523 (132 routes in the manifest, 100 requests).

**Does not conform yet: 4 must claims not holding; no inventory given; 2 must claims skipped.** Claims holding: 21 of 36 (must: 12 of 18). Checks: 363 pass, 117 fail, 11 skipped.

Calls to what other people see: allowed, the target is a proven mock (loopback: yes, isolated home: yes, no credentials: yes, mock identity: yes).

Effects the X-ray caused: POST /api/agent-actions (message.send) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (reaction.add) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (conversation.markRead) (refused): 2 audit records of the refusal, nothing else; POST /api/agent-actions (meeting.respond) (refused): 2 audit records of the refusal, nothing else.

| | Claim | Tier | Rule | Pass | Fail | Skip |
|---|---|---|---|---|---|---|
| ✗ | `cli.unknown-flag` | must | An unknown flag fails before anything runs, and the error names the flag. | 3 | 41 | 0 |
| ✗ | `http.wrong-ref-first` | must | A route given an id that does not exist fails and says where to get a right one. | 2 | 17 | 0 |
| ✗ | `cli.others-preview` | must | Every command other people see has a preview that acts on nothing (`--dry-run`) and names who will see it. | 0 | 8 | 0 |
| ✗ | `cli.wait-on-refs` | must | A wait command accepts the refs the reads list: `watch <ref>` waits on the conversation a list gave. | 0 | 1 | 0 |
| – | `cli.inventory` | must | Every command the CLI registers is listed once in `help --json` and in the inventory the adopter generates from its command registration, and the X-ray covers exactly that set. | 0 | 0 | 1 |
| – | `http.inventory` | must | Every route the agent port registers is in the inventory the adopter generates from its router, once, and the X-ray's routes manifest covers exactly that set. | 0 | 0 | 1 |
| ✗ | `http.error-teaches` | should | Every error names a next action: a route, a field, or a command. | 8 | 27 | 0 |
| ✗ | `cli.flag-suggest` | should | A misspelt flag's error names the closest real flag. | 1 | 17 | 0 |
| ✗ | `cli.read-json` | should | Every read takes `--json` and prints exactly one JSON document (a stream prints JSON lines), exits 0 and writes nothing to stderr. | 24 | 2 | 0 |
| ✗ | `cli.error-teaches` | should | Every error names a next action: a command to run or a flag to add. | 26 | 1 | 0 |
| ✗ | `cli.wait-typed` | should | A wait's `--json` answer is a wait (`wait/1`): what happened, or, when nothing did in time, the cursor and the exact command that resumes. | 0 | 1 | 0 |
| ✗ | `http.index` | should | The API's base path answers an index of its routes. | 0 | 1 | 0 |
| ✗ | `http.unknown-route` | should | An unknown route answers 404 and says where the routes are listed. | 0 | 1 | 0 |
| – | `cli.outcome` | should | An action's `--json` result is an outcome (`outcome/1`) that validates: its state, who can see it, a postcondition, a receipt and the next commands. | 0 | 0 | 8 |
| – | `cli.work-events` | should | The interface records an attributed work event (`work-event/1`) for each action, handoff and wait, and an agent can read them through the interface. | 0 | 0 | 1 |
| ✓ | `cli.help-parses` | must | `<cli> help --json` prints one JSON document that names every command. | 1 | 0 | 0 |
| ✓ | `cli.help-effects` | must | Help says who sees each command: only the person, or other people. | 39 | 0 | 0 |
| ✓ | `cli.exit-codes` | must | Exit codes are documented, and every exit code the CLI gives is one of them. | 1 | 0 | 0 |
| ✓ | `cli.ambiguous-verbs` | must | Ambiguous verbs (edit, delete, remove) don't act; they answer with the specific commands. | 3 | 0 | 0 |
| ✓ | `cli.others-need-why` | must | Every command other people see refuses to run without `--why`, and says so. | 8 | 0 | 0 |
| ✓ | `cli.wrong-ref-first` | must | A wrong reference fails before anything reaches anyone, and the error says where to get a right one. | 8 | 0 | 0 |
| ✓ | `cli.text-as-argument` | must | A command that takes free text accepts it as one argument, not only on stdin, and its help shows that form. | 8 | 0 | 0 |
| ✓ | `cli.reads-stay-reads` | must | Reads change nothing. | 1 | 0 | 0 |
| ✓ | `cli.refusals-change-nothing` | must | A refused call changes nothing, except an audit record that says it was refused. | 9 | 0 | 0 |
| ✓ | `http.others-need-why` | must | Every route that does what other people see refuses a request without a why, and names the field. | 5 | 0 | 0 |
| ✓ | `http.reads-stay-reads` | must | GET requests change nothing. | 1 | 0 | 0 |
| ✓ | `http.refusals-change-nothing` | must | A refused request changes nothing, except an audit record that says it was refused. | 5 | 0 | 0 |
| ✓ | `cli.command-help` | should | Every command answers `<command> --help` with exit 0 on stdout, and nothing on stderr. | 39 | 0 | 0 |
| ✓ | `cli.help-width` | should | No help line is wider than the width limit (100 columns by default). | 40 | 0 | 0 |
| ✓ | `cli.overview-short` | should | The overview (`--help`) fits one screen: at most 60 lines. | 1 | 0 | 0 |
| ✓ | `cli.unknown-command` | should | An unknown command fails with the usage exit code and lists the commands, or names the help that lists them. | 1 | 0 | 0 |
| ✓ | `cli.missing-arg` | should | A command missing a required argument fails with the usage exit code and says what to give. | 4 | 0 | 0 |
| ✓ | `cli.one-line-error` | should | Every error is one line on stderr; stdout stays empty, or with `--json` holds the same error as one JSON document. | 27 | 0 | 0 |
| ✓ | `cli.no-stack-trace` | should | No call prints a stack trace. | 1 | 0 | 0 |
| ✓ | `http.json` | should | Every route answers JSON, with a JSON content type. | 62 | 0 | 0 |
| ✓ | `http.error-shape` | should | Every error is a JSON object with a string `error`. | 35 | 0 | 0 |

## What fails, and the fix

### `cli.unknown-flag`: An unknown flag fails before anything runs, and the error names the flag.

Why: A silently ignored flag gives an agent a wrong answer that looks right: `--limt 2` returns everything.

Fix: Check every flag against the command's declared flags before acting; refuse an unknown one with the usage exit code.

- **today**: `m365tandem today --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **activity**: `m365tandem activity --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **activity --allx**: `m365tandem activity --allx --json` → exit 0; stdout: {: --allx was ignored, so the answer is not what was asked
- **status**: `m365tandem status --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **update**: `m365tandem update --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **conversations**: `m365tandem conversations --ax-xray-no-such-flag --json` → exit 0; stdout: [: the flag was ignored
- **conversations --limt**: `m365tandem conversations --limt 2 --json` → exit 0; stdout: [: --limt was ignored, so the answer is not what was asked
- **emoji**: `m365tandem emoji --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **emoji --limt**: `m365tandem emoji --limt 2 --json` → exit 0; stdout: {: --limt was ignored, so the answer is not what was asked
- **folders**: `m365tandem folders --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **folders --allx**: `m365tandem folders --allx --json` → exit 0; stdout: {: --allx was ignored, so the answer is not what was asked
- **teams**: `m365tandem teams --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **teams --hiddn**: `m365tandem teams --hiddn --json` → exit 0; stdout: {: --hiddn was ignored, so the answer is not what was asked
- **apps**: `m365tandem apps --ax-xray-no-such-flag --json` → exit 0; stdout: [: the flag was ignored
- **apps --lookp**: `m365tandem apps --lookp --json` → exit 0; stdout: [: --lookp was ignored, so the answer is not what was asked
- **focus**: `m365tandem focus --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **attention**: `m365tandem attention --ax-xray-no-such-flag --json` → exit 0; stdout: [: the flag was ignored
- **attention --allx**: `m365tandem attention --allx --json` → exit 0; stdout: [: --allx was ignored, so the answer is not what was asked
- **agenda**: `m365tandem agenda --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **matters**: `m365tandem matters --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **matters --seris**: `m365tandem matters --seris --json` → exit 0; stdout: {: --seris was ignored, so the answer is not what was asked
- **categories**: `m365tandem categories --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **recordings**: `m365tandem recordings --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **recordings --sine**: `m365tandem recordings --sine --json` → exit 0; stdout: {: --sine was ignored, so the answer is not what was asked
- **prep**: `m365tandem prep --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **prep --tex**: `m365tandem prep --tex 2 --json` → exit 1; stderr: m365tandem: no meeting matches "2". Try "m365tandem agenda".
- **draft**: `m365tandem draft show --ax-xray-no-such-flag --json` → exit 1; stderr: m365tandem: the person has no conversation open right now. Name one instead: its [id] from "m365tandem conversations".
- **draft --tex**: `m365tandem draft show --tex 2 --json` → exit 2; stderr: m365tandem: numbers refer to the last list printed; run "m365tandem conversations" first, or use the short id in [brackets].
- **layout**: `m365tandem layout catalog --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **layout --brif**: `m365tandem layout catalog --brif --json` → exit 0; stdout: {: --brif was ignored, so the answer is not what was asked
- **log**: `m365tandem log --ax-xray-no-such-flag --json` → exit 0; stdout: []: the flag was ignored
- **log --limt**: `m365tandem log --limt 2 --json` → exit 0; stdout: []: --limt was ignored, so the answer is not what was asked
- **help**: `m365tandem help --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **look**: `m365tandem look 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **look --limt**: `m365tandem look 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --limt 2 --json` → exit 0; stdout: {: --limt was ignored, so the answer is not what was asked
- **people**: `m365tandem people 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --ax-xray-no-such-flag --json` → exit 1; stderr: m365tandem: tandem knows nobody in "19:00000000bbbb0000bbbb000000000002@thread.tacv2" yet: Teams lists no members for it and no one has written there.
- **search**: `m365tandem search the --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **search --limt**: `m365tandem search the --limt 2 --json` → exit 0; stdout: {: --limt was ignored, so the answer is not what was asked
- **meeting**: `m365tandem meeting "mock-event-allday\|2026-10-30T07:00:00.000Z" --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored
- **meeting --freh**: `m365tandem meeting "mock-event-allday\|2026-10-30T07:00:00.000Z" --freh --json` → exit 0; stdout: {: --freh was ignored, so the answer is not what was asked
- **notes**: `m365tandem notes "mock-event-allday\|2026-10-30T07:00:00.000Z" --ax-xray-no-such-flag --json` → exit 0; stdout: {: the flag was ignored

### `http.wrong-ref-first`: A route given an id that does not exist fails and says where to get a right one.

Why: Checking before acting keeps a stale id from becoming a wrong write.

Fix: On a miss, name the route that lists valid ids.

- **GET /api/conversations/{id}**: `GET /api/conversations/axxraynoref` → 404 {"error":"no such conversation"}
- **GET /api/conversations/{id}/messages**: `GET /api/conversations/axxraynoref/messages` → 404 {"error":"no such conversation"}
- **GET /api/conversations/{id}/artifacts**: `GET /api/conversations/axxraynoref/artifacts` → 404 {"error":"no such conversation"}
- **GET /api/conversations/{id}/transcript**: `GET /api/conversations/axxraynoref/transcript` → 404 {"error":"no such conversation"}
- **GET /api/drafts/{id}**: `GET /api/drafts/axxraynoref` → 200 {"conversationId":"axxraynoref","draft":{"text":"","spans":[],"version":0,"updatedAt":null,"updatedBy":null,"readiness":"drafting","readinessBy":null,"readines…
- **GET /api/agent-actions/{id}**: `GET /api/agent-actions/axxraynoref` → 404 {"error":"no such action"}
- **GET /api/activity/seen/{id}**: `GET /api/activity/seen/axxraynoref` → 404 {"error":"no such request"}
- **GET /api/prep/{id}**: `GET /api/prep/axxraynoref` → 404 {"error":"no such meeting"}
- **GET /api/meetings/{id}**: `GET /api/meetings/axxraynoref` → 404 {"error":"no such meeting"}
- **GET /api/meetings/{id}/recap**: `GET /api/meetings/axxraynoref/recap` → 404 {"error":"no such meeting"}
- **GET /api/meetings/{id}/transcript**: `GET /api/meetings/axxraynoref/transcript` → 404 {"error":"no such meeting"}
- **GET /api/meetings/{id}/notes**: `GET /api/meetings/axxraynoref/notes` → 404 {"error":"no such meeting"}
- **GET /api/calendar/categorize/{id}**: `GET /api/calendar/categorize/axxraynoref` → 404 {"error":"no such request"}
- **POST /api/agent-actions (message.send)**: `POST /api/agent-actions` → 422 {"error":"not a conversation tandem can act in","code":"target"}
- **POST /api/agent-actions (reaction.add)**: `POST /api/agent-actions` → 422 {"error":"not a conversation tandem can act in","code":"target"}
- **POST /api/agent-actions (conversation.markRead)**: `POST /api/agent-actions` → 422 {"error":"not a conversation tandem can act in","code":"target"}
- **POST /api/meetings/{id}/join**: `POST /api/meetings/axxraynoref/join` → 404 {"error":"no such meeting"}

### `cli.others-preview`: Every command other people see has a preview that acts on nothing (`--dry-run`) and names who will see it.

Why: An agent, or a checker, can confirm the audience without acting; a wall it is not, because nothing waits on it.

Fix: Add `--dry-run`: resolve the target, print the preview line ("Would send to X as the person. Everyone in X will see it."), exit 0, and send nothing.

- **send**: `m365tandem send --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **reply**: `m365tandem reply --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **react**: `m365tandem react --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **edit-sent**: `m365tandem edit-sent --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **delete-sent**: `m365tandem delete-sent --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **answer-invite**: `m365tandem answer-invite --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **join**: `m365tandem join --help` offers no --dry-run, so who will see it can only be learnt by doing it
- **mark-read**: `m365tandem mark-read --help` offers no --dry-run, so who will see it can only be learnt by doing it

### `cli.wait-on-refs`: A wait command accepts the refs the reads list: `watch <ref>` waits on the conversation a list gave.

Why: Waiting through the interface beats polling; when the wait refuses the ref the agent holds, agents fall back to blind streams and pollers.

Fix: Let the wait take every ref a read prints, and exit with a documented code when nothing happens in time.

- **watch <conversation>**: `m365tandem watch 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --timeout 1s` → exit 2; stderr: m365tandem: watch takes an object ref such as meeting:<ref>; bare "watch" streams every event

### `http.error-teaches`: Every error names a next action: a route, a field, or a command.

Why: `not found` alone leaves the agent guessing.

Fix: Say where to go: `no such conversation; GET /api/conversations lists them`.

- **GET /api/ax-xray-no-such-route**: "not found" names no route, flag or command
- **GET /api/conversations/{id}**: "no such conversation" names no route, flag or command
- **GET /api/conversations/{id}/messages**: "no such conversation" names no route, flag or command
- **GET /api/conversations/{id}/artifacts**: "no such conversation" names no route, flag or command
- **GET /api/conversations/{id}/transcript**: "no such conversation" names no route, flag or command
- **GET /api/callbacks**: "object is required: refs look like meeting:<6 characters>" names no route, flag or command
- **GET /api/resolve**: "link-form" names no route, flag or command
- **GET /api/agent-actions**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/agent-actions/{id}**: "no such action" names no route, flag or command
- **GET /api/activity/seen/{id}**: "no such request" names no route, flag or command
- **GET /api/activity/seen-work**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/prep/{id}**: "no such meeting" names no route, flag or command
- **GET /api/meetings/{id}**: "no such meeting" names no route, flag or command
- **GET /api/meetings/{id}/recap**: "no such meeting" names no route, flag or command
- **GET /api/meetings/{id}/transcript**: "no such meeting" names no route, flag or command
- **GET /api/meetings/{id}/notes**: "no such meeting" names no route, flag or command
- **GET /api/calendar/categorize**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/calendar/categorize/{id}**: "no such request" names no route, flag or command
- **GET /api/sync/fresh-work**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/sync/recap-work**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/sync/chat-work**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/sync/profile-work**: "only tandem's own page may do this" names no route, flag or command
- **GET /api/sync/org-work**: "only tandem's own page may do this" names no route, flag or command
- **POST /api/agent-actions (message.send) (wrong ref)**: "not a conversation tandem can act in" names no route, flag or command
- **POST /api/agent-actions (reaction.add) (wrong ref)**: "not a conversation tandem can act in" names no route, flag or command
- **POST /api/agent-actions (conversation.markRead) (wrong ref)**: "not a conversation tandem can act in" names no route, flag or command
- **POST /api/meetings/{id}/join (wrong ref)**: "no such meeting" names no route, flag or command

### `cli.flag-suggest`: A misspelt flag's error names the closest real flag.

Why: The error should carry the fix, so the next call is right.

Fix: Suggest the declared flag nearest by edit distance: `unknown flag --limt; did you mean --limit?`.

- **activity --allx**: `m365tandem activity --allx --json` → exit 0; stdout: {; does not name --all
- **conversations --limt**: `m365tandem conversations --limt 2 --json` → exit 0; stdout: [; does not name --limit
- **emoji --limt**: `m365tandem emoji --limt 2 --json` → exit 0; stdout: {; does not name --limit
- **folders --allx**: `m365tandem folders --allx --json` → exit 0; stdout: {; does not name --all
- **teams --hiddn**: `m365tandem teams --hiddn --json` → exit 0; stdout: {; does not name --hidden
- **apps --lookp**: `m365tandem apps --lookp --json` → exit 0; stdout: [; does not name --lookup
- **attention --allx**: `m365tandem attention --allx --json` → exit 0; stdout: [; does not name --all
- **calendar --categry**: `m365tandem calendar --categry 2 --json` → exit 2; stderr: m365tandem: unsupported calendar option "--categry". Use a positional range, for example: m365tandem calendar week.; does not name --category
- **matters --seris**: `m365tandem matters --seris --json` → exit 0; stdout: {; does not name --series
- **recordings --sine**: `m365tandem recordings --sine --json` → exit 0; stdout: {; does not name --since
- **prep --tex**: `m365tandem prep --tex 2 --json` → exit 1; stderr: m365tandem: no meeting matches "2". Try "m365tandem agenda".; does not name --text
- **draft --tex**: `m365tandem draft show --tex 2 --json` → exit 2; stderr: m365tandem: numbers refer to the last list printed; run "m365tandem conversations" first, or use the short id in [brackets].; does not name --text
- **layout --brif**: `m365tandem layout catalog --brif --json` → exit 0; stdout: {; does not name --brief
- **log --limt**: `m365tandem log --limt 2 --json` → exit 0; stdout: []; does not name --limit
- **look --limt**: `m365tandem look 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --limt 2 --json` → exit 0; stdout: {; does not name --limit
- **search --limt**: `m365tandem search the --limt 2 --json` → exit 0; stdout: {; does not name --limit
- **meeting --freh**: `m365tandem meeting "mock-event-allday\|2026-10-30T07:00:00.000Z" --freh --json` → exit 0; stdout: {; does not name --fresh

### `cli.read-json`: Every read takes `--json` and prints exactly one JSON document (a stream prints JSON lines), exits 0 and writes nothing to stderr.

Why: One parseable answer per call is the cheapest thing for an agent to consume.

Fix: Give the read a `--json` that prints the same data the text shows, as one document.

- **draft**: `m365tandem draft show --json` → exit 1; stderr: m365tandem: the person has no conversation open right now. Name one instead: its [id] from "m365tandem conversations".
- **people**: `m365tandem people 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --json` → exit 1; stderr: m365tandem: tandem knows nobody in "19:00000000bbbb0000bbbb000000000002@thread.tacv2" yet: Teams lists no members for it and no one has written there.

### `cli.error-teaches`: Every error names a next action: a command to run or a flag to add.

Why: An agent recovers from the error alone when the error says what to do instead.

Fix: End each error with what to do: `Try "<cli> conversations"`.

- **people --ax-xray-no-such-flag**: `m365tandem people 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --ax-xray-no-such-flag --json` → exit 1; stderr: m365tandem: tandem knows nobody in "19:00000000bbbb0000bbbb000000000002@thread.tacv2" yet: Teams lists no members for it and no one has written there.: names no command or flag to try

### `cli.wait-typed`: A wait's `--json` answer is a wait (`wait/1`): what happened, or, when nothing did in time, the cursor and the exact command that resumes.

Why: A typed wait tells an agent what happened, or exactly how to keep waiting, so it never writes its own polling loop.

Fix: Answer waits with `ax-wait` (`waitFor({ ... })`), which gives the cursor and the resume command.

- **watch <conversation> --json**: `m365tandem watch 19:00000000bbbb0000bbbb000000000002@thread.tacv2 --timeout 1s --json` → exit 2; stderr: m365tandem: watch takes an object ref such as meeting:<ref>; bare "watch" streams every event; not a wait/1

### `http.index`: The API's base path answers an index of its routes.

Why: An agent finds the routes from the API itself, not from source code.

Fix: Serve GET /api with { routes: ["GET /api/x", ...] } from the same table the router uses.

- **GET /api**: `GET /api` → 404 {"error":"not found"}; names 0 of 132 routes

### `http.unknown-route`: An unknown route answers 404 and says where the routes are listed.

Why: A guessed route is the commonest first call.

Fix: Answer 404 with `no route GET /api/x; GET /api lists the routes`.

- **GET /api/ax-xray-no-such-route**: `GET /api/ax-xray-no-such-route` → 404 {"error":"not found"}

## Every surface

| Surface | Holds | Fails | Skipped |
|---|---|---|---|
| cli · help | `cli.help-parses` `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · inventory |  |  | `cli.inventory` |
| cli · today | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · activity | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · status | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · update | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · conversations | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · look | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · emoji | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · people | `cli.help-effects` `cli.command-help` | `cli.read-json` `cli.unknown-flag` |  |
| cli · folders | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · teams | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · apps | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · focus | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · show | `cli.help-effects` `cli.command-help` `cli.missing-arg` |  |  |
| cli · search | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · attention | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · agenda | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · calendar | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.unknown-flag` |  |  |
| cli · matters | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.text-as-argument` | `cli.unknown-flag` |  |
| cli · categories | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · categorize | `cli.help-effects` `cli.command-help` `cli.missing-arg` |  |  |
| cli · meeting | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · transcript | `cli.help-effects` `cli.command-help` `cli.missing-arg` |  |  |
| cli · recordings | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · prep | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.text-as-argument` | `cli.unknown-flag` |  |
| cli · note | `cli.help-effects` `cli.command-help` `cli.missing-arg` `cli.text-as-argument` |  |  |
| cli · notes | `cli.help-effects` `cli.command-help` `cli.read-json` `cli.text-as-argument` | `cli.unknown-flag` |  |
| cli · draft | `cli.help-effects` `cli.command-help` `cli.text-as-argument` | `cli.read-json` `cli.unknown-flag` |  |
| cli · layout | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · send | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · reply | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · react | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · edit-sent | `cli.help-effects` `cli.command-help` `cli.text-as-argument` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · delete-sent | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · answer-invite | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · join | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · mark-read | `cli.help-effects` `cli.command-help` `cli.others-need-why` `cli.wrong-ref-first` `cli.refusals-change-nothing` | `cli.others-preview` | `cli.outcome` |
| cli · watch | `cli.help-effects` `cli.command-help` |  |  |
| cli · log | `cli.help-effects` `cli.command-help` `cli.read-json` | `cli.unknown-flag` |  |
| cli · --help | `cli.help-width` `cli.overview-short` |  |  |
| cli · today --help | `cli.help-width` |  |  |
| cli · activity --help | `cli.help-width` |  |  |
| cli · status --help | `cli.help-width` |  |  |
| cli · update --help | `cli.help-width` |  |  |
| cli · conversations --help | `cli.help-width` |  |  |
| cli · look --help | `cli.help-width` |  |  |
| cli · emoji --help | `cli.help-width` |  |  |
| cli · people --help | `cli.help-width` |  |  |
| cli · folders --help | `cli.help-width` |  |  |
| cli · teams --help | `cli.help-width` |  |  |
| cli · apps --help | `cli.help-width` |  |  |
| cli · focus --help | `cli.help-width` |  |  |
| cli · show --help | `cli.help-width` |  |  |
| cli · search --help | `cli.help-width` |  |  |
| cli · attention --help | `cli.help-width` |  |  |
| cli · agenda --help | `cli.help-width` |  |  |
| cli · calendar --help | `cli.help-width` |  |  |
| cli · matters --help | `cli.help-width` |  |  |
| cli · categories --help | `cli.help-width` |  |  |
| cli · categorize --help | `cli.help-width` |  |  |
| cli · meeting --help | `cli.help-width` |  |  |
| cli · transcript --help | `cli.help-width` |  |  |
| cli · recordings --help | `cli.help-width` |  |  |
| cli · prep --help | `cli.help-width` |  |  |
| cli · note --help | `cli.help-width` |  |  |
| cli · notes --help | `cli.help-width` |  |  |
| cli · draft --help | `cli.help-width` |  |  |
| cli · layout --help | `cli.help-width` |  |  |
| cli · send --help | `cli.help-width` |  |  |
| cli · reply --help | `cli.help-width` |  |  |
| cli · react --help | `cli.help-width` |  |  |
| cli · edit-sent --help | `cli.help-width` |  |  |
| cli · delete-sent --help | `cli.help-width` |  |  |
| cli · answer-invite --help | `cli.help-width` |  |  |
| cli · join --help | `cli.help-width` |  |  |
| cli · mark-read --help | `cli.help-width` |  |  |
| cli · watch --help | `cli.help-width` |  |  |
| cli · log --help | `cli.help-width` |  |  |
| cli · help --help | `cli.help-width` |  |  |
| cli · ax-xray-no-such-command | `cli.unknown-command` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · remove | `cli.ambiguous-verbs` `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · show (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · categorize (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · transcript (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · note (no argument) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · activity --allx |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · conversations --limt |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · emoji --limt |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · folders --allx |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · teams --hiddn |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · apps --lookp |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · attention --allx |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · calendar --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · calendar --categry | `cli.unknown-flag` | `cli.flag-suggest` |  |
| cli · matters --seris |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · recordings --sine |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · prep --tex |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · draft --ax-xray-no-such-flag | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · draft --tex |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · layout --brif |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · log --limt |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · look --limt |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · people --ax-xray-no-such-flag | `cli.one-line-error` | `cli.error-teaches` |  |
| cli · search --limt |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · meeting --freh |  | `cli.unknown-flag` `cli.flag-suggest` |  |
| cli · notes --tex | `cli.unknown-flag` `cli.flag-suggest` |  |  |
| cli · 26 reads, their flag probes and the missing-argument probes | `cli.reads-stay-reads` |  |  |
| cli · watch <conversation> |  | `cli.wait-on-refs` |  |
| cli · watch <conversation> --json |  | `cli.wait-typed` |  |
| cli · send (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · send (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · reply (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · reply (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · react (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · react (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit-sent (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · edit-sent (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete-sent (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · delete-sent (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · answer-invite (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · answer-invite (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · join (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · join (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · mark-read (no --why) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · mark-read (wrong ref) | `cli.one-line-error` `cli.error-teaches` |  |  |
| cli · events |  |  | `cli.work-events` |
| cli · the whole run | `cli.refusals-change-nothing` |  |  |
| cli · all 137 calls | `cli.no-stack-trace` `cli.exit-codes` |  |  |
| http · inventory |  |  | `http.inventory` |
| http · GET /api |  | `http.index` |  |
| http · GET /api/ax-xray-no-such-route | `http.error-shape` | `http.unknown-route` `http.error-teaches` |  |
| http · GET /api/health | `http.json` |  |  |
| http · GET /api/update | `http.json` |  |  |
| http · GET /api/state | `http.json` |  |  |
| http · GET /api/freshness | `http.json` |  |  |
| http · GET /api/conversations | `http.json` |  |  |
| http · GET /api/conversations/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/conversations/{id}/messages | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/conversations/{id}/artifacts | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/conversations/{id}/transcript | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/focus | `http.json` |  |  |
| http · GET /api/drafts | `http.json` |  |  |
| http · GET /api/drafts/{id} | `http.json` | `http.wrong-ref-first` |  |
| http · GET /api/log | `http.json` |  |  |
| http · GET /api/callbacks | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/search | `http.json` |  |  |
| http · GET /api/resolve | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/layout | `http.json` |  |  |
| http · GET /api/layout/catalog | `http.json` |  |  |
| http · GET /api/layout/list | `http.json` |  |  |
| http · GET /api/usage | `http.json` |  |  |
| http · GET /api/layout/v3 | `http.json` |  |  |
| http · GET /api/settings | `http.json` |  |  |
| http · GET /api/actions | `http.json` |  |  |
| http · GET /api/agent-actions | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/agent-actions/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/activity | `http.json` |  |  |
| http · GET /api/activity/seen/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/activity/seen-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/attention | `http.json` |  |  |
| http · GET /api/prep | `http.json` |  |  |
| http · GET /api/prep/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/agenda | `http.json` |  |  |
| http · GET /api/meetings | `http.json` |  |  |
| http · GET /api/meetings/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/meetings/{id}/recap | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/meetings/{id}/transcript | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/meetings/{id}/notes | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/recordings | `http.json` |  |  |
| http · GET /api/recordings/{ref} | `http.json` `http.wrong-ref-first` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/calendar | `http.json` |  |  |
| http · GET /api/matters | `http.json` |  |  |
| http · GET /api/matters/proposals | `http.json` |  |  |
| http · GET /api/categories | `http.json` |  |  |
| http · GET /api/calendar/categorize | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/calendar/categorize/{id} | `http.json` `http.error-shape` | `http.wrong-ref-first` `http.error-teaches` |  |
| http · GET /api/people | `http.json` |  |  |
| http · GET /api/people/presence | `http.json` |  |  |
| http · GET /api/people/avatars | `http.json` |  |  |
| http · GET /api/folders | `http.json` |  |  |
| http · GET /api/teams | `http.json` |  |  |
| http · GET /api/apps | `http.json` |  |  |
| http · GET /api/untitled | `http.json` |  |  |
| http · GET /api/emoji | `http.json` |  |  |
| http · GET /api/emoji/status | `http.json` |  |  |
| http · GET /api/emoji/catalog | `http.json` `http.error-shape` `http.error-teaches` |  |  |
| http · GET /api/sync/fresh-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/sync/recap-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/sync/attendees | `http.json` |  |  |
| http · GET /api/sync/chat-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/sync/profile-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/sync/org-work | `http.json` `http.error-shape` | `http.error-teaches` |  |
| http · GET /api/lifecycle | `http.json` |  |  |
| http · 70 GET requests | `http.reads-stay-reads` |  |  |
| http · POST /api/agent-actions (message.send) | `http.others-need-why` `http.refusals-change-nothing` | `http.wrong-ref-first` |  |
| http · POST /api/agent-actions (message.send) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (message.send) (wrong ref) | `http.error-shape` | `http.error-teaches` |  |
| http · POST /api/agent-actions (reaction.add) | `http.others-need-why` `http.refusals-change-nothing` | `http.wrong-ref-first` |  |
| http · POST /api/agent-actions (reaction.add) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (reaction.add) (wrong ref) | `http.error-shape` | `http.error-teaches` |  |
| http · POST /api/agent-actions (conversation.markRead) | `http.others-need-why` `http.refusals-change-nothing` | `http.wrong-ref-first` |  |
| http · POST /api/agent-actions (conversation.markRead) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (conversation.markRead) (wrong ref) | `http.error-shape` | `http.error-teaches` |  |
| http · POST /api/agent-actions (meeting.respond) | `http.others-need-why` `http.wrong-ref-first` `http.refusals-change-nothing` |  |  |
| http · POST /api/agent-actions (meeting.respond) (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/agent-actions (meeting.respond) (wrong ref) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/meetings/{id}/join | `http.others-need-why` `http.refusals-change-nothing` | `http.wrong-ref-first` |  |
| http · POST /api/meetings/{id}/join (no why) | `http.error-shape` `http.error-teaches` |  |  |
| http · POST /api/meetings/{id}/join (wrong ref) | `http.error-shape` | `http.error-teaches` |  |
