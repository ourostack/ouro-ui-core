// pnpm tokens: writes every platform's output from tokens/ into dist/.
//   dist/web/**.css               Ouro HX for web (byte-identical to web's files; see tokens:parity)
//   dist/apple/OuroTokens.swift   Ouro HX for Apple
//   dist/swatches.html            every theme's resolved colours, to look at
//   dist/ax/apple.claims.json     Ouro AX for Apple's claim set, byte for byte from standard/ax/surfaces/
//   dist/hx/components.claims.json  Ouro HX's component claims, byte for byte from standard/hx/
//   dist/feel/feel.spec.json      Ouro Feel's spec, byte for byte from standard/feel/
//   dist/actions/ouro-actions.mts the one action model's generator, byte for byte from src/actions.mts, for apps to vendor
//   dist/ax/actions.claims.json   Ouro AX's action claims, byte for byte from standard/ax/
//   dist/a2ui/ouro-a2ui.mts       the A2UI validator, resolver and MCP Apps helpers, byte for byte from src/a2ui.mts
//   dist/a2ui/ouro-a2ui-catalog.mts  the catalog generator, from src/a2ui-catalog.mts with its imports renamed to the vendored files
//   dist/hx/a2ui/catalog.json     Ouro HX's A2UI catalog, byte for byte from standard/hx/a2ui/
//   dist/dist-manifest.json       { coreTag, files: { "dist/<path>": sha256 } }, for core-provenance.json
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ACTIONS_VERSION } from "../src/actions.mts";
import { loadActionClaimSet } from "../src/action-claims.mts";
import { loadAppleClaimSet } from "../src/ax-claims.mts";
import { loadFeelSpec } from "../src/feel-spec.mts";
import { loadHxClaimSet } from "../src/hx-claims.mts";
import { renderApple } from "../src/apple.mts";
import { renderSwatches } from "../src/swatches.mts";
import { renderWeb } from "../src/web.mts";

const root = new URL("../", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8")) as { version: string };
const tag = `v${version}`;

const files = new Map<string, string>(await renderWeb());
files.set("apple/OuroTokens.swift", await renderApple(tag));
files.set("swatches.html", await renderSwatches(tag));

// The claim set is published as written, after checking it, so a platform pins the bytes it was reviewed as.
const appleClaims = await readFile(new URL("standard/ax/surfaces/apple.claims.json", root), "utf8");
loadAppleClaimSet(JSON.parse(appleClaims));
files.set("ax/apple.claims.json", appleClaims);
const hxClaims = await readFile(new URL("standard/hx/components.claims.json", root), "utf8");
loadHxClaimSet(JSON.parse(hxClaims));
files.set("hx/components.claims.json", hxClaims);
const feelSpec = await readFile(new URL("standard/feel/feel.spec.json", root), "utf8");
loadFeelSpec(JSON.parse(feelSpec));
files.set("feel/feel.spec.json", feelSpec);
const actionClaims = await readFile(new URL("standard/ax/actions.claims.json", root), "utf8");
loadActionClaimSet(JSON.parse(actionClaims));
files.set("ax/actions.claims.json", actionClaims);
// Apps vendor the generator itself; it imports only node: modules, so the file runs on its own.
if (ACTIONS_VERSION !== version) throw new Error(`src/actions.mts says ${ACTIONS_VERSION} but package.json says ${version}. Fix: make them agree.`);
const actions = await readFile(new URL("src/actions.mts", root), "utf8");
if (/^(?:import|export)\b[^;]*?\bfrom\s+["'](?!node:)/m.test(actions)) throw new Error("src/actions.mts imports something other than node: modules, so a vendored copy can't run alone. Fix: inline it.");
files.set("actions/ouro-actions.mts", actions);
// The A2UI module imports nothing at all, so web and Apple can vendor or port it whole.
const a2ui = await readFile(new URL("src/a2ui.mts", root), "utf8");
if (/^(?:import|export)\b[^;]*?\bfrom\s+["']/m.test(a2ui)) throw new Error("src/a2ui.mts imports something, so a vendored copy can't run alone. Fix: inline it.");
files.set("a2ui/ouro-a2ui.mts", a2ui);
const a2uiCatalog = (await readFile(new URL("src/a2ui-catalog.mts", root), "utf8")).replace('from "./actions.mts"', 'from "./ouro-actions.mts"').replace('from "./a2ui.mts"', 'from "./ouro-a2ui.mts"');
if (/from\s+["']\.\/(?!ouro-actions\.mts|ouro-a2ui\.mts)/.test(a2uiCatalog)) throw new Error("src/a2ui-catalog.mts imports a file the release doesn't ship. Fix: import only ./actions.mts and ./a2ui.mts.");
files.set("a2ui/ouro-a2ui-catalog.mts", a2uiCatalog);
files.set("hx/a2ui/catalog.json", await readFile(new URL("standard/hx/a2ui/catalog.json", root), "utf8"));

const manifest = {
  coreTag: tag,
  files: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([path, text]) => [`dist/${path}`, createHash("sha256").update(text).digest("hex")])),
};
files.set("dist-manifest.json", JSON.stringify(manifest, null, 2) + "\n");

for (const [path, text] of files) {
  const url = new URL(`dist/${path}`, root);
  await mkdir(new URL("./", url), { recursive: true });
  await writeFile(url, text);
}
console.log(`wrote ${files.size} files to dist/ for ${tag}`);
