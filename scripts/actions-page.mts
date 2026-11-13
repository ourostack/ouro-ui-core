// pnpm actions:page: rewrites the claims section of standard/ax/actions.md from standard/ax/actions.claims.json.
import { readFile, writeFile } from "node:fs/promises";
import { actionClaimsPage, loadActionClaimSet } from "../src/action-claims.mts";

const json = new URL("../standard/ax/actions.claims.json", import.meta.url);
const md = new URL("../standard/ax/actions.md", import.meta.url);
const page = await readFile(md, "utf8");
const set = loadActionClaimSet(JSON.parse(await readFile(json, "utf8")));
await writeFile(md, page.slice(0, page.indexOf("## The claims")) + actionClaimsPage(set));
