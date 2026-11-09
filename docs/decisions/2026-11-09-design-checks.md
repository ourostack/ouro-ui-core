# Decision: design checks agents can run instead of looking

Status: accepted, 2026-11-09. The code lives in web, `ourostack/ouro-ui`, in Ouro check (`registry/ouro/check/`); this record says what each check is and which tool owns it.

## Why

Ari, 2026-11-09, after a design pass that was "an improvement in some ways, but also SO unrefined": "DO NOT burn tons of tokens forcing agents to consume all of this. instead, have agents build reusable tooling as part of ouro feel + reins that allows them to deterministically look for bad design".

Agents found design problems by viewing whole screenshots and screen recordings, which costs tokens and still misses things. Six things Ari found by eye that morning became the seed cases. Each is now a check that fails on the page as he found it and passes once it is fixed:

| What Ari saw | Check | How it is measured |
| --- | --- | --- |
| mendelow.me's "Selected work" led its Ouro UI entry with a giant scene photo where the work belongs | `giant-picture` | A banner-shaped picture (1.8 times as wide as tall or wider) that leads a content item, fills its width, is over 55% of its height and over 1.25 times the height of the rest |
| ouroboros.bot/ouro-md/'s recording showed a double border, a black corner inside the rounded frame | `baked-corner` | Pixels along each corner's diagonal, on the video's first frame: a band that is neither the colour behind the frame nor the media's edge colour (nor a blend of the two), turning back to the edge colour further in, in the same colour at two corners or more |
| The Ouro MD title sat against the hero art with "ZERO breathing room" | `cramped-heading` | The gap above a heading's row, against half its font size (a quarter, under its own card's picture) |
| The recording was shown larger than it was captured, so it was blurry | `blurry-image`, now for videos | Drawn size × device pixel ratio over the video's frame size |
| `http://` didn't move to `https://` on ouroboros.bot or ui.ouroboros.bot, and www.ouroboros.bot moved to `http://` | `https` | A 301 or 308 from `http://` to `https://`, `Strict-Transport-Security` of a year or more, and the same for a bare name's `www.` twin |
| The Tandem live plan map jank | `jank`, `repaint` | A walk of the page's states, measuring Ouro Feel's numbers on each, and endless animations that repaint at rest |

On 2026-11-09 the first versions found every seed case on the live pages, at the sizes Ari saw them.

## Decision

1. **Ouro check owns every check of what a page looks like and how it moves, on any page.** It already opened every page at every size, light and dark, ships into apps (`ouro-check`), runs on any URL, and writes JSON findings with a small captioned close-up each. One command covers a URL or a built folder: `node lib/ouro/check/check.ts <url | folder> --sizes 390x844,1440x900,3840x2160`. An agent reads `report.json` and opens a close-up only for the finding it is fixing.
2. **Ouro Feel owns what the motion measures mean.** Ouro check's walk counts forced layouts, the longest frame and layout shift by Feel's definitions ([Ouro Feel](2026-11-04-ouro-feel.md)): a forced layout is a layout read while a DOM change waits to be laid out. Feel keeps its deeper per-component cases in the engines apps ship in, and the real engine still decides a component's time budgets. Ouro check's `jank` is a guard in headless Chromium, the way its `inp` is: a step fails on the median of three runs over 250 ms, or when even its best run forces more than 50 layouts or shifts the page by more than 0.01 with no press or key to explain it.
3. **The walk is the web's first, shallow Reins.** [Ouro Reins](https://github.com/ourostack/ouro-ui-apple/blob/main/docs/decisions/2026-11-05-ouro-reins.md) drives every state of a native app as state and actions. On the web, Ouro check finds states from the page itself: card-sized links and buttons to hover, popups and disclosures to open and close (`aria-haspopup`, `aria-expanded`, `popovertarget`, `<summary>`), the page and its regions to scroll, and surfaces to pan (`cursor: grab`), three of each kind a page. It never opens what `inp` never presses. The walk runs without reduced motion, as most people see a page; the rest of the check keeps reduced motion so pictures hold still.
4. **flow-review keeps declared flows.** A flow a repository declares (sign in, then send) with its fixtures, across Chromium, WebKit and Edge, stays in flow-review, with its own `cls` and `jank`. The next step there is to run Ouro check's in-page rules at each `capture` moment, so a declared state gets the same design rules. That is not in this change.
5. **Only measurable rules.** A rule from Refactoring UI is kept only when a number decides it without flagging pages that are right. Calibration on 2026-11-09 against ouroboros.bot, ouroboros.bot/ouro-md/, ui.ouroboros.bot and mendelow.me, at a phone, a laptop and a 4K screen, light and dark, removed each false finding it found before release: a squarer screenshot of the work (now left alone), a heading's own content below it (only the space above counts), round avatars and a fixed navigation bar over a picture's corners (round crops are skipped; only corners the screen shows count), a photograph's dark corners (the band must turn back and match), pills, radio dots and transparent links (effective radii, visible frames, boxes only), and a disclosure pushing content as it opens (shifts the browser puts down to input don't count).

