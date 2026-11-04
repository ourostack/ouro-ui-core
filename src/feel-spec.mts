// Ouro Feel's spec: the scenarios, launch stages, measures, seed and report every driver shares, so
// web and native numbers compare side by side under the same names (standard/feel/feel.spec.json).

export const FEEL_UNITS = Object.freeze(["count", "px", "ms"] as const);
export type FeelUnit = (typeof FEEL_UNITS)[number];
export const FEEL_DRIVERS = Object.freeze(["web", "apple", "windows"] as const);
export type FeelDriver = (typeof FEEL_DRIVERS)[number];
/** The launch stages every driver marks. */
export const REQUIRED_STAGES = Object.freeze(["processStart", "firstFrame", "firstLayout", "firstRow"] as const);

export interface FeelScenario {
  id: string;
  scope: "app" | "component";
  component?: string;
  does: string;
  measures: string[];
  drivers: Partial<Record<FeelDriver, "built" | "planned">>;
}

export interface FeelMeasure {
  name: string;
  unit: FeelUnit;
  status: "built" | "planned";
  means: string;
}

export interface FeelSpec {
  version: string;
  judging: { count: string; distance: string; time: string; minTimeRuns: number };
  scenarios: FeelScenario[];
  launch: {
    naming: string;
    t0: { macos: string; windows: string; optional: string };
    stages: { name: string; required: boolean; means: string }[];
    namespaces: { web: string[]; native: string[]; app: string; appExamples: string[] };
    dimensions: { service: string[]; launch: string[] };
    reports: string;
    signpost: { api: string; subsystem: string; category: string; mark: string; case: string; content: string };
  };
  measures: FeelMeasure[];
  seed: { prng: string; vector: { seed: number; first: number[] }; data: string };
  report: { file: string; entry: string[]; measure: string[]; content: string };
  drivers: { id: string; repository: string; path?: string; how: string; status: "building" | "planned" | "later" }[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const camel = /^[a-z][a-zA-Z0-9]*$/;
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A measure's unit, from its name: `Px` is a distance, `Ms` a time, anything else a count. */
export function unitOfMeasure(name: string): FeelUnit {
  return name.endsWith("Px") ? "px" : name.endsWith("Ms") ? "ms" : "count";
}

/** A launch mark's measure from t0: `firstRow` is `launchToFirstRowMs`. */
export function launchMeasure(mark: string): string {
  return `launchTo${mark[0]!.toUpperCase()}${mark.slice(1)}Ms`;
}

/** Every problem with a Feel spec, each with its fix; empty when it is one. */
export function checkFeelSpec(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value["scenarios"]) || !Array.isArray(value["measures"]) || !isRecord(value["launch"])) {
    return ["a Feel spec is { version, judging, scenarios, launch, measures, seed, report, drivers }. Fix: start from standard/feel/feel.spec.json."];
  }
  const problems: string[] = [];
  if (!isText(value["version"]) || !/^\d+\.\d+\.\d+$/.test(value["version"])) problems.push(`version is ${JSON.stringify(value["version"])}. Fix: a semver version such as "0.1.0".`);
  const judging = value["judging"];
  if (!isRecord(judging) || typeof judging["minTimeRuns"] !== "number" || judging["minTimeRuns"] < 3) problems.push("judging.minTimeRuns is under 3. Fix: time measures are the median of at least 3 runs.");

  const measures = new Map<string, Record<string, unknown>>();
  for (const m of value["measures"] as unknown[]) {
    if (!isRecord(m) || !isText(m["name"])) {
      problems.push("a measure has no name. Fix: { name, unit, status, means }.");
      continue;
    }
    const name = m["name"];
    if (measures.has(name)) problems.push(`${name}: the measure is listed twice. Fix: list it once.`);
    measures.set(name, m);
    if (!camel.test(name)) problems.push(`${name}: a measure's name is camelCase. Fix: such as "blankFrames".`);
    if (m["unit"] !== unitOfMeasure(name)) problems.push(`${name}: its unit is ${JSON.stringify(m["unit"])}, but its name says ${unitOfMeasure(name)}. Fix: a distance ends in Px, a time in Ms, and a count has neither.`);
    if (m["status"] !== "built" && m["status"] !== "planned") problems.push(`${name}: status is ${JSON.stringify(m["status"])}. Fix: "built" or "planned".`);
    if (!isText(m["means"])) problems.push(`${name}: means is empty. Fix: say what it counts in one sentence.`);
  }

