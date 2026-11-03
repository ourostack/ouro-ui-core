# Decision: a CLI kit in Ouro AX, and platform targets for Ouro HX

A command line has an agent and a person reading it at once. An agent parses it: `--json`, exit codes, a short error. A person reads it: what is happening while it runs, whether it worked and what to do next. Ouro AX's kit already serves the agent, and a person who runs the first adopter's self-check today reads a wall of lines to find out whether it worked.[^before] This record says where reusable terminal output lives, what a world-class CLI means as checkable rules, and how Ouro HX names its platforms now that a second is coming.

## The decision

1. **Put reusable CLI tools in Ouro AX,** in `registry/ouro/ax/`, as items like the rest of the kit.[^axdir] Start with `ax-terminal` (colour, status symbols, progress, the verdict line and next steps, with a plain fallback) and `ax-checks` (a tool declares its checks once, and gets a progress display while they run, results grouped under a verdict, `--json`, timing and exit codes from that definition).
2. **Give Ouro HX platform targets.** Ouro HX for web is what ships today. Ouro HX for Apple, native apps on Apple's platforms, comes next. A component keeps its name across targets.
3. **Hold "world-class CLI" to the rules below,** checked by the kit's tests and, where it can see them from outside, by the X-ray.

## Where CLI tools live, and why not Ouro HX

Ouro HX is for people, and Ouro AX is for agents.[^halves] A terminal is read by a person too, so it could seem to belong to Ouro HX. It belongs to Ouro AX:

- **One definition drives both readers.** A command's result already renders as `--json` or as the text its `text()` makes of it.[^twins] The person's view of a CLI is the text twin of the agent's JSON, not a separate interface. Splitting them across the halves would split a command's definition between the kits, the drift Ouro AX exists to prevent.
- **Ouro AX already owns what a person reads in a terminal.** The voice, a line of character for a person at a terminal, lives in `ax-voice`, and the kit prints it only to a terminal.[^voice] Colour, progress and the verdict line follow the voice: for the person, out of the agent's way.
- **The constraints match.** Ouro HX for web is React components compiled by an app's Tailwind CSS and tested in browsers; Ouro AX is Node TypeScript without dependencies.[^nodeps] A terminal kit needs neither React nor a browser.

Rules for the kit, for how the readers relate:

- Make the person's text and the agent's `--json` from the same result. Put what the text says (the verdict, the counts, a failure and its fix, the time taken) in the JSON too, so an agent can skip the text.
- Keep decoration where an agent doesn't parse: colour and symbols on a terminal, progress on stderr on a terminal, the voice after the facts. Print plain text to a pipe, under `NO_COLOR` and with `--json`.
- Repeat in the result what progress showed, so a fact that scrolled past is still there.

A full-screen terminal app for people, one without an agent twin, would be an Ouro HX target. A CLI's output is not.

## Ouro HX's platform targets

