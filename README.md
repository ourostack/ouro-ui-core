# Ouro UI core

**One set of tokens, every platform: the shared heart of Ouro HX (for people) and Ouro AX (for agents).** Change a colour once and watch it turn up everywhere, down to the last byte.

Core holds what is true on every platform. Today that is two things: Ouro HX's colours, radii and motion, written once as [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/) JSON and generated into each platform's own language; and Ouro AX for Apple's claims. Each platform repository pins a core release by tag and builds from it. The HX design language, web's AX claims standard and the [ui.ouro.bot](https://ui.ouro.bot/) site move here in later steps.

| Platform | Where it lives | What core gives it |
|---|---|---|
| Ouro HX for web | [ourostack/ouro-ui](https://github.com/ourostack/ouro-ui) | `dist/web/*.css` |
| Ouro HX for Apple | `ourostack/ouro-ui-apple` (coming) | `dist/apple/OuroTokens.swift` |

## What's inside

```
tokens/ouro.tokens.json           the base set: Pearl's colours and what every component needs
tokens/themes/<name>.tokens.json  each theme's changes: pearl, abyss, brass, chart, cookbook, coral
templates/web/                    web's stylesheets with a placeholder where each value goes
scripts/build.mts                 pnpm tokens: writes dist/
scripts/parity.mts                pnpm tokens:parity: dist/web/ against web's files, byte for byte
standard/ax/surfaces/apple.md     Ouro AX for Apple: the App Intents surfaces and their claims
standard/ax/surfaces/apple.claims.json  the same claims as data, published as dist/ax/apple.claims.json
docs/decisions/                   decision records, with their history from ouro-ui; new ones go here, each with a "Prior art" section
```

`pnpm tokens` writes:

- `dist/web/ouro-theme.css` and `dist/web/ouro-base.css`: what `shadcn add` installs from web's registry.
- `dist/web/plain/` and `dist/web/themes/<name>.css`: the plain stylesheets ui.ouro.bot serves for pages without Tailwind.
- `dist/apple/OuroTokens.swift`: SwiftUI with no dependencies. `OuroTokens.theme(.pearl).colors(scheme).primary` is a `Color`, `OuroTokens.Duration.fast` is a `Double` in seconds, and `OuroTokens.Spring.animation` is the spring.
- `dist/ax/apple.claims.json`: Ouro AX for Apple's claim set, byte for byte, for `ouro-ax-xray` in ouro-ui-apple.
- `dist/swatches.html`: every theme's colours in light and dark, to look at.

## Ouro AX for Apple

On Apple platforms the agent is Siri and the interface is App Intents. [`standard/ax/surfaces/apple.md`](standard/ax/surfaces/apple.md) says what an app's intents, entities, onscreen annotations and app skills should do for Siri: thirty checkable claims, each citing the Apple page it comes from and naming the lane that proves it (the bundle's App Intents metadata, AppIntentsTesting, the skills linter, SiriEvaluations, or a person on a device). The X-ray that checks them, `ouro-ax-xray`, lives in [ourostack/ouro-ui-apple](https://github.com/ourostack/ouro-ui-apple). Why, and what we found on the way: [the decision record](docs/decisions/2026-11-03-ouro-ax-for-apple.md).

## Build it

```sh
pnpm install
pnpm tokens            # write dist/
pnpm tokens:parity     # dist/web/ must equal web's files at parity.json's webTag, byte for byte
pnpm test              # tokens resolve; CSS text and DTCG values agree; parity catches one changed byte
pnpm apple:check       # macOS: Swift 6 type-check of OuroTokens.swift, then named tokens resolve
```

To change a token, edit `tokens/`, run `pnpm tokens`, and look at `dist/swatches.html`. Never edit `dist/`.

### Why byte for byte

Every web app that loads these stylesheets looks the way their bytes say. `tokens:parity` downloads web's files at the tag that `parity.json` pins and compares raw bytes, never parsed CSS, so a reordered declaration or a lost comment fails too. While web still owns its copies, a token change lands in web first; then core bumps `webTag` and matches it. Once web builds from core, the direction flips.

## Pinning a core release

A platform repository takes core's outputs from a GitHub release, never from `main`:

1. Download the assets of a release tag, such as `v0.1.0`, from `https://github.com/ourostack/ouro-ui-core/releases`. `dist-manifest.json` lists every file in `dist/` with its SHA-256.
2. Copy the files you use into your repository.
3. Record them in `core-provenance.json` at your repository's root:

   ```json
   {
     "coreTag": "v0.1.0",
     "files": {
       "Sources/OuroHX/OuroTokens.swift": "<sha256 of the file as core released it>"
     }
   }
   ```

   `coreTag` is the core release you pinned. `files` maps each path in your repository to the SHA-256 of that file in `dist-manifest.json`.
4. In CI, hash each listed file and fail when a hash differs. A hand edit to a generated file then fails CI, and a token change arrives only as a bump PR that moves `coreTag`.

## Prior art

We looked around before building this ([the full record](docs/decisions/2026-11-03-token-pipeline.md#prior-art)):

- **Adopt** [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/) as the token format, and [Terrazzo](https://terrazzo.app/docs/)'s parser to validate tokens and resolve aliases and modes. Terrazzo reads DTCG 2025.10's colour objects, while Style Dictionary [says](https://styledictionary.com/info/dtcg/) its 2025.10 support is still a work in progress.
- **Borrow** Terrazzo's `$extensions.mode` convention for light and dark, and Skyscanner [Backpack](https://github.com/Skyscanner/backpack-foundations)'s layering: one base set, with each theme setting only what it changes.
- **Ignore for now** Style Dictionary's Swift formats, which emit UIKit types, and [Terrazzo's Swift plugin](https://terrazzo.app/docs/integrations/swift/), which emits an asset catalog. Our SwiftUI file is a small custom formatter, `src/apple.mts`.

## License

MIT, © 2026 Ari Mendelow. See [LICENSE](LICENSE).
