import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { actionClaimsPage, checkActionClaimSet, loadActionClaimSet } from "../src/action-claims.mts";

const set = JSON.parse(await readFile(new URL("../standard/ax/actions.claims.json", import.meta.url), "utf8")) as { version: string; claims: Record<string, unknown>[] };
const page = await readFile(new URL("../standard/ax/actions.md", import.meta.url), "utf8");

test("the action claim set checks clean", () => {
  assert.deepEqual(checkActionClaimSet(set), []);
  assert.equal(loadActionClaimSet(set).version, "0.1.0");
});

test("the page's claims section is rendered from the data, word for word (pnpm actions:page)", () => {
  assert.equal(page.slice(page.indexOf("## The claims")), actionClaimsPage(loadActionClaimSet(set)));
});

test("a must claim needs a hazard or an evaluation, with its finding", () => {
  const principle = structuredClone(set);
  principle.claims[1]!["evidence"] = { basis: "principle", source: "https://example.com", finding: "" };
  assert.ok(checkActionClaimSet(principle).some((p) => /a must claim needs/.test(p)));
  const empty = structuredClone(set);
  (empty.claims[2]!["evidence"] as { finding: string }).finding = "";
  assert.ok(checkActionClaimSet(empty).some((p) => /finding is empty/.test(p)));
});

test("unknown projections, extra fields and bad ids are problems with fixes", () => {
  const bad = structuredClone(set);
  bad.claims[0]!["appliesTo"] = ["android"];
  bad.claims[0]!["extra"] = 1;
  bad.claims[1]!["id"] = "Bad";
  const problems = checkActionClaimSet(bad);
  assert.ok(problems.some((p) => /appliesTo names "android"/.test(p)));
  assert.ok(problems.some((p) => /field claims do not have, "extra"/.test(p)));
  assert.ok(problems.some((p) => /not action\.<name>/.test(p)));
  assert.match(checkActionClaimSet(null)[0]!, /Fix:/);
  assert.throws(() => loadActionClaimSet(bad), /problems/);
});