  const ids = new Set<string>();
  for (const s of value["scenarios"] as unknown[]) {
    const id = isRecord(s) && isText(s["id"]) ? s["id"] : "a scenario";
    if (!isRecord(s)) {
      problems.push(`${id}: is not an object. Fix: { id, scope, does, measures, drivers }.`);
      continue;
    }
    if (!kebab.test(id)) problems.push(`${id}: a scenario's id is lowercase words joined by hyphens. Fix: such as "launch-cold".`);
    if (ids.has(id)) problems.push(`${id}: the scenario is listed twice. Fix: list it once.`);
    ids.add(id);
    if (s["scope"] !== "app" && s["scope"] !== "component") problems.push(`${id}: scope is ${JSON.stringify(s["scope"])}. Fix: "app" or "component".`);
    if (s["scope"] === "component" && !isText(s["component"])) problems.push(`${id}: a component scenario names its component. Fix: component: "<web's name>", such as "message-list".`);
    if (!isText(s["does"])) problems.push(`${id}: does is empty. Fix: say what happens in one sentence.`);
    const listed = s["measures"];
    if (!Array.isArray(listed) || listed.length === 0) problems.push(`${id}: measures is empty. Fix: list the measures it reports.`);
    else for (const m of listed) if (!measures.has(m as string)) problems.push(`${id}: measures names ${JSON.stringify(m)}, which the spec does not define. Fix: add it to measures, or use a defined name.`);
    const drivers = s["drivers"];
    if (!isRecord(drivers) || Object.keys(drivers).length === 0) problems.push(`${id}: drivers is empty. Fix: { "web": "built" | "planned", "apple": ... }.`);
    else for (const [d, state] of Object.entries(drivers)) {
      if (!(FEEL_DRIVERS as readonly string[]).includes(d)) problems.push(`${id}: drivers names ${JSON.stringify(d)}. Fix: one of ${FEEL_DRIVERS.join(", ")}.`);
      if (state !== "built" && state !== "planned") problems.push(`${id}: drivers.${d} is ${JSON.stringify(state)}. Fix: "built" or "planned".`);
    }
  }

  const launch = value["launch"];
  const stages = Array.isArray(launch["stages"]) ? (launch["stages"] as unknown[]).filter(isRecord) : [];
  for (const name of REQUIRED_STAGES) {
    if (!stages.some((stage) => stage["name"] === name && stage["required"] === true)) problems.push(`launch: the required stage ${name} is missing. Fix: { "name": "${name}", "required": true, "means": "..." }.`);
  }
  for (const stage of stages) {
    const name = stage["name"];
    if (!isText(name) || !camel.test(name)) problems.push(`launch: the stage ${JSON.stringify(name)} is not camelCase. Fix: such as "firstRow".`);
    else if (name !== "processStart" && stage["required"] === true && !measures.has(launchMeasure(name))) problems.push(`launch: ${name} has no measure ${launchMeasure(name)}. Fix: add it to measures.`);
  }
  const namespaces = launch["namespaces"];
  if (!isRecord(namespaces) || !Array.isArray(namespaces["web"])) problems.push("launch.namespaces is not { web, native, app }. Fix: start from standard/feel/feel.spec.json.");
  else {
    for (const [driver, marks] of [["web", namespaces["web"]], ["native", namespaces["native"]]] as const) {
      for (const mark of Array.isArray(marks) ? marks : []) {
        if (!isText(mark) || !new RegExp(`^${driver}\\.[a-z][a-zA-Z0-9]*$`).test(mark)) problems.push(`launch: the ${driver} mark ${JSON.stringify(mark)} is not ${driver}.<camelCase>. Fix: such as "${driver}.${driver === "web" ? "navigationStart" : "windowShown"}".`);
      }
    }
    for (const mark of Array.isArray(namespaces["appExamples"]) ? namespaces["appExamples"] : []) {
      if (!isText(mark) || !/^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/.test(mark) || /^(web|native)\./.test(mark)) problems.push(`launch: the app mark ${JSON.stringify(mark)} is not <app>.<camelCase>. Fix: such as "tandem.firstActivityItem".`);
    }
  }
  const signpost = launch["signpost"];
  if (!isRecord(signpost) || signpost["category"] !== "feel") problems.push("launch.signpost.category is not \"feel\". Fix: OSSignposter with the app's bundle id as subsystem and category feel.");
  return problems;
}

