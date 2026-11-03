// Ouro AX for Apple: the claim set's shape, its check, and the canonical text its hash is taken over.
// The fields are web's ax-claims fields (registry/ouro/ax/claims.ts in ourostack/ouro-ui) plus two:
// `appliesTo`, the surface types a claim covers, and `checkedBy`, which lane can prove it.
import { createHash } from "node:crypto";

/** The surface types of App Intents (fixed interface 4 of the program plan, with app skills from the Siri AI preview). */
export const APPLE_SURFACES = Object.freeze(["app-intent", "app-entity", "app-skill", "view-annotation"] as const);
export type AppleSurface = (typeof APPLE_SURFACES)[number];

/**
 * Where a claim applies, decided from the bundle's App Intents metadata, never from a hand-written waiver:
 * once per `app`; per `intent` and `parameter`; per `entity` and `property`; per `skill-bundle` and `skill`.
 */
export const APPLE_SCOPES = Object.freeze(["app", "intent", "parameter", "entity", "property", "skill-bundle", "skill"] as const);
export type AppleScope = (typeof APPLE_SCOPES)[number];

/**
 * How a claim is checked, which is also what a report can say it proved:
 * - `app-intents-metadata`: the App Intents metadata the build compiled into the bundle, the inventory the system registers;
 * - `app-intents-testing`: Apple's AppIntentsTesting, running intents and queries out of process against the live app;
 * - `skills-lint`: the app-skills bundle linter;
 * - `siri-evaluations`: SiriEvaluations scenario runs on a 27.3 beta OS, reported as pass rates;
 * - `person`: a person on a device.
 */
export const APPLE_CHECKED_BY = Object.freeze(["app-intents-metadata", "app-intents-testing", "skills-lint", "siri-evaluations", "person"] as const);
export type AppleCheckedBy = (typeof APPLE_CHECKED_BY)[number];

export interface AppleClaim {
  id: string;
  surface: "app-intents";
  tier: "must" | "should";
  applies: AppleScope;
  appliesTo: AppleSurface[];
  checkedBy: AppleCheckedBy;
  rule: string;
  why: string;
  evidence: { basis: "evaluation" | "hazard" | "principle"; source: string; finding: string };
  check: string;
  fix: string;
}

export interface AppleClaimSet {
  version: string;
  claims: AppleClaim[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Every problem with a claim set, each with its fix; empty when it is one. Same admission rule as web's ax-claims. */
export function checkAppleClaimSet(value: unknown): string[] {
  if (!isRecord(value) || !isText(value["version"]) || !Array.isArray(value["claims"])) {
    return ["a claim set is { version, claims: [...] }. Fix: start from standard/ax/surfaces/apple.claims.json."];
  }
  const problems: string[] = [];
  const seen = new Set<string>();
  value["claims"].forEach((c: unknown, i: number) => {
    const id = isRecord(c) && isText(c["id"]) ? c["id"] : `claim ${i}`;
    if (!isRecord(c)) return void problems.push(`${id}: is not an object. Fix: { id, surface, tier, applies, appliesTo, checkedBy, rule, why, evidence, check, fix }.`);
    for (const field of ["id", "rule", "why", "check", "fix"]) if (!isText(c[field])) problems.push(`${id}: ${field} is empty. Fix: say it in one sentence.`);
    if (seen.has(id)) problems.push(`${id}: the id is used twice. Fix: give each claim its own id.`);
    seen.add(id);
    if (c["surface"] !== "app-intents") problems.push(`${id}: surface is ${JSON.stringify(c["surface"])}. Fix: "app-intents".`);
    if (c["tier"] !== "must" && c["tier"] !== "should") problems.push(`${id}: tier is ${JSON.stringify(c["tier"])}. Fix: "must" or "should".`);
    if (!(APPLE_SCOPES as readonly unknown[]).includes(c["applies"])) problems.push(`${id}: applies is ${JSON.stringify(c["applies"])}. Fix: one of ${APPLE_SCOPES.join(", ")}.`);
    const to = c["appliesTo"];
    if (!Array.isArray(to) || to.length === 0) problems.push(`${id}: appliesTo is empty. Fix: list the surface types it covers, from ${APPLE_SURFACES.join(", ")}.`);
    else for (const s of to) if (!(APPLE_SURFACES as readonly unknown[]).includes(s)) problems.push(`${id}: appliesTo names ${JSON.stringify(s)}. Fix: one of ${APPLE_SURFACES.join(", ")}.`);
    if (!(APPLE_CHECKED_BY as readonly unknown[]).includes(c["checkedBy"])) problems.push(`${id}: checkedBy is ${JSON.stringify(c["checkedBy"])}. Fix: one of ${APPLE_CHECKED_BY.join(", ")}.`);
    const e = c["evidence"];
    if (!isRecord(e) || !["evaluation", "hazard", "principle"].includes(e["basis"] as string) || typeof e["source"] !== "string" || typeof e["finding"] !== "string") {
      return void problems.push(`${id}: evidence is not { basis, source, finding }. Fix: name the Apple page, the run or the hazard.`);
    }
    if (e["basis"] === "principle" && !/^https:\/\/developer\.apple\.com\//.test(e["source"])) problems.push(`${id}: evidence.source is not an Apple page. Fix: link the developer.apple.com page the claim comes from.`);
    if (e["basis"] === "evaluation" && (!isText(e["source"]) || !isText(e["finding"]))) problems.push(`${id}: an evaluation names its run and what it showed. Fix: evidence: { basis: "evaluation", source: "<the run's file>", finding: "<what Siri did>" }.`);
    if (e["basis"] === "hazard" && !isText(e["finding"])) problems.push(`${id}: a hazard is stated. Fix: evidence.finding: "<the harm it prevents>".`);
    if (c["tier"] === "must" && e["basis"] === "principle") problems.push(`${id}: a must claim needs an evaluation that shows the failure, or a stated hazard. Fix: tier: "should", or cite the run.`);
  });
  return problems;
}

/** The claim set, checked; throws with every problem when it is not one. */
export function loadAppleClaimSet(value: unknown): AppleClaimSet {
  const problems = checkAppleClaimSet(value);
  if (problems.length) throw new Error(`ax-claims: the claim set has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.join("\n")}`);
  return value as AppleClaimSet;
}

/** Canonical JSON (keys sorted at every level), the text the hash is taken over; the same rule as web's claimSetText. */
export function claimSetText(set: unknown): string {
  const sorted = (v: unknown): unknown => (Array.isArray(v) ? v.map(sorted) : isRecord(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v);
  return JSON.stringify(sorted(set));
}

/** The SHA-256 of the canonical text, which a report pins. */
export function claimSetHash(set: unknown): string {
  return createHash("sha256").update(claimSetText(set)).digest("hex");
}
