# Decision: rounder people, and presence as a dot on the curve

Amends [squircles, the Quiet switch and avatars with presence](2026-11-13-squircles-switch-avatars.md), which this record follows.

## Why

Ari, on the live Avatar page: "sparkle is fine!!! folks will set their own image :) so we just need a cozy default. i like the channel default :) i do think we should round the people avatars a touch more though, no? a bit toooo difficult to differentiate - also wondering if we can do presence badge better, hm". A person and a team were both squircles of nearly the same radius, so they read alike, most of all in a stack.

Ari picked from rendered options in Chromium and WebKit, light and dark, at 24, 32, 40 and 64 px: "B, and P2".

## Decision

1. **A person is rounder than a team.** A person's squircle radius is 44% of its size (option B, the most rounded of three), where a team, a channel and an app keep their own. The two read apart at a glance at every size and in stacks, and a person is still a squircle, inside the family. A true circle was left out: the squircle language is the point of the family.
2. **Presence is a dot on the curve (option P2).** The dot sits where the avatar's corner curves, at the same place for every size, cut into the avatar by a bite mask with a thin gap, so it reads on any photo and in light and dark. It is smaller than the old badge and has no ring of padding.
   - At 32 px and below it is a plain colour, because a glyph there is a smudge.
   - From 40 px up it carries a glyph: a tick for available, a bar for busy, a clock for away, a cross for offline.
   - Colour is never the only signal: the glyph and the avatar's accessible status text carry it too.
3. **Unchanged.** The agent's sparkle tile and the channel and team default stay as they are. A team still shows no presence.

## Prior art

Read on 2026-11-14.

| Find | Verdict | Why |
| --- | --- | --- |
| Apple Messages and FaceTime (a small dot on the avatar's curve, cut in) | **Adopt** | The dot's size, place and bite; plain colour when small. |
| Slack (a presence dot at the corner, hollow for away) | **Borrow** | Offline reads as an outline, not a filled dot. |
| Discord (status glyphs inside the dot: moon, minus, ring) | **Borrow** | Glyphs where there is room to draw them, none where there is not. |
| Microsoft Teams and Fluent UI PresenceBadge (glyphs in a badge) | **Borrow** | The glyph vocabulary people arriving from Teams expect. |
| Linear (a quiet, small dot, no ring) | **Borrow** | Restraint: the dot never competes with the face. |
| A true circle for people | **Ignore** | Leaves the squircle language; the rounder squircle differentiates enough. |
