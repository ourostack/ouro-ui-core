// Ouro HX's component specs: a component specified once (API, states, tokens, claims, accessibility, conformance
// cases), which each platform vendors by hash and renders by hand (docs/decisions/2026-11-14-native-kits.md).
// standard/hx/components/component.schema.json is the shape; this checks what a schema can't: that the claims are
// exactly the ones whose appliesTo names the component, that every token exists, and that every case uses the API.
import { APPLE_COLORS } from "./apple.mts";
import type { HxClaimSet } from "./hx-claims.mts";

export interface SpecProperty { name: string; type: "string" | "boolean" | "number" | "enum" | "action"; description: string; required?: boolean; values?: string[]; default?: string | boolean | number }
export interface ComponentSpec {
  name: string;
  version: string;
  role: "control" | "label" | "group";
  properties: SpecProperty[];
  slots: { name: string; description: string; decorative?: boolean }[];
  events: { name: string; description: string }[];
  states: { name: string; description: string }[];
  tokens: Record<string, string>;
  metrics: Record<string, number>;
  claims: string[];
  cases: { id: string; props: Record<string, unknown>; slots?: Record<string, string>; person: string; agent: { role: string; name: string; focusable?: boolean } }[];
}

/** Every problem with a spec beyond its schema, each with its fix; empty when there are none. */
export function checkSpec(spec: ComponentSpec, claims: HxClaimSet): string[] {
  const at = spec.name;
  const problems: string[] = [];
  const want = claims.claims.filter((c) => (c.appliesTo as string[]).includes(spec.name)).map((c) => c.id).sort();
  const have = [...spec.claims].sort();
  if (JSON.stringify(want) !== JSON.stringify(have)) problems.push(`${at}: claims are ${JSON.stringify(have)}, but components.claims.json applies ${JSON.stringify(want)}. Fix: list exactly the claims whose appliesTo names "${at}".`);
  const tone = spec.properties.find((p) => p.name === "tone");
  for (const [part, token] of Object.entries(spec.tokens)) {
    const names = token.includes("{tone}") ? (tone?.values ?? []).map((v) => token.replace("{tone}", v)) : [token];
    if (token.includes("{tone}") && !tone) problems.push(`${at}: tokens.${part} uses {tone}, but there is no tone property. Fix: add one, or name the token.`);
    for (const n of names) if (!(APPLE_COLORS as readonly string[]).includes(n)) problems.push(`${at}: tokens.${part} names "${n}", which is not a colour token. Fix: one of ${APPLE_COLORS.slice(0, 23).join(", ")}.`);
  }
  const seen = new Set<string>();
  for (const p of spec.properties) {
    if (seen.has(p.name)) problems.push(`${at}: property "${p.name}" is listed twice. Fix: list it once.`);
    seen.add(p.name);
    if (p.type === "enum" && !p.values) problems.push(`${at}: property "${p.name}" is an enum with no values. Fix: list them.`);
    if (p.type !== "enum" && p.values) problems.push(`${at}: property "${p.name}" has values but is a ${p.type}. Fix: make it an enum, or drop the values.`);
    if (p.type === "enum" && p.default !== undefined && !p.values?.includes(String(p.default))) problems.push(`${at}: property "${p.name}" defaults to ${JSON.stringify(p.default)}, which is not one of its values. Fix: pick one of ${p.values?.join(", ")}.`);
  }
  if (spec.role === "control" && !spec.events.some((e) => e.name === "press")) problems.push(`${at}: is a control with no press event. Fix: add { name: "press" }, or make its role label or group.`);
  for (const c of spec.cases) {
    for (const [k, v] of Object.entries(c.props)) {
      const p = spec.properties.find((x) => x.name === k);
      if (!p) problems.push(`${at}: case ${c.id} sets "${k}", which is not a property. Fix: use ${spec.properties.map((x) => x.name).join(", ")}.`);
      else if (p.type === "enum" && !p.values?.includes(String(v))) problems.push(`${at}: case ${c.id} sets ${k} to ${JSON.stringify(v)}. Fix: one of ${p.values?.join(", ")}.`);
      else if ((p.type === "string" || p.type === "action") && typeof v !== "string") problems.push(`${at}: case ${c.id} sets ${k} to a ${typeof v}. Fix: a string.`);
    }
    for (const k of Object.keys(c.slots ?? {})) if (!spec.slots.some((s) => s.name === k)) problems.push(`${at}: case ${c.id} fills slot "${k}", which the spec doesn't have. Fix: use ${spec.slots.map((s) => s.name).join(", ") || "no slots"}.`);
    for (const p of spec.properties.filter((x) => x.required)) if (!(p.name in c.props) && !(p.name === "label" && "action" in c.props)) problems.push(`${at}: case ${c.id} leaves out required "${p.name}". Fix: set it.`);
  }
  return problems;
}
