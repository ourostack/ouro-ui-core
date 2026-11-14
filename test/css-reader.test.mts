// Web's token stylesheets change without core: the reader must read what they hold, and must refuse
// a block it cannot place, so core cannot drift from web without a red check.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { readDeclarations } from "../src/css-reader.mts";

test("a base-layer rule that applies a token is not a token", () => {
  const css = [":root {", "  --ouro-corner-shape: squircle;", "}", "@layer base {", "  :where([data-ouro])[class*=\"rounded\"] {", "    --corner-shape: var(--ouro-corner-shape);", "    corner-shape: var(--ouro-corner-shape);", "  }", "}"].join("\n");
  assert.deepEqual(readDeclarations(css).declarations.map((d) => d.name), ["--ouro-corner-shape"]);
});

test("a custom property in any other block is refused, naming the block", () => {
  assert.throws(() => readDeclarations(".other {\n  --x: 1;\n}"), /--x sits in a block with no colour mode: \.other/);
  assert.throws(() => readDeclarations("@media print {\n  .a {\n    --x: 1;\n  }\n}"), /no colour mode/);
});

test("the reader reads every token stylesheet of web's latest release", async (t) => {
  const { webRepo, files } = JSON.parse(await readFile(new URL("../parity.json", import.meta.url), "utf8")) as { webRepo: string; files: Record<string, string> };
  const headers = { accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
  const latest = await fetch(`https://api.github.com/repos/${webRepo}/releases/latest`, { headers }).catch(() => null);
  if (!latest?.ok) return t.skip("web's latest release could not be read (offline or rate limited)");
  const tag = ((await latest.json()) as { tag_name: string }).tag_name;
  for (const path of Object.values(files)) {
    const response = await fetch(`https://raw.githubusercontent.com/${webRepo}/${tag}/${path}`);
    assert.ok(response.ok, `${path} at ${tag}: HTTP ${response.status}`);
    const text = await response.text();
    assert.doesNotThrow(() => readDeclarations(text), `${path} at ${tag}: add it to src/css-reader.mts and rerun pnpm tokens:import`);
  }
});
