// pnpm tokens: writes every platform's output from tokens/ into dist/.
//   dist/web/**.css               Ouro HX for web (byte-identical to web's files; see tokens:parity)
//   dist/apple/OuroTokens.swift   Ouro HX for Apple
//   dist/swatches.html            every theme's resolved colours, to look at
//   dist/dist-manifest.json       { coreTag, files: { "dist/<path>": sha256 } }, for core-provenance.json
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { renderApple } from "../src/apple.mts";
import { renderSwatches } from "../src/swatches.mts";
import { renderWeb } from "../src/web.mts";

const root = new URL("../", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8")) as { version: string };
const tag = `v${version}`;

const files = new Map<string, string>(await renderWeb());
files.set("apple/OuroTokens.swift", await renderApple(tag));
files.set("swatches.html", await renderSwatches(tag));

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
