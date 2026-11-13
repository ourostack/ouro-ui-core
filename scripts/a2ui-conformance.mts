// Writes, or checks, what each A2UI conformance case must resolve to, using the reference resolver in src/a2ui.mts.
//   node scripts/a2ui-conformance.mts           write: the catalogs, and each case's "expect"
//   node scripts/a2ui-conformance.mts --check   fail when a catalog or a case's "expect" differs from what write gives
// Every renderer (web's a2ui-surface, Apple's OuroA2UI) runs these cases and must match "expect": for a valid stream,
// the tree of each surface; for an invalid one, each problem's code and path (and its refusal, when it has one).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveMessages } from "../src/a2ui.mts";
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
let drift = 0;
for (const [path, text] of files) {
  if (!check) {
    await writeFile(path, text);
    continue;
  }
  const have = await readFile(path, "utf8").catch(() => null);
  if (have !== text) {
    drift++;
    process.stderr.write(`a2ui: ${path.slice(dir.length)} ${have === null ? "is missing" : "differs from what the reference resolver gives"}. Fix: run pnpm a2ui:generate and review the diff.\n`);
  }
}
if (drift) process.exit(1);
process.stdout.write(`a2ui: ${files.size - 2} conformance cases and 2 catalogs ${check ? "match the reference" : "written"}.\n`);
