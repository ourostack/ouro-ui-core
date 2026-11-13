// Ouro AX's action claims: what the one action model promises on every surface it projects to, as data its
// checks prove. The fields follow Ouro HX's component claims (src/hx-claims.mts), with `appliesTo` naming
// projections and `check` naming the check that proves the claim (core's test, or the command an app runs).

/** The surfaces one declaration projects to (src/actions.mts). */
export const ACTION_PROJECTIONS = Object.freeze(["cli", "mcp", "webmcp", "web-control", "app-intent", "swiftui-button", "reins"] as const);
export type ActionProjection = (typeof ACTION_PROJECTIONS)[number];

export interface ActionClaim {
  id: string;
  tier: "must" | "should";
  appliesTo: ActionProjection[];
  rule: string;
  why: string;
  evidence: { basis: "evaluation" | "hazard" | "principle"; source: string; finding: string };
  check: string;
  fix: string;
}

export interface ActionClaimSet {
  version: string;
  claims: ActionClaim[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const CLAIM_FIELDS = ["id", "tier", "appliesTo", "rule", "why", "evidence", "check", "fix"];
const EVIDENCE_FIELDS = ["basis", "source", "finding"];
const extra = (record: Record<string, unknown>, fields: string[]) => Object.keys(record).filter((k) => !fields.includes(k));

/** Every problem with an action claim set, each with its fix; empty when it is one. `must` needs a hazard or an evaluation. */
export function checkActionClaimSet(value: unknown): string[] {
  if (!isRecord(value) || !isText(value["version"]) || !Array.isArray(value["claims"])) {
    return ["a claim set is { version, claims: [...] }. Fix: start from standard/ax/actions.claims.json."];
  }
  const problems: string[] = [];
  if (!/^\d+\.\d+\.\d+$/.test(value["version"])) problems.push(`version is ${JSON.stringify(value["version"])}. Fix: a semver version such as "0.1.0".`);
  for (const k of extra(value, ["version", "claims"])) problems.push(`the claim set has a field it does not have, ${JSON.stringify(k)}. Fix: remove it.`);
  const seen = new Set<string>();
  value["claims"].forEach((c: unknown, i: number) => {
    const id = isRecord(c) && isText(c["id"]) ? c["id"] : `claim ${i}`;
    if (!isRecord(c)) return void problems.push(`${id}: is not an object. Fix: { ${CLAIM_FIELDS.join(", ")} }.`);
    for (const k of extra(c, CLAIM_FIELDS)) problems.push(`${id}: has a field claims do not have, ${JSON.stringify(k)}. Fix: remove it.`);
    if (isText(c["id"]) && !/^action\.[a-z]+(-[a-z]+)*$/.test(c["id"])) problems.push(`${id}: the id is not action.<name> in lowercase letters and hyphens. Fix: such as "action.projections-match".`);
    for (const field of ["id", "rule", "why", "check", "fix"]) if (!isText(c[field])) problems.push(`${id}: ${field} is empty. Fix: say it in one sentence.`);
    if (seen.has(id)) problems.push(`${id}: the id is used twice. Fix: give each claim its own id.`);
    seen.add(id);
    if (c["tier"] !== "must" && c["tier"] !== "should") problems.push(`${id}: tier is ${JSON.stringify(c["tier"])}. Fix: "must" or "should".`);
    const to = c["appliesTo"];
    if (!Array.isArray(to) || to.length === 0) problems.push(`${id}: appliesTo is empty. Fix: list the projections it covers, from ${ACTION_PROJECTIONS.join(", ")}.`);
    else for (const s of to) if (!(ACTION_PROJECTIONS as readonly unknown[]).includes(s)) problems.push(`${id}: appliesTo names ${JSON.stringify(s)}. Fix: one of ${ACTION_PROJECTIONS.join(", ")}.`);
    const e = c["evidence"];
    if (!isRecord(e) || !["evaluation", "hazard", "principle"].includes(e["basis"] as string) || !isText(e["source"]) || typeof e["finding"] !== "string") {
      return void problems.push(`${id}: evidence is not { basis, source, finding }. Fix: name the source, the run or the hazard.`);
    }
    for (const k of extra(e, EVIDENCE_FIELDS)) problems.push(`${id}: evidence has a field it does not have, ${JSON.stringify(k)}. Fix: { basis, source, finding } only.`);
    if (!/^https:\/\//.test(e["source"] as string)) problems.push(`${id}: evidence.source is not a link. Fix: link the source the claim comes from.`);
    if (e["basis"] !== "principle" && !isText(e["finding"])) problems.push(`${id}: evidence.finding is empty, but a ${e["basis"]} basis needs one. Fix: the harm it prevents, or what the run showed.`);
    if (c["tier"] === "must" && e["basis"] === "principle") problems.push(`${id}: a must claim needs an evaluation that shows the failure, or a stated hazard. Fix: tier: "should", or state the hazard.`);
  });
  return problems;
}

/** The claim set, checked; throws with every problem when it is not one. */
export function loadActionClaimSet(value: unknown): ActionClaimSet {
  const problems = checkActionClaimSet(value);
  if (problems.length) throw new Error(`action-claims: the claim set has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.join("\n")}`);
  return value as ActionClaimSet;
}

/** The "The claims" section of `standard/ax/actions.md`, rendered from the data, so the page cannot drift from it. */
export function actionClaimsPage(set: ActionClaimSet): string {
  const out = ["## The claims", ""];
  for (const c of set.claims) {
    out.push(`### \`${c.id}\``, "", `**${c.tier}**, for ${c.appliesTo.join(", ")}. ${c.rule}`, "");
    out.push(`- Why: ${c.why}`, `- Source: <${c.evidence.source}>. ${c.evidence.finding}`.trimEnd(), `- Checked by: ${c.check}`, `- Fix: ${c.fix}`, "");
  }
  return out.join("\n");
}
