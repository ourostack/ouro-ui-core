// pnpm tokens: writes every platform's output from tokens/ into dist/.
//   dist/web/**.css               Ouro HX for web (byte-identical to web's files; see tokens:parity)
//   dist/apple/OuroTokens.swift   Ouro HX for Apple
//   dist/android/OuroTokens.kt    Ouro HX for Android (Jetpack Compose)
//   dist/windows/OuroTokens.cs    Ouro HX for Windows (WinUI 3), every theme
//   dist/windows/OuroTokens.xaml  Ouro HX for Windows: the default theme as a ResourceDictionary, with HighContrast
//   dist/swatches.html            every theme's resolved colours, to look at
//   dist/ax/apple.claims.json     Ouro AX for Apple's claim set, byte for byte from standard/ax/surfaces/
//   dist/hx/components/*.json     Ouro HX's component specs and their schema, byte for byte from standard/hx/components/
//   dist/hx/components.claims.json  Ouro HX's component claims, byte for byte from standard/hx/
//   dist/feel/feel.spec.json      Ouro Feel's spec, byte for byte from standard/feel/
//   dist/actions/ouro-actions.mts the one action model's generator, byte for byte from src/actions.mts, for apps to vendor
//   dist/actions/ouro-actions-windows.mts  the Windows projections (App Actions, the MCP bundle, OuroActions.g.cs), from src/actions-windows.mts importing ./ouro-actions.mts
//   dist/ax/actions.claims.json   Ouro AX's action claims, byte for byte from standard/ax/
//   dist/composed/ouro-composed.mts  Ouro's composed UI: components, consent rules, the tree and its validator, byte for byte from src/composed.mts
//   dist/composed/ouro-mcp-app.mts   the MCP Apps adapter, from src/mcp-app.mts with its imports renamed to the vendored files
//   dist/a2ui/ouro-a2ui.mts       the A2UI adapter, from src/a2ui.mts with its imports renamed to the vendored files
//   dist/a2ui/ouro-a2ui-catalog.mts  the catalog generator, from src/a2ui-catalog.mts with its imports renamed to the vendored files
//   dist/hx/a2ui/catalog.json     Ouro HX's A2UI catalog, byte for byte from standard/hx/a2ui/
//   dist/dist-manifest.json       { coreTag, files: { "dist/<path>": sha256 } }, for core-provenance.json
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { ACTIONS_VERSION } from "../src/actions.mts";
import { loadActionClaimSet } from "../src/action-claims.mts";
import { loadAppleClaimSet } from "../src/ax-claims.mts";
import { loadFeelSpec } from "../src/feel-spec.mts";
import { loadHxClaimSet } from "../src/hx-claims.mts";
import { checkSpec, type ComponentSpec } from "../src/hx-specs.mts";
import { renderAndroid } from "../src/android.mts";
import { renderApple } from "../src/apple.mts";
import { renderSwatches } from "../src/swatches.mts";
import { renderWindowsCs, renderWindowsXaml } from "../src/windows.mts";
import { renderWeb } from "../src/web.mts";

const root = new URL("../", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8")) as { version: string };
const tag = `v${version}`;

const files = new Map<string, string>(await renderWeb());
files.set("apple/OuroTokens.swift", await renderApple(tag));
files.set("android/OuroTokens.kt", await renderAndroid(tag));
files.set("windows/OuroTokens.cs", await renderWindowsCs(tag));
files.set("windows/OuroTokens.xaml", await renderWindowsXaml(tag));
files.set("swatches.html", await renderSwatches(tag));

// The claim set is published as written, after checking it, so a platform pins the bytes it was reviewed as.
const appleClaims = await readFile(new URL("standard/ax/surfaces/apple.claims.json", root), "utf8");
loadAppleClaimSet(JSON.parse(appleClaims));
files.set("ax/apple.claims.json", appleClaims);
const hxClaims = await readFile(new URL("standard/hx/components.claims.json", root), "utf8");
loadHxClaimSet(JSON.parse(hxClaims));
files.set("hx/components.claims.json", hxClaims);
for (const name of (await readdir(new URL("standard/hx/components/", root))).filter((n) => n.endsWith(".json")).sort()) {
  const text = await readFile(new URL(`standard/hx/components/${name}`, root), "utf8");
  const problems = name.endsWith(".spec.json") ? checkSpec(JSON.parse(text) as ComponentSpec, loadHxClaimSet(JSON.parse(hxClaims))) : [];
  if (problems.length) throw new Error(`standard/hx/components/${name}:\n${problems.join("\n")}`);
  files.set(`hx/components/${name}`, text);
}
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
// Ouro's composed UI imports nothing at all, so web and Apple can vendor or port it whole. Each adapter imports only
// the composed module and other adapters, renamed to the names the release ships them under.
const vendored = async (src: string, allowed: readonly string[]): Promise<string> => {
  let text = await readFile(new URL(src, root), "utf8");
  for (const name of allowed) text = text.replaceAll(`from "./${name}.mts"`, `from "./ouro-${name}.mts"`);
  const stray = [...text.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm)].map((m) => m[1]!).filter((from) => !allowed.some((name) => from === `./ouro-${name}.mts`));
  if (stray.length) throw new Error(`${src} imports ${stray.join(", ")}, which the release doesn't ship beside it. Fix: import only ${allowed.length ? allowed.map((n) => `./${n}.mts`).join(" and ") : "nothing"}.`);
  return text;
};
files.set("composed/ouro-composed.mts", await vendored("src/composed.mts", []));
files.set("composed/ouro-mcp-app.mts", await vendored("src/mcp-app.mts", ["composed"]));
files.set("a2ui/ouro-a2ui.mts", await vendored("src/a2ui.mts", ["composed", "mcp-app"]));
// The Windows projection runs as a CLI, so it imports node: modules too, and otherwise only the action model.
const actionsWindows = (await readFile(new URL("src/actions-windows.mts", root), "utf8")).replace('from "./actions.mts"', 'from "./ouro-actions.mts"');
if (/^(?:import|export)\b[^;]*?\bfrom\s+["'](?!node:|\.\/ouro-actions\.mts["'])/m.test(actionsWindows)) throw new Error("src/actions-windows.mts imports something other than node: modules and ./actions.mts, so a vendored copy can't run beside ouro-actions.mts alone. Fix: inline it.");
files.set("actions/ouro-actions-windows.mts", actionsWindows);
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
