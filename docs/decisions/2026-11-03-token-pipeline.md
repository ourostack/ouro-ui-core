# Decision: the token pipeline in core

Status: accepted, 2026-11-03. Part of the program in which Ouro HX and Ouro AX gain Apple as a platform; the repository split itself is web's decision record `docs/decisions/2026-11-03-platforms-and-repositories.md`, proposed in [ourostack/ouro-ui#555](https://github.com/ourostack/ouro-ui/pull/555).

## Decision

1. **Format.** Tokens are DTCG 2025.10 JSON: a base set, `tokens/ouro.tokens.json`, and one set per theme, `tokens/themes/<name>.tokens.json`, holding only what that theme changes. A theme token replaces the base token whole.
2. **Names.** A token's path joined with `-` is its CSS custom property: `primary-foreground` is `--primary-foreground`, `ouro.duration.fast` is `--ouro-duration-fast`. The one exception is `shadcn.input` and `shadcn.radius`, shadcn's stock values, which `ouro-base.css` writes for an app whose theme has neither; they are not Ouro's own `input` and `radius`.
3. **Modes.** The dark value sits in `$extensions.mode.dark`, Terrazzo's convention. An alias whose chain changes in dark mode states its dark alias outright, because Terrazzo 2.10 resolves an inherited dark mode through the next token's default value (found by the test that CSS text and DTCG values agree: cookbook's dark `--background` resolved to `--sj-bone` instead of `--sj-charcoal`).
4. **CSS spellings.** Every `$value` is a DTCG value. Where CSS needs a spelling the value cannot carry (color-mix() over a var(), a percentage alpha, an unquoted `-apple-system`), the exact text is in `$extensions["bot.ouro"].css` (and `.cssDark`). A test evaluates that text and checks it gives the same colour as the value, for every colour in every theme and mode. Values DTCG has no type for (the CSS `linear()` spring, `calc()` radii, shadows) are `$type: "string"`, which Terrazzo accepts and DTCG 2025.10 does not define.
5. **Web output: templates, not a generic CSS format.** `templates/web/` is each of web's stylesheets with a placeholder where each value goes (`{{primary}}`, `{{primary@dark}}`, `{{ouro.ease.out|description}}`). The prose, the order and the non-token CSS (`@font-face`, keyframes, Tailwind's `@theme` and `@utility`) stay exactly as web wrote them, so the output can be byte-identical. Their git history is web's, kept by `git filter-repo`.
6. **Parity.** `tokens:parity` downloads web's files at the tag in `parity.json` and compares bytes. It ran against `ourostack/ouro-ui@v1.3.3`, web's latest release on 2026-11-03.
7. **Apple output: a custom SwiftUI formatter.** `src/apple.mts` writes `OuroTokens.swift`: `public struct OuroTokens` with `Color` and `Double` values and `static func theme(_ name: OuroThemeName) -> OuroTheme`. Colours are resolved at build time, because SwiftUI has no var() or color-mix(). Radii are points at 16 per rem. Web's CSS has light and dark values and no high-contrast ones, so the Swift file has none either; high contrast needs new tokens first.
8. **Two Apple-only tokens.** `ouro.spring.visual-duration` (400ms) and `ouro.spring.bounce` (0.15) come from `ouro-base.css`'s own description, "a Motion spring(0.4, 0.15) as CSS", and give SwiftUI `.spring(duration: 0.4, bounce: 0.15)`. They carry `"bot.ouro": { "web": false }`, since no stylesheet writes them.
9. **Bootstrap.** `scripts/import-from-web.mts` derived the tokens and templates from web's files at v1.3.3, and refuses to finish unless every template renders web's file byte for byte. From here, `tokens/` is edited by hand.

## Not decided here

- When web stops keeping its own copies and builds from core's release instead. Until then a token change lands in web first.
- Which other site stylesheets (`site/src/themes/*.css`, the site's own sources) core generates. They move with the site.
- Typed shadows and font stacks beyond what the CSS needs today.

## Prior art

Read on 2026-11-03, building on the program's `research/03-prior-art.md`.

| Find | Verdict | Why |
|---|---|---|
| [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/) and [colour module](https://www.designtokens.org/tr/2025.10/color/) | **Adopt** | The standard format; colour objects carry a colour space and a hex fallback. |
| [Terrazzo](https://github.com/terrazzoapp/terrazzo) parser (`@terrazzo/parser` 2.10.0) | **Adopt** | Parses DTCG 2025.10, lints values, resolves aliases and `$extensions.mode` (probed 2026-11-03). We use the parser only; its CSS output could not be byte-identical to web's hand-written files. |
| Terrazzo's `$extensions.mode` convention | **Borrow** | Light and dark in one token, which Terrazzo resolves. |
| [DTCG 2025.10 resolver module](https://www.designtokens.org/tr/2025.10/resolver/) | **Watch** | The standard way to express sets and modes across files. Move to it when tools resolve it as well as they resolve `$extensions.mode`. |
| [Style Dictionary](https://styledictionary.com/info/dtcg/) 5 | **Ignore for now** | Its own page says DTCG 2025.10 support is "a work in progress in v5", and its [Swift formats](https://styledictionary.com/reference/hooks/formats/predefined/) (`ios-swift/class.swift` and friends) are UIKit-flavoured. Revisit if we need its many platform formats. |
| [Terrazzo Swift plugin](https://terrazzo.app/docs/integrations/swift/) | **Watch** | Writes an asset catalog and is experimental. A plain Swift file is easier to pin and hash in `core-provenance.json`. |
| Skyscanner [Backpack foundations](https://github.com/Skyscanner/backpack-foundations) | **Borrow** | Its layering: one base set for every platform, with sets on top. Ours are themes. |
| [fluentui-apple](https://github.com/microsoft/fluentui-apple) | **Ignore** as a dependency | UIKit and AppKit controls with Fluent's look; precedent for a per-platform repository only. |
