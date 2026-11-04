// pnpm tokens: writes every platform's output from tokens/ into dist/.
//   dist/web/**.css               Ouro HX for web (byte-identical to web's files; see tokens:parity)
//   dist/apple/OuroTokens.swift   Ouro HX for Apple
//   dist/swatches.html            every theme's resolved colours, to look at
//   dist/ax/apple.claims.json     Ouro AX for Apple's claim set, byte for byte from standard/ax/surfaces/
//   dist/hx/components.claims.json  Ouro HX's component claims, byte for byte from standard/hx/
//   dist/feel/feel.spec.json      Ouro Feel's spec, byte for byte from standard/feel/
//   dist/dist-manifest.json       { coreTag, files: { "dist/<path>": sha256 } }, for core-provenance.json
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
