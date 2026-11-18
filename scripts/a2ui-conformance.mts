// Writes, or checks, what each A2UI conformance case must resolve to, using the reference resolver in src/a2ui.mts.
//   node scripts/a2ui-conformance.mts           write: the catalogs, and each case's "expect"
//   node scripts/a2ui-conformance.mts --check   fail when a catalog or a case's "expect" differs from what write gives
// Every renderer (web's a2ui-surface, Apple's OuroA2UI) runs these cases and must match "expect": for a valid stream,
// the tree of each surface; for an invalid one, each problem's code and path (and its refusal, when it has one).
// It also writes each tree update case's "expect" (standard/hx/composed/updates/, from src/composed.mts's
// applyTreeUpdate): every renderer that applies Ouro's own updates must match it, the tree and data an update gives
// or each problem's path (docs/decisions/2026-11-18-composed-tree-updates.md).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadCatalog, resolveMessages } from "../src/a2ui.mts";
import { applyTreeUpdate, type ComposedNode, type Json } from "../src/composed.mts";
import { renderCatalog } from "../src/a2ui-catalog.mts";
import recipe from "../test/fixtures/a2ui/recipe.actions.mts";

const dir = new URL("../standard/hx/a2ui/", import.meta.url).pathname;
const check = process.argv.includes("--check");
const files = new Map<string, string>([
  [join(dir, "catalog.json"), renderCatalog()],
  [join(dir, "conformance/recipe.catalog.json"), renderCatalog(recipe)],
]);
const catalogs: Record<string, unknown> = {
  "catalog.json": JSON.parse(files.get(join(dir, "catalog.json"))!),
  "recipe.catalog.json": JSON.parse(files.get(join(dir, "conformance/recipe.catalog.json"))!),
};
const casesDir = join(dir, "conformance/cases");
for (const name of (await readdir(casesDir)).filter((f) => f.endsWith(".json")).sort()) {
  const path = join(casesDir, name);
  const c = JSON.parse(await readFile(path, "utf8")) as { description: string; catalog: string; messages: unknown[]; source?: unknown; expect?: unknown };
  const cat = catalogs[c.catalog];
  if (!cat) throw new Error(`${name}: catalog ${c.catalog} is not one of ${Object.keys(catalogs).join(", ")}.`);
  const expect = resolveMessages(cat, c.messages);
  if (name.startsWith("invalid-") !== "problems" in expect) throw new Error(`${name}: ${"problems" in expect ? `doesn't validate: ${JSON.stringify(expect.problems)}` : "validates, but its name says it shouldn't"}.`);
  files.set(path, `${JSON.stringify({ description: c.description, ...(c.source ? { source: c.source } : {}), catalog: c.catalog, messages: c.messages, expect }, null, 2)}\n`);
}
const updatesDir = new URL("../standard/hx/composed/updates/", import.meta.url).pathname;
const updates = (await readdir(updatesDir)).filter((f) => f.endsWith(".json")).sort();
for (const name of updates) {
  const path = join(updatesDir, name);
  const c = JSON.parse(await readFile(path, "utf8")) as { description: string; catalog: string; tree: ComposedNode; data?: Json; update: unknown };
  const cat = catalogs[c.catalog];
  if (!cat) throw new Error(`${name}: catalog ${c.catalog} is not one of ${Object.keys(catalogs).join(", ")}.`);
  const expect = applyTreeUpdate(loadCatalog(cat), c.tree, c.data, c.update);
  if (name.startsWith("invalid-") !== "problems" in expect) throw new Error(`${name}: ${"problems" in expect ? `doesn't apply: ${JSON.stringify(expect.problems)}` : "applies, but its name says it shouldn't"}.`);
  files.set(path, `${JSON.stringify({ description: c.description, catalog: c.catalog, tree: c.tree, ...(c.data !== undefined ? { data: c.data } : {}), update: c.update, expect }, null, 2)}\n`);
}
let drift = 0;
for (const [path, text] of files) {
  if (!check) {
    await writeFile(path, text);
    continue;
  }
  const have = await readFile(path, "utf8").catch(() => null);
  if (have !== text) {
    drift++;
    process.stderr.write(`a2ui: ${path.startsWith(dir) ? path.slice(dir.length) : path.slice(updatesDir.length - "composed/updates/".length)} ${have === null ? "is missing" : "differs from what the reference resolver gives"}. Fix: run pnpm a2ui:generate and review the diff.\n`);
  }
}
if (drift) process.exit(1);
process.stdout.write(`a2ui: ${files.size - 2 - updates.length} conformance cases, ${updates.length} tree update cases and 2 catalogs ${check ? "match the reference" : "written"}.\n`);
