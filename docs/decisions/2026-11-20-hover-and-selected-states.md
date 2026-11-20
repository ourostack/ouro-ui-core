# Decision: hover is a quiet raised row, derived from the theme, and never the selected colour

Status: accepted, 2026-11-20, under Ari's overnight authority. It answers an app's report that its hovers looked unfinished: hover and selection blurred together. Web shipped it in [ourostack/ouro-ui#2444](https://github.com/ourostack/ouro-ui/pull/2444), [#2462](https://github.com/ourostack/ouro-ui/pull/2462), [#2470](https://github.com/ourostack/ouro-ui/pull/2470), [#2482](https://github.com/ourostack/ouro-ui/pull/2482), [#2495](https://github.com/ourostack/ouro-ui/pull/2495) and [#2498](https://github.com/ourostack/ouro-ui/pull/2498).

## Why

A hover painted in the selected colour, or in an avatar's grey, can't be told from a selection. An app then overrides each component's hover by hand.

## Decision

- Hover and pressed read `--ouro-row-*` (rows, the rail) and `--ouro-state-*` (the wash on Button, Toggle and Badge). Selected reads `--ouro-row-selected*`.
- The defaults live in `ouro-base.css` and mix shadcn's own variables (`--foreground` into `--background`, and `--accent` for selected), so they hold in any theme. `ouro-theme.css` only tunes them.
- Hover is `pointer-fine:hover:` only. A row shows a "…" button in the time's slot on hover and on focus, always on a coarse pointer, so the row's box never moves.
- Tests measure the lightness gap between hover, selected and the surface in the Ouro theme, stock shadcn and every fixture theme, and forced colours keep selected distinct.
- An app overrides a token, never a component's class.

## Prior art

Read on 2026-11-20.

| Find | Verdict | Why |
| --- | --- | --- |
| [Material state layers](https://m3.material.io/foundations/interaction/states/state-layers) | **Borrow** | A state is a translucent wash of the content colour at a set weight; the weights are tokens. |
| [Apple pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices) | **Borrow** | Hover is a light cue for a fine pointer only, and touch needs no hover. |
| [shadcn/ui theming](https://ui.shadcn.com/docs/theming) | **Adopt** | The defaults derive from its variables, so any shadcn theme works untouched. |
