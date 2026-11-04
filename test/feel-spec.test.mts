import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { checkFeelSpec, feelRandom, feelSpecPage, launchMeasure, loadFeelSpec, unitOfMeasure } from "../src/feel-spec.mts";

const raw = await readFile(new URL("../standard/feel/feel.spec.json", import.meta.url), "utf8");
const spec = JSON.parse(raw) as Record<string, unknown> & { scenarios: Record<string, unknown>[]; measures: Record<string, unknown>[] };
const page = await readFile(new URL("../standard/feel/feel.md", import.meta.url), "utf8");

test("Ouro Feel's spec checks clean", () => {
  assert.deepEqual(checkFeelSpec(spec), []);
  assert.equal(loadFeelSpec(spec).version, "0.1.0");
});

test("the spec keeps the first app gate's scenario ids and launch stages", () => {
  const ids = spec.scenarios.map((s) => s["id"]);
  for (const id of ["launch-cold", "launch-warm", "switch", "scroll", "typing", "typing-120wpm", "network-drop", "wake", "history-prepend"]) assert.ok(ids.includes(id), id);
  const { launch } = loadFeelSpec(spec);
  assert.deepEqual(launch.stages.map((stage) => stage.name), ["processStart", "firstFrame", "firstLayout", "firstRow", "authReturn"]);
  assert.deepEqual(launch.namespaces.web.map((mark) => mark.name), ["web.environmentCreated", "web.viewCreated", "web.loadRequested", "web.navigationStart", "web.htmlRequested", "web.htmlResponseStart", "web.navigationCommit", "web.htmlLoaded", "web.scriptsLoaded", "web.scriptRun", "web.runtimeReady"]);
  assert.deepEqual(launch.namespaces.native.map((mark) => mark.name), ["native.appLaunched", "native.windowShown", "native.notifyPermission"]);
  assert.ok(!raw.includes("tandem."), "an app's own marks stay in its own docs");
  const { report } = loadFeelSpec(spec);
  for (const field of ["variant", "t0", "marks"]) assert.ok(report.entry.includes(field), field);
  assert.deepEqual(launch.signpost.category, "feel");
  assert.deepEqual(spec.scenarios.find((s) => s["id"] === "launch-warm")!["measures"], ["launchToFirstFrameMs", "launchToFirstLayoutMs", "launchToFirstRowMs", "firstRowMs"]);
  assert.ok((spec.scenarios.find((s) => s["id"] === "launch-cold")!["measures"] as string[]).includes("launchToRowMs"));
  assert.equal(launchMeasure("firstRow"), "launchToFirstRowMs");
  const launchMeasures = loadFeelSpec(spec).measures.map((m) => m.name).filter((name) => name.startsWith("launchTo"));
  assert.deepEqual(launchMeasures, ["launchToFirstFrameMs", "launchToFirstLayoutMs", "launchToFirstRowMs", "launchToAuthReturnMs", "launchToRowMs"]);
  assert.ok(loadFeelSpec(spec).report.entry.includes("marks"));
  assert.deepEqual(launch.dimensions, { service: ["running", "started"], launch: ["first", "afterUpdate", "repeat"] });
});

test("the seed's PRNG gives the spec's test vector, which every driver reproduces", () => {
  const { seed } = loadFeelSpec(spec);
  const next = feelRandom(seed.vector.seed);
  assert.deepEqual(seed.vector.first.map(() => next()), seed.vector.first);
});

test("the page's spec section is rendered from the data, word for word (pnpm feel:page)", () => {
  assert.equal(page.slice(page.indexOf("## The spec")), feelSpecPage(loadFeelSpec(spec)));
});

test("a measure's unit follows its name", () => {
  assert.equal(unitOfMeasure("anchorMovePx"), "px");
  assert.equal(unitOfMeasure("firstRowMs"), "ms");
  assert.equal(unitOfMeasure("blankFrames"), "count");
});

test("checkFeelSpec names each problem with its fix", () => {
  const bad = structuredClone(spec);
  bad.scenarios.push({ id: "Scroll Fast", scope: "page", does: "", measures: ["frameDrops"], drivers: { android: "soon" } });
  bad.measures.push({ name: "blank_frames", unit: "ms", status: "maybe", means: "" });
  bad.measures.push({ name: "launchToWebNavigationStartMs", unit: "ms", status: "planned", means: "x" });
  (bad["judging"] as Record<string, unknown>)["minTimeRuns"] = 1;
  (bad["launch"] as { stages: unknown[] }).stages = [{ name: "processStart", required: true, means: "" }];
  const problems = checkFeelSpec(bad);
  for (const start of [
    "judging.minTimeRuns is under 3. Fix:",
    "blank_frames: a measure's name is camelCase. Fix:",
    "blank_frames: its unit is \"ms\", but its name says count. Fix:",
    "blank_frames: status is \"maybe\". Fix:",
    "Scroll Fast: a scenario's id is lowercase words joined by hyphens. Fix:",
    "Scroll Fast: scope is \"page\". Fix:",
    "Scroll Fast: measures names \"frameDrops\", which the spec does not define. Fix:",
    "Scroll Fast: drivers names \"android\". Fix:",
    "launch: the required stage firstFrame is missing. Fix:",
    "launch: the required stage firstLayout is missing. Fix:",
    "launchToWebNavigationStartMs: driver marks are not measures. Fix:",
  ]) assert.ok(problems.some((p) => p.startsWith(start)), `${start}\n${problems.join("\n")}`);
});
