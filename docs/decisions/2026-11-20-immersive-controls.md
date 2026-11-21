# Decision: ImmersiveControls is a spec in core, with a claim that the content holds still

Status: accepted, 2026-11-20, from Gatefold build 53. Apple builds it first (ouro-ui-apple's `.ouroImmersiveControls`).

## Why

Gatefold's reader showed its controls by stepping the page back (a 0.96 scale) and laying paper behind them, so no glass stood on text. On the iPhone Duo's cover screen the paper reached from the middle of the screen down, and the reader lost half the page. Measured with Gatefold's `ControlsOverPageUITests` on that build: 19 of 19 lines moved and 7 were hidden on the Duo, and 29 of 29 moved and 16 were hidden on an iPad Pro 13-inch. Each app that shows controls over a page, a photo or a video meets the same choice, so the answer is a component, not a fix in one app.

## Decision

- `immersive-controls` gets a spec in `standard/hx/components/`: a top bar and a bottom bar of the app's controls, laid over content that fills the screen.
- A new `must` claim, `content.holds-still`: showing or hiding the controls never moves, scales, reflows, fills over or dims the content. Its basis is the evaluation above.
- The bars stand in the bands the system already takes: the top bar at the safe area's top, beside any camera housing the platform reports; the bottom bar resting on the home indicator, in the 13 points it takes (the indicator and the gap under it), across the width under the housing. A housing across the middle of the top moves the top bar below it.
- The component joins `motion.reduced`: each bar slides in from its own edge, and crossfades under reduced motion.
- It draws no colour of its own, so it joins none of the contrast, name or touch-target claims; the controls in its slots are the app's own buttons, which carry them.
- The claim set goes from 0.8.0 to 0.9.0.

## Prior art

Read on 2026-11-20.

- [Apple Books in iOS 27.2 (9to5Mac, 2026-10-06)](https://9to5mac.com/2026/10/06/ios-27-2-gives-apple-books-new-design-updates-as-iphone-duo-nears/): adopt. Close moves to the upper-left corner, Bookmark is a standalone button in the upper-right, the menu becomes a three-dot Liquid Glass menu in the lower-right, and Back moves to the lower-left, over a page that stays where it is.
- [Apple Human Interface Guidelines: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars): adopt, floating Liquid Glass bars of grouped controls over the content.
- Photos and Safari on iOS 26: borrow, controls that come and go over a photo or a page without moving it.
