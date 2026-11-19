import assert from "node:assert/strict";
import { test } from "node:test";
import { line, readKits, releaseSet, render } from "../scripts/release-sets.mts";

test("a release set exists only when every part of every kit meets one core line", () => {
  assert.equal(line("v0.19.3"), "v0.19");
  assert.equal(line("v1.4.0"), "v1");
  assert.throws(() => line("main"), /not a release tag/);
  const aligned = releaseSet({ web: { tag: "v1.3.0", core: { tokens: "v0.19.0", tree: "v0.19.2" } }, android: { tag: "v0.3.0", core: { core: "v0.19.1" } } });
  assert.deepEqual(aligned, { set: { core: "v0.19", kits: { web: "v1.3.0", android: "v0.3.0" } }, behind: [] });
  const apart = releaseSet({ web: { tag: "v1.3.0", core: { tokens: "v0.19.0", actions: "v0.17.6" } }, apple: { tag: "v1.2.0", core: { tokens: "v0.14.0", tree: "v0.19.0" } } });
  assert.equal(apart.set, null);
  assert.deepEqual(apart.behind, ["web v1.3.0 actions meets core v0.17.6, not v0.19", "apple v1.2.0 tokens meets core v0.14.0, not v0.19"]);
  // A 1.x line is newer than any 0.x line.
  assert.deepEqual(releaseSet({ a: { tag: "v1.0.0", core: { core: "v1.2.0" } }, b: { tag: "v2.0.0", core: { core: "v0.20.0" } } }).behind, ["b v2.0.0 core meets core v0.20.0, not v1"]);
});

test("the kits are read from each repository's newest release, and a file that names no core tag fails with its path", async () => {
  const files: Record<string, string> = {
    "https://api.github.com/repos/ourostack/ouro-ui/releases/latest": '{"tag_name":"v1.3.318"}',
    "https://api.github.com/repos/ourostack/ouro-ui-apple/releases/latest": '{"tag_name":"v1.2.0"}',
    "https://api.github.com/repos/ourostack/ouro-ui-windows/releases/latest": '{"tag_name":"v0.3.0"}',
    "https://api.github.com/repos/ourostack/ouro-ui-android/releases/latest": '{"tag_name":"v0.3.0"}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui/v1.3.318/scripts/parity-data/provenance.json": '{"coreTag":"v0.19.0"}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui/v1.3.318/test/fixtures/a2ui/core.json": '{"coreTag":"v0.19.0"}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui/v1.3.318/scripts/ouro-actions/dist-manifest.json": '{"coreTag":"v0.17.6"}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui-apple/v1.2.0/core-provenance.json": '{"coreTag":"v0.14.0","tree":{"coreTag":"v0.19.0"}}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui-windows/v0.3.0/core-provenance.json": '{"coreTag":"v0.19.0"}',
    "https://raw.githubusercontent.com/ourostack/ouro-ui-android/v0.3.0/core-provenance.json": '{"coreTag":"v0.19.0"}',
  };
  const kits = await readKits(async (url) => files[url] ?? Promise.reject(new Error(`unexpected ${url}`)));
  assert.deepEqual(kits.apple, { tag: "v1.2.0", core: { tokens: "v0.14.0", tree: "v0.19.0" } });
  const file = JSON.parse(render(kits));
  assert.equal(file.set, null);
  assert.equal(file.behind.length, 2);
  files["https://raw.githubusercontent.com/ourostack/ouro-ui-android/v0.3.0/core-provenance.json"] = "{}";
  await assert.rejects(readKits(async (url) => files[url]!), /ouro-ui-android v0\.3\.0: core-provenance\.json names no core tag for its core/);
});
