# Ouro AX for Apple: App Intents surfaces

**Siri is the agent; App Intents are the interface.** On Apple platforms an app's agent-facing surface is its App Intents: the actions it offers, the things those actions act on, what is on screen, and the app skills that guide Siri through longer tasks. This page is the standard for them. Its claims are data in [`apple.claims.json`](apple.claims.json), version 0.1.0, and `ouro-ax-xray` in [ourostack/ouro-ui-apple](https://github.com/ourostack/ouro-ui-apple) checks them from outside the app.

The standard follows Ouro AX's rules for web, from [the 2026-10-30 decision](../../../docs/decisions/2026-10-30-ouro-ax.md): a claim is one checkable rule with its reason, its source, its check and its fix; a claim is `must` only when an evaluation reproduced the failure it prevents, or it states a hazard with an executable check; everything else is `should`. Every claim here is `should` until SiriEvaluations runs show otherwise. Why this target exists, and how it differs from web, is [the 2026-11-03 decision](../../../docs/decisions/2026-11-03-ouro-ax-for-apple.md).

## Surfaces

| Surface | What it is | Where the X-ray finds it |
|---|---|---|
| `app-intent` | An action: an `AppIntent`, including tool intents (`@AppIntent(.tool)`) and App Shortcuts. | The bundle's compiled App Intents metadata, `Metadata.appintents/extract.actionsdata`. |
| `app-entity` | A thing actions act on: an `AppEntity`, its properties and its query. | The same metadata; AppIntentsTesting runs its queries. |
| `view-annotation` | An entity marked as on screen, with `.appEntityIdentifier` or `NSUserActivity`. | AppIntentsTesting's `viewAnnotations()` against the running app. |
| `app-skill` | A `SKILL.md` in the app's `Skills.skillsbundle`: guidance for Siri that ships inside the product. | The bundles inside the built app. |

## How each claim is checked

A claim's `checkedBy` says which lane can prove it, and a report keeps the lanes apart, so it never claims more than it saw:

