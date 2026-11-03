// tokens:parity — every generated web file must equal web's file at the pinned tag, byte for byte.
// It compares bytes, never parsed CSS: one changed byte changes every web app that loads the file.
//
//   node scripts/parity.mts                 compare with parity.json's webTag (fetched from GitHub)
//   node scripts/parity.mts --tag v1.3.4    compare with another tag
//   node scripts/parity.mts --latest        also say whether web has a newer release than webTag
//   node scripts/parity.mts --json out.json write the result as JSON too
//   node scripts/parity.mts --dist <dir>    read the generated files from <dir> instead of the repository
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

interface ParityConfig {
  webRepo: string;
  webTag: string;
  files: Record<string, string>;
}

interface FileResult {
  generated: string;
  web: string;
  ok: boolean;
  bytes: number;
  sha256: string | null;
  webSha256: string | null;
  firstDifference: { byte: number; line: number } | null;
  error?: string;
}

const { values: args } = parseArgs({
  options: {
    tag: { type: "string" },
    latest: { type: "boolean", default: false },
    json: { type: "string" },
    dist: { type: "string" },
  },
});

const root = new URL("../", import.meta.url);
const config = JSON.parse(await readFile(new URL("parity.json", root), "utf8")) as ParityConfig;
const tag = args.tag ?? config.webTag;
// The generated files live under dist/ in the repository, or directly under --dist.
const generatedRoot = args.dist ? pathToFileURL(resolve(args.dist) + "/") : new URL("dist/", root);

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function webBytes(path: string): Promise<Uint8Array> {
  const url = `https://raw.githubusercontent.com/${config.webRepo}/${tag}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function firstDifference(a: Uint8Array, b: Uint8Array): { byte: number; line: number } | null {
  const length = Math.min(a.length, b.length);
  let line = 1;
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return { byte: i, line };
    if (a[i] === 0x0a) line++;
  }
  return a.length === b.length ? null : { byte: length, line };
}

const results: FileResult[] = [];
for (const [generated, web] of Object.entries(config.files)) {
  const result: FileResult = { generated, web, ok: false, bytes: 0, sha256: null, webSha256: null, firstDifference: null };
  try {
    const expected = await webBytes(web);
    result.webSha256 = sha256(expected);
    const actual = new Uint8Array(await readFile(new URL(generated.replace(/^dist\//, ""), generatedRoot)));
    result.bytes = actual.length;
    result.sha256 = sha256(actual);
    result.firstDifference = firstDifference(actual, expected);
    result.ok = result.firstDifference === null;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  results.push(result);
}

const lines: string[] = [];
for (const r of results) {
  const source = `${config.webRepo}@${tag}:${r.web}`;
  if (r.ok) lines.push(`ok    ${r.generated} == ${source} (${r.bytes} bytes, sha256 ${r.sha256})`);
  else if (r.error) lines.push(`FAIL  ${r.generated} vs ${source}: ${r.error}`);
  else lines.push(`FAIL  ${r.generated} differs from ${source} at byte ${r.firstDifference!.byte} (line ${r.firstDifference!.line})`);
}
const passed = results.filter((r) => r.ok).length;
lines.push(`${passed}/${results.length} files byte-identical to ${config.webRepo}@${tag}`);

let latestTag: string | null = null;
if (args.latest) {
  const response = await fetch(`https://api.github.com/repos/${config.webRepo}/releases/latest`, {
    headers: { accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
  });
  if (response.ok) {
    latestTag = ((await response.json()) as { tag_name: string }).tag_name;
    lines.push(latestTag === tag ? `web's latest release is ${latestTag}, the tag compared` : `note: web's latest release is ${latestTag}; parity.json pins ${config.webTag}`);
  } else lines.push(`note: could not read web's latest release (HTTP ${response.status})`);
}

console.log(lines.join("\n"));
if (args.json) await writeFile(args.json, JSON.stringify({ webRepo: config.webRepo, tag, latestTag, passed, total: results.length, results }, null, 2) + "\n");
process.exitCode = passed === results.length ? 0 : 1;
