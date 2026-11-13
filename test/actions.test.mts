import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIONS_VERSION,
  annotationsOf,
  checkGenerated,
  compareMcp,
  main,
  defineAction,
  defineActions,
  field,
  inputSchema,
  names,
  refusal,
  renderActions,
  toCommand,
  toMcpTool,
  toWebMcpTool,
  type InputOf,
} from "../src/actions.mts";
import shopping, { addShoppingListItem, getShoppingList, placeGroceryOrder, shareShoppingList } from "./fixtures/actions/shopping.actions.mts";

const base = {
  id: "pin_recipe",
  consent: "write" as const,
  label: "Pin",
  description: "Pin this recipe.",
  agent: "Pin a recipe to the top of the person's kitchen.",
  input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", arg: true }) },
  output: {},
};

test("names derive from a snake_case id", () => {
  assert.deepEqual(names("add_shopping_list_item"), { kebab: "add-shopping-list-item", camel: "addShoppingListItem", pascal: "AddShoppingListItem" });
});

test("a declaration's input type is inferred, optional fields optional", () => {
  const input: InputOf<typeof addShoppingListItem> = { name: "oat milk" };
  const full: InputOf<typeof addShoppingListItem> = { name: "flour", quantity: 500, unit: "g" };
  assert.equal(input.name, "oat milk");
  assert.equal(full.quantity, 500);
  // @ts-expect-error quantity is a number
  const wrong: InputOf<typeof addShoppingListItem> = { name: "flour", quantity: "lots" };
  // @ts-expect-error name is required
  const missing: InputOf<typeof addShoppingListItem> = { quantity: 1 };
  void wrong;
  void missing;
});

test("defineAction refuses a declaration that isn't one, with the fix", () => {
  assert.throws(() => defineAction({ ...base, id: "Pin-Recipe" }), /id .*snake_case.*Fix:/);
  assert.throws(() => defineAction({ ...base, consent: "person-only" }), /person-only.*personOnly.*Fix:/);
  assert.throws(() => defineAction({ ...base, personOnly: { reason: "No.", how: "by hand" } }), /personOnly.*only.*person-only/);
  assert.throws(() => defineAction({ ...base, agent: "Two\nlines" }), /agent.*one line/);
  assert.throws(() => defineAction({ ...base, label: " " }), /label/);
  assert.throws(() => defineAction({ ...base, consent: "sometimes" as "write" }), /consent/);
  assert.throws(
    () => defineAction({ ...base, input: { x: field.string({ label: "X", description: "x", optional: true, arg: true }) } }),
    /x.*arg.*required/,
  );
  assert.throws(() => defineAction({ ...base, input: { x: field.enum({ label: "X", description: "x", values: [] }) } }), /values/);
  // arg only on a required string, since web's CLI arguments are strings.
  assert.throws(() => defineAction({ ...base, input: { n: field.integer({ label: "N", description: "n", arg: true } as never) } }), /n.*arg.*string/);
  // An input may not shadow web's kit's own flags or the App Intent's members; an output may use those names.
  for (const name of ["json", "help", "why", "whyFile", "dryRun", "agent", "quiet", "input", "perform"]) {
    assert.throws(() => defineAction({ ...base, input: { [name]: field.string({ label: "X", description: "x" }) } }), /taken by a surface.*Fix:/, name);
  }
  assert.doesNotThrow(() => defineAction({ ...base, output: { id: field.string({ label: "Id", description: "x" }) } }));
  // Web reserves some ids for the person; only a person-only action may take one.
  assert.throws(() => defineAction({ ...base, id: "share" }), /web reserves "share" for the person.*Fix:/);
  // ask is Siri's one-line question for a missing input; protocolOnly is only for an optional input.
  assert.throws(() => defineAction({ ...base, input: { x: field.string({ label: "X", description: "x", ask: "Which\none?" }) } }), /x.*ask.*one line/);
  assert.throws(() => defineAction({ ...base, output: { x: field.string({ label: "X", description: "x", ask: "Which?" }) } }), /x.*ask/);
  assert.throws(() => defineAction({ ...base, input: { x: field.string({ label: "X", description: "x", protocolOnly: true }) } }), /x.*protocolOnly.*optional/);
  assert.throws(() => defineAction({ ...base, output: { x: field.string({ label: "X", description: "x", optional: true, protocolOnly: true }) } }), /x.*protocolOnly/);
  assert.doesNotThrow(() => defineAction({ ...base, input: { ...base.input, key: field.string({ label: "Key", description: "k", optional: true, protocolOnly: true }) } }));
  assert.doesNotThrow(() => defineAction({ ...base, id: "share", consent: "person-only", personOnly: { reason: "Only they share.", how: "with Share" } }));
});

