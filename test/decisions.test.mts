import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

const dir = new URL("../docs/decisions/", import.meta.url);
const records = (await readdir(dir)).filter((name) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name)).sort();
const index = await readFile(new URL("README.md", dir), "utf8");

test("every decision record is in the index, so a reader who starts there finds it", () => {
  assert.deepEqual(records.filter((name) => !index.includes(`(${name})`)), []);
});

test("every decision record from 2026-11-03 on has a Prior art section (Meerkat mode, AGENTS.md)", async () => {
  const missing = [];
  for (const name of records.filter((name) => name >= "2026-11-03")) if (!/^## Prior art$/m.test(await readFile(new URL(name, dir), "utf8"))) missing.push(name);
  assert.deepEqual(missing, []);
});
