# Ouro HX: what the components promise

**The same five components, the same promises, on every platform.** Button, Empty, Alert, Sheet and Toast exist on web ([ourostack/ouro-ui](https://github.com/ourostack/ouro-ui)) and on Apple ([ourostack/ouro-ui-apple](https://github.com/ourostack/ouro-ui-apple), where Empty is `OuroEmptyState` and Alert is `OuroBanner`). This page is what each one promises a person, whatever it is drawn with. The claims are data in [`components.claims.json`](components.claims.json), version 0.1.0, published as `dist/hx/components.claims.json`; a platform vendors that file by hash and its tests prove each claim.

The rules are Ouro AX's: a claim is one checkable rule with its reason, its source, its check and its fix, and it is `must` only when it states a hazard with a check, or an evaluation reproduced the failure. `appliesTo` uses web's component names. `checks` says how each platform proves the claim; a platform with no entry has not claimed it yet, and an entry that proves only part of a claim says which part is "Not yet checked". Apple's entries name tests in ouro-ui-apple (`Tests/OuroHXTests`, and the gallery's `Examples/OuroHXGallery/UITests`), first released in its v0.3.0, the release that pins this set; its `ClaimCoverageTests` fails when a claim has no test there.

The claims section below is generated from the data with `pnpm hx:page`; edit the JSON, not the page.

## The claims

### `target.touch`

**must**, for button, empty, alert, sheet, toast. On a touch screen, every control a component draws (its button, action, dismiss or close control) can be pressed anywhere in a target at least 44 by 44 points (CSS pixels on web).

- Why: A smaller target is missed by people with a tremor or limited dexterity, and by everyone on the move.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html>. Targets under 44 by 44 fail WCAG 2.5.5 (level AAA, chosen on purpose above 2.5.8's AA floor of 24) and Apple's HIG minimum (https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls).

- Checked on web: registry/ouro/components/ouro/button/button.touch.test.tsx measures the Button's box on a coarse pointer, and the Toaster test "gives the dismiss and action buttons 44px touch targets". Not yet checked on web: the Sheet's close control and the Alert's dismiss button.
- Checked on apple: TouchTargetTests (Tests/OuroHXTests/ComponentTests.swift) read every button size's and every close control's minimum target; the gallery's ComponentClaimTests.testEveryControlIs44Points measures every button's frame on every component page, and testEveryComponentPagePassesTheAccessibilityAudit runs performAccessibilityAudit, whose hitRegion audit fails a small target.
- Fix: Give the control a 44-point minimum frame and content shape on touch platforms, even when it draws smaller.

### `motion.reduced`

**must**, for button, alert, sheet, toast. With Reduce Motion on, a component animates no movement: no slide, scale, spring or bounce. What would move crossfades instead, over `ouro.duration.base`, and a press does not scale. A drag may still follow the finger, since the person is moving it.

- Why: Movement across the screen can make people with vestibular disorders dizzy or sick.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html>. WCAG 2.3.3, and Apple's HIG on Motion (https://developer.apple.com/design/human-interface-guidelines/motion): motion triggered by interaction must be possible to turn off, unless it is essential, as following a finger is.

- Checked on web: The Button test "does not scale with reduced motion", the Sheet test "drops transform motion under reduced motion and keeps an opacity fade" and the Toaster test "slides on the ease-out curve in 300ms or less, never animates height, and only fades with reduced motion". Not yet checked on web: the Alert. The drag allowance: the Toaster test "still follows the finger with reduced motion, then returns or fades with no travel".
- Checked on apple: ComponentMotionTests (Tests/OuroHXTests/ComponentTests.swift) read each component's transition and press scale with reduceMotion true and false: a crossfade with it on, never a move or a scale.
- Fix: Pick the animation from the Reduce Motion setting: OuroMotion's step on Apple, `motion-reduce:` on web.

### `name.spoken`

**must**, for button, empty, alert, sheet, toast. Every control has a name a screen reader speaks and the role it plays (button, heading); a component's title is a heading; decorative icons are hidden from the screen reader.

- Why: A control without a name is announced as "button" or skipped, so a blind person cannot tell what it does.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html>. WCAG 4.1.2. Apple: https://developer.apple.com/documentation/accessibility/supporting-voiceover-in-your-app.

- Checked on web: The Empty test "renders the title as an <h3>, the description, the icon and the action", the Alert test "shows a dismiss button with onDismiss, named by dismissLabel" and the Sheet test "renders a Close button last in the sheet, hidden until keyboard focus, that closes it" query by role and name; the axe lane checks names on every component.
- Checked on apple: The gallery's ComponentClaimTests.testVoiceOverLabels finds each control by its VoiceOver label as a button, each title as text, and no decorative icon; testEveryComponentPagePassesTheAccessibilityAudit runs performAccessibilityAudit's sufficientElementDescription and trait audits on every page.
- Fix: Pass a visible title or an explicit accessibility label; mark titles as headers; hide decorative images.

### `text.reflows`

**must**, for button, empty, alert, sheet, toast. At the largest text size the platform offers (Apple's accessibility sizes, 200% text on web), titles, messages and action labels wrap onto more lines; none is truncated or clipped.

- Why: People who need large text lose the words that tell them what an action does when a label is cut off.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html>. WCAG 1.4.4. Apple: https://developer.apple.com/design/human-interface-guidelines/typography#Supporting-Dynamic-Type.

- Checked on apple: The gallery's ComponentClaimTests.testEveryComponentPagePassesTheAccessibilityAudit launches every component page at accessibility XXXL and runs performAccessibilityAudit, whose textClipped and dynamicType audits fail clipped or fixed-size text.
- Fix: Let labels wrap (no fixed line limit at accessibility sizes, no fixed heights) and use text styles that scale.

### `contrast.text`

**must**, for button, empty, alert, sheet, toast. Text and icons that carry meaning reach 4.5:1 against what is behind them in every theme, light and dark, and 7:1 when the platform's increased-contrast setting is on.

- Why: Low-contrast text cannot be read by people with low vision, or by anyone in sunlight.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>. WCAG 1.4.3 (4.5:1 for text) and 1.4.6 (7:1, the enhanced level). Ouro chooses 7:1 for increased contrast, and holds meaningful icons to the text ratio, above 1.4.11's 3:1 for graphics.

- Checked on web: The axe lane's color-contrast rule, 4.5:1 in light and dark. Not yet checked on web: 7:1 under increased contrast.
- Checked on apple: ContrastTests (Tests/OuroHXTests/ComponentTests.swift) compute the WCAG ratio of every component's text and icons on its surface, every tone and variant, in all six themes, light and dark, standard and increased contrast; performAccessibilityAudit's contrast audit runs on the gallery. ComponentSnapshotTests keeps references of every component in light, dark and increased contrast.
- Fix: Take text colours from the theme's foreground pairs, and raise them under increased contrast (OuroColor.increasedContrast on Apple).

### `announce.urgency`

**should**, for alert, toast. A banner or toast is announced once when it appears. A destructive banner or toast interrupts what the screen reader is saying, and so does a warning banner; the others, warning toasts included, wait their turn.

- Why: A message that is never announced is never heard, and one that always interrupts trains people to ignore it.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>. WCAG 4.1.3 asks for status messages a screen reader announces without moving focus.

- Checked on web: The Alert test "uses role=%s for a %s alert" (alert.test.tsx, an it.each: destructive and warning give role=alert, the rest role=status) and the Toaster test "is announced once, its message and description only: politely, and a destructive toast assertively (Review Focus 5)". Not yet checked on web: that a warning toast waits its turn.
- Checked on apple: AnnouncementTests (Tests/OuroHXTests/ComponentTests.swift) read each tone's announcement priority for a banner and for a toast.
- Fix: Announce on appear with the tone's priority for that component: role=alert or role=status on web, AccessibilityNotification.Announcement with a priority on Apple.

### `toast.action-stays`

**must**, for toast. A toast with an action stays until it is dismissed, unless the app gives it a duration; one without an action dismisses itself after 5 seconds by default.

- Why: A timed Undo can run out before a keyboard, switch or screen reader user reaches it.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html>. WCAG 2.2.1.

- Checked on web: The Toaster test "keeps a toast that has an action until it is dismissed, unless duration is given".
- Checked on apple: ToastTests (Tests/OuroHXTests/ComponentTests.swift) resolve each toast's duration: nil (until dismissed) with an action, 5 seconds without one, the app's duration when given; the gallery's ComponentClaimTests.testAToastWithAnActionWaits sees a plain toast leave and the Undo toast stay.
- Fix: Leave the duration unset on a toast with an action, or pass one long enough to reach it.

### `dismiss.reachable`

**must**, for alert, sheet, toast. A sheet, a dismissible banner and every toast have a close control with a name, which a screen reader can reach and press.

- Why: On a phone a screen reader user has no Escape key and may not know the dismiss gesture, so without a control they are stuck.
- Source: <https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html>. WCAG 2.1.2: focus that cannot leave a component traps the person in it. VoiceOver's escape gesture (https://developer.apple.com/documentation/objectivec/nsobject-swift.class/accessibilityperformescape()) exists, but many people never learn it, so the control is the reliable way out.

- Checked on web: The Sheet test "renders a Close button last in the sheet, hidden until keyboard focus, that closes it", the Alert test "shows a dismiss button with onDismiss, named by dismissLabel" and the Toaster test "closes from the dismiss button".
- Checked on apple: The gallery's ComponentClaimTests.testCloseControlsClose finds the sheet's, the banner's and a toast's close control by its label, presses it and checks the surface is gone.
- Fix: Render a labelled close button ("Close", "Dismiss") inside the surface.
