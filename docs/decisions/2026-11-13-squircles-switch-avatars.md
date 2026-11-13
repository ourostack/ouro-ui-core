# Decision: squircles, the Quiet switch and avatars with presence

Status: accepted, 2026-11-13. The code lives in web, `ourostack/ouro-ui`, and ships in Ouro UI releases from v1.3.16; the tokens go to this repository after web, with a `webTag` bump in `parity.json`.

## Why

Ari, 2026-11-13 20:48 UTC: "how do you generally feel about abolishing all standard rounded radii and mandating only squircle when such a thing is needed? :)", then "yes, obviously, that was implied!!! :) dont need to ask for permsisions for things that i clearly want you to do 😘".

Ari, 20:54 UTC, on the polyfill: "mikhailmogilnikov/hyperellipse looks like it was released 5 months ago and isnt maintained. wanna fork it and make our own in case we need to tweak?" On where: "yes, everwhere in ouro :) and i think many things that are currently circles should become squircles!!! like avatars 👀 just gotta think about how we do precence badges etc."

Ari, 21:13 UTC, on the switch: "love it!!! except the glass lens looks too caryoony - find the balance of doable, themable, beautiful, and modern". On teams: "most teams have cover art! it's on team level, not channel level". On agents: "needs to read cleanly to folks coming from teams to tandem… making agents circles is confusing… let's keep hexagon, just make it squircle?"

Ari, 21:18 UTC: "agents still too blobby, no? and should stay with same height as width lol idk why you made it strechted :)". At 21:28 UTC: "looks like they changed the shape of agents, and agents DO have precense dots!!!! … your hexagons do read as wide".

Ari, 21:36 UTC, final picks: "switch: go with A :)" and "A, the less-rounded squirckle? sgtm :)". The approved mockups are the round 4 sheet of 2026-11-13.

## Decision

1. **Squircles.** Every standard rounded corner is a squircle: `corner-shape: squircle` (a superellipse with n = 4), set once through the `--ouro-corner-shape` token and applied wherever a component sets a radius. It is native in Chromium 139 and later; elsewhere the `ourostack/hyperellipse` polyfill, our fork of mikhailmogilnikov/hyperellipse, draws it. The radius scale rises about 1.5 times, because a squircle at the same radius reads tighter than a circular arc.
2. **What stays round.** The switch, radios, presence dots, slider thumbs and spinners. Each is a circle or a pill because the shape is the control's meaning, not decoration.
3. **Many circles become squircles**, avatars first.
4. **The Quiet switch (option A).** The thumb is Liquid Glass: white at 34% in light mode and 12% in dark, a 0.75 px rim, a 0.5 px hairline, `--ouro-shadow-sm`, and `--ouro-glass*` tokens so a theme can make the glass clearer, warmer or flat. Under `prefers-reduced-transparency` it is a solid surface. Off keeps its 3:1 outline. It replaces the pre-Liquid-Glass toggle.
5. **Avatars with presence.**
   - A person: a photo or initials in a squircle, with the presence dot cut in by a bite mask.
   - A team: the team's own cover art, per team and not per channel, in a squircle, with a second edge peeking behind it, and no presence dot. Without art, initials on the team's hue.
   - An agent (option A): a less-rounded squircle app tile, radius about 0.24 times its size, the same height as width, white in light mode and a slightly lighter surface in dark, the agent's glyph in its own colour, with a presence dot at the bottom right, cut in by a bite mask. It replaces the stretched hexagon, and the rule that a hexagon shows no presence dot goes.

## Prior art

Read on 2026-11-13.

| Find | Verdict | Why |
| --- | --- | --- |
| [CSS `corner-shape`](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape) (CSS Backgrounds and Borders Level 4) | **Adopt** | The native squircle, in Chromium 139 and later. |
| [mikhailmogilnikov/hyperellipse](https://github.com/mikhailmogilnikov/hyperellipse) | **Borrow** | The polyfill for other browsers, forked as `ourostack/hyperellipse` so we can tweak it; the original is unmaintained. |
| Apple's continuous corners (iOS app icons, SwiftUI `RoundedRectangle(style: .continuous)`) | **Borrow** | The reference for how a squircle should look; Ouro UI for Apple already draws them. |
| [Microsoft Teams' avatars](https://learn.microsoft.com/en-us/microsoftteams/) (agents as app tiles, teams with cover art) | **Borrow** | What people arriving from Teams expect to read cleanly. |
| [Fluent UI Avatar and PresenceBadge](https://react.fluentui.dev/?path=/docs/components-avatar--docs) | **Borrow** | Presence as a small dot at the avatar's corner, cut into it. |
| Apple's Liquid Glass | **Borrow** | The thumb's translucent lens; calmer, with themable tokens. |
| [`prefers-reduced-transparency`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency) | **Adopt** | The switch's solid fallback. |
| Hexagon agent avatars (Ouro's own, before this record) | **Ignore** | Replaced by the tile, as Teams moved too. |