test("defineActions refuses two actions that collide on any surface, naming both", () => {
  const a = defineAction({ ...base, id: "pin_recipe" });
  const b = defineAction({ ...base, id: "pin_recipe_now", cli: "pin-recipe" });
  assert.throws(() => defineActions("x", [a, b]), /pin_recipe.*pin_recipe_now.*CLI words "pin-recipe"/);
  assert.throws(() => defineActions("x", [a, a]), /used twice/);
  assert.throws(() => defineActions("Bad Name", [a]), /set name/);
  // Two ids whose camelCase names agree would generate one Swift type and one Reins node.
  assert.throws(() => defineActions("x", [defineAction({ ...base, id: "add_item2" }), defineAction({ ...base, id: "add_item_2" })]), /add_item2.*add_item_2/);
  // get_list.itemsKind and get_list_items.kind would both be the Swift enum GetListItemsKindValue.
  const kind = (name: string) => ({ [name]: field.enum({ label: "Kind", description: "x", values: ["a"], optional: true }) });
  assert.throws(
    () => defineActions("x", [defineAction({ ...base, id: "get_list", input: kind("itemsKind") }), defineAction({ ...base, id: "get_list_items", input: kind("kind") })]),
    /get_list.*get_list_items.*Swift enum type "GetListItemsKindValue"/,
  );
});

