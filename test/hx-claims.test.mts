import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { HX_COMPONENTS, checkHxClaimSet, loadHxClaimSet } from "../src/hx-claims.mts";

const raw = await readFile(new URL("../standard/hx/components.claims.json", import.meta.url), "utf8");
const set = JSON.parse(raw) as { version: string; claims: Record<string, unknown>[] };
const page = await readFile(new URL("../standard/hx/components.md", import.meta.url), "utf8");

test("the HX component claim set checks clean", () => {
  assert.deepEqual(checkHxClaimSet(set), []);
  assert.equal(loadHxClaimSet(set).version, "0.1.0");
});

test("every claim says how Apple proves it, and every component is covered", () => {
  for (const c of set.claims) assert.ok((c["checks"] as Record<string, string>)["apple"], `${c["id"]} has no Apple check`);
  for (const name of HX_COMPONENTS) assert.ok(set.claims.some((c) => (c["appliesTo"] as string[]).includes(name)), `no claim covers ${name}`);
});

test("the page lists exactly the claims in the data", () => {
  const onPage = [...page.matchAll(/^### `([a-z]+\.[a-z-]+)`/gm)].map((m) => m[1]);
  assert.deepEqual(onPage, set.claims.map((c) => c["id"]));
});

test("checkHxClaimSet names each problem with its fix", () => {
  const good = set.claims[0]!;
  const problems = checkHxClaimSet({
    version: "1",
    claims: [
      { ...good, id: "a.one", appliesTo: [] },
      { ...good, id: "a.two", appliesTo: ["dialog"] },
      { ...good, id: "a.three", checks: {} },
      { ...good, id: "a.four", checks: { android: "x" } },
      { ...good, id: "a.five", evidence: { basis: "principle", source: "https://x", finding: "" } },
      { ...good, id: "a.six", notes: "typo" },
      { ...good, id: "a.one" },
      { ...good, id: "A" },
    ],
  });
  const expect = [
    'version is "1". Fix:',
    "a.one: appliesTo is empty. Fix:",
    'a.two: appliesTo names "dialog". Fix:',
    "a.three: checks is empty. Fix:",
    'a.four: checks names "android". Fix:',
    "a.five: a must claim needs an evaluation that shows the failure, or a stated hazard. Fix:",
    'a.six: has a field claims do not have, "notes". Fix:',
    "a.one: the id is used twice. Fix:",
    "A: the id is not <area>.<name>",
  ];
  for (const e of expect) assert.ok(problems.some((p) => p.startsWith(e)), `missing: ${e}\n${problems.join("\n")}`);
});
