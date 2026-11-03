// Loads the DTCG token sets, layers a theme over the base set, and asks Terrazzo's parser to
// validate the result and resolve aliases and modes.
import { readFile } from "node:fs/promises";
import { defineConfig, parse } from "@terrazzo/parser";
import { aliasPath, formatValue, isAlias, type DtcgType } from "./css-value.mts";

export const THEMES = ["pearl", "abyss", "brass", "chart", "cookbook", "coral"] as const;
export type ThemeName = (typeof THEMES)[number];

export interface OuroExtension {
  /** The exact CSS text for the light (default) mode, when formatting $value would not give it. */
  css?: string;
  /** The exact CSS text for the dark mode. */
  cssDark?: string;
  /** false: a token for platforms other than web, which no stylesheet writes. */
  web?: boolean;
}

export interface RawToken {
  $type: DtcgType;
  $value: unknown;
  $description?: string;
  $extensions?: { mode?: { dark?: unknown }; "bot.ouro"?: OuroExtension };
}

export type TokenMap = Map<string, RawToken>;

const root = new URL("../", import.meta.url);
export const tokenFile = (theme?: ThemeName) => new URL(theme ? `tokens/themes/${theme}.tokens.json` : "tokens/ouro.tokens.json", root);

const isToken = (node: unknown): node is RawToken => typeof node === "object" && node !== null && "$value" in node;

export function flatten(doc: Record<string, unknown>, prefix: string[] = [], into: TokenMap = new Map()): TokenMap {
  for (const [key, node] of Object.entries(doc)) {
    if (key.startsWith("$")) continue;
    const path = [...prefix, key];
    if (isToken(node)) into.set(path.join("."), node);
    else flatten(node as Record<string, unknown>, path, into);
  }
  return into;
}

export function nest(map: TokenMap, header: Record<string, unknown> = {}): Record<string, unknown> {
  const doc: Record<string, unknown> = { ...header };
  for (const [id, token] of map) {
    const path = id.split(".");
    let group = doc;
    for (const part of path.slice(0, -1)) group = (group[part] ??= {}) as Record<string, unknown>;
    group[path.at(-1)!] = token;
  }
  return doc;
}

export async function readSet(theme?: ThemeName): Promise<TokenMap> {
  return flatten(JSON.parse(await readFile(tokenFile(theme), "utf8")));
}

/** The base set with a theme's tokens laid over it; a theme token replaces the base token whole. */
export async function layered(theme?: ThemeName): Promise<TokenMap> {
  const base = await readSet();
  if (!theme) return base;
  return new Map([...base, ...(await readSet(theme))]);
}

/** The CSS text a stylesheet writes for a token in a mode. */
export function cssText(tokens: TokenMap, id: string, mode: "light" | "dark"): string {
  const token = tokens.get(id);
  if (!token) throw new Error(`no token ${id}`);
  const ext = token.$extensions?.["bot.ouro"];
  const dark = token.$extensions?.mode?.dark;
  let text: string | null | undefined;
  if (mode === "dark") text = ext?.cssDark ?? (dark !== undefined ? formatValue(token.$type, dark) : (ext?.css ?? formatValue(token.$type, token.$value)));
  else text = ext?.css ?? formatValue(token.$type, token.$value);
  if (text === null || text === undefined) throw new Error(`${id} (${mode}) has no CSS spelling`);
  return text;
}

export interface Resolved {
  light: unknown;
  dark: unknown;
  type: string;
}

/**
 * An alias whose chain changes in dark mode must state its dark alias outright. Terrazzo 2.10
 * resolves an alias's inherited dark mode through the next token's default value, not that
 * token's dark alias: --background: var(--sj-paper) would resolve dark to --sj-bone instead of
 * --sj-charcoal. Returns a copy; the importer writes the pins into the JSON, and resolve() applies
 * them again so a hand-edited alias can't lose its dark value.
 */
export function pinDarkAliases(map: TokenMap, fallback: TokenMap = new Map()): TokenMap {
  const out: TokenMap = new Map();
  const find = (id: string) => map.get(id) ?? fallback.get(id);
  const hasDark = (id: string, seen = new Set<string>()): boolean => {
    const t = find(id);
    if (!t || seen.has(id)) return false;
    seen.add(id);
    if (t.$extensions?.mode?.dark !== undefined) return true;
    return isAlias(t.$value) && hasDark(aliasPath(t.$value).join("."), seen);
  };
  for (const [id, token] of map) {
    const pin = isAlias(token.$value) && token.$extensions?.mode?.dark === undefined && hasDark(aliasPath(token.$value).join("."));
    out.set(id, pin ? { ...token, $extensions: { ...token.$extensions, mode: { dark: token.$value } } } : token);
  }
  return out;
}

/** Validates a layered set with Terrazzo and returns each token's resolved light and dark values. */
export async function resolve(tokens: TokenMap): Promise<Map<string, Resolved>> {
  const config = defineConfig({}, { cwd: root });
  const src = JSON.stringify(nest(pinDarkAliases(tokens)));
  const { tokens: parsed } = await parse([{ filename: new URL("file:///ouro.tokens.json"), src }], { config });
  const out = new Map<string, Resolved>();
  for (const [id, t] of Object.entries(parsed)) {
    const token = t as { $type: string; $value: unknown; mode: Record<string, { $value: unknown }> };
    out.set(id, { type: token.$type, light: token.$value, dark: token.mode.dark?.$value ?? token.$value });
  }
  return out;
}