test("MCP annotations are web's effectAnnotations for each consent class", () => {
  assert.deepEqual(annotationsOf(getShoppingList), { readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  assert.deepEqual(annotationsOf(addShoppingListItem), { readOnlyHint: false, destructiveHint: false, openWorldHint: false });
  assert.deepEqual(annotationsOf(shareShoppingList), { readOnlyHint: false, destructiveHint: true, openWorldHint: true });
});

test("the typed refusal is web's refused outcome with a person-only error", () => {
  const problem = "You can't place an order or pay for the person; only they can. Ask the person, who does it with Place order on the shopping list";
  const message = `list order: ${problem}.`;
  // Byte for byte web's cli.ts answer to a person-only word under --json: outcome({ action, state: "refused", summary, error }).
  assert.deepEqual(refusal(placeGroceryOrder), {
    ax: "outcome/1",
    action: "list order",
    effect: "private",
    audience: { only: true, who: "only you" },
    target: null,
    state: "refused",
    summary: message,
    postcondition: { checked: false, holds: null, how: "not checked" },
    receipt: null,
    next: [],
    error: { code: "person-only", exit: 2, thing: "list order", problem, fix: null, message },
  });
  assert.throws(() => refusal(addShoppingListItem), /not person-only/);
});

test("the input schema: types, descriptions, minimum, required only what is required, nothing extra", () => {
  assert.deepEqual(inputSchema(addShoppingListItem), {
    type: "object",
    properties: {
      name: { type: "string", description: 'What to buy, as the person said it, such as "oat milk".' },
      quantity: { type: "number", description: "How many or how much.", minimum: 0 },
      unit: { type: "string", description: "The unit of the quantity, such as g, cups or cans." },
      idempotencyKey: { type: "string", description: "Send the same key again when retrying this exact call, and the item is added once." },
    },
    required: ["name"],
    additionalProperties: false,
  });
  assert.deepEqual(inputSchema(placeGroceryOrder).properties, { store: { type: "string", description: "Which store delivers.", enum: ["corner", "market"] } });
});

test("the CLI projection is a defineCommand definition: args, optional flags, effect", () => {
  assert.deepEqual(toCommand(addShoppingListItem), {
    name: "list add",
    summary: addShoppingListItem.agent,
    effect: "private",
    args: [{ name: "name", description: 'What to buy, as the person said it, such as "oat milk".', required: true }],
    flags: {
      quantity: { type: "number", description: "How many or how much.", min: 0 },
      unit: { type: "string", description: "The unit of the quantity, such as g, cups or cans." },
      "idempotency-key": { type: "string", description: "Send the same key again when retrying this exact call, and the item is added once." },
    },
    output: "{ id, name }",
  });
  assert.equal(toCommand(getShoppingList).readOnly, true);
  assert.equal(toCommand(shareShoppingList).effect, "others");
  assert.deepEqual(toCommand(shareShoppingList).flags, { "can-edit": { type: "boolean", description: "Whether they may change the list, not only see it." } });
  assert.throws(() => toCommand(placeGroceryOrder), /person-only/);
});

test("MCP and WebMCP tools carry the agent's description and the consent hints", () => {
  const tool = toMcpTool(addShoppingListItem);
  assert.equal(tool.name, "add_shopping_list_item");
  assert.equal(tool.title, "Add to list");
  assert.equal(tool.description, addShoppingListItem.agent);
  assert.deepEqual(tool.inputSchema, inputSchema(addShoppingListItem));
  assert.deepEqual(tool.outputSchema?.required, ["id", "name"]);
  assert.equal(toMcpTool(shareShoppingList).outputSchema, undefined);
  assert.deepEqual(toWebMcpTool(shareShoppingList).annotations, { readOnlyHint: false, consequentialHint: true });
  assert.deepEqual(toWebMcpTool(getShoppingList).annotations, { readOnlyHint: true, consequentialHint: false });
});

test("the generated JSON lists person-only actions only as refusals, on every agent door", () => {
  const files = renderActions(shopping);
  const mcp = JSON.parse(files.get("mcp.json")!);
  assert.deepEqual(mcp.tools.map((t: { name: string }) => t.name), ["get_shopping_list", "add_shopping_list_item", "share_shopping_list"]);
  assert.deepEqual(mcp.refusals, { place_grocery_order: refusal(placeGroceryOrder) });
  const web = JSON.parse(files.get("webmcp.json")!);
  assert.equal(web.tools.length, 3);
  assert.deepEqual(web.refusals, mcp.refusals);
  const cli = JSON.parse(files.get("commands.json")!);
  assert.deepEqual(cli.personOnly, { "list order": { reason: placeGroceryOrder.personOnly!.reason, how: placeGroceryOrder.personOnly!.how } });
  assert.equal(cli.commands.length, 3);
  assert.deepEqual(JSON.parse(files.get("actions.json")!).actions.map((a: { id: string }) => a.id), shopping.actions.map((a) => a.id));
});

test("the web projection feeds defineComponentAx and bindAx, and gives each control its props", () => {
  const web = renderActions(shopping).get("web.ts")!;
  assert.match(web, /"data-ax-action": "add-shopping-list-item"/);
  assert.match(web, /\{ id: "place-grocery-order", summary: "Order everything on your list and pay for it\.", effect: "private", personOnly: "You can't place an order or pay for the person; only they can\." \}/);
  assert.match(web, /\{ id: "share-shopping-list", summary: "Share your shopping list with someone in your household\.", effect: "others", agent: true \}/);
  assert.match(web, /"add-shopping-list-item": "shop list add <name>"/);
  assert.match(web, /refuseAs: \{\s*"place-grocery-order": "shop list order"/);
});

test("fromCli gives a CLI run() the declaration's field names, so every door calls one handler", async () => {
  const web = (await import("./fixtures/actions/generated/web.ts")) as {
    fromCli: (action: string, input: Record<string, unknown>) => Record<string, unknown>;
  };
  assert.deepEqual(web.fromCli("share-shopping-list", { with: "sam", "can-edit": true }), { with: "sam", canEdit: true });
  assert.deepEqual(web.fromCli("add-shopping-list-item", { name: "flour", quantity: 2 }), { name: "flour", quantity: 2 });
});

test("every generated file names its generator and set, and renders the same twice", () => {
  const a = renderActions(shopping);
  const b = renderActions(shopping);
  assert.deepEqual([...a.keys()].sort(), ["OuroActions.swift", "OuroActionsReins.swift", "actions.json", "commands.json", "mcp.json", "web.ts", "webmcp.json"]);
  for (const [path, text] of a) {
    assert.equal(text, b.get(path));
    assert.match(text, /ouro-actions \d+\.\d+\.\d+/, `${path} has no header`);
    assert.match(text, /"?shopping"?/, `${path} doesn't name its set`);
  }
});

test("the drift check passes the committed fixture and names every drift: changed, missing, extra", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const dir = new URL("./fixtures/actions/generated/", import.meta.url);
  const committed = new Map<string, string>();
  for (const name of (await readdir(dir)).sort()) committed.set(name, await readFile(new URL(name, dir), "utf8"));
  assert.deepEqual(checkGenerated(shopping, committed), []);

  const drifted = new Map(committed);
  drifted.set("mcp.json", committed.get("mcp.json")!.replace('"readOnlyHint": true', '"readOnlyHint": false'));
  drifted.delete("web.ts");
  drifted.set("extra.json", "{}");
  const problems = checkGenerated(shopping, drifted);
  assert.equal(problems.length, 3);
  assert.match(problems[0]!, /^mcp\.json:\d+: drifted from its declaration: expected ".*readOnlyHint\\": true.*", found ".*readOnlyHint\\": false/);
  assert.match(problems[1]!, /^web\.ts: missing/);
  assert.match(problems[2]!, /^extra\.json: not generated from any declaration/);
});

test("compareMcp passes the generated tools and names each way a live server drifts", () => {
  const generated = JSON.parse(renderActions(shopping).get("mcp.json")!);
  assert.deepEqual(compareMcp(shopping, generated), []);
  assert.deepEqual(compareMcp(shopping, generated.tools), []);
  const tools = structuredClone(generated.tools) as Record<string, unknown>[];
  tools[1]!["description"] = "Adds an item.";
  (tools[1]!["inputSchema"] as { required: string[] }).required = [];
  tools[2]!["annotations"] = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  tools.splice(0, 1);
  tools.push({ name: "place_grocery_order", description: "", inputSchema: {} }, { name: "secret_tool", description: "", inputSchema: {} });
  const problems = compareMcp(shopping, { tools });
  const starts = [
    "get_shopping_list: declared but the server doesn't list it",
    "add_shopping_list_item: description drifted",
    "add_shopping_list_item: input schema drifted",
    "share_shopping_list: annotation destructiveHint",
    "share_shopping_list: annotation openWorldHint",
    "place_grocery_order: is person-only but the server lists it",
    "secret_tool: the server lists a tool no declaration has",
  ];
  assert.equal(problems.length, starts.length, problems.join("\n"));
  starts.forEach((start, i) => assert.ok(problems[i]!.startsWith(start), `${problems[i]} should start with ${start}`));
  assert.match(compareMcp(shopping, { nope: 1 })[0]!, /not a tools\/list result/);

  // A missing hint is MCP's default (readOnlyHint false, destructiveHint and openWorldHint true), which is right for a
  // consequential action and wrong for a read; a null entry and a tool listed twice are named, not thrown.
  const defaults = structuredClone(generated.tools) as Record<string, unknown>[];
  delete defaults[2]!["annotations"];
  assert.deepEqual(compareMcp(shopping, { tools: defaults }), []);
  delete defaults[0]!["annotations"];
  assert.ok(compareMcp(shopping, { tools: defaults }).some((p) => p.startsWith("get_shopping_list: annotation readOnlyHint")));
  const odd = [...(structuredClone(generated.tools) as unknown[]), null, structuredClone(generated.tools[1])];
  const oddProblems = compareMcp(shopping, { tools: odd });
  assert.ok(oddProblems.some((p) => /^tools\[\d+\]: is not a tool with a name/.test(p)), oddProblems.join("\n"));
  assert.ok(oddProblems.some((p) => p.startsWith("add_shopping_list_item: the server lists it twice")), oddProblems.join("\n"));
});

test("the CLI: check exits 0 on the fixture and 1 with findings on drift; usage exits 2", async () => {
  const { mkdtemp, cp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const decl = new URL("./fixtures/actions/shopping.actions.mts", import.meta.url).pathname;
  const gen = new URL("./fixtures/actions/generated", import.meta.url).pathname;
  const run = async (argv: string[]) => {
    let out = "";
    let err = "";
    const code = await main(argv, { out: (s) => void (out += s), err: (s) => void (err += s) });
    return { code, out, err };
  };
  const ok = await run(["check", decl, gen]);
  assert.equal(ok.code, 0);
  assert.match(ok.out, /4 actions, every projection matches its declaration/);

  const tmp = await mkdtemp(join(tmpdir(), "ouro-actions-"));
  try {
    await cp(gen, tmp, { recursive: true });
    await writeFile(join(tmp, "webmcp.json"), "{}\n");
    const bad = await run(["check", decl, tmp]);
    assert.equal(bad.code, 1);
    assert.match(bad.err, /^ouro-actions: webmcp\.json:1: drifted/);
    const fresh = join(tmp, "fresh");
    assert.equal((await run(["generate", decl, fresh])).code, 0);
    assert.equal((await run(["check", decl, fresh])).code, 0);
    // A subfolder of the generated folder is not a generated file, and reading it doesn't throw.
    const withSub = await run(["check", decl, tmp]);
    assert.equal(withSub.code, 1);
    assert.doesNotMatch(withSub.err, /fresh|EISDIR/);
    await writeFile(join(tmp, "tools.json"), JSON.stringify({ tools: [] }));
    assert.equal((await run(["compare-mcp", decl, join(tmp, "tools.json")])).code, 1);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  assert.equal((await run(["frobnicate"])).code, 2);
});

test("the generator's version is core's version", async () => {
  const { readFile } = await import("node:fs/promises");
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
  assert.equal(ACTIONS_VERSION, pkg.version);
});

test("Swift: one App Intent per agent door, Button(intent:), confirmation only when consequential, escaped strings", () => {
  const swift = renderActions(shopping).get("OuroActions.swift")!;
  assert.match(swift, /public struct AddShoppingListItemIntent: AppIntent \{/);
  assert.match(swift, /public var quantity: Double\?/);
  assert.match(swift, /Button\(intent: AddShoppingListItemIntent\(input\)\)/);
  assert.equal(swift.match(/requestConfirmation\(\)/g)?.length, 1);
  assert.match(swift, /public struct ShareShoppingListIntent: AppIntent \{[\s\S]*?requestConfirmation\(\)[\s\S]*?\n\}/);
  assert.doesNotMatch(swift, /PlaceGroceryOrderIntent/);
  assert.match(swift, /IntentDescription\("Add one item to the person's shopping list\./);
  assert.match(swift, /description: "What to buy, as the person said it, such as \\"oat milk\\"\."/);
  // An enum's Swift type is the action, the field and "Value", so it can't clash with another generated type.
  assert.match(swift, /public enum GetShoppingListShowValue: String/);
  const tricky = defineActions("tricky", [defineAction({ ...base, label: 'Pin \\ "it"', description: "A \\ path." })]);
  const trickySwift = renderActions(tricky).get("OuroActions.swift")!;
  assert.match(trickySwift, /LocalizedStringResource = "Pin \\\\ \\"it\\""/);
  const reins = renderActions(shopping).get("OuroActionsReins.swift")!;
  assert.match(reins, /public static func addShoppingListItem\(\) -> ReinsAction/);
  assert.match(reins, /public static func placeGroceryOrder\(\) -> ReinsAction/);
});

test("Swift: a protocol-only field stays off the App Intent and Reins, ask becomes Siri's question, and the intent speaks", () => {
  const swift = renderActions(shopping).get("OuroActions.swift")!;
  const intent = swift.match(/public struct AddShoppingListItemIntent: AppIntent \{[\s\S]*?\n\}/)![0];
  // The input keeps it, so every door hands the handler one type; the person's doors never set it.
  assert.match(swift, /public struct AddShoppingListItemInput[\s\S]*?public var idempotencyKey: String\?/);
  assert.doesNotMatch(intent, /idempotencyKey/);
  assert.match(intent, /AddShoppingListItemInput\(name: name, quantity: quantity, unit: unit\)/);
  assert.match(intent, /@Parameter\(title: "Item", description: "[^"]*\\"oat milk\\"\.", requestValueDialog: "What should I add to your list\?"\)/);
  assert.equal(swift.match(/requestValueDialog/g)?.length, 1);
  // The intent always provides a dialog: the app's words for the result or the error, else "Done." and a throw.
  assert.match(intent, /some IntentResult & ProvidesDialog/);
  assert.match(intent, /if let dialog = AddShoppingListItemAction\.dialog \{ return \.result\(dialog: try await dialog\(input, result\)\) \}/);
  assert.match(intent, /_ = try result\.get\(\)\n\s+return \.result\(dialog: "Done\."\)/);
  assert.match(swift, /public static var dialog: \(@MainActor @Sendable \(AddShoppingListItemInput, Result<AddShoppingListItemOutput, any Error>\) async throws -> IntentDialog\)\?/);
  // A person-only action has no intent, so nothing to speak.
  assert.doesNotMatch(swift, /PlaceGroceryOrderInput, Result</);
  const reins = renderActions(shopping).get("OuroActionsReins.swift")!;
  assert.match(reins, /extension AddShoppingListItemInput: ReinsInput \{\n.*\["name": \.string, "quantity": \.number, "unit": \.string\], required: \["name"\]/);
});

test("compareMcp's undeclared list lets an app move tool by tool, and it can only shrink", () => {
  const generated = JSON.parse(renderActions(shopping).get("mcp.json")!);
  const legacy = { name: "get_recipe", description: "Read a recipe.", inputSchema: { type: "object" } };
  const tools = [...generated.tools, legacy];
  assert.deepEqual(compareMcp(shopping, { tools }), ["get_recipe: the server lists a tool no declaration has. Fix: declare it with defineAction."]);
  assert.deepEqual(compareMcp(shopping, { tools }, { undeclared: ["get_recipe"] }), []);
  // A declared tool still drifts as before, undeclared list or not.
  const drifted = structuredClone(tools);
  drifted[1].description = "Adds.";
  assert.ok(compareMcp(shopping, { tools: drifted }, { undeclared: ["get_recipe"] })[0]!.startsWith("add_shopping_list_item: description drifted"));
  assert.deepEqual(compareMcp(shopping, { tools }, { undeclared: ["get_recipe", "add_shopping_list_item", "gone_tool"] }), [
    "add_shopping_list_item: is declared, so it isn't undeclared any more. Fix: take it off the undeclared list.",
    "gone_tool: is on the undeclared list but the server doesn't list it. Fix: take it off the undeclared list.",
  ]);
});

test("the CLI: compare-mcp takes --undeclared <names.json>; anything else after it is a usage error", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const decl = new URL("./fixtures/actions/shopping.actions.mts", import.meta.url).pathname;
  const run = async (argv: string[]) => {
    let out = "";
    let err = "";
    const code = await main(argv, { out: (s) => void (out += s), err: (s) => void (err += s) });
    return { code, out, err };
  };
  const tmp = await mkdtemp(join(tmpdir(), "ouro-actions-"));
  try {
    const generated = JSON.parse(renderActions(shopping).get("mcp.json")!);
    await writeFile(join(tmp, "tools.json"), JSON.stringify({ tools: [...generated.tools, { name: "get_recipe", description: "", inputSchema: {} }] }));
    await writeFile(join(tmp, "undeclared.json"), JSON.stringify(["get_recipe"]));
    await writeFile(join(tmp, "bad.json"), JSON.stringify({ get_recipe: true }));
    assert.equal((await run(["compare-mcp", decl, join(tmp, "tools.json")])).code, 1);
    const ok = await run(["compare-mcp", decl, join(tmp, "tools.json"), "--undeclared", join(tmp, "undeclared.json")]);
    assert.equal(ok.code, 0, ok.err);
    assert.match(ok.out, /the live tools match their declarations/);
    const bad = await run(["compare-mcp", decl, join(tmp, "tools.json"), "--undeclared", join(tmp, "bad.json")]);
    assert.equal(bad.code, 2);
    assert.match(bad.err, /not a JSON array of tool names/);
    assert.equal((await run(["compare-mcp", decl, join(tmp, "tools.json"), "--undeclared"])).code, 2);
    assert.equal((await run(["check", decl, tmp, "--undeclared", join(tmp, "undeclared.json")])).code, 2);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("Swift: an intent can take an App Entity, return a value to Shortcuts and open the app", () => {
  const swift = renderActions(shopping).get("OuroActions.swift")!;
  // get_shopping_list: opensApp, and one `returned` output handed to Shortcuts along with the dialog.
  assert.match(swift, /public struct GetShoppingListIntent: AppIntent \{[\s\S]*?public static let openAppWhenRun = true/);
  assert.match(swift, /public func perform\(\) async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog \{[\s\S]*?let said: IntentDialog = try await GetShoppingListAction\.dialog\?\(input, result\) \?\? "Done\."\n        return \.result\(value: try result\.get\(\)\.items, dialog: said\)/);
  // An intent that declares neither returns a dialog only and does not open the app.
  assert.match(swift, /public func perform\(\) async throws -> some IntentResult & ProvidesDialog \{/);
  assert.equal(swift.match(/openAppWhenRun/g)?.length, 1);
  assert.equal(swift.match(/ReturnsValue</g)?.length, 1);
  // share_shopping_list: `with` is a HouseholdMemberEntity in the intent and a plain string in Input, MCP and the CLI.
  assert.match(swift, /@Parameter\(title: "With", description: [^\n]*\)\n    public var with: HouseholdMemberEntity\n/);
  assert.match(swift, /self\.with = HouseholdMemberEntity\(id: input\.with\)/);
  assert.match(swift, /ShareShoppingListInput\(with: with\.id, canEdit: canEdit\)/);
  assert.match(swift, /public struct ShareShoppingListInput: Codable, Sendable, Hashable \{\n    public var with: String\n/);
  assert.equal((inputSchema(shareShoppingList).properties["with"] as { type: string }).type, "string");
  // An optional entity is optional on both sides.
  const optional = defineActions("optional", [defineAction({ ...base, input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", optional: true, entity: "RecipeEntity" }) } })]);
  const optionalSwift = renderActions(optional).get("OuroActions.swift")!;
  assert.match(optionalSwift, /public var recipe: RecipeEntity\?/);
  assert.match(optionalSwift, /self\.recipe = input\.recipe\.map \{ RecipeEntity\(id: \$0\) \}/);
  assert.match(optionalSwift, /PinRecipeInput\(recipe: recipe\?\.id\)/);
});

test("defineAction refuses what the intent options can't carry, with the fix", () => {
  const throwsWith = (def: object, pattern: RegExp) => assert.throws(() => defineAction({ ...base, ...def } as never), pattern);
  throwsWith({ output: { a: field.string({ label: "A", description: "One.", returned: true }), b: field.string({ label: "B", description: "Two.", returned: true }) } }, /only one output field can be returned/);
  throwsWith({ output: { a: field.string({ label: "A", description: "One.", returned: true, optional: true }) } }, /returned must be required/);
  throwsWith({ output: { a: field.enum({ label: "A", description: "One.", values: ["x"], returned: true }) } }, /returned must be a string, number, integer or boolean/);
  throwsWith({ input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", returned: true }) } }, /returned is only for an output field/);
  throwsWith({ output: { a: { ...field.string({ label: "A", description: "One." }), entity: "RecipeEntity" } } }, /entity is only for an input string field/);
  throwsWith({ input: { n: field.number({ label: "N", description: "A number.", entity: "RecipeEntity" } as never) } }, /entity is only for an input string field/);
  throwsWith({ input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", entity: "recipe" }) } }, /entity is not a Swift type name/);
  throwsWith({ input: { recipe: field.string({ label: "Recipe", description: "The recipe's id.", optional: true, protocolOnly: true, entity: "RecipeEntity" }) } }, /entity is for the person's doors/);
  throwsWith({ opensApp: "yes" }, /opensApp is "yes". Fix: true or false/);
});

test("felt number: one declaration, seven projections", () => {
  const files = renderActions(shopping);
  const surfaces = [
    JSON.parse(files.get("commands.json")!).commands.some((c: { name: string }) => c.name === "list add"),
    JSON.parse(files.get("mcp.json")!).tools.some((t: { name: string }) => t.name === "add_shopping_list_item"),
    JSON.parse(files.get("webmcp.json")!).tools.some((t: { name: string }) => t.name === "add_shopping_list_item"),
    files.get("web.ts")!.includes('id: "add-shopping-list-item"'),
    files.get("OuroActions.swift")!.includes("struct AddShoppingListItemIntent: AppIntent"),
    files.get("OuroActions.swift")!.includes("Button(intent: AddShoppingListItemIntent(input))"),
    files.get("OuroActionsReins.swift")!.includes("static func addShoppingListItem()"),
  ];
  assert.deepEqual(surfaces, Array(7).fill(true));
});

test("the generator runs alone, as an app vendors it: copied into an empty folder, it generates and checks", async () => {
  const { mkdtemp, copyFile, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const dir = await mkdtemp(join(tmpdir(), "ouro-actions-vendored-"));
  try {
    await copyFile(new URL("../src/actions.mts", import.meta.url), join(dir, "ouro-actions.mts"));
    await writeFile(
      join(dir, "pins.actions.mts"),
      [
        'import { defineAction, defineActions, field } from "./ouro-actions.mts";',
        "export default defineActions(\"pins\", [defineAction({ id: \"pin_recipe\", consent: \"write\", label: \"Pin\", description: \"Pin this recipe.\",",
        "  agent: \"Pin a recipe to the top of the person's kitchen.\", input: { recipe: field.string({ label: \"Recipe\", description: \"The recipe's id.\", arg: true }) }, output: {} })]);",
        "",
      ].join("\n"),
    );
    const node = (...args: string[]) => execFileSync(process.execPath, ["ouro-actions.mts", ...args], { cwd: dir, encoding: "utf8" });
    assert.match(node("generate", "pins.actions.mts", "generated"), /wrote 7 files for 1 action into generated/);
    assert.match(node("check", "pins.actions.mts", "generated"), /1 action, every projection matches/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
