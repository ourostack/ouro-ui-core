import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { APPLE_CHECKED_BY, APPLE_SCOPES, APPLE_SURFACES, checkAppleClaimSet, claimSetHash, claimSetText, loadAppleClaimSet } from "../src/ax-claims.mts";

const file = new URL("../standard/ax/surfaces/apple.claims.json", import.meta.url);
const raw = await readFile(file, "utf8");
const PINNED_HASH = "27b3ea5e80b47c18c90c6bf25a832da489dae4a043532d5f23414917d06be9a0";
const set = JSON.parse(raw) as { version: string; claims: Record<string, unknown>[] };

test("the Apple claim set checks clean", () => {
  assert.deepEqual(checkAppleClaimSet(set), []);
  assert.equal(loadAppleClaimSet(set).version, "0.1.0");
});

// Loosen this when the first claim is admitted as must, with its evaluation or hazard.
test("every Apple claim starts at should, cites an Apple source and says how it is checked", () => {
  for (const c of set.claims) {
    assert.equal(c["tier"], "should", `${c["id"]} is not should`);
    const e = c["evidence"] as { basis: string; source: string };
    assert.equal(e.basis, "principle", `${c["id"]}'s basis`);
    assert.match(e.source, /^https:\/\/developer\.apple\.com\//, `${c["id"]}'s source`);
    assert.ok((APPLE_CHECKED_BY as readonly unknown[]).includes(c["checkedBy"]), `${c["id"]}'s checkedBy`);
  }
});

test("every surface type and every way of checking has claims", () => {
  for (const s of APPLE_SURFACES) assert.ok(set.claims.some((c) => (c["appliesTo"] as string[]).includes(s)), `no claim for ${s}`);
  for (const k of APPLE_CHECKED_BY) assert.ok(set.claims.some((c) => c["checkedBy"] === k), `no claim checked by ${k}`);
});

test("checkAppleClaimSet names each problem with its fix", () => {
  const good = set.claims[0]!;
  const bad = {
    version: "0.1.0",
    claims: [
      { ...good, appliesTo: [] },
      { ...good, id: "b", appliesTo: ["app-widget"] },
      { ...good, id: "c", checkedBy: "vibes" },
      { ...good, id: "d", tier: "must" },
      { ...good, id: "e", applies: "everything" },
      { ...good, id: "f", surface: "cli" },
      { ...good, id: "g", evidence: { basis: "principle", source: "a blog", finding: "" } },
      { ...good, id: "b" },
      { ...good, id: "h", notes: "a typo'd field" },
      { ...good, id: "i", appliesTo: ["app-intent", "app-intent"] },
      { ...good, id: "j", applies: "skill", appliesTo: ["app-intent"] },
      { ...good, id: "k.v2" },
      { ...good, id: "l", evidence: { basis: "principle", source: "https://developer.apple.com/x", finding: "", url: "" } },
    ],
  };
  const problems = checkAppleClaimSet(bad);
  const expect = [
    `${good["id"]}: appliesTo is empty. Fix:`,
    `b: appliesTo names "app-widget". Fix:`,
    `c: checkedBy is "vibes". Fix:`,
    `d: a must claim needs an evaluation that shows the failure, or a stated hazard. Fix:`,
    `e: applies is "everything". Fix:`,
    `f: surface is "cli". Fix:`,
    `g: evidence.source is not an Apple page. Fix:`,
    `b: the id is used twice. Fix:`,
    `h: has a field claims do not have, "notes". Fix:`,
    `i: appliesTo names "app-intent" twice. Fix:`,
    `j: applies is "skill" but appliesTo is not ["app-skill"]. Fix:`,
    `k.v2: the id is not <area>.<name> in lowercase letters and hyphens. Fix:`,
    `l: evidence has a field it does not have, "url". Fix:`,
  ];
  for (const e of expect) assert.ok(problems.some((p) => p.startsWith(e)), `missing: ${e}\n${problems.join("\n")}`);
  assert.throws(() => loadAppleClaimSet(bad), /the claim set has \d+ problems/);
  assert.ok(checkAppleClaimSet({ version: "1", claims: [] }).some((p) => p.startsWith(`version is "1". Fix:`)));
  assert.ok(checkAppleClaimSet({ version: "0.1.0", claims: [], extra: 1 }).some((p) => p.startsWith(`the claim set has a field it does not have, "extra". Fix:`)));
  assert.deepEqual(checkAppleClaimSet(null), ["a claim set is { version, claims: [...] }. Fix: start from standard/ax/surfaces/apple.claims.json."]);
});

test("the hash is over canonical JSON, so key order does not change it", () => {
  const reordered = { claims: set.claims.map((c) => Object.fromEntries(Object.entries(c).reverse())), version: set.version };
  assert.equal(claimSetText(reordered), claimSetText(set));
  assert.equal(claimSetHash(set), createHash("sha256").update(claimSetText(set)).digest("hex"));
  assert.ok(APPLE_SCOPES.includes("intent"));
});

test("the canonical text matches the shared test vector other platforms assert", async () => {
  // Swift's JSONSerialization .sortedKeys sorts case-insensitively, so a consumer must sort by code unit itself.
  const vector = JSON.parse(await readFile(new URL("./fixtures/canonical-json-vector.json", import.meta.url), "utf8")) as { input: unknown; text: string; sha256: string };
  assert.equal(claimSetText(vector.input), vector.text);
  assert.equal(claimSetHash(vector.input), vector.sha256);
  assert.equal(vector.text, '{"B":[true,null,{"Z":"a\\"b","z":"é/x"}],"aB":0.5,"a_":"","ab":{"Y":-3,"y":2},"b":1}');
});

test("the 0.1.0 claim set's canonical hash is pinned", () => {
  // A platform's report pins this; change it only with the set's version.
  assert.equal(set.version, "0.1.0");
  assert.equal(claimSetHash(set), PINNED_HASH);
});

test("pnpm tokens publishes the claim set byte for byte, listed in the manifest", async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["scripts/build.mts"], { cwd: new URL("../", import.meta.url) });
  const published = await readFile(new URL("../dist/ax/apple.claims.json", import.meta.url), "utf8");
  assert.equal(published, raw);
  const manifest = JSON.parse(await readFile(new URL("../dist/dist-manifest.json", import.meta.url), "utf8")) as { files: Record<string, string> };
  assert.equal(manifest.files["dist/ax/apple.claims.json"], createHash("sha256").update(raw).digest("hex"));
});

test("the standard's page lists every claim, and no other, with its rule, lane and source", async () => {
  const page = await readFile(new URL("../standard/ax/surfaces/apple.md", import.meta.url), "utf8");
  const lanes: Record<string, string> = { "app-intents-metadata": "metadata", "app-intents-testing": "AppIntentsTesting", "skills-lint": "skills linter", "siri-evaluations": "SiriEvaluations", person: "a person" };
  const rows = new Map([...page.matchAll(/^\| `([a-z-]+\.[a-z-]+)` \| (.+) \| (.+) \| \[[^\]]+\]\((\S+)\) \|$/gm)].map((m) => [m[1]!, { rule: m[2], lane: m[3], source: m[4] }]));
  assert.deepEqual([...rows.keys()].sort(), set.claims.map((c) => c["id"] as string).sort());
  for (const c of set.claims) {
    assert.deepEqual(rows.get(c["id"] as string), { rule: c["rule"], lane: lanes[c["checkedBy"] as string], source: (c["evidence"] as { source: string }).source }, `${c["id"]}'s row`);
  }
});
