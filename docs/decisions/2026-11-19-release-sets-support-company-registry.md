# Decision: release sets, a road to core 1.0, a support and security policy, and a company-owned registry

Status: accepted, 2026-11-19, under Ari's overnight authority. It answers two findings of the [model interviews](2026-11-19-model-interviews.md): [ourostack/ouro-ui#2316](https://github.com/ourostack/ouro-ui/issues/2316) and [ourostack/ouro-ui#2296](https://github.com/ourostack/ouro-ui/issues/2296).

## Why

Six of the eight models that answered read Ouro UI as one person's fast-moving project: a pre-1.0 core, kits pinned to different core versions, no support or CVE policy, and packages on a token-gated feed and GitHub Pages instead of nuget.org and Maven Central. GPT-6.1 Terra: "I could not establish that every cross-repository claim described one tested release set." All eight said copy-in source is fine for one team and a governance problem for twenty. GPT-6.2 Astra: "I'd want one internally owned, versioned package, not twenty forks." Claude Opus 5.5: "Its auto-merging update bot doesn't reassure me; at our scale, governance wants a human gate."

What they asked for is real, and most of it is policy and plumbing Ouro can ship. A second maintainer is the product owner's to find, and nothing here pretends otherwise.

## Decision

### 1. A release set is the unit a company adopts

A **release set** names one release of every Ouro UI repository (web, core, Apple, Windows and Android) that work together: each kit's release meets the same core minor and passes that core's conformance cases (tokens, the composed tree and its updates, A2UI, and the action generators each kit runs). Core publishes the sets in `release-sets.json`, and a script writes a set from each kit's `core-provenance.json` at its release tag, so no set is typed by hand. A set is cut only when every kit passes at one core minor. Until then the file says which core each kit meets, and the web's Platforms page reads it.

### 2. Core 1.0 when the first full release set exists

Core goes to 1.0 at the first release set in which every kit meets one core minor. Its public surface is then the token files, the composed tree and its update format, the action declaration format, the A2UI and MCP Apps adapters' output, and the conformance case format. Anything else stays marked experimental in its JSDoc. From 1.0:

- A breaking change to the public surface is a new major version.
- Nothing public is removed without being deprecated first, for at least one minor release and 60 days, with the replacement named in the deprecation and in the release notes.
- The kits say which core majors they support.

### 3. Support and security

- **Reporting:** private vulnerability reporting is on for every Ouro UI repository, and an organisation-wide `SECURITY.md` in ourostack/.github says how to report.
- **Response:** a report is acknowledged within three working days.
- **Fixes:** a fix ships in the newest release of each affected kit. Before core 1.0 nothing is backported. From 1.0, the previous core minor gets security fixes for 90 days after the next one ships.
- **Provenance:** every release's artifacts carry a GitHub build attestation (SLSA provenance), so a company can check that a package was built from the tagged commit.

### 4. Standard package registries

The Windows kit publishes to nuget.org and the Android kit to Maven Central, beside the release assets they attach today. This needs the product owner's accounts: a nuget.org API key, and Maven Central's namespace verification for `bot.ouro` with a signing key. Until those exist, the kits keep attaching their packages to each release, and their READMEs say where to get them.

### 5. A company-owned registry, not twenty forks

Ouro HX stays copy-in source: a component is yours to change, which is why agents can fix what they ship. That doesn't stop one team from owning the version every other team gets.

- **A mirror registry.** A company mirrors Ouro's registry at a reviewed release tag into its own shadcn registry, under its own namespace, such as `@acme/button`. Teams install from the mirror, and one reviewed pull request on the mirror moves every team. A script builds the mirror from a tag and records each item's source tag and hash.
- **Updates that wait for a person.** Ouro Current gets a setting that leaves auto-merge off and requests review from a named team, for repositories whose governance wants a human gate.
- **Finding the copies that missed a fix.** A report lists, for each app, which Ouro items it pins, at which release, and which files differ from that release's source, so a company can see who is behind and who has edited what.

An npm package isn't offered: it would take away the edit-in-place model that the rest of Ouro HX (and its checks) rely on. The mirror is the versioned, centrally owned package in registry form.

## What this changes

- **Core:** `release-sets.json` and the script that writes it, the 1.0 criteria above, and a deprecation note in `AGENTS.md`.
- **ourostack/.github:** an organisation-wide `SECURITY.md`; private vulnerability reporting turned on in each Ouro UI repository.
- **Each repository's release workflow:** build attestations; nuget.org and Maven Central publishing once the accounts exist.
- **Web:** a guide to running Ouro UI at a company (the mirror, reviewed updates, the drift report), the mirror script, Ouro Current's review setting, and the Platforms page reading the release set.

## Prior art

Read on 2026-11-19.

| Find | Verdict | Why |
| --- | --- | --- |
| [Semantic Versioning](https://semver.org/) | **Adopt** | A major version for a breaking change to a declared public surface. |
| [Node.js release schedule](https://nodejs.org/en/about/previous-releases) | **Borrow** | A stated support window per release line. Ouro's is far shorter, and says so. |
| [Radix Primitives releases](https://www.radix-ui.com/primitives/docs/overview/releases) | **Watch** | A component library's public release notes per package. |
| [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) | **Adopt** | A private channel for reports without a mailbox to staff. |
| [SLSA](https://slsa.dev/) and [GitHub artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds) | **Adopt** | Build provenance a company can verify, from the release workflow alone. |
| [shadcn registry namespaces](https://ui.shadcn.com/docs/registry/namespace) and [running a registry](https://ui.shadcn.com/docs/registry) | **Adopt** | A company hosts its own registry under its own namespace; the CLI installs from it as from Ouro's. |
| [Renovate's automerge setting](https://docs.renovatebot.com/configuration-options/#automerge) | **Borrow** | Dependency updates whose merge is a per-repository choice, off where governance wants review. |
| [Maven Central namespaces](https://central.sonatype.org/register/namespace/) and [publishing to nuget.org](https://learn.microsoft.com/en-us/nuget/nuget-org/publish-a-package) | **Adopt** | The registries a company's build already trusts. |
