# Decision: Android is one Compose kit, AppFunctions for agents, checked on emulators

Status: accepted, 2026-11-14. This applies the [native-kits record](2026-11-14-native-kits.md) to Android; it does not reopen that strategy.

## Why

Ari, 2026-11-14: "do android too - i will never use this myself, though, so do not let it be on the critical path! it's just for completeness, and we should be open about the fact that i do not have any android devices and welcome a collaborator that does".

So Android is small, cheap and honest. Nothing waits on it. The maintainer owns no Android device. Everything is checked on emulators in CI, on GitHub's free Linux runners, and a collaborator with real devices is welcome as an outside collaborator or through a fork.

## Decision

1. **The kit is `ourostack/ouro-ui-android`,** in Jetpack Compose only. It has no web views and no cross-platform toolkit, as the native-kits record says. It has two libraries:
   - `ouro-hx`: the theme from `dist/android/OuroTokens.kt`, plus Button, Badge, Card and Item, Apple's first set.
   - `ouro-actions`: the runtime the generated actions call.
2. **Components are specified in core and rendered by hand.** The kit vendors the four specs and `components.claims.json` by SHA-256 (`core-provenance.json`), as Apple and Windows do. Each spec now has `accessibility.android` and `platforms.android`. `android` is in `HX_PLATFORMS`, and the five claims these components make have a `checks.android` entry naming the kit's Robolectric `ClaimsTest`. It reads the Compose semantics tree that TalkBack and agents read, and samples rendered pixels.
3. **Agents reach the app through AppFunctions,** generated from `defineAction` by `src/actions-android.mts` (released as `dist/actions/ouro-actions-android.mts`).
   - Each action an agent may call gets one `@AppFunctionDeclaration`, whose `@AppFunctionInstruction` is the declaration's agent text.
   - A person-only action gets no AppFunction, as it has no App Intent on Apple; the generated catalog carries core's typed refusal for any bridge that relays a call to it.
   - Android has no system confirmation prompt, so a consequential action asks the person through the app's `confirm` hook and is refused (`AppFunctionDeniedException`) until the app sets one. It fails closed.
4. **The X-ray runs on an emulator.** The sample app's instrumented test asks `AppFunctionManager` what Android indexed for the app and compares it with the declarations. It checks that the buttons on screen name the same actions, that an agent's add goes through the same handler a person's press does, and that share is refused without the person.
5. **Releases need no account beyond `gh`.** Maven files are attached to each GitHub release (Maven Central needs a Sonatype account, and GitHub Packages needs a token even to download).

## What the toolkit forces

- androidx.appfunctions 1.0.0-rc01 needs compileSdk 37 and AGP 9.1 or later (its `aar-metadata.properties`). The kit uses Google's ChatApp sample's set: AGP 9.5.1, Kotlin 2.4.21, KSP 2.3.13 and Gradle 9.9.1.
- On the API 36 emulator image, AppFunctions were not indexed and `cmd app_function` had no shell command, so CI runs the API 37 (Android 17) image. Compose's test rule brings an Espresso that calls the `InputManager.getInstance` Android 17 removed, so the kit pins Espresso 3.7.0.
- Touch targets are 48 dp, Android's minimum, which is above the claim's 44.

## Prior art (meerkat)

Researched 2026-11-14.

| Find | What it is | Verdict |
|---|---|---|
| [androidx.appfunctions 1.0.0-rc01](https://developer.android.com/jetpack/androidx/releases/appfunctions) | Jetpack AppFunctions, Android's on-device tool calling. The [overview](https://developer.android.com/ai/appfunctions) still calls it an experimental preview. The [android/skills appfunctions skill](https://github.com/android/skills/tree/main/device-ai/appfunctions) says to "Expose only safe, non-destructive tasks that the app's UI already offers". | **Adopt** as the agent door. |
| [`@AppFunctionAccessLevel`](https://developer.android.com/reference/kotlin/androidx/appfunctions/AppFunctionAccessLevel) | An experimental access level (SELF, SYSTEM, ANDROID_TRUSTED). | **Watch.** A person-only action stays unprojected rather than restricted to SELF. |
| [android/appfunctions](https://github.com/android/appfunctions) | Google's ChatApp sample and test agent. The agent treats an empty result plus a PendingIntent as "confirmation needed". | **Borrow** its toolchain now. A PendingIntent confirm is the consequential follow-up. |
| [Compose Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3) | The standard Compose design system. It has no contrast-level API; the platform has [`UiModeManager.getContrast()`](https://developer.android.com/reference/android/app/UiModeManager#getContrast()). | **Borrow** its theming shape (CompositionLocal colours). Our components and our increased contrast are our own. |
| [app_intents_codegen](https://pub.dev/packages/app_intents_codegen) | Flutter codegen from one definition to App Intents and Android AppFunctions. | **Borrow** the one-definition shape; ours also binds the control a person presses. |
| [A2UI for Compose](https://developer.android.com/develop/ui/compose/agentic) (`androidx.a2ui.compose`, alpha) | Google's A2UI renderer with pluggable catalogs, on A2UI v0.9.1. | **Watch.** An Ouro catalog for it once it reads our catalog's version. |
| [Skyscanner Backpack](https://github.com/Skyscanner/backpack-android) | A live Compose design system on the same AGP and Kotlin. | **Borrow** its token package layout. |
| [Roborazzi](https://github.com/takahirom/roborazzi) / [Paparazzi](https://github.com/cashapp/paparazzi) | JVM snapshot tests. Roborazzi runs on Robolectric; Paparazzi's stable release predates AGP 9. | **Adopt** Roborazzi; **watch** Paparazzi. |
| [ReactiveCircus android-emulator-runner](https://github.com/ReactiveCircus/android-emulator-runner) | Emulators on GitHub's Linux runners with KVM. | **Adopt.** |

## Not yet

- The kit's other components (Empty, Alert, Sheet, Toast and the rest) join as each gets a Compose rendering and its `checks.android`.
- An A2UI renderer for the catalog's Badge, Card and Item, once Compose's A2UI reads our catalog's version.
- Real devices: none here. A collaborator with one is welcome.
