# Ouro HX: what the components promise

**The same five components, the same promises, on every platform.** Button, Empty, Alert, Sheet and Toast exist on web ([ourostack/ouro-ui](https://github.com/ourostack/ouro-ui)) and on Apple ([ourostack/ouro-ui-apple](https://github.com/ourostack/ouro-ui-apple), where Empty is `OuroEmptyState` and Alert is `OuroBanner`). This page is what each one promises a person, whatever it is drawn with. The claims are data in [`components.claims.json`](components.claims.json), version 0.1.0, published as `dist/hx/components.claims.json`; a platform vendors that file by hash and its tests prove each claim.

The rules are Ouro AX's: a claim is one checkable rule with its reason, its source, its check and its fix, and it is `must` only when it states a hazard with a check, or an evaluation reproduced the failure. `appliesTo` uses web's component names. `checks` says how each platform proves the claim; a platform with no entry has not claimed it yet.

## The claims

### `target.touch`

**must**, for button, empty, alert, sheet, toast. On a touch screen, every control a component draws (its button, action, dismiss or close control) can be pressed anywhere in a target at least 44 by 44 points (CSS pixels on web).

- Why: A smaller target is missed by people with a tremor or limited dexterity, and by everyone on the move.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html>. Targets under 44 by 44 fail WCAG 2.5.5 and Apple's HIG minimum (https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls).

- Checked on web: registry/ouro/components/ouro/button/button.touch.test.tsx measures the Button's box on a coarse pointer.
- Checked on apple: Unit tests read each component's minimum target per size and platform; the gallery's XCUITest measures every button's frame and runs performAccessibilityAudit, whose hitRegion audit fails a small target.
- Fix: Give the control a 44-point minimum frame and content shape on touch platforms, even when it draws smaller.

### `motion.reduced`

**must**, for button, alert, sheet, toast. With Reduce Motion on, a component moves nothing: no slide, scale, spring or bounce. What would move crossfades instead, over `ouro.duration.base`, and a press does not scale.

- Why: Movement across the screen can make people with vestibular disorders dizzy or sick.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>. WCAG 2.3.3, and Apple's HIG on Motion (https://developer.apple.com/design/human-interface-guidelines/motion): motion triggered by interaction must be possible to turn off.

- Checked on web: The Button test "does not scale with reduced motion" and the Sheet test "drops transform motion under reduced motion and keeps an opacity fade".
- Checked on apple: Unit tests read each component's motion step and transition with reduceMotion true and false: crossfade or none with it on, never a move or a scale.
- Fix: Pick the animation from the Reduce Motion setting: OuroMotion's step on Apple, `motion-reduce:` on web.

### `name.spoken`

**must**, for button, empty, alert, sheet, toast. Every control has a name a screen reader speaks and the role it plays (button, heading); a component's title is a heading; decorative icons are hidden from the screen reader.

- Why: A control without a name is announced as "button" or skipped, so a blind person cannot tell what it does.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html>. WCAG 4.1.2. Apple: https://developer.apple.com/documentation/accessibility/supporting-voiceover-in-your-app.

- Checked on web: Each component's browser tests query by role and name ("renders the title as an <h3>…", "shows a dismiss button with onDismiss, named by dismissLabel"); the axe lane checks names.
- Checked on apple: The gallery's XCUITest finds each control by its VoiceOver label and trait (button, header) and fails on a missing or unexpected one; performAccessibilityAudit's sufficientElementDescription and trait audits run on every page.
- Fix: Pass a visible title or an explicit accessibility label; mark titles as headers; hide decorative images.

### `text.reflows`

**must**, for button, empty, alert, sheet, toast. At the largest text size the platform offers (Apple's accessibility sizes, 200% text on web), titles, messages and action labels wrap onto more lines; none is truncated or clipped.

- Why: People who need large text lose the words that tell them what an action does when a label is cut off.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html>. WCAG 1.4.4. Apple: https://developer.apple.com/design/human-interface-guidelines/typography#Supporting-Dynamic-Type.

- Checked on apple: The gallery's XCUITest launches at accessibility XXXL and runs performAccessibilityAudit, whose textClipped and dynamicType audits fail clipped or fixed-size text.
- Fix: Let labels wrap (no fixed line limit at accessibility sizes, no fixed heights) and use text styles that scale.

### `contrast.text`

**must**, for button, empty, alert, sheet, toast. Text and icons that carry meaning reach 4.5:1 against what is behind them in every theme, light and dark, and 7:1 when the platform's increased-contrast setting is on.

- Why: Low-contrast text cannot be read by people with low vision, or by anyone in sunlight.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>. WCAG 1.4.3 (4.5:1) and 1.4.6 (7:1, the enhanced level Increase Contrast asks for).

- Checked on web: The axe lane's color-contrast rule in light and dark.
- Checked on apple: Unit tests compute the WCAG ratio of every tone and variant's label on its fill, in all six themes, light, dark and increased contrast; performAccessibilityAudit's contrast audit runs on the gallery.
- Fix: Take text colours from the theme's foreground pairs, and raise them under increased contrast (OuroColor.increasedContrast on Apple).

### `announce.urgency`

**should**, for alert, toast. A banner or toast is announced once when it appears: destructive and warning ones interrupt what the screen reader is saying, the others wait their turn.

- Why: A message that is never announced is never heard, and one that always interrupts trains people to ignore it.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>. WCAG 4.1.3 asks for status messages a screen reader announces without moving focus.

- Checked on web: The Alert test "renders the title and description in a status region by default" and the Toaster's announcement tests.
- Checked on apple: Unit tests read each tone's announcement priority (high for destructive and warning, default otherwise).
- Fix: Announce on appear with the tone's priority: role=alert or role=status on web, AccessibilityNotification.Announcement with a priority on Apple.

### `toast.action-stays`

**must**, for toast. A toast with an action stays until it is dismissed, unless the app gives it a duration; one without an action dismisses itself after 5 seconds by default.

- Why: A timed Undo can run out before a keyboard, switch or screen reader user reaches it.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html>. WCAG 2.2.1.

- Checked on web: The Toaster test "keeps a toast that has an action until it is dismissed, unless duration is given".
- Checked on apple: Unit tests resolve each toast's duration: nil (until dismissed) with an action, 5 seconds without one, the app's duration when given.
- Fix: Leave the duration unset on a toast with an action, or pass one long enough to reach it.

### `dismiss.reachable`

**must**, for alert, sheet, toast. A sheet, a dismissible banner and every toast have a close control with a name, which a screen reader can reach and press.

- Why: On a phone a screen reader user has no Escape key and may not know the dismiss gesture, so without a control they are stuck.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html>. WCAG 2.1.2: focus that cannot leave a component traps the person in it.

- Checked on web: The Sheet test "renders a Close button last in the sheet, hidden until keyboard focus, that closes it" and the Toaster test "closes from the dismiss button".
- Checked on apple: The gallery's XCUITest opens each sheet, banner and toast, finds its close control by its label, presses it and checks the surface is gone.
- Fix: Render a labelled close button ("Close", "Dismiss") inside the surface.
