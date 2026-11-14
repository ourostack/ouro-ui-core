import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  actionMessage,
  applyMessages,
  COMPONENTS,
  functionCallProblem,
  HX_CATALOG_ID,
  loadCatalog,
  MCP_APP_MIME,
  mcpAppResource,
  mcpAppToolMeta,
  mcpAppToolResult,
  resolveMessages,
  resolveSurface,
  validateMessages,
  type Resolved,
} from "../src/a2ui.mts";
import { catalog, main, renderCatalog } from "../src/a2ui-catalog.mts";
import recipe from "./fixtures/a2ui/recipe.actions.mts";

const root = new URL("../", import.meta.url);
const read = async (p: string) => readFile(new URL(p, root), "utf8");
const hx = JSON.parse(await read("standard/hx/a2ui/catalog.json"));
const app = JSON.parse(await read("standard/hx/a2ui/conformance/recipe.catalog.json"));
const caseNames = (await readdir(new URL("standard/hx/a2ui/conformance/cases/", root))).filter((f) => f.endsWith(".json")).sort();
const cases = await Promise.all(caseNames.map(async (n) => ({ name: n, ...JSON.parse(await read(`standard/hx/a2ui/conformance/cases/${n}`)) })));
const catalogs: Record<string, unknown> = { "catalog.json": hx, "recipe.catalog.json": app };
const create = (components: unknown[], dataModel: unknown = {}) => [{ version: "1.0", createSurface: { surfaceId: "s", catalogId: app.catalogId, dataModel, components } }];

test("the committed catalogs are what the generator writes", async () => {
  assert.equal(await read("standard/hx/a2ui/catalog.json"), renderCatalog());
  assert.equal(await read("standard/hx/a2ui/conformance/recipe.catalog.json"), renderCatalog(recipe));
});

test("HX's catalog has HX's components and no button; an app's adds ActionButton naming exactly its actions", () => {
  assert.equal(hx.catalogId, HX_CATALOG_ID);
  assert.deepEqual(Object.keys(hx.components), Object.keys(COMPONENTS));
  assert.equal(hx.components.ActionButton, undefined);
  assert.deepEqual(app.components.ActionButton.properties.action.enum, recipe.actions.map((a) => a.id));
  assert.deepEqual(hx.functions, {}, "no function an agent could call");
  const consent = Object.fromEntries(Object.entries(loadCatalog(app).actions).map(([id, a]) => [id, [a.consent, a.press]]));
  assert.deepEqual(consent, { get_recipe: ["read", "run"], add_recipe_to_shopping_list: ["write", "run"], share_recipe: ["consequential", "confirm"], order_ingredients: ["person-only", "handoff"] });
  assert.equal(catalog(recipe, { catalogId: "https://spoonjoy.app/a2ui/v1" }).catalogId, "https://spoonjoy.app/a2ui/v1");
});

test("A2UI's own schemas: both catalogs are valid catalogs, and every case's messages are valid A2UI", async () => {
  const spec = "test/fixtures/a2ui/spec/";
  const hashes: Record<string, string> = {
    "agent_to_renderer.json": "2f575f783fdda0e4d175fe5d331661655e4a4901613262322792dae7e823761d",
    "catalog_definition.json": "836a48b2deb7ae76c3b68cb4e79c2faa24cba36d4d5396474894796797364d44",
    "common_types.json": "c4e78305be1de73eecb37f8179ba169730250611703683af291b18135a6430dc",
  };
  const schemas: Record<string, { $id: string }> = {};
  for (const [file, sha] of Object.entries(hashes)) {
    const text = await read(spec + file);
    assert.equal(createHash("sha256").update(text).digest("hex"), sha, `${file} is A2UI's file at the pinned commit (SOURCE.md)`);
    schemas[file] = JSON.parse(text);
  }
  for (const [name, cat] of Object.entries(catalogs)) {
    const ajv = new Ajv2020({ strict: false, allErrors: true, discriminator: true });
    ajv.addSchema(schemas["common_types.json"]!);
    const ok = ajv.validate(schemas["catalog_definition.json"]!, cat);
    assert.ok(ok, `${name} is an A2UI v1.0 catalog: ${ajv.errorsText()}`);
    // The envelope refers to catalog.json beside it; that is our catalog.
    const envelope = new Ajv2020({ strict: false, allErrors: true, discriminator: true });
    envelope.addSchema(schemas["common_types.json"]!);
    envelope.addSchema({ ...(cat as object), $id: "https://a2ui.org/specification/v1_0/catalog.json" });
    const validate = envelope.compile(schemas["agent_to_renderer.json"]!);
    for (const c of cases.filter((c) => c.catalog === name && !c.name.startsWith("invalid-"))) {
      c.messages.forEach((m: unknown, i: number) => assert.ok(validate(m), `${c.name} message ${i} is valid A2UI with ${name}: ${envelope.errorsText(validate.errors)}`));
    }
  }
});

