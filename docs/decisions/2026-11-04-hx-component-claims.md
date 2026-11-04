# 2026-11-04: Ouro HX's component claims live in core

Status: accepted (W8 of the HX and AX native program).

## Decision

1. **What a component promises a person is platform-neutral, so it is core's.** `standard/hx/components.claims.json` holds the promises Button, Empty, Alert, Sheet and Toast make on every platform; each platform's tests prove them. It ships as `dist/hx/components.claims.json`, and a platform vendors it by hash, as it does the tokens.
2. **The shape is AX's claim shape** (id, tier, rule, why, evidence, fix), with `appliesTo` naming components by web's names and `checks` naming the proof per platform. The admission rule is AX's: `must` only with a stated hazard and a check.
3. **The first eight claims are WCAG hazards** (target size, motion, name and role, resize text, contrast, timing, no trap) plus one `should` (announcement urgency, from WCAG 4.1.3). Seven are `must` because each states the harm and names a test.
4. **Apple names follow Apple.** Web's `Empty` and `Alert` are `OuroEmptyState` and `OuroBanner` on Apple, where "alert" means SwiftUI's modal `.alert`; the claims use web's names, and ouro-ui-apple maps them.

## Prior art

| Find | Verdict |
|---|---|
| [WCAG 2.2 Understanding docs](https://www.w3.org/WAI/WCAG22/Understanding/) | **Adopt** as each claim's source |
| [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | **Adopt** for the 44-point target and Dynamic Type |
| [Fluent 2 accessibility](https://fluent2.microsoft.design/accessibility) | **Borrow** stating the promise per component, platform by platform |
| [Material 3 accessibility](https://m3.material.io/foundations/designing/overview) | **Watch**; its 48dp target is Android's, which a later Android platform adds as its own `checks` entry |
| [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) | **Borrow** for the roles web's checks use |
| Web's ax-claims (`docs/decisions/2026-10-30-ouro-ax.md`) | **Adopt** the claim shape and admission rule |
