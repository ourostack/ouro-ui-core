// Derives the token sets and the web templates from web's stylesheets at a tag. Run once to
// bootstrap core (2026-11-03, from ourostack/ouro-ui v1.3.3) and again only to re-derive after a
// web change made outside core; once core is the source, edit tokens/ instead.
//
//   node scripts/import-from-web.mts                    from parity.json's webRepo@webTag, over HTTPS
//   node scripts/import-from-web.mts --from <git dir>   from a local clone of web, at the same tag
//
// It writes tokens/ouro.tokens.json, tokens/themes/<name>.tokens.json and templates/web/**, then
// renders the templates and refuses to finish unless each one reproduces web's file byte for byte.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { readDeclarations } from "../src/css-reader.mts";
import { isAlias, aliasPath, parseValue } from "../src/css-value.mts";
import { cssNameToPath } from "../src/names.mts";
import { nest, THEMES, type RawToken, type ThemeName, type TokenMap } from "../src/tokens.mts";
import { render } from "../src/web.mts";

const { values: args } = parseArgs({ options: { from: { type: "string" } } });
const root = new URL("../", import.meta.url);
const parity = JSON.parse(await readFile(new URL("parity.json", root), "utf8")) as { webRepo: string; webTag: string; files: Record<string, string> };

async function webFile(path: string): Promise<string> {
  if (args.from) return execFileSync("git", ["-C", args.from, "show", `${parity.webTag}:${path}`], { encoding: "utf8" });
  const response = await fetch(`https://raw.githubusercontent.com/${parity.webRepo}/${parity.webTag}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

interface Entry {
  name: string;
  light?: string;
  dark?: string;
  description?: string;
}
type State = Map<string, Entry>;

function record(state: State, id: string, name: string, mode: "light" | "dark", value: string, where: string) {
  const entry = state.get(id) ?? { name };
  state.set(id, entry);
  const previous = entry[mode];
  if (previous !== undefined && previous !== value) throw new Error(`${where}: ${name} (${mode}) is "${value}" here and "${previous}" earlier`);
  entry[mode] = value;
}

interface Source {
  template: string;
  webPath: string;
  css: string;
  theme: ThemeName | undefined;
}

const sources: Source[] = [];
for (const [dist, webPath] of Object.entries(parity.files)) {
  const template = dist.replace(/^dist\/web\//, "");
  const theme = /^themes\/([\w-]+)\.css$/.exec(template)?.[1] as ThemeName | undefined;
  sources.push({ template, webPath, css: await webFile(webPath), theme });
}

/** ouro-base.css writes shadcn's stock --input and --radius, which are not Ouro's own. */
const idFor = (source: Source, name: string) =>
  cssNameToPath(name, { shadcn: !source.theme && /ouro-base\.css$/.test(source.webPath) && (name === "--input" || name === "--radius") }).join(".");

// 1. Every declaration, per context: the base set (ouro-theme and ouro-base, both spellings) and each theme.
const base: State = new Map();
const themes = new Map<ThemeName, State>(THEMES.map((t) => [t, new Map()]));
const templates = new Map<string, string>();

for (const source of sources) {
  const state = source.theme ? themes.get(source.theme)! : base;
  const { lines, declarations } = readDeclarations(source.css);
  for (const d of declarations) {
    const id = idFor(source, d.name);
    const where = `${source.webPath}:${d.line + 1}`;
    if (d.mode !== "dark") record(state, id, d.name, "light", d.value, where);
    if (d.mode !== "light") record(state, id, d.name, "dark", d.value, where);
    if (d.comment) {
      const entry = state.get(id)!;
      if (entry.description && entry.description !== d.comment) throw new Error(`${where}: two descriptions for ${d.name}`);
      entry.description = d.comment;
    }
    lines[d.line] = `${d.indent}${d.name}: {{${id}${d.mode === "dark" ? "@dark" : ""}}};${d.comment ? ` /* {{${id}|description}} */` : ""}`;
  }
  templates.set(source.template, lines.join("\n"));
}

// 2. Tokens. var() inside an expression is looked up per mode, first in the theme, then in the base.
const textIn = (states: State[], mode: "light" | "dark") => (name: string) => {
  const id = cssNameToPath(name).join(".");
  for (const s of states) {
    const e = s.get(id);
    if (e) return mode === "dark" ? (e.dark ?? e.light) : (e.light ?? e.dark);
  }
  return undefined;
};

function makeToken(entry: Entry, states: State[], where: string): RawToken {
  if (entry.light === undefined) throw new Error(`${where}: ${entry.name} has a dark value and no light one`);
  const lightText = entry.light;
  const darkText = entry.dark ?? entry.light;
  const light = parseValue(entry.name, lightText, textIn(states, "light"));
  const dark = parseValue(entry.name, darkText, textIn(states, "dark"));
  if (light.type !== dark.type && !isAlias(light.value) && !isAlias(dark.value)) {
    throw new Error(`${where}: ${entry.name} is a ${light.type} in light and a ${dark.type} in dark`);
  }
  const token: RawToken = { $type: isAlias(light.value) ? dark.type : light.type, $value: light.value };
  if (entry.description) token.$description = entry.description;
  const darkDiffers = JSON.stringify(dark.value) !== JSON.stringify(light.value);
  const ext: RawToken["$extensions"] = {};
  if (darkDiffers) ext.mode = { dark: dark.value };
  const ouro: NonNullable<NonNullable<RawToken["$extensions"]>["bot.ouro"]> = {};
  if (light.css !== undefined) ouro.css = light.css;
  if (dark.css !== undefined && (darkDiffers || dark.css !== light.css)) ouro.cssDark = dark.css;
  if (Object.keys(ouro).length) ext["bot.ouro"] = ouro;
  if (Object.keys(ext).length) token.$extensions = ext;
  return token;
}

const baseTokens: TokenMap = new Map();
for (const [id, entry] of base) baseTokens.set(id, makeToken(entry, [base], "base"));

// The Apple platform needs the spring as SwiftUI does it, and ouro-base.css names it in prose:
// "Motion: a Motion spring(0.4, 0.15) as CSS". No stylesheet writes these two.
const baseCss = sources.find((s) => s.webPath.endsWith("registry/ouro/theme/ouro-base.css"))!.css;
if (!baseCss.includes("a Motion spring(0.4, 0.15) as CSS")) throw new Error("ouro-base.css no longer names the spring; update the spring tokens by hand");
baseTokens.set("ouro.spring.visual-duration", {
  $type: "duration",
  $value: { value: 400, unit: "ms" },
  $description: "The spring's perceived duration: Motion's spring(0.4, 0.15), which --ouro-ease-spring draws as CSS",
  $extensions: { "bot.ouro": { web: false } },
});
baseTokens.set("ouro.spring.bounce", {
  $type: "number",
  $value: 0.15,
  $description: "The spring's bounce: Motion's spring(0.4, 0.15), which --ouro-ease-spring draws as CSS",
  $extensions: { "bot.ouro": { web: false } },
});

/** Aliases take their target's type, so Terrazzo can check the reference. */
function typeAliases(map: TokenMap, fallback: TokenMap = new Map()) {
  for (const [id, token] of map) {
    let value = token.$value;
    const seen = new Set([id]);
    while (isAlias(value)) {
      const target = aliasPath(value).join(".");
      if (seen.has(target)) throw new Error(`alias cycle at ${id}`);
      seen.add(target);
      const t = map.get(target) ?? fallback.get(target);
      if (!t) throw new Error(`${id} refers to ${target}, which no token defines`);
      value = t.$value;
      if (!isAlias(value)) token.$type = t.$type;
    }
  }
}
/**
 * An alias whose chain changes in dark mode states its dark alias outright. Terrazzo 2.10 resolves
 * an alias's inherited dark mode through the next token's default value, not that token's dark
 * alias: --background: var(--sj-paper) would resolve dark to --sj-bone instead of --sj-charcoal.
 */
function pinDarkAliases(map: TokenMap, fallback: TokenMap = new Map()) {
  const find = (id: string) => map.get(id) ?? fallback.get(id);
  const hasDark = (id: string, seen = new Set<string>()): boolean => {
    const t = find(id);
    if (!t || seen.has(id)) return false;
    seen.add(id);
    if (t.$extensions?.mode?.dark !== undefined) return true;
    return isAlias(t.$value) && hasDark(aliasPath(t.$value).join("."), seen);
  };
  for (const token of map.values()) {
    if (!isAlias(token.$value) || token.$extensions?.mode?.dark !== undefined) continue;
    if (!hasDark(aliasPath(token.$value).join("."))) continue;
    token.$extensions = { ...token.$extensions, mode: { dark: token.$value } };
  }
}

typeAliases(baseTokens);
pinDarkAliases(baseTokens);

const themeTokens = new Map<ThemeName, TokenMap>();
for (const theme of THEMES) {
  const state = themes.get(theme)!;
  const set: TokenMap = new Map();
  for (const [id, entry] of state) {
    const token = makeToken(entry, [state, base], theme);
    const inherited = baseTokens.get(id);
    const strip = (t: RawToken) => JSON.stringify({ ...t, $description: undefined });
    if (!inherited || strip(inherited) !== strip(token)) set.set(id, token);
  }
  typeAliases(set, baseTokens);
  pinDarkAliases(set, baseTokens);
  themeTokens.set(theme, set);
}

// 3. Write, then prove the round trip before anyone relies on it.
const header = (description: string) => ({ $description: description });
// Two-space JSON, with arrays of numbers and strings on one line so colours read as one value.
const json = (doc: unknown) =>
  JSON.stringify(doc, null, 2).replace(/\[\s*([^[\]{}]*?)\s*\]/g, (_, inner: string) => `[${inner.split(/,\s*/).join(", ")}]`) + "\n";
await mkdir(new URL("tokens/themes/", root), { recursive: true });
await writeFile(
  new URL("tokens/ouro.tokens.json", root),
  json(nest(baseTokens, header(`Ouro UI's tokens: the default colours (Pearl) and what every Ouro component needs. DTCG 2025.10. Derived from ${parity.webRepo}@${parity.webTag}.`))),
);
for (const [theme, set] of themeTokens) {
  await writeFile(
    new URL(`tokens/themes/${theme}.tokens.json`, root),
    json(nest(set, header(`The ${theme[0]!.toUpperCase()}${theme.slice(1)} theme: the tokens it sets over tokens/ouro.tokens.json. DTCG 2025.10. Derived from ${parity.webRepo}@${parity.webTag}.`))),
  );
}
for (const [path, template] of templates) {
  const url = new URL(`templates/web/${path}`, root);
  await mkdir(new URL("./", url), { recursive: true });
  await writeFile(url, template);
}

let failures = 0;
for (const source of sources) {
  const tokens = source.theme ? new Map([...baseTokens, ...themeTokens.get(source.theme)!]) : baseTokens;
  const out = render(templates.get(source.template)!, tokens, source.template);
  const ok = out === source.css;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  templates/web/${source.template} renders ${source.webPath}`);
}
console.log(`${baseTokens.size} base tokens; theme overrides: ${[...themeTokens].map(([t, s]) => `${t} ${s.size}`).join(", ")}`);
process.exitCode = failures ? 1 : 0;