- **`app-intents-metadata`**: the App Intents metadata the build compiled into the bundle. It is the inventory the system registers, so it lists every intent, parameter, entity, query and App Shortcut, with their titles and descriptions. Reading it needs no device.
- **`app-intents-testing`**: [AppIntentsTesting](https://developer.apple.com/documentation/appintentstesting), which runs intents and queries out of process against the live app, by bundle identifier, the way Siri and Shortcuts do. It needs an OS that matches the Xcode it came with (see the decision record).
- **`skills-lint`**: the app-skills linter, `ouro-ax-skills lint`.
- **`siri-evaluations`**: [SiriEvaluations](https://developer.apple.com/documentation/sirievaluations) scenario sets, run at least five times on a 27.3 beta OS on an Apple Intelligence device, reported as pass rates.
- **`person`**: a person on a device, in Siri, Shortcuts and Spotlight.

AppIntentsTesting does not drive Siri, so no metadata or AppIntentsTesting result proves what Siri will do. A report says that in its first lines.

## Claim fields

Each claim has web's fields (`id`, `surface`, `tier`, `applies`, `rule`, `why`, `evidence`, `check`, `fix`) and two more:

- `appliesTo`: the surface types it covers, from `app-intent`, `app-entity`, `app-skill` and `view-annotation`.
- `checkedBy`: the lane, from the list above.

`surface` is `app-intents` for every claim, the way web's are `cli`, `http`, `mcp` or `ui`. `applies` is where it is checked: once per `app`, or per `intent`, `parameter`, `entity`, `property`, `skill-bundle` or `skill`. `evidence.source` is the Apple page the claim comes from.

## The claims

### Intents (`app-intent`)

| Claim | Rule | Checked by | Apple source |
|---|---|---|---|
| `intent.title` | Every intent has a title a person would say, not its type name. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.description` | Every intent has a description that says what it does, beyond its title. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.parameter-title` | Every parameter has a title. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.parameter-description` | Every parameter has a description that says what value it wants. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.tool` | The app's main actions are tool intents (`@AppIntent(.tool)`) or adopt a Siri schema, so Siri AI can call them. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.tool-not-on-schema` | No intent is both a tool and an adopter of a schema that already reaches Siri. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `intent.shortcuts` | The app offers App Shortcuts for its main actions, so Siri and Spotlight find them with no setup. | metadata | [app-shortcuts](https://developer.apple.com/documentation/appintents/app-shortcuts) |
| `intent.error-names-fix` | When an intent is refused, its error is one sentence that says what to do next. | AppIntentsTesting | [customlocalizedstringresourceconvertible](https://developer.apple.com/documentation/foundation/customlocalizedstringresourceconvertible) |
| `intent.confirms-what-others-see` | An intent whose result other people see asks the person to confirm before it acts. | a person | [requestconfirmation(conditions:actionname:dialog:)](https://developer.apple.com/documentation/appintents/appintent/requestconfirmation(conditions:actionname:dialog:)) |
| `intent.reads-in-shortcuts` | Each intent appears under the app in Shortcuts, and its parameter summary reads like a sentence. | a person | [verifying-your-app-intents-implementation](https://developer.apple.com/documentation/appintents/verifying-your-app-intents-implementation) |
| `intent.siri-calls` | Siri calls the right intent with the right parameters for direct, indirect and incomplete wording, and declines unexpected requests. | SiriEvaluations | [sirievaluations](https://developer.apple.com/documentation/sirievaluations) |
| `intent.siri-says-what-happened` | After an action, what Siri says names what happened. | SiriEvaluations | [sirievaluations](https://developer.apple.com/documentation/sirievaluations) |

### Entities (`app-entity`)

| Claim | Rule | Checked by | Apple source |
|---|---|---|---|
| `entity.type-name` | Every entity type has a display name a person would say, not its type name. | metadata | [typedisplayrepresentation](https://developer.apple.com/documentation/appintents/typedisplayrepresentation) |
| `entity.properties` | An entity exposes what a person would ask about it as properties. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `entity.property-description` | Every entity property has a description. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `entity.private-properties` | Sensitive properties require authentication, and properties only the app needs are hidden from Siri. | a person | [intentauthenticationpolicy](https://developer.apple.com/documentation/appintents/intentauthenticationpolicy) |
| `entity.findable` | Siri can find every entity: it is indexed in Spotlight, or its query can list or search it. | metadata | [bringing-custom-actions-and-content-to-siri](https://developer.apple.com/documentation/appintents/bringing-custom-actions-and-content-to-siri) |
| `entity.indexed` | An entity that says it is indexed is in the Spotlight index once the app has content. | AppIntentsTesting | [spotlightquery(_:)](https://developer.apple.com/documentation/appintentstesting/appentitydefinition/spotlightquery(_:)) |
| `entity.ids-resolve` | An entity's identifier resolves back to the same entity. | AppIntentsTesting | [testing-your-app-intents-code](https://developer.apple.com/documentation/appintentstesting/testing-your-app-intents-code) |
| `entity.transferable` | Every entity is `Transferable`. | metadata | [testing-your-app-intents-code](https://developer.apple.com/documentation/appintentstesting/testing-your-app-intents-code) |
| `entity.transfer-round-trip` | An exported entity can be read back. | AppIntentsTesting | [testing-your-app-intents-code](https://developer.apple.com/documentation/appintentstesting/testing-your-app-intents-code) |
| `entity.display-representation` | Each entity shows a title a person recognises, with a subtitle or image where it helps. | a person | [displayrepresentation](https://developer.apple.com/documentation/appintents/displayrepresentation) |
| `entity.siri-finds` | Siri finds the entity the person means from their words. | SiriEvaluations | [sirievaluations](https://developer.apple.com/documentation/sirievaluations) |

### Onscreen annotations (`view-annotation`)

| Claim | Rule | Checked by | Apple source |
|---|---|---|---|
| `annotation.onscreen` | Entities shown on screen are annotated, so "this" means what the person sees. | AppIntentsTesting | [providing-contextual-cues-to-apple-intelligence-and-siri](https://developer.apple.com/documentation/appintents/providing-contextual-cues-to-apple-intelligence-and-siri) |
| `annotation.siri-onscreen` | Siri resolves "this" to the entity on screen. | SiriEvaluations | [sirievaluations](https://developer.apple.com/documentation/sirievaluations) |

### App skills (`app-skill`)

| Claim | Rule | Checked by | Apple source |
|---|---|---|---|
| `skill.bundle-shape` | A skills bundle is `Skills.skillsbundle` holding only `Skills/<name>/SKILL.md`, one bundle per target. | skills linter | [orchestrating-complex-actions-with-app-skills](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills) |
| `skill.names` | Each skill's name is lowercase letters, numbers and hyphens, the same in its folder and frontmatter, and unique across the app. | skills linter | [orchestrating-complex-actions-with-app-skills](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills) |
| `skill.frontmatter` | A skill's frontmatter holds only `name` and `description`. | skills linter | [orchestrating-complex-actions-with-app-skills](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills) |
| `skill.body` | A skill's body is at most 10,000 characters and names tools informally, not by type. | skills linter | [orchestrating-complex-actions-with-app-skills](https://developer.apple.com/documentation/appintents/orchestrating-complex-actions-with-app-skills) |
| `skill.loads` | Siri loads the skill for the requests it is written for. | SiriEvaluations | [sirievaluations](https://developer.apple.com/documentation/sirievaluations) |

## Versions

The claim set has its own version, and a report pins it with the SHA-256 of its canonical JSON (keys sorted, no spaces), the same rule as web's ax-claims. Core's releases publish the file byte for byte as `apple.claims.json`; a platform repository vendors it and records its hash in `core-provenance.json`.
