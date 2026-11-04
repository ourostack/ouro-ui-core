// Rewrites the "The claims" section of standard/hx/components.md from components.claims.json: pnpm hx:page.
// The section above it is hand-written; the test fails when the claims section and the data disagree.
import { readFile, writeFile } from "node:fs/promises";
import { hxClaimsPage, loadHxClaimSet } from "../src/hx-claims.mts";

const root = new URL("../standard/hx/", import.meta.url);
const set = loadHxClaimSet(JSON.parse(await readFile(new URL("components.claims.json", root), "utf8")));
const pageUrl = new URL("components.md", root);
const page = await readFile(pageUrl, "utf8");
const at = page.indexOf("## The claims");
if (at < 0) throw new Error("hx-page: components.md has no \"## The claims\" heading. Fix: restore it from git.");
await writeFile(pageUrl, page.slice(0, at) + hxClaimsPage(set));
console.log("standard/hx/components.md: the claims section matches components.claims.json.");