- **Names.** The family is Ouro HX. A target is "Ouro HX for web" or "Ouro HX for Apple"; in code, paths and tags, `web` and `apple`. Say "for web" where the platform matters (installing, a component's code, its tests) and plain "Ouro HX" where it doesn't (the design, the claims a component meets).
- **Registry naming.** Keep Ouro HX for web's item names, `@ouro` namespace and install addresses, as the README gives them, and its source in `registry/ouro/components/`.[^addresses] Ship Ouro HX for Apple as a Swift package instead, since the shadcn registry copies source into a web app. Name its library `OuroHX` and give its components the web components' names (`Button`, `Dialog`), so a component is one thing with one page on both targets.
- **What a target shares.** State a component's behaviour (touch targets, reduced motion, keyboard and screen-reader names) once, as claims, and have a target prove them in its own tests. Keep design tokens in one source and generate each target's from it.
- **Where the Apple source lives.** Decide it when the first Apple component is built, and expect a repository of its own: a Swift package is a whole Git repository with its manifest at the root, and this repository's history is large for a package manager to clone.[^gitsize] Name, in the Apple repository's README, the Ouro UI release whose claims it meets.
- **Docs and the site.** Keep a component's address, such as `https://ui.ouro.bot/docs/dialog/`. Once Ouro HX for Apple ships, show a Web and an Apple tab on the page, web first, and list both install lines in `llms.txt`. Until then, label the install sections "Ouro HX for web" and change nothing else.

This record decides names and structure; it builds nothing for Apple.

## What world-class means, as rules

Hold a CLI built with the kit to these rules. The kit's tests check them, and the X-ray checks the ones it can see from outside, on a tool built with the kit or not.

| Rule | How it is checked |
| --- | --- |
| **Show progress for anything slow.** Show a spinner with the check's name, its place in the list and the time so far, on stderr on a terminal. Off a terminal, print a single plain line for a check still running after a couple of seconds, and redraw nothing. Show no progress for a fast run. | Test it in the kit with a held clock. Check with the X-ray that piped output redraws nothing. |
| **Put the verdict first.** Say on the first line whether it worked, with the counts. Then the results, grouped: what failed, then what was not run and why. | Test it in the kit. Check with the X-ray that a check command's first line of text is the verdict in its `--json`. |
| **Use colour and symbols, with a fallback.** Use colour only on a terminal; let `NO_COLOR` turn it off and `FORCE_COLOR` turn it on for captures. Off a terminal, turn the symbols into words (`ok`, `FAIL`, `warn`, `skip`). | Test it in the kit. Check with the X-ray that piped output, and output under `NO_COLOR` with colour forced, is free of ANSI escape codes. |
| **Put the same facts in `--json`.** Include the verdict, the counts, each check's state, detail, fix and duration, and the next steps. | Test it in the kit. Check with the X-ray that a check command's JSON has the verdict, counts and exit code its text has. |
| **Give a next step for a problem.** Name the exact command that fixes a failure, or, where a command can't, the thing to do by hand. Don't offer "run this again" as the fix for the command just run. | Make the kit fail a tool's own tests when a failure has no fix. |
| **Stay quiet on success.** Print the verdict and what the person must still act on; print the passing checks with `--verbose`. | Test it in the kit. |
| **Exit with the tool's codes.** Return exit code 0 when nothing failed, warnings included, and with the tool's failure code from its exit-code table when something did. | Test it in the kit, and check it with the X-ray's `cli.exit-codes`. |
| **Show timing.** Put the run's time in the verdict, a slow check's time beside it, and the durations in the JSON. | Test it in the kit. |

## The reference: an archiver's `doctor`

The reference doctor is the `doctor` of an open-source archiver CLI from the same organization, read from its source and run on a scratch folder, away from the person's data.[^doctor] The kit takes what it does well:

- A status symbol, a name and a detail per check, in colour only on a terminal, with `NO_COLOR` and `--no-color` winning and a variable that forces colour for screenshots.[^doctor-well]
- A fix under a warning or failure.[^doctor-well]
- A check that can't run because an earlier one failed says which to fix first.[^doctor-well]
- The same facts as JSON, text by default only on a terminal, and a failing doctor exits with its own code.[^doctor-well]
- Probes that say what they did not do ("doctor does not start it").[^doctor-well]

What it lacks, which the kit adds:

- The verdict comes last, on stderr, after thirteen rows; the kit puts it first.[^doctor-lacks]
- The checks are a flat list of snake_case identifiers; the kit groups them, with names a person reads.[^doctor-lacks]
- Passing rows print on every run; the kit is quiet on success.[^doctor-lacks]
- Without progress or timing, a slow check would look like a hang; the kit has both.[^doctor-lacks]
- Its final fix, run the same doctor again, sends the person in a circle; the kit's fixes are commands that change something.[^doctor-lacks]
- Its JSON has a verdict but no counts; the kit's has the verdict, the counts and the durations.[^doctor-lacks]

## The first user: the first adopter's `selfcheck`

The first adopter's `selfcheck` tries the writes its app sends, live, in a place only the person sees, and reports on them.[^before] Convert it to `ax-checks` once the kit ships in a release. Today, on made-up data, it prints this when the writes pass (the command is `app`, as in the record of 2026-10-30; long lines are cut here with `…`):[^before]

```text
$ app selfcheck
App self-check: 11 writes to the service. Its test messages go to your Notes to self, where only you see them.
Each goes the way your agent's do, logged as agent:self-check with the reason "self-check". The test messages are deleted at the end.

  passed   Send a plain message
  passed   Send a formatted message (bold, italic, a list)
  … 10 more passed lines …
  skipped  React with one of your organization's custom emoji, then take it off: your organization has no custom emoji in the app's catalog (or the window has not loaded them yet), so there is none to react with
  skipped  Reply in a channel thread, then delete the reply: everyone in the channel sees a reply, so it runs only in a thread you name. On your own thread in channel [u2ynm2] (you started it Sat, Oct 31 4:01 PM PDT): app selfcheck --reply-in u2ynm2#1793000000000 --yes
  … 5 more skipped paragraphs …
To run the checks above on what the self-check found, in one go: app selfcheck --reply-in u2ynm2#1793000000000 --activity z4vug0 --rsvp cgl8c3 --answer accept --categorize 5le59j --yes

12 passed, 0 failed, 7 skipped.
Cleaned up: the test messages are deleted.
Every write that ran works. Nothing to send back.
```

The verdict is on the last line, nothing moves while a write waits for the service, and there is no colour.[^before] With the kit, the same run would print this on a terminal (a sketch; the adoption replaces it with a capture):

```text
$ app selfcheck
✓ Everything works: 11 writes and 1 read passed in 1.4s. The test messages are deleted.
  7 not run: 5 need something you name (4 found), 1 needs what the app doesn't hold, 1 is by hand.

Next
  Run the 4 the self-check found (others see 2 of them):
  $ app selfcheck --reply-in u2ynm2#1793000000000 --activity z4vug0 --rsvp cgl8c3 --answer accept --categorize 5le59j --yes
  See every check: app selfcheck --verbose
```

On a run slow enough to need it, such as against the real service, one line on stderr, redrawn in place and gone when it ends:

```text
⠹ Send a picture  4 of 12 · 3.1s
```

When a write fails:

```text
$ app selfcheck
✗ 1 of 12 checks failed: React with a like. 11 passed in 1.2s. The test messages are deleted.

Failed
  ✗ React with a like
    The service refused the reaction (HTTP 400). Nobody saw anything. Request id: a6ca84af9b234.

Not run  7: 5 need something you name (4 found), 1 needs what the app doesn't hold, 1 is by hand

Next
  Paste this to your agent (no message text, no sign-in tokens):
    App self-check, 2026-11-02 23:01 UTC (from a checkout, macOS): 11 passed, 1 failed, 7 not run.
    - react (reaction.add) failed: the service refused the reaction (HTTP 400). Request id: a6ca84af9b234.
```

When it can't start, the readiness checks say why, and the fix is the command that changes it:

```text
$ app selfcheck
✗ Not ready: sending to the service is off, so nothing was sent.

Next
  $ npm run writes -- on        in the app folder; only you can turn sending on
  $ app selfcheck
```

Off a terminal, under `NO_COLOR` or in CI, the same facts in plain words, without progress:

```text
FAIL 1 of 12 checks failed: React with a like. 11 passed in 1.2s. The test messages are deleted.
```

And `--json` keeps today's fields and adds the verdict, the counts and the durations:

```json
{ "verdict": "failed", "summary": "1 of 12 checks failed: React with a like. 11 passed in 1.2s.", "durationMs": 1197, "counts": { "passed": 11, "failed": 1, "skipped": 7 }, "steps": [{ "id": "react", "state": "failed", "durationMs": 90, "detail": "…", "fix": "Paste the report to your agent." }], "paste": "…" }
```

## What comes next

- Land `ax-terminal` and `ax-checks` in this repository with their tests and docs, and add to the X-ray the rules above it can check from outside: plain text in a pipe or under `NO_COLOR`, and a check command's verdict the same in text and `--json`.
- Ship them in the next Ouro UI release, then convert the first adopter's `selfcheck` from that release.
- Label the install sections of the README and the docs "Ouro HX for web" in a later change; build nothing for Apple until its first component.

[^before]: evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/selfcheck-before.md verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/selfcheck-before.md, /^12 passed, 0 failed, 7 skipped\.$/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/selfcheck-before.md, /^Every write that ran works\. Nothing to send back\.$/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/selfcheck-before.md, /Its test messages go to your Notes to self, where only you see them\./)
[^axdir]: scripts/registry.mts verify:fileLine(scripts/registry.mts, /^const axDir = "registry\/ouro\/ax\/";$/)
[^halves]: docs/decisions/2026-10-30-ouro-ax.md verify:fileLine(docs/decisions/2026-10-30-ouro-ax.md, /Ouro HX is for people: an agent builds an interface and a person uses it\. Ouro AX is for agents/)
[^twins]: test:registry/ouro/ax/output.test.mts::one result renders as JSON or as its text, with one trailing newline verify:testExists(registry/ouro/ax/output.test.mts::one result renders as JSON or as its text, with one trailing newline)
[^voice]: test:registry/ouro/ax/cli.test.mts::the voice speaks only on a terminal: never under --json, --quiet, CI or a pipe, and never in an error verify:testExists(registry/ouro/ax/cli.test.mts::the voice speaks only on a terminal: never under --json, --quiet, CI or a pipe, and never in an error)
[^nodeps]: scripts/registry.mts verify:fileLine(scripts/registry.mts, /Ouro AX: the agent-experience kit, Node TypeScript with no dependencies/)
[^addresses]: README.md verify:fileLine(README.md, /The repository, `@ouro` namespace and install addresses are unchanged\./) verify:fileLine(README.md, /npx shadcn@latest add ourostack\/ouro-ui\/dialog#v\d+\.\d+\.\d+/)
[^gitsize]: evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/repository-size.md verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/repository-size.md, /^263M\t\.git$/)
[^doctor]: evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md; evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.txt verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^## What it does well$/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^## What it lacks$/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.txt, /fix: Resolve the failing checks listed by `archiver doctor`, then run again\./)
[^doctor-well]: evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*Status symbols with colour, and a plain fallback\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*A fix under each problem\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*Order and dependencies\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*The same facts as JSON\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*Honest probes\.\*\*/)
[^doctor-lacks]: evidence:docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /after thirteen rows/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*No grouping\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*Not quiet on success\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*No progress and no timing\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /^- \*\*A circular final fix\.\*\*/) verify:fileLine(docs/decisions/2026-11-02-cli-kit-and-platform-targets/evidence/archiver-doctor.md, /there are no counts/)
