// Rewrites the "The spec" section of standard/feel/feel.md from feel.spec.json: pnpm feel:page.
import { readFile, writeFile } from "node:fs/promises";
import { feelSpecPage, loadFeelSpec } from "../src/feel-spec.mts";

const root = new URL("../standard/feel/", import.meta.url);
const spec = loadFeelSpec(JSON.parse(await readFile(new URL("feel.spec.json", root), "utf8")));
const pageUrl = new URL("feel.md", root);
const page = await readFile(pageUrl, "utf8");
const at = page.indexOf("## The spec");
if (at < 0) throw new Error("feel-page: feel.md has no \"## The spec\" heading. Fix: restore it from git.");
await writeFile(pageUrl, page.slice(0, at) + feelSpecPage(spec));
console.log("standard/feel/feel.md: the spec section matches feel.spec.json.");
