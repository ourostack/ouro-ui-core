// Release sets (docs/decisions/2026-11-19-release-sets-support-company-registry.md): one release of each Ouro UI
// repository that meets the same core minor. It reads, at each repository's newest release tag, the files where that
// release records the core it copied, and writes release-sets.json: each kit's tag and core tags, and the set, or what
// keeps one from existing. Nothing in it is typed by hand.
//
//   node scripts/release-sets.mts           fetch the newest releases and write release-sets.json
//   node scripts/release-sets.mts --check   fail when release-sets.json differs from what the newest releases say
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Where each kit records the core it copied, by what the copy is for. */
export const SOURCES: Record<string, { repository: string; files: Record<string, { path: string; read: (json: any) => string | undefined }> }> = {
  web: {
    repository: "ourostack/ouro-ui",
    files: {
      tokens: { path: "scripts/parity-data/provenance.json", read: (j) => j.coreTag },
      tree: { path: "test/fixtures/a2ui/core.json", read: (j) => j.coreTag },
      actions: { path: "scripts/ouro-actions/dist-manifest.json", read: (j) => j.coreTag },
    },
  },
  apple: {
    repository: "ourostack/ouro-ui-apple",
    files: { tokens: { path: "core-provenance.json", read: (j) => j.coreTag }, tree: { path: "core-provenance.json", read: (j) => j.tree?.coreTag } },
  },
  windows: { repository: "ourostack/ouro-ui-windows", files: { core: { path: "core-provenance.json", read: (j) => j.coreTag } } },
  android: { repository: "ourostack/ouro-ui-android", files: { core: { path: "core-provenance.json", read: (j) => j.coreTag } } },
};

export interface Kit {
  tag: string;
  /** The core tag each part of the kit copied, by part. */
  core: Record<string, string>;
}

/** A tag's minor line, `v0.19.3` → `v0.19`; from 1.0 the major line, `v1.4.0` → `v1`. */
export const line = (tag: string): string => {
  const m = /^v(\d+)\.(\d+)\.\d+/.exec(tag);
  if (!m) throw new Error(`${tag} is not a release tag such as v0.19.0`);
  return m[1] === "0" ? `v0.${m[2]}` : `v${m[1]}`;
};

/**
 * The release set the kits make: the core line every part of every kit meets, or null with each part that keeps the set
 * from existing, measured against the newest line any part meets.
 */
export function releaseSet(kits: Record<string, Kit>): { set: { core: string; kits: Record<string, string> } | null; behind: string[] } {
  const parts = Object.entries(kits).flatMap(([name, kit]) => Object.entries(kit.core).map(([part, tag]) => ({ name, part, tag, line: line(tag) })));
  const lines = [...new Set(parts.map((p) => p.line))];
  if (lines.length === 1) return { set: { core: lines[0]!, kits: Object.fromEntries(Object.entries(kits).map(([name, kit]) => [name, kit.tag])) }, behind: [] };
  const order = (l: string) => l.slice(1).split(".").map(Number);
  const newest = lines.sort((a, b) => { const [x, y] = [order(a), order(b)]; return x[0]! - y[0]! || (x[1] ?? 0) - (y[1] ?? 0); }).at(-1)!;
  return { set: null, behind: parts.filter((p) => p.line !== newest).map((p) => `${p.name} ${kits[p.name]!.tag} ${p.part} meets core ${p.tag}, not ${newest}`) };
}

/** The file, from each kit's newest release. `get` reads a URL as text. */
export async function readKits(get: (url: string) => Promise<string>): Promise<Record<string, Kit>> {
  const kits: Record<string, Kit> = {};
  for (const [name, source] of Object.entries(SOURCES)) {
    const tag = JSON.parse(await get(`https://api.github.com/repos/${source.repository}/releases/latest`)).tag_name as string;
    const core: Record<string, string> = {};
    for (const [part, file] of Object.entries(source.files)) {
      const found = file.read(JSON.parse(await get(`https://raw.githubusercontent.com/${source.repository}/${tag}/${file.path}`)));
      if (!found) throw new Error(`${source.repository} ${tag}: ${file.path} names no core tag for its ${part}`);
      core[part] = found;
    }
    kits[name] = { tag, core };
  }
  return kits;
}

export function render(kits: Record<string, Kit>): string {
  return `${JSON.stringify({ $comment: "Written by node scripts/release-sets.mts from each Ouro UI repository's newest release; never edit it. `set` is the release set when every part of every kit meets one core line, else null, and `behind` lists what keeps it from existing.", kits, ...releaseSet(kits) }, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const get = async (url: string) => {
    const response = await fetch(url, { headers: url.startsWith("https://api.github.com/") && token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
    return response.text();
  };
  const file = fileURLToPath(new URL("../release-sets.json", import.meta.url));
  const next = render(await readKits(get));
  if (process.argv.includes("--check")) {
    if (readFileSync(file, "utf8") !== next) {
      console.error("release-sets.json differs from the newest releases. Fix: node scripts/release-sets.mts, and commit it.");
      process.exitCode = 1;
    } else console.log("release-sets.json matches the newest releases.");
  } else {
    writeFileSync(file, next);
    console.log(next);
  }
}