## The rules

| Principle | Rule | Kept? |
| --- | --- | --- |
| Use fewer borders | `nested-frame`: a framed box within 6px of another on every side, or corners that don't nest (inner radius not the outer radius less the inset, near the corner) | Kept |
| Establish a type scale; two or three weights | `type-scale`: more than 10 text sizes or more than 3 weights on a page | Kept |
| Define a fixed set of shadows (elevation) | `shadow-scale`: more than 5 different shadows | Kept |
| Don't use grey text on coloured backgrounds | `grey-on-colour`: HSL saturation under 0.12 on a background of 0.35 or more | Kept |
| Hierarchy is everything | `heading-hierarchy`: a heading larger than the heading of higher rank above it | Kept |
| Start with too much white space | `cramped-heading` | Kept |
| Use images where they serve the content | `giant-picture` | Kept |
| Keep line length 45–75 characters | `long-lines` | Stays opt-in: Ouro's rule is that the layout, not a fixed measure, sets line width, unless a design sets one |
| Contrast | axe-core's `color-contrast` | Already checked |
| Spacing on a scale | Not kept | Fluid spacing (`clamp()`) lands between scale steps at most widths, so a 4px-grid test flags pages that are right |
| Alignment to a grid | Not kept | Near-miss edges (1 to 3px apart) mostly came from borders and optical offsets; no threshold separated mistakes from intent |
| Emphasize by de-emphasizing | Not kept | No number tells intended emphasis from too much |
| Empty states | Not yet | Needs the empty state on screen; a Reins-style walk with data control can reach it later |

## What comes next

The Tandem plan map's smoothness work (2026-11-09) measured the map's jank with four signals; the first is in this change as `repaint`, and the other three come next, over Chromium's trace (CDP `Tracing`):

- Paints at rest: Paint events on the renderer's main thread over 1.5 s with the pointer parked (180 before the map's fix, 0 after).
- Forced layouts from the trace: Layout events inside an animation frame, a timer or a scroll, wheel or pointer event, counted only when the stack has a frame from the page's origin, so the test harness's own layouts don't count (149 before, 0 after).
- Frame states: PipelineReporter's frames, deduplicated by sequence, counting partial presentation, dropped frames and checkerboarding.

That work also found two problems in Feel's probe: `blankFrames` uses `elementFromPoint`, which skips `pointer-events: none` content, so a page that turns off hover while scrolling reads as blank; and its sampling cost about 1 s of script per 2 s of panning a 340-card map. Feel's next change fixes both.

## Prior art

Read on 2026-11-09.

| Find | Verdict | Why |
|---|---|---|
| [Refactoring UI](https://www.refactoringui.com/) (Wathan and Schoger) | **Borrow** | The principles behind `type-scale`, `shadow-scale`, `grey-on-colour`, `nested-frame` ("use fewer borders"), `heading-hierarchy` and `cramped-heading`; each kept only where a number decides it. |
| [Paul Irish's list of what forces layout](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) | **Adopt** | The getters and methods the walk counts, as Feel does. |
| [Cumulative Layout Shift](https://web.dev/articles/cls) | **Adopt** | How a shift is scored, and leaving out shifts just after input; a step's own limit is 0.01, far under the page-load threshold of 0.1. |
| [Interaction to Next Paint](https://web.dev/articles/inp) | **Borrow** | 200 ms is good for a press; a walk step's longest frame gets 250 ms, judged on a median. |
| [Long Animation Frames](https://developer.chrome.com/docs/web-platform/long-animation-frames) | **Watch** | Splits a slow frame into script, style, layout and waiting; flow-review uses it to tell raster-bound frames apart. |
| [Lighthouse's image-size-responsive audit](https://developer.chrome.com/docs/lighthouse/best-practices/image-size-responsive) | **Borrow** | Rendered size × device pixel ratio against natural size, the test `blurry-image` already made, now for videos too. |
| [HSTS preload requirements](https://hstspreload.org/) | **Adopt** | A redirect from HTTP to HTTPS on the same host and `max-age` of at least 31536000 (a year). |
| [Chrome's guidance on compositor-only properties](https://web.dev/articles/animations-guide) | **Adopt** | Animate `transform` and `opacity`; anything else repaints, the basis of `repaint`. |
| [axe-core](https://github.com/dequelabs/axe-core) | **Adopt** (already) | Contrast and the rest of WCAG A/AA stay axe's. |
| [flow-review](https://github.com/ourostack/flow-review) | **Borrow** | Its evidence model (a finding, its numbers and a cropped picture) is the shape Ouro check already had; declared flows stay there. |
| [Percy](https://percy.io/) and [Chromatic](https://www.chromatic.com/) visual diffing | **Ignore** | They flag that pixels changed, not that a design is wrong, and need a person to look. |
