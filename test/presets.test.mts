import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { renderWeb } from "../src/web.mts";
import { THEMES } from "../src/tokens.mts";

const source = await readFile(new URL("../tokens/presets.json", import.meta.url), "utf8");

test("presets name every theme once, in the order the picker shows them", () => {
  const names = (JSON.parse(source) as { name: string }[]).map((p) => p.name);
  assert.deepEqual([...names].sort(), [...THEMES].sort());
});

test("each preset has a label, a mood, a heading font, a radius and its fonts", () => {
  for (const p of JSON.parse(source) as Record<string, unknown>[]) {
    for (const key of ["name", "label", "mood", "heading", "radius"]) assert.equal(typeof p[key], "string", `${p.name} ${key}`);
    assert.ok(Array.isArray(p.fonts) && p.fonts.length > 0, `${p.name} fonts`);
  }
});

test("dist/web/presets.json is the presets file, byte for byte", async () => {
  assert.equal((await renderWeb()).get("web/presets.json"), source);
});
