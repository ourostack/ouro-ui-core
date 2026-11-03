import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { APPLE_CHECKED_BY, APPLE_SCOPES, APPLE_SURFACES, checkAppleClaimSet, claimSetHash, claimSetText, loadAppleClaimSet } from "../src/ax-claims.mts";

const file = new URL("../standard/ax/surfaces/apple.claims.json", import.meta.url);
const raw = await readFile(file, "utf8");
const set = JSON.parse(raw) as { version: string; claims: Record<string, unknown>[] };

test("the Apple claim set checks clean", () => {
  assert.deepEqual(checkAppleClaimSet(set), []);
  assert.equal(loadAppleClaimSet(set).version, "0.1.0");
});

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
  ];
  for (const e of expect) assert.ok(problems.some((p) => p.startsWith(e)), `missing: ${e}\n${problems.join("\n")}`);
  assert.throws(() => loadAppleClaimSet(bad), /the claim set has \d+ problems/);
  assert.deepEqual(checkAppleClaimSet(null), ["a claim set is { version, claims: [...] }. Fix: start from standard/ax/surfaces/apple.claims.json."]);
});

test("the hash is over canonical JSON, so key order does not change it", () => {
  const reordered = { claims: set.claims.map((c) => Object.fromEntries(Object.entries(c).reverse())), version: set.version };
  assert.equal(claimSetText(reordered), claimSetText(set));
  assert.equal(claimSetHash(set), createHash("sha256").update(claimSetText(set)).digest("hex"));
  assert.ok(APPLE_SCOPES.includes("intent"));
});

test("pnpm tokens publishes the claim set byte for byte, listed in the manifest", async () => {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, ["scripts/build.mts"], { cwd: new URL("../", import.meta.url) });
  const published = await readFile(new URL("../dist/ax/apple.claims.json", import.meta.url), "utf8");
  assert.equal(published, raw);
  const manifest = JSON.parse(await readFile(new URL("../dist/dist-manifest.json", import.meta.url), "utf8")) as { files: Record<string, string> };
  assert.equal(manifest.files["dist/ax/apple.claims.json"], createHash("sha256").update(raw).digest("hex"));
});

test("the standard's page lists every claim, and no other", async () => {
  const page = await readFile(new URL("../standard/ax/surfaces/apple.md", import.meta.url), "utf8");
  const listed = [...page.matchAll(/^\| `([a-z-]+\.[a-z-]+)` \|/gm)].map((m) => m[1]);
  assert.deepEqual(listed.sort(), set.claims.map((c) => c["id"] as string).sort());
});
