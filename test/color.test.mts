import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateColor, rgbaToHex } from "../src/color.mts";

const none = () => undefined;

test("oklch converts to sRGB", () => {
  assert.equal(rgbaToHex(evaluateColor("oklch(0.922 0 0)", none)!), "#e5e5e5");
  assert.equal(rgbaToHex(evaluateColor("oklch(1 0 0)", none)!), "#ffffff");
  assert.equal(evaluateColor("oklch(1 0 0 / 15%)", none)!.a, 0.15);
});

test("color-mix with transparent keeps the colour and scales its alpha", () => {
  const c = evaluateColor("color-mix(in srgb, var(--ink) 18%, transparent)", (n) => (n === "--ink" ? "#28231d" : undefined))!;
  assert.equal(rgbaToHex(c), "#28231d");
  assert.ok(Math.abs(c.a - 0.18) < 1e-9);
});

test("color-mix of two opaque colours blends in sRGB", () => {
  assert.equal(rgbaToHex(evaluateColor("color-mix(in srgb, #ffffff 50%, #000000)", none)!), "#808080");
});

test("rgb() with a slash alpha", () => {
  const c = evaluateColor("rgb(0 0 0 / 0.12)", none)!;
  assert.equal(rgbaToHex(c), "#000000");
  assert.equal(c.a, 0.12);
});
