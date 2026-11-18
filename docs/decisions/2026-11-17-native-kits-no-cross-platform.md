# Decision: native kits, no cross-platform frameworks

Status: accepted, 2026-11-17, under Ari's overnight authority. It extends [native kits](2026-11-14-native-kits.md), whose strategy section already ruled out web views, React Native and cross-platform toolkits inside a native kit, to every platform Ouro will support.

## Why

Ari, 2026-11-14: "things like react native by nature have compromises. whole point is that we want uncompromising maximum delightfulness! web bit stays a first and easy way to only build once for all platforms, and then you can specialize on your own time".

Ari, 2026-11-17, when the model reviews raised Flutter: "platforms like flutter are no longer relevent :) flutter, react native, etc were always bandaids, and optimized for minimal human attention at the expense for building good experiences. that is no longer the math". And on apps already built that way: "they wont be rewritten tomorrow, but they WILL be rewritten in the next year. look at what dhh is doing with hey".

In web's 2026-11-14 model reviews, three of the models that chose A2UI named Flutter among its renderers in their pull quotes (Claude Opus 5, Gemini 4 Hydrogen, Grok 4.7), and Claude Opus 5.5, which chose Ouro UI, named A2UI's Flutter renderer as the trade-off. Ouro has no Flutter kit on purpose, and its pages didn't say so, so a reader saw a gap where there is a stance.

Cross-platform frameworks exist to save people's time writing the same app twice. Agents now write the native app for each platform, so that saving no longer pays for the compromise in how the app feels. DHH and Shopify reached the same conclusion this year (Prior art).

## Decision

1. **Ouro builds one kit per platform, in that platform's own UI toolkit,** and the web kit for the web: SwiftUI on Apple, WinUI 3 on Windows, Compose on Android, React on the web. Kits share core (tokens, component specs, claims, the one action model, and the composed tree with its conformance cases, which web and Apple draw today and Windows and Android don't yet), never rendering.
2. **No kit for Flutter, React Native, Kotlin or Compose Multiplatform, .NET MAUI, or any other cross-platform framework,** and no exception for apps already built on one. Ouro expects those apps to be rewritten natively, and its kits are where an agent starts that rewrite.
3. **Ouro says this where readers look:** the platforms page, the composed-UI guide and the README, so the absence reads as a stance.

## What this changes

- Core: this record and the index.
- Web: the platforms page and the composed-UI guide say it now; the README says it once the home page's new opening merges.

## Prior art

Read on 2026-11-17.

| Find | Verdict | Why |
| --- | --- | --- |
| DHH, [Rails World 2026 opening keynote](https://www.youtube.com/watch?v=vDjW_dRyKXY&t=1444s) (2026-09-23), on HEY going native | **Adopt** | Ari points to it as the precedent. HEY becomes six native apps written in each platform's own framework: "In the old times, That is, 5 minutes ago, the idea that a small team could maintain 6 native applications written in the native frameworks was preposterous" (24:45); "That's not only why we had people doing web apps. It's why we had React Native. It was why we had Hotwire Native. … While accepting That the fidelity was gonna take a slight hit" (25:00); "They're not gonna be web apps much longer. They're gonna be native applications, because the price of developing those things has gone to damn near zero" (26:45). The web keeps the apps nobody installs (33:30). The talk doesn't say which UI frameworks HEY's native apps use, and it never mentions Flutter. |
| Shopify's Shop app, React Native to SwiftUI and Compose ([the migration](https://shopify.engineering/shop-app-migration), [back to native](https://shopify.engineering/back-to-native)) | **Adopt** | A React Native app rewritten natively in 12 weeks by six engineers: "agents reduced the advantages of sharing implementation, while the advantages of building for each platform remain". Parity comes from "shared specifications, tests, and review checkpoints", not shared code, which is how Ouro's kits meet: core's specs and conformance cases, rendered by each kit. |
| [Flutter](https://github.com/flutter/flutter) | **Ignore** | Draws its own widgets rather than the platform's. A2UI's Flutter renderer is A2UI's concern; Ouro's tree reaches each platform through that platform's own kit. |
| [React Native](https://github.com/facebook/react-native) | **Ignore** | Native controls under a JavaScript runtime; the compromise the 2026-11-14 record already declined. |
| [Compose Multiplatform](https://github.com/JetBrains/compose-multiplatform) | **Ignore** | Compose's renderer on iOS and desktop, not SwiftUI or WinUI. |
| [.NET MAUI](https://github.com/dotnet/maui) | **Ignore** | One abstraction over each platform's controls, a step behind each. |
| [Microsoft Adaptive Cards](https://adaptivecards.io/) | **Borrow** | Hosts render one schema in their own native look: the split Ouro keeps between core's specs and each kit's rendering. |
