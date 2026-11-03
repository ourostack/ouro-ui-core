# Migration: what moved into core, and what comes next

Core starts as a copy. Nothing has been removed from web (`ourostack/ouro-ui`), and nothing there needs to change for anyone working in it.

## Copied on 2026-11-03, with history

| From web | In core | Web's copy |
|---|---|---|
| `registry/ouro/theme/ouro-theme.css`, `ouro-base.css` | `templates/web/`, rendered to `dist/web/` | stays, and remains what `shadcn add` installs |
| `site/public/css/ouro-theme.css`, `ouro-base.css` | `templates/web/plain/` | stays |
| `site/public/css/themes/*.css` | `templates/web/themes/` | stays |
| `docs/decisions/` | `docs/decisions/` | stays |

`tokens:parity` keeps core's output byte-identical to web's files at the tag in `parity.json`.

## Later, each its own step

1. Web consumes core's release, pinned in its `core-provenance.json`, and its copies gain a one-line header pointing here.
2. The AX claims standard, its tooling and the ui.ouro.bot site move here, copied with history first.
3. Web's copies are removed only after every open pull request that touches them has merged or closed.