test("every conformance case resolves to its expect", () => {
  assert.ok(cases.length >= 9);
  for (const c of cases) assert.deepEqual(resolveMessages(catalogs[c.catalog], c.messages), c.expect, c.name);
});

test("an agent can't press a button through the screen", () => {
  const cat = loadCatalog(app);
  assert.match(functionCallProblem(cat, "share_recipe").message, /through their own tool \(MCP share_recipe\)/);
  const person = functionCallProblem(cat, "order_ingredients");
  assert.equal(person.refusal?.state, "refused");
  assert.equal(person.refusal?.error.code, "person-only");
  assert.match(functionCallProblem(cat, "openUrl").message, /no functions an agent may call, so openUrl is not one/);
});

test("the validator: person-only input is the typed refusal, and required input is prepared", () => {
  const order = validateMessages(app, create([{ id: "root", component: "ActionButton", action: "order_ingredients", input: { recipe: "r1" } }]));
  assert.equal(order.length, 1);
  assert.equal(order[0]!.refusal?.error.code, "person-only");
  assert.deepEqual(validateMessages(app, create([{ id: "root", component: "ActionButton", action: "order_ingredients", input: {} }])), []);
  const shop = validateMessages(app, create([{ id: "root", component: "ActionButton", action: "add_recipe_to_shopping_list" }]));
  assert.match(shop[0]!.message, /needs recipe \(Recipe\) prepared/);
  assert.match(validateMessages(app, create([{ id: "root", component: "ActionButton", action: "pay" }]))[0]!.message, /not one of the app's actions/);
  assert.match(validateMessages(app, create([{ id: "root", component: "ActionButton", action: "share_recipe", input: { recipe: "r", with: "a@b.c", label: "Add to list" } }]))[0]!.message, /has no input label/);
});

test("the validator: envelope, surfaces, the tree", () => {
  const ok = create([{ id: "root", component: "Text", text: "Hi" }]);
  assert.deepEqual(validateMessages(app, ok), []);
  assert.match(validateMessages(app, [{ version: "0.9", createSurface: {} }])[0]!.message, /"version": "1.0"/);
  assert.match(validateMessages(app, [{ version: "1.0", updateComponents: { surfaceId: "x", components: [] } }])[0]!.message, /Create surface x/);
  assert.equal(validateMessages(app, [...ok, ...ok])[0]!.code, "INTEGRITY_ERROR");
  assert.match(validateMessages(app, create([{ id: "a", component: "Text", text: "Hi" }]))[0]!.message, /id root/);
  const loop = validateMessages(app, create([{ id: "root", component: "Card", children: ["a"] }, { id: "a", component: "Card", children: ["root"] }]));
  assert.ok(loop.some((p) => /root can't be a child/.test(p.message)));
  const loop2 = validateMessages(app, create([{ id: "root", component: "Card", children: ["a"] }, { id: "a", component: "Card", children: ["b"] }, { id: "b", component: "Card", children: ["a"] }]));
  assert.ok(loop2.some((p) => /loops: root > a > b > a/.test(p.message)));
  assert.match(validateMessages(app, [{ version: "1.0", createSurface: { surfaceId: "s", catalogId: "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json" } }])[0]!.message, /catalogId is/);
  assert.match(validateMessages(app, create([{ id: "root", component: "Image", url: "https://x/y.jpg" }]))[0]!.message, /needs description/);
});

test("the action message a pressed button sends: the action's id, the input, and that the person pressed it", () => {
  const tree = (resolveMessages(app, cases.find((c) => c.name === "action-buttons.json")!.messages) as { surfaces: Record<string, Resolved> }).surfaces.buttons!;
  const [open, shop, share, order] = tree.children as [Resolved, Resolved, Resolved, Resolved];
  const sent = actionMessage({ surfaceId: "buttons", sourceComponentId: "shop", button: shop, timestamp: "2026-11-13T12:00:00Z" });
  assert.deepEqual(sent, {
    version: "1.0",
    action: {
      name: "add_recipe_to_shopping_list",
      surfaceId: "buttons",
      sourceComponentId: "shop",
      timestamp: "2026-11-13T12:00:00Z",
      userMessage: "Add ingredients to list",
      context: { recipe: "rcp_123", servings: 4 },
      metadata: { extensions: { bot_ouroboros_action: { consent: "write", by: "person" } } },
    },
  });
  assert.equal((actionMessage({ surfaceId: "b", sourceComponentId: "open", button: open, timestamp: "t" }).action as { name: string }).name, "get_recipe");
  assert.throws(() => actionMessage({ surfaceId: "b", sourceComponentId: "share", button: share, timestamp: "t" }), /only after the person confirms/);
  const confirmed = actionMessage({ surfaceId: "b", sourceComponentId: "share", button: share, timestamp: "t", confirmed: true }) as { action: { metadata: unknown } };
  assert.deepEqual(confirmed.action.metadata, { extensions: { bot_ouroboros_action: { consent: "consequential", by: "person", confirmed: true } } });
  assert.throws(() => actionMessage({ surfaceId: "b", sourceComponentId: "order", button: order, timestamp: "t" }), /person-only/);
});

test("data model writes follow JSON pointer, and null deletes", () => {
  const surfaces = applyMessages([
    { version: "1.0", createSurface: { surfaceId: "s", catalogId: hx.catalogId, dataModel: { a: { b: 1 }, list: [1, 2, 3] } } },
    { version: "1.0", updateDataModel: { surfaceId: "s", path: "/a/c~1d", value: "x" } },
    { version: "1.0", updateDataModel: { surfaceId: "s", path: "/list/1", value: null } },
    { version: "1.0", updateDataModel: { surfaceId: "s", path: "/new/deep", value: true } },
  ]);
  assert.deepEqual(surfaces.get("s")!.data, { a: { b: 1, "c/d": "x" }, list: [1, 3], new: { deep: true } });
  assert.equal(resolveSurface(hx, surfaces.get("s")!), null, "no root, nothing to show");
});

test("MCP Apps: the resource, the tool's link to it, and a result that carries the surface", () => {
  const r = mcpAppResource({ uri: "ui://kitchen/hx", name: "Kitchen", html: "<!doctype html>" });
  assert.equal(r.listing.mimeType, MCP_APP_MIME);
  assert.equal(MCP_APP_MIME, "text/html;profile=mcp-app");
  assert.equal(r.contents.text, "<!doctype html>");
  assert.throws(() => mcpAppResource({ uri: "https://x", name: "x", html: "" }), /ui:\/\//);
  assert.deepEqual(mcpAppToolMeta("ui://kitchen/hx"), { ui: { resourceUri: "ui://kitchen/hx" } });
  const messages = cases.find((c) => c.name === "action-buttons.json")!.messages;
  const result = mcpAppToolResult({ text: "Here is the recipe.", catalog: app, messages });
  assert.deepEqual(result.content, [{ type: "text", text: "Here is the recipe." }]);
  assert.equal(result.structuredContent.a2ui.catalogId, app.catalogId);
  assert.throws(() => mcpAppToolResult({ text: "x", catalog: app, messages: create([{ id: "root", component: "Button" }]) }), /don't validate/);
});

test("the command line writes, checks and validates", async () => {
  const out: string[] = [];
  const io = { out: (s: string) => void out.push(s), err: (s: string) => void out.push(s) };
  assert.equal(await main(["check", "test/fixtures/a2ui/recipe.actions.mts", "standard/hx/a2ui/conformance/recipe.catalog.json"], io), 0);
  assert.equal(await main(["check", "standard/hx/a2ui/conformance/recipe.catalog.json"], io), 1, "without the actions it is HX's catalog, which differs");
  assert.equal(await main(["validate", "standard/hx/a2ui/conformance/recipe.catalog.json", "standard/hx/a2ui/conformance/cases/invalid-free-button.json"], io), 1);
  assert.equal(await main(["nonsense"], io), 2);
  assert.match(out.join(""), /"code":"VALIDATION_FAILED"/);
});

test("an empty relative path in a template is the item itself, as A2UI's collection scope appends it", () => {
  const out = resolveMessages(JSON.parse(renderCatalog()), [
    { version: "1.0", createSurface: { surfaceId: "s", catalogId: HX_CATALOG_ID, dataModel: { tags: ["Vegetarian", "One pan"] }, components: [
      { id: "root", component: "Stack", children: { componentId: "tag", path: "/tags" } },
      { id: "tag", component: "Badge", text: { "@path": "" } },
    ] } },
  ]);
  assert.ok("surfaces" in out);
  assert.deepEqual(out.surfaces.s!.children.map((c) => c.props.text), ["Vegetarian", "One pan"]);
});

test("a protocol-only field is the app's to add, so a composed button's input never offers it", () => {
  const add = (catalog(recipe).metadata as { extensions: { bot_ouroboros_hx: { actions: Record<string, { input: Record<string, unknown> }> } } }).extensions.bot_ouroboros_hx.actions.add_recipe_to_shopping_list!;
  assert.deepEqual(Object.keys(add.input), ["recipe", "servings"]);
});

test("each resolved node carries its component id, for the action message's sourceComponentId", () => {
  const c = JSON.parse(readFileSync(new URL("standard/hx/a2ui/conformance/cases/action-buttons.json", root), "utf8"));
  const out = resolveMessages(JSON.parse(renderCatalog(recipe)), c.messages);
  assert.ok("surfaces" in out);
  assert.deepEqual([out.surfaces.buttons!.id, ...out.surfaces.buttons!.children.map((n) => n.id)], ["root", "open", "shop", "share", "order"]);
});

const shareStream = (input: Record<string, unknown>, data: unknown = { recipe: { id: "rcp_lemon_orzo", title: "Lemon orzo" } }) =>
  create([{ id: "root", component: "ActionButton", action: "share_recipe", input }], data);
const confirmOf = (messages: unknown[], options?: Parameters<typeof resolveMessages>[2]) =>
  ((resolveMessages(app, messages, options) as { surfaces: Record<string, Resolved> }).surfaces.s!.props as { confirm: { fields: unknown[] } }).confirm.fields;

test("a confirm sheet shows the name a field's shownAs names, and keeps the id beside it", () => {
  assert.equal(loadCatalog(app).actions.share_recipe!.input.recipe!.shownAs, "recipeTitle");
  const input = { recipe: { "@path": "/recipe/id" }, recipeTitle: { "@path": "/recipe/title" }, with: "sam@example.com" };
  assert.deepEqual(confirmOf(shareStream(input)), [
    { label: "Recipe", value: "Lemon orzo", raw: "rcp_lemon_orzo" },
    { label: "Send to", value: "sam@example.com" },
  ]);
});

test("without a name, the confirm sheet shows the id as it did before, and an empty name is no name", () => {
  assert.deepEqual(confirmOf(shareStream({ recipe: { "@path": "/recipe/id" }, with: "sam@example.com" })), [
    { label: "Recipe", value: "rcp_lemon_orzo" },
    { label: "Send to", value: "sam@example.com" },
  ]);
  assert.deepEqual(confirmOf(shareStream({ recipe: { "@path": "/recipe/id" }, recipeTitle: "  ", with: "x@y.z" }))[0], { label: "Recipe", value: "rcp_lemon_orzo" });
});

test("the app's own resolver names an id from its own data, and wins over what the agent prepared", () => {
  const seen: unknown[] = [];
  const label = (c: { action: string; field: string; value: string; input: Record<string, unknown> }) => {
    seen.push([c.action, c.field, c.value]);
    return c.field === "recipe" ? "Lemon orzo (yours)" : undefined;
  };
  const input = { recipe: { "@path": "/recipe/id" }, recipeTitle: "Something else", with: "sam@example.com" };
  assert.deepEqual(confirmOf(shareStream(input), { label }), [
    { label: "Recipe", value: "Lemon orzo (yours)", raw: "rcp_lemon_orzo" },
    { label: "Send to", value: "sam@example.com" },
  ]);
  assert.deepEqual(seen, [["share_recipe", "recipe", "rcp_lemon_orzo"], ["share_recipe", "with", "sam@example.com"]]);
});

test("a run button has no confirm sheet, so nothing asks the resolver", () => {
  const stream = create([{ id: "root", component: "ActionButton", action: "get_recipe", input: { recipe: "rcp_1" } }]);
  const out = resolveMessages(app, stream, { label: () => { throw new Error("asked"); } }) as { surfaces: Record<string, Resolved> };
  assert.equal((out.surfaces.s!.props as { confirm?: unknown }).confirm, undefined);
});
