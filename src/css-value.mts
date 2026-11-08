// CSS text <-> DTCG 2025.10 values, for the token types today's stylesheets use.
//
// A token's $value is always a valid DTCG value. When CSS needs a spelling that the value can't
// carry (a var() inside color-mix(), a percentage alpha, -apple-system unquoted), the exact CSS
// text rides along in $extensions["bot.ouro"].css (and .cssDark for the dark mode), and a test
// checks that the text and the value mean the same colour.
import { evaluateColor, rgbaToDtcg, type Lookup } from "./color.mts";
import { cssNameToPath, pathToCssName } from "./names.mts";

export type DtcgType = "color" | "dimension" | "duration" | "number" | "cubicBezier" | "fontFamily" | "string" | "typography";

export interface DtcgColor {
  colorSpace: string;
  components: (number | "none")[];
  alpha?: number;
  hex?: string;
}

export interface ParsedValue {
  type: DtcgType;
  value: unknown;
  /** The exact CSS text, present only when formatting `value` would not reproduce it. */
  css?: string;
}

const GENERIC_FAMILIES = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif",
  "ui-monospace", "ui-rounded", "emoji", "math", "fangsong",
]);

export const isAlias = (value: unknown): value is string => typeof value === "string" && /^\{[^{}]+\}$/.test(value);
export const aliasPath = (alias: string) => alias.slice(1, -1).split(".");

const num = (n: number) => String(n);

/** Formats a DTCG value as CSS, or returns null when this value has no plain CSS spelling. */
export function formatValue(type: DtcgType, value: unknown): string | null {
  if (isAlias(value)) return `var(${pathToCssName(aliasPath(value))})`;
  switch (type) {
    case "color": {
      const c = value as DtcgColor;
      if (c.colorSpace === "srgb" && c.hex && (c.alpha ?? 1) === 1) return c.hex;
      if (c.colorSpace === "oklch") return `oklch(${c.components.join(" ")}${(c.alpha ?? 1) === 1 ? "" : ` / ${num(c.alpha!)}`})`;
      return null;
    }
    case "dimension":
    case "duration": {
      const d = value as { value: number; unit: string };
      return `${num(d.value)}${d.unit}`;
    }
    case "number":
      return num(value as number);
    case "cubicBezier":
      return `cubic-bezier(${(value as number[]).map(num).join(", ")})`;
    case "fontFamily":
      return (value as string[]).map((f) => (GENERIC_FAMILIES.has(f) ? f : `"${f}"`)).join(", ");
    case "string":
      return value as string;
    case "typography":
      // A composite: no single CSS value spells it. Typography tokens are Apple-only (web: false).
      return null;
  }
}

function parseColorLiteral(text: string): DtcgColor | null {
  if (/^#[0-9a-f]{6}$/i.test(text)) {
    const c = evaluateColor(text, () => undefined)!;
    return { ...rgbaToDtcg(c), hex: text };
  }
  const oklch = /^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)$/.exec(text);
  if (oklch) {
    const [, L, C, H, A] = oklch;
    const alpha = A === undefined ? undefined : A.endsWith("%") ? Number(A.slice(0, -1)) / 100 : Number(A);
    const l = L!.endsWith("%") ? Number(L!.slice(0, -1)) / 100 : Number(L);
    return { colorSpace: "oklch", components: [l, Number(C), Number(H)], ...(alpha === undefined ? {} : { alpha }) };
  }
  return null;
}

/**
 * Parses one CSS custom property value. `name` hints the type (font stacks), and `lookup` resolves
 * var() for colour expressions in the mode being parsed.
 */
export function parseValue(name: string, text: string, lookup: Lookup): ParsedValue {
  const withCss = (type: DtcgType, value: unknown): ParsedValue => {
    const formatted = formatValue(type, value);
    return formatted === text ? { type, value } : { type, value, css: text };
  };

  const alias = /^var\((--[\w-]+)\)$/.exec(text);
  if (alias) {
    // The type comes from the target; the caller fills it in once every token is known.
    return { type: "string", value: `{${cssNameToPath(alias[1]!).join(".")}}` };
  }
  const literal = parseColorLiteral(text);
  if (literal) return withCss("color", literal);
  if (/^(#[0-9a-f]{3,8}|rgba?\(|color-mix\(|transparent$)/i.test(text)) {
    const c = evaluateColor(text, lookup);
    if (c) return { type: "color", value: rgbaToDtcg(c), css: text };
  }
  let m = /^(-?[\d.]+)(rem|px)$/.exec(text);
  if (m) return withCss("dimension", { value: Number(m[1]), unit: m[2] });
  m = /^([\d.]+)(ms|s)$/.exec(text);
  if (m) return withCss("duration", { value: Number(m[1]), unit: m[2] });
  if (/^-?[\d.]+$/.test(text)) return withCss("number", Number(text));
  m = /^cubic-bezier\(([^)]*)\)$/.exec(text);
  if (m) return withCss("cubicBezier", m[1]!.split(",").map((s) => Number(s.trim())));
  if (/^--font-/.test(name)) {
    const families = text.split(",").map((s) => s.trim().replace(/^"(.*)"$/, "$1"));
    return withCss("fontFamily", families);
  }
  return { type: "string", value: text };
}
