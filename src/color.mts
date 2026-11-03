// Evaluates the CSS colour expressions today's stylesheets use, to sRGB: hex, rgb(), oklch(),
// `transparent`, var() through a lookup, and color-mix() in srgb or oklab (CSS Color 5,
// premultiplied alpha). Platforms that have no var() or color-mix(), such as SwiftUI, get the
// resolved colour from here.

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type Lookup = (cssName: string) => string | undefined;

export function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function parseNumberOrPercent(text: string, percentScale = 1): number {
  return text.endsWith("%") ? (Number(text.slice(0, -1)) / 100) * percentScale : Number(text);
}

function hexToRgba(hex: string): Rgba {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp01(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

function srgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklchToSrgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  return oklabToSrgb(L, C * Math.cos(h), C * Math.sin(h));
}

/** Splits "a b c / d" into its components and alpha. */
function channels(inner: string): { parts: string[]; alpha: string | undefined } {
  const [main, slashAlpha] = inner.split("/").map((s) => s.trim());
  const parts = main!.includes(",") ? main!.split(",").map((s) => s.trim()) : main!.split(/\s+/);
  const alpha = slashAlpha ?? (parts.length === 4 ? parts.pop() : undefined);
  return { parts, alpha };
}

function mix(space: string, c1: Rgba, p1: number, c2: Rgba, p2: number): Rgba {
  const sum = p1 + p2;
  const [w1, w2] = [p1 / sum, p2 / sum];
  const alphaScale = sum < 1 ? sum : 1;
  const a = c1.a * w1 + c2.a * w2;
  const into = (c: Rgba): [number, number, number] => (space === "oklab" ? srgbToOklab(c.r, c.g, c.b) : [c.r, c.g, c.b]);
  const [x1, x2] = [into(c1), into(c2)];
  // Premultiply, interpolate, unpremultiply. A fully transparent side contributes no colour.
  const comp = [0, 1, 2].map((i) => (a === 0 ? 0 : (x1[i]! * c1.a * w1 + x2[i]! * c2.a * w2) / a)) as [number, number, number];
  const [r, g, b] = space === "oklab" ? oklabToSrgb(...comp) : comp.map(clamp01);
  return { r: r!, g: g!, b: b!, a: a * alphaScale };
}

/** Evaluates a CSS colour, or returns null when the text is not a colour this module understands. */
export function evaluateColor(text: string, lookup: Lookup, depth = 0): Rgba | null {
  if (depth > 32) throw new Error(`colour reference cycle at ${text}`);
  const t = text.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return hexToRgba(t);
  if (t === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (t === "white") return { r: 1, g: 1, b: 1, a: 1 };
  if (t === "black") return { r: 0, g: 0, b: 0, a: 1 };
  const call = /^([a-z-]+)\((.*)\)$/is.exec(t);
  if (!call) return null;
  const [, fn, inner] = call as unknown as [string, string, string];
  if (fn === "var") {
    const [name, fallback] = splitTopLevel(inner, ",");
    const value = lookup(name!) ?? fallback;
    return value === undefined ? null : evaluateColor(value, lookup, depth + 1);
  }
  if (fn === "rgb" || fn === "rgba") {
    const { parts, alpha } = channels(inner);
    const [r, g, b] = parts.map((p) => parseNumberOrPercent(p, 255) / 255);
    return { r: r!, g: g!, b: b!, a: alpha === undefined ? 1 : parseNumberOrPercent(alpha) };
  }
  if (fn === "oklch") {
    const { parts, alpha } = channels(inner);
    const [L, C, H] = [parseNumberOrPercent(parts[0]!), parseNumberOrPercent(parts[1]!, 0.4), Number(parts[2] ?? 0)];
    const [r, g, b] = oklchToSrgb(L, C, H);
    return { r, g, b, a: alpha === undefined ? 1 : parseNumberOrPercent(alpha) };
  }
  if (fn === "color-mix") {
    const [method, first, second] = splitTopLevel(inner, ",");
    const space = /^in\s+(srgb|oklab)$/.exec(method!)?.[1];
    if (!space || !first || !second) return null;
    const side = (s: string) => {
      const m = /^(.*?)(?:\s+([\d.]+%))?$/s.exec(s)!;
      return { color: evaluateColor(m[1]!, lookup, depth + 1), p: m[2] === undefined ? undefined : Number(m[2].slice(0, -1)) / 100 };
    };
    const [x, y] = [side(first), side(second)];
    if (!x.color || !y.color) return null;
    const p1 = x.p ?? (y.p === undefined ? 0.5 : 1 - y.p);
    const p2 = y.p ?? 1 - p1;
    return mix(space, x.color, p1, y.color, p2);
  }
  return null;
}

const round4 = (x: number) => Math.round(x * 10000) / 10000;

export function rgbaToHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b].map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** A DTCG 2025.10 colour value in sRGB, with the six-digit hex fallback. */
export function rgbaToDtcg(c: Rgba): { colorSpace: "srgb"; components: number[]; alpha?: number; hex: string } {
  return { colorSpace: "srgb", components: [c.r, c.g, c.b].map(round4), ...(c.a < 1 ? { alpha: round4(c.a) } : {}), hex: rgbaToHex(c) };
}

/** Converts a DTCG colour value (srgb or oklch) to sRGB. */
export function dtcgToRgba(value: { colorSpace: string; components: (number | "none")[]; alpha?: number; hex?: string }): Rgba {
  const comps = value.components.map((c) => (c === "none" ? 0 : c));
  const a = value.alpha ?? 1;
  if (value.colorSpace === "srgb") return { r: comps[0]!, g: comps[1]!, b: comps[2]!, a };
  if (value.colorSpace === "oklch") {
    const [r, g, b] = oklchToSrgb(comps[0]!, comps[1]!, comps[2]!);
    return { r, g, b, a };
  }
  throw new Error(`unsupported colour space ${value.colorSpace}`);
}
