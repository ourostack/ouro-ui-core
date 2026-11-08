import assert from "node:assert/strict";
import { test } from "node:test";
import { rgbaToHex } from "../src/color.mts";
import { renderApple, themeExtras } from "../src/apple.mts";
import { readSet } from "../src/tokens.mts";

const hexAt = (c: { r: number; g: number; b: number; a: number }) => `${rgbaToHex(c)} at ${Math.round(c.a * 100)}%`;

test("cookbook extras carry every sj colour, as a Swift case", async () => {
  const extras = await themeExtras("cookbook");
  const swift = await renderApple("test");
  const sjColours = [...(await readSet("cookbook"))].filter(([id, t]) => id.startsWith("sj-") && t.$type === "color").map(([id]) => id);
  assert.ok(sjColours.length >= 30, `only ${sjColours.length} sj colours`);
  for (const id of sjColours) {
    const entry = extras.colors.find((c) => c.id === id);
    assert.ok(entry, `${id} is not an extra`);
    assert.match(swift, new RegExp(`case ${entry.swift} = "${id}"`), `${id} has no OuroExtraColor case`);
  }
  assert.equal(extras.colors.find((c) => c.id === "sj-brass")!.swift, "sjBrass");
  assert.equal(extras.colors.find((c) => c.id === "sj-on-photo-muted")!.swift, "sjOnPhotoMuted");
});

test("extras resolve color-mix like the browser", async () => {
  const extras = await themeExtras("cookbook");
  const border = extras.colors.find((c) => c.id === "sj-border")!;
  assert.equal(hexAt(border.light), "#28231d at 18%");
  const panel = extras.colors.find((c) => c.id === "sj-panel")!;
  assert.equal(hexAt(panel.dark), "#282522 at 84%");
  const swift = await renderApple("test");
  assert.match(swift, /\.sjBorder: Color\(\.sRGB, red: 0\.1569, green: 0\.1373, blue: 0\.1137, opacity: 0\.18\) \/\* #28231d at 18% \*\//);
});

test("type tokens map to text styles, with web's sizes in points", async () => {
  const { type } = await themeExtras("cookbook");
  const eyebrow = type.find((t) => t.id === "sj-type-eyebrow")!;
  // Web's .sj-eyebrow: IBM Plex Sans Condensed, 700, 0.72rem, tracked 0.18em.
  assert.deepEqual(
    { family: eyebrow.family, weight: eyebrow.weight, size: eyebrow.size, textStyle: eyebrow.textStyle },
    { family: "sjUi", weight: 700, size: 11.52, textStyle: "caption" },
  );
  assert.equal(Math.round(eyebrow.tracking * 1000) / 1000, 2.074);
  for (const role of ["display", "title", "section", "step", "instruction", "body", "ui", "eyebrow", "meta"]) {
    assert.ok(type.some((t) => t.id === `sj-type-${role}`), `sj-type-${role} is missing`);
  }
  const swift = await renderApple("test");
  assert.match(swift, /\.sjTypeEyebrow: OuroTypeToken\(family: \.sjUi, weight: 700, size: 11\.52, textStyle: \.caption, tracking: 2\.0736, lineHeight: 1\.0\)/);
});

test("lengths are points and shadows halve the CSS blur", async () => {
  const { lengths, shadows, numbers, fonts } = await themeExtras("cookbook");
  const points = Object.fromEntries(lengths.map((l) => [l.id, l.points]));
  assert.equal(points["sj-space-unit"], 4);
  assert.deepEqual([points["sj-margin-compact"], points["sj-margin-regular"], points["sj-margin-fold"]], [24, 32, 40]);
  assert.equal(points["sj-radius-photo"], 8);
  assert.equal(numbers.find((n) => n.id === "sj-tracking-eyebrow")!.value, 0.18);
  const soft = shadows.find((s) => s.id === "sj-shadow-soft")!;
  // Light: 0 12px 36px color-mix(in srgb, var(--sj-charcoal) 8%, transparent).
  // Dark: 0 16px 44px color-mix(in srgb, var(--sj-photo-charcoal) 42%, transparent).
  assert.deepEqual({ x: soft.light.x, y: soft.light.y, radius: soft.light.radius }, { x: 0, y: 12, radius: 18 });
  assert.equal(hexAt(soft.light.color), "#28231d at 8%");
  assert.deepEqual({ x: soft.dark.x, y: soft.dark.y, radius: soft.dark.radius }, { x: 0, y: 16, radius: 22 });
  assert.equal(hexAt(soft.dark.color), "#1d1915 at 42%");
  assert.equal(fonts.find((f) => f.id === "font-sj-display")!.swift, "sjDisplay");
  assert.deepEqual(fonts.find((f) => f.id === "font-sj-ui")!.families[0], "IBM Plex Sans Condensed");
});

test("pearl has empty extras", async () => {
  const extras = await themeExtras("pearl");
  for (const list of Object.values(extras)) assert.deepEqual(list, []);
  const swift = await renderApple("test");
  assert.match(swift, /public static let pearl = OuroTheme\([\s\S]*?extras: \.empty\n {4}\)/);
});
