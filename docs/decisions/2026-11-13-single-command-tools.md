# Decision: a tool with one thing to do has no command word

Status: accepted, 2026-11-13. The code lives in web, `ourostack/ouro-ui` ([ourostack/ouro-ui#1020](https://github.com/ourostack/ouro-ui/issues/1020)); this record says how the Ouro AX kit defines a tool with one command, and why.

## Why

Ouro UI's own command-line tools are to be built with the kit's `defineCommand`, so the kit has a production user in its own repository (ourostack/ouro-ui#1020). The kit's `defineCli` asks for a command word before the arguments (`notes rooms --limit 5`). Ouro check and the image tool have none: they take a folder. The design checks record commits Ouro check to `node lib/ouro/check/check.ts <url | folder>`, and apps and CI call both that way. Moving them onto the kit as it stands would break every caller for no gain to a reader.

## Decision

1. **`defineCli` takes `command` (one, with no word) or `commands` (each with its words), never both.** A tool with `command` reads every token as that command's arguments and flags: `ouro-images site/showcase --out site/public/showcase`. Parsing, refusals and their fixes, `--json`, the exit codes and the help all work as they do for any command.
2. **It is not a catch-all.** A tool with `commands` never guesses a command from a word it doesn't know: it still refuses and names the nearest command. A one-command tool that gains a second becomes a tool with `commands`, and its callers add the word: a breaking change, released as one.
3. **`help` still answers.** `tool --help` shows the command's help, and `tool help` and `tool help --json` answer as they do in every Ouro AX tool, so agents and the X-ray read each tool the same way. The word `help` is reserved as a first argument, and only there.
4. **One MCP tool.** The MCP server of a one-command tool offers one tool, named after the tool.

## Prior art

| Find | Mark | Why |
| --- | --- | --- |
| [Command Line Interface Guidelines: "Don't have a catch-all subcommand"](https://clig.dev/) | adopt | Guessing a command from an unknown word stops a tool from ever adding a command named like an argument. One command with no word is a different shape, not a guess. |
| [oclif's single-command CLIs](https://oclif.io/docs/single_command_cli) | adopt | A tool declared as one command takes its arguments and flags with no command word; growing a second command is a change of shape |
| [cobra's root command with `Run`](https://github.com/spf13/cobra/blob/main/site/content/user_guide.md) | borrow | The root command can run itself, with its own flags and arguments |
| [clap's `Command`](https://docs.rs/clap/latest/clap/struct.Command.html) | borrow | A command with arguments and no subcommands is the plain case |
| [yargs's default command (`$0` or `*`)](https://github.com/yargs/yargs/blob/main/docs/advanced.md) | ignore | A catch-all in a tool with other commands, which clig.dev warns against |
| [commander's `isDefault`](https://github.com/tj/commander.js/blob/master/Readme.md) | ignore | The same catch-all |
