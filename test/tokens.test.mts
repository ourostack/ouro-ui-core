import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { dtcgToRgba, evaluateColor, rgbaToHex } from "../src/color.mts";
import type { DtcgColor } from "../src/css-value.mts";
import { pathToCssName } from "../src/names.mts";
import { cssText, layered, readSet, resolve, THEMES, type TokenMap } from "../src/tokens.mts";
import { PLACEHOLDER, webTemplates } from "../src/web.mts";

const hexOf = (value: unknown) => rgbaToHex(dtcgToRgba(value as DtcgColor));

test("a named token resolves, through aliases and modes", async () => {
  const pearl = await resolve(await layered("pearl"));
  assert.equal(hexOf(pearl.get("primary")!.light), "#0066cc");
  assert.equal(hexOf(pearl.get("primary")!.dark), "#2997ff");
  assert.deepEqual(pearl.get("ouro.duration.fast")!.light, { value: 150, unit: "ms" });

  // cookbook: --background: var(--sj-paper); --sj-paper is var(--sj-bone) in light and
  // var(--sj-charcoal) in .dark, where --sj-charcoal is #1f1d1a.
  const cookbook = await resolve(await layered("cookbook"));
  assert.equal(hexOf(cookbook.get("background")!.light), "#fbfaf4");
  assert.equal(hexOf(cookbook.get("background")!.dark), "#1f1d1a");
});

test("the fixed interface's names exist in tokens/ouro.tokens.json", async () => {
  const base = await readSet();
  const names = [
    "background", "foreground", "primary", "primary-foreground", "secondary", "muted", "accent", "destructive",
    "border", "input", "ring", "radius", "success", "warning",
    ...[1, 2, 3, 4, 5].map((n) => `chart-${n}`), ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `avatar-${n}`),
    ...["fast", "base", "slow", "press", "sheet", "draw"].map((d) => `ouro.duration.${d}`),
    "ouro.ease.out", "ouro.ease.in-out", "ouro.ease.drawer", "ouro.ease.spring", "ouro.spring.duration", "ouro.press.scale",
  ];
  for (const name of names) assert.ok(base.has(name), `${name} is missing`);
});

test("every theme has a token set, and Terrazzo accepts each one layered over the base", async () => {
  for (const theme of THEMES) {
    await readFile(new URL(`../tokens/themes/${theme}.tokens.json`, import.meta.url));
    const resolved = await resolve(await layered(theme));
    assert.ok(resolved.size > 0, theme);
  }
});

// The CSS spelling ($extensions["bot.ouro"].css) and the DTCG value must mean the same colour.
test("each colour's CSS text and its DTCG value agree, per theme and mode", async () => {
  for (const theme of [undefined, ...THEMES]) {
    const tokens: TokenMap = await layered(theme);
    const resolved = await resolve(tokens);
    // --input means Ouro's `input`; shadcn's stock value only fills in for an app with no theme.
    const byCss = new Map([...tokens.keys()].filter((id) => !id.startsWith("shadcn.")).map((id) => [pathToCssName(id.split(".")), id]));
    for (const [id, token] of tokens) {
      if (token.$type !== "color") continue;
      for (const mode of ["light", "dark"] as const) {
        const lookup = (name: string) => (byCss.has(name) ? cssText(tokens, byCss.get(name)!, mode) : undefined);
        const fromCss = evaluateColor(cssText(tokens, id, mode), lookup);
        assert.ok(fromCss, `${theme ?? "base"} ${id} ${mode}: CSS text is not a colour`);
        const fromValue = dtcgToRgba(resolved.get(id)![mode] as DtcgColor);
        assert.equal(rgbaToHex(fromCss), rgbaToHex(fromValue), `${theme ?? "base"} ${id} ${mode}`);
        assert.ok(Math.abs(fromCss.a - fromValue.a) < 0.001, `${theme ?? "base"} ${id} ${mode} alpha`);
      }
    }
  }
});

test("every web token appears in a template, and every placeholder names a token", async () => {
  const used = new Set<string>();
  for (const { path, theme } of await webTemplates()) {
    const template = await readFile(new URL(`../templates/web/${path}`, import.meta.url), "utf8");
    const tokens = await layered(theme);
    for (const [, id] of template.matchAll(PLACEHOLDER)) {
      assert.ok(tokens.has(id!), `templates/web/${path}: {{${id}}} names no token`);
      used.add(id!);
    }
  }
  for (const theme of [undefined, ...THEMES]) {
    for (const [id, token] of await readSet(theme)) {
      if (token.$extensions?.["bot.ouro"]?.web === false) continue;
      assert.ok(used.has(id), `${theme ?? "base"}: ${id} is in no template`);
    }
  }
});