/** The spec, checked; throws with every problem when it is not one. */
export function loadFeelSpec(value: unknown): FeelSpec {
  const problems = checkFeelSpec(value);
  if (problems.length) throw new Error(`feel-spec: the spec has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.join("\n")}`);
  return value as FeelSpec;
}

/** mulberry32, the seed every driver's data comes from: the same seed gives the same numbers on every stack. */
export function feelRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The "## The spec" section of `standard/feel/feel.md`, rendered from the data, so the page cannot drift from it. */
export function feelSpecPage(spec: FeelSpec): string {
  const out = ["## The spec", "", `Version ${spec.version}.`, "", "### Scenarios", "", "| Scenario | Scope | What happens | Measures | Drivers |", "| --- | --- | --- | --- | --- |"];
  for (const s of spec.scenarios) {
    const scope = s.scope === "component" ? `component: ${s.component}` : "app";
    const drivers = Object.entries(s.drivers).map(([d, state]) => `${d} ${state}`).join(", ");
    out.push(`| \`${s.id}\` | ${scope} | ${s.does} | ${s.measures.map((m) => `\`${m}\``).join(", ")} | ${drivers} |`);
  }
  out.push("", "### Measures", "", `- Counts and distances: ${spec.judging.count}.`, `- Times: ${spec.judging.time}.`, "", "| Measure | Unit | Status | What it counts |", "| --- | --- | --- | --- |");
  for (const m of spec.measures) out.push(`| \`${m.name}\` | ${m.unit} | ${m.status} | ${m.means} |`);
  const code = (names: string[]) => names.map((m) => `\`${m}\``).join(", ");
  const { launch } = spec;
  out.push("", "### Launch", "", launch.naming, "", `- t0 on macOS: ${launch.t0.macos}`, `- t0 on Windows: ${launch.t0.windows}`, `- Optional: ${launch.t0.optional}`, "", "| Shared mark | Required | What it marks |", "| --- | --- | --- |");
  for (const stage of launch.stages) out.push(`| \`${stage.name}\` | ${stage.required ? "yes" : "no"} | ${stage.means} |`);
  out.push(
    "",
    `- Web's marks: ${code(launch.namespaces.web)}.`,
    `- Native marks: ${code(launch.namespaces.native)}.`,
    `- An app's own marks: \`${launch.namespaces.app}\`, such as ${code(launch.namespaces.appExamples)}.`,
    `- Dimensions: \`service\` is ${code(launch.dimensions.service).replace(", ", " or ")}; \`launch\` is ${code(launch.dimensions.launch)}.`,
    `- ${launch.reports}`,
    `- os_signpost: ${launch.signpost.api}, with subsystem ${launch.signpost.subsystem} and category \`${launch.signpost.category}\`. A mark is ${launch.signpost.mark}; a case is ${launch.signpost.case}. ${launch.signpost.content}`,
    "",
    "### Seed",
    "",
    `- PRNG: ${spec.seed.prng}.`,
    `- Test vector: seed ${spec.seed.vector.seed} gives ${spec.seed.vector.first.join(", ")}.`,
    `- ${spec.seed.data}`,
    "",
    "### Report",
    "",
    `\`${spec.report.file}\` holds one entry per scenario and engine: ${spec.report.entry.map((f) => `\`${f}\``).join(", ")}. Each measure has ${spec.report.measure.map((f) => `\`${f}\``).join(", ")}. ${spec.report.content}`,
    "",
    "### Drivers",
    "",
    "| Driver | Where | How | Status |",
    "| --- | --- | --- | --- |",
  );
  for (const d of spec.drivers) out.push(`| ${d.id} | ${d.repository ? `${d.repository}${d.path ? ` (\`${d.path}\`)` : ""}` : "not yet"} | ${d.how} | ${d.status} |`);
  out.push("");
  return out.join("\n");
}
