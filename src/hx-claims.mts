// Ouro HX's component claims: what every platform's Button, Empty, Alert, Sheet and Toast promise a person,
// as data each platform's tests prove. The fields follow Ouro AX's claims (src/ax-claims.mts), minus the App
// Intents scopes, plus `checks`: how each platform proves the claim.
import { claimSetHash, claimSetText } from "./ax-claims.mts";

/** The components the set covers, by web's names (Apple's OuroEmptyState is `empty`; its OuroBanner is `alert`). */
export const HX_COMPONENTS = Object.freeze(["button", "empty", "alert", "sheet", "toast", "badge", "card", "item"] as const);
export type HxComponent = (typeof HX_COMPONENTS)[number];
export const HX_PLATFORMS = Object.freeze(["web", "apple"] as const);
export type HxPlatform = (typeof HX_PLATFORMS)[number];

export interface HxClaim {
  id: string;
  tier: "must" | "should";
  appliesTo: HxComponent[];
  rule: string;
  why: string;
  evidence: { basis: "evaluation" | "hazard" | "principle"; source: string; finding: string };
  checks: Partial<Record<HxPlatform, string>>;
  fix: string;
}

export interface HxClaimSet {
  version: string;
  claims: HxClaim[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const CLAIM_FIELDS = ["id", "tier", "appliesTo", "rule", "why", "evidence", "checks", "fix"];
const EVIDENCE_FIELDS = ["basis", "source", "finding"];
const extra = (record: Record<string, unknown>, fields: string[]) => Object.keys(record).filter((k) => !fields.includes(k));

/** Every problem with an HX claim set, each with its fix; empty when it is one. Web's admission rule: `must` needs a hazard or an evaluation. */
export function checkHxClaimSet(value: unknown): string[] {
  if (!isRecord(value) || !isText(value["version"]) || !Array.isArray(value["claims"])) {
    return ["a claim set is { version, claims: [...] }. Fix: start from standard/hx/components.claims.json."];
  }
  const problems: string[] = [];
  if (!/^\d+\.\d+\.\d+$/.test(value["version"])) problems.push(`version is ${JSON.stringify(value["version"])}. Fix: a semver version such as "0.1.0".`);
  for (const k of extra(value, ["version", "claims"])) problems.push(`the claim set has a field it does not have, ${JSON.stringify(k)}. Fix: remove it, or add it to the shape in src/hx-claims.mts.`);
  const seen = new Set<string>();
  value["claims"].forEach((c: unknown, i: number) => {
    const id = isRecord(c) && isText(c["id"]) ? c["id"] : `claim ${i}`;
    if (!isRecord(c)) return void problems.push(`${id}: is not an object. Fix: { ${CLAIM_FIELDS.join(", ")} }.`);
    for (const k of extra(c, CLAIM_FIELDS)) problems.push(`${id}: has a field claims do not have, ${JSON.stringify(k)}. Fix: remove it, or add it to the shape in src/hx-claims.mts.`);
    if (isText(c["id"]) && !/^[a-z]+\.[a-z]+(-[a-z]+)*$/.test(c["id"])) problems.push(`${id}: the id is not <area>.<name> in lowercase letters and hyphens. Fix: such as "target.touch".`);
    for (const field of ["id", "rule", "why", "fix"]) if (!isText(c[field])) problems.push(`${id}: ${field} is empty. Fix: say it in one sentence.`);
    if (seen.has(id)) problems.push(`${id}: the id is used twice. Fix: give each claim its own id.`);
    seen.add(id);
    if (c["tier"] !== "must" && c["tier"] !== "should") problems.push(`${id}: tier is ${JSON.stringify(c["tier"])}. Fix: "must" or "should".`);
    const to = c["appliesTo"];
    if (!Array.isArray(to) || to.length === 0) problems.push(`${id}: appliesTo is empty. Fix: list the components it covers, from ${HX_COMPONENTS.join(", ")}.`);
    else {
      for (const s of to) if (!(HX_COMPONENTS as readonly unknown[]).includes(s)) problems.push(`${id}: appliesTo names ${JSON.stringify(s)}. Fix: one of ${HX_COMPONENTS.join(", ")} (web's names).`);
      for (const s of new Set(to)) if (to.filter((x) => x === s).length > 1) problems.push(`${id}: appliesTo names ${JSON.stringify(s)} twice. Fix: list each component once.`);
    }
    const checks = c["checks"];
    if (!isRecord(checks) || Object.keys(checks).length === 0) problems.push(`${id}: checks is empty. Fix: { "apple": "<the test that proves it>" }, one entry per platform that proves it.`);
    else for (const [p, how] of Object.entries(checks)) {
      if (!(HX_PLATFORMS as readonly string[]).includes(p)) problems.push(`${id}: checks names ${JSON.stringify(p)}. Fix: one of ${HX_PLATFORMS.join(", ")}.`);
      else if (!isText(how)) problems.push(`${id}: checks.${p} is empty. Fix: name the test that proves it.`);
    }
    const e = c["evidence"];
    if (!isRecord(e) || !["evaluation", "hazard", "principle"].includes(e["basis"] as string) || !isText(e["source"]) || typeof e["finding"] !== "string") {
      return void problems.push(`${id}: evidence is not { basis, source, finding }. Fix: name the guideline, the run or the hazard.`);
    }
    for (const k of extra(e, EVIDENCE_FIELDS)) problems.push(`${id}: evidence has a field it does not have, ${JSON.stringify(k)}. Fix: { basis, source, finding } only.`);
    if (!/^https:\/\//.test(e["source"] as string) && e["basis"] !== "evaluation") problems.push(`${id}: evidence.source is not a link. Fix: link the WCAG or HIG page the claim comes from.`);
    if (e["basis"] !== "principle" && !isText(e["finding"])) problems.push(`${id}: evidence.finding is empty, but a ${e["basis"]} basis needs one. Fix: evidence.finding: "<the harm it prevents, or what the run showed>".`);
    if (c["tier"] === "must" && e["basis"] === "principle") problems.push(`${id}: a must claim needs an evaluation that shows the failure, or a stated hazard. Fix: tier: "should", or state the hazard.`);
  });
  return problems;
}

/** The claim set, checked; throws with every problem when it is not one. */
export function loadHxClaimSet(value: unknown): HxClaimSet {
  const problems = checkHxClaimSet(value);
  if (problems.length) throw new Error(`hx-claims: the claim set has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.join("\n")}`);
  return value as HxClaimSet;
}

/** The "The claims" section of `standard/hx/components.md`, rendered from the data, so the page cannot drift from it. */
export function hxClaimsPage(set: HxClaimSet): string {
  const out = ["## The claims", ""];
  for (const c of set.claims) {
    out.push(`### \`${c.id}\``, "", `**${c.tier}**, for ${c.appliesTo.join(", ")}. ${c.rule}`, "");
    out.push(`- Why: ${c.why}`, `- Source: <${c.evidence.source}>. ${c.evidence.finding}`, "");
    for (const p of HX_PLATFORMS) if (c.checks[p]) out.push(`- Checked on ${p}: ${c.checks[p]}`);
    out.push(`- Fix: ${c.fix}`, "");
  }
  return out.join("\n");
}

export { claimSetHash, claimSetText };
