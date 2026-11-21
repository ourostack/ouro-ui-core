import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { HX_COMPONENTS, loadHxClaimSet } from "../src/hx-claims.mts";
import { checkSpec, type ComponentSpec } from "../src/hx-specs.mts";

const dir = new URL("../standard/hx/components/", import.meta.url);
const read = async (name: string) => JSON.parse(await readFile(new URL(name, dir), "utf8"));
const schema = await read("component.schema.json");
const claims = loadHxClaimSet(JSON.parse(await readFile(new URL("../standard/hx/components.claims.json", import.meta.url), "utf8")));
const names = (await readdir(dir)).filter((n) => n.endsWith(".spec.json")).sort();
const specs = await Promise.all(names.map(read)) as ComponentSpec[];
const validate = new Ajv2020({ strict: true, allowUnionTypes: true, allErrors: true }).compile(schema);

test("each component a platform has built or specified has a spec", () => {
  assert.deepEqual(names, ["avatar.spec.json", "badge.spec.json", "button.spec.json", "card.spec.json", "checkbox.spec.json", "composer.spec.json", "confirm-dialog.spec.json", "conversation-list.spec.json", "description-list.spec.json", "dialog.spec.json", "field.spec.json", "immersive-controls.spec.json", "item-group.spec.json", "item.spec.json", "message-list.spec.json", "message.spec.json", "page-header.spec.json", "progress.spec.json", "reaction-bar.spec.json", "reorderable.spec.json", "segmented-control.spec.json", "select.spec.json", "separator.spec.json", "sheet.spec.json", "sidebar.spec.json", "skeleton.spec.json", "spinner.spec.json", "swipe-actions.spec.json", "switch.spec.json", "sync-status.spec.json", "tab-bar.spec.json", "table.spec.json", "tabs.spec.json", "text-field.spec.json"]);
  for (const s of specs) assert.ok((HX_COMPONENTS as readonly string[]).includes(s.name), s.name);
  for (const [i, s] of specs.entries()) assert.equal(`${s.name}.spec.json`, names[i]);
});

test("every spec matches the schema", () => {
  for (const s of specs) assert.ok(validate(s), `${s.name}: ${JSON.stringify(validate.errors)}`);
});

test("every spec's claims, tokens and cases agree with the claims and the API", () => {
  for (const s of specs) assert.deepEqual(checkSpec(s, claims), [], s.name);
});

test("the checker catches a wrong claim list, an unknown token and a case outside the API", () => {
  const badge = structuredClone(specs.find((s) => s.name === "badge")!);
  badge.claims = ["name.spoken"];
  badge.tokens["label"] = "{tone}-ink";
  badge.cases[0]!.props["tone"] = "teal";
  badge.cases[0]!.props["size"] = "lg";
  const problems = checkSpec(badge, claims).join("\n");
  assert.match(problems, /applies \["contrast\.text","name\.spoken","text\.reflows"\]/);
  assert.match(problems, /"primary-ink", which is not a colour token/);
  assert.match(problems, /sets tone to "teal"/);
  assert.match(problems, /sets "size", which is not a property/);
});
