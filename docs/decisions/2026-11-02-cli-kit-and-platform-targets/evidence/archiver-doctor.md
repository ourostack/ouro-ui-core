# An archiver's `doctor`, read and run

The reference for "a doctor done well" is the `doctor` command of an open-source archiver from the same GitHub organization: a Go CLI that mirrors a work suite's chat, mail and calendar caches into one local SQLite file for agents to read. Its name and the services it reads are replaced here (`archiver`, "chat app", "mail app"), as the 2026-10-30 record does for its first adopter.

## How it was read and run

- Source: the archiver's repository at `f6c5bbf7`, the commit the installed build reports (`archiver --version`, version 1.5.0). Files: `internal/cli/doctor.go`, `internal/cli/color.go`, `internal/cli/text.go`, `internal/render/render.go`, `internal/errs/errs.go`.
- The source shows `doctor` reads only, with one exception: it creates and removes a scratch file beside the archive to prove the folder is writable (`writableCheck`). It finds the browser that `transcripts fetch` would run and does not start it. It does not sync first.
- So it was run once, on 2026-11-02, isolated from the person's own data: `--db` and the chat app root pointed at an empty scratch folder, and the mail app source off. The run took 0.8 seconds. The output is in [archiver-doctor.txt](archiver-doctor.txt), with paths replaced by `<scratch>`.

## What it does well

- **Status symbols with colour, and a plain fallback.** Each check is one row: a symbol (`●` ready, `▲` warning, `✖` failing, from `statusGlyph` in `render.go`), its name and its detail. Colour is on only for a terminal; `--no-color` or `NO_COLOR` always turns it off, and `CLICOLOR_FORCE` turns it on for screenshots (`colorEnabled` in `color.go`). Without colour the symbols stay.
- **A fix under each problem.** A warning or failing row is followed by a `fix:` line in the row's colour (`Doctor` in `render.go`). Some fixes are exact commands (``Run `archiver sync`.``); others are steps ("Open chat app and sign in so it creates its cache, then run again.").
- **Order and dependencies.** A check that can't run because an earlier one failed says so and points at it ("not checked: chat app is not installed", fix "Fix chat_installed first.").
- **The same facts as JSON.** `--json` prints `{ ok, checks: [{ name, ok, warn?, detail, fix }] }`; text is the default only on a terminal (`--format`).
- **Exit codes.** A failing check exits 3 (`ExitEnvironment`, `errs.go`), with one stderr line naming the failing checks and a fix.
- **Honest probes.** The rows say what was not probed ("doctor does not start it", "sign-in and path access not probed").

## What it lacks

- **No verdict first.** The verdict (`failing checks: chat_origin`) comes last, on stderr, after thirteen rows; on a terminal a person scrolls to find the one failure.
- **No grouping.** Thirteen rows in one flat list under "Ready checks", named in snake_case identifiers (`transcripts_profile_mode`).
- **Not quiet on success.** Every passing row prints every time, with its full detail, wrapped long paths included.
- **No progress and no timing.** Checks run before anything prints, and neither the rows nor the JSON say how long anything took. At 0.8 seconds that is fine; a slow check would look like a hang.
- **A circular final fix.** The stderr line's fix is "Resolve the failing checks listed by `archiver doctor`, then run again.", the command just run.
- **The JSON has no summary.** `ok` is the verdict; there are no counts, and a warning is `ok: true, warn: true`, so a reader counts warnings itself.
- **Colour beyond the rows.** The banner is a five-line block-letter wordmark in a 256-colour gradient, printed by `doctor` (`textBanners` in `text.go`): character for a person, but five lines before the first fact.
