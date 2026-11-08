// Ouro HX for Apple: renders dist/apple/OuroTokens.swift, a SwiftUI file with no dependencies.
// Colours are resolved here (aliases, modes and color-mix() included), because SwiftUI has no
// var(). The CSS has light and dark values and no high-contrast ones, so neither does this file.
// An oklch() colour outside sRGB is written in Display P3, as browsers draw it on wide-gamut screens.
import { dtcgToRgba, evaluateColor, oklchToDisplayP3, rgbaToHex, splitTopLevel, type Rgba } from "./color.mts";
import { aliasPath, isAlias, type DtcgColor } from "./css-value.mts";
import { pathToCssName } from "./names.mts";
import { cssText, layered, readSet, resolve, THEMES, type Resolved, type ThemeName, type TokenMap } from "./tokens.mts";

/** The colours each theme carries on Apple, by token name. */
export const APPLE_COLORS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring",
  "success", "success-foreground", "warning", "warning-foreground",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5", "avatar-6", "avatar-7", "avatar-8",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
] as const;

/** Points per rem: Apple's text sizes and the web's default root font size agree on 16. */
const POINTS_PER_REM = 16;

export const swiftName = (token: string) => token.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

const fixed = (x: number) => {
  const s = (Math.round(x * 10000) / 10000).toFixed(4).replace(/0+$/, "").replace(/\.$/, ".0");
  return s === "-0.0" ? "0.0" : s;
};

function swiftColor(value: unknown, where: string): string {
  const c = value as DtcgColor;
  if (!c || typeof c !== "object" || !("colorSpace" in c)) throw new Error(`${where} is not a colour`);
  const { r, g, b, a } = dtcgToRgba(c);
  const p3 = c.colorSpace === "oklch" ? oklchToDisplayP3(...(c.components.map((x) => (x === "none" ? 0 : x)) as [number, number, number])) : null;
  if (p3) {
    // Outside sRGB: browsers draw it in Display P3 on wide-gamut screens, so SwiftUI does too.
    return `Color(.displayP3, red: ${fixed(p3[0])}, green: ${fixed(p3[1])}, blue: ${fixed(p3[2])}, opacity: ${fixed(a)}) /* oklch(${c.components.join(" ")}), outside sRGB; ${rgbaToHex({ r, g, b, a })} clipped */`;
  }
  return `Color(.sRGB, red: ${fixed(r)}, green: ${fixed(g)}, blue: ${fixed(b)}, opacity: ${fixed(a)}) /* ${rgbaToHex({ r, g, b, a })}${a < 1 ? ` at ${Math.round(a * 100)}%` : ""} */`;
}

/** An already-evaluated colour (a shadow's colour-mix()), always in sRGB. */
function swiftRgba(c: Rgba): string {
  const hex = rgbaToHex(c);
  return `Color(.sRGB, red: ${fixed(c.r)}, green: ${fixed(c.g)}, blue: ${fixed(c.b)}, opacity: ${fixed(c.a)}) /* ${hex}${c.a < 1 ? ` at ${Math.round(c.a * 100)}%` : ""} */`;
}

function seconds(value: unknown, where: string): string {
  const d = value as { value: number; unit: string };
  if (d?.unit === "ms") return fixed(d.value / 1000);
  if (d?.unit === "s") return fixed(d.value);
  throw new Error(`${where} is not a duration`);
}

function points(value: unknown, where: string): string {
  const d = value as { value: number; unit: string };
  if (d?.unit === "rem") return fixed(d.value * POINTS_PER_REM);
  if (d?.unit === "px") return fixed(d.value);
  throw new Error(`${where} is not a dimension`);
}

const get = (map: Map<string, Resolved>, id: string, where: string) => {
  const r = map.get(id);
  if (!r) throw new Error(`${where}: no token ${id}`);
  return r;
};


/** Apple's Dynamic Type styles, which a typography token's `appleTextStyle` names. */
export const APPLE_TEXT_STYLES = ["largeTitle", "title", "title2", "title3", "headline", "body", "callout", "subheadline", "footnote", "caption", "caption2"] as const;

export interface ShadowLayer {
  x: number;
  y: number;
  /** SwiftUI's shadow radius: half the CSS blur. */
  radius: number;
  color: Rgba;
}

/**
 * A theme's own tokens: the ones no other theme and not the base set defines, outside Ouro's own
 * `ouro.*` group (Cookbook's sj-* and font-sj-*), sorted into the kinds Apple can use. Names every
 * theme sets, such as font-heading and shadow-md, are shared roles, not extras, so Pearl has none.
 */
export interface ThemeExtras {
  colors: { id: string; swift: string; light: Rgba; dark: Rgba; source: { light: unknown; dark: unknown } }[];
  fonts: { id: string; swift: string; families: string[] }[];
  lengths: { id: string; swift: string; points: number }[];
  numbers: { id: string; swift: string; value: number }[];
  shadows: { id: string; swift: string; light: ShadowLayer; dark: ShadowLayer }[];
  type: { id: string; swift: string; family: string; weight: number; size: number; textStyle: string; tracking: number; lineHeight: number }[];
}

const pointsOf = (value: unknown, where: string) => Number(points(value, where));
const fontCase = (id: string) => swiftName(id.replace(/^font-/, ""));

/** Parses one CSS box-shadow layer, `<x> <y> <blur> [<spread>] <colour>`, in px. */
function shadowLayer(text: string, lookup: (cssName: string) => string | undefined, where: string): ShadowLayer {
  if (splitTopLevel(text, ",").length !== 1) throw new Error(`${where}: one shadow layer expected, got ${text}`);
  const m = /^(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?\s+(?:(-?[\d.]+)(?:px)?\s+)?(.+)$/s.exec(text.trim());
  if (!m) throw new Error(`${where}: not a box-shadow: ${text}`);
  if (m[4] !== undefined && Number(m[4]) !== 0) throw new Error(`${where}: SwiftUI's shadow has no spread: ${text}`);
  const color = evaluateColor(m[5]!, lookup);
  if (!color) throw new Error(`${where}: shadow colour ${m[5]} doesn't resolve`);
  return { x: Number(m[1]), y: Number(m[2]), radius: Number(m[3]) / 2, color };
}

export async function themeExtras(theme: ThemeName): Promise<ThemeExtras> {
  const elsewhere = new Set([...(await readSet()).keys()]);
  for (const other of THEMES) if (other !== theme) for (const id of (await readSet(other)).keys()) elsewhere.add(id);
  const own = [...(await readSet(theme))].filter(([id]) => !elsewhere.has(id) && !id.startsWith("ouro."));
  const tokens: TokenMap = await layered(theme);
  const resolved = await resolve(tokens);
  const byCss = new Map([...tokens.keys()].filter((id) => !id.startsWith("shadcn.")).map((id) => [pathToCssName(id.split(".")), id]));
  const lookup = (mode: "light" | "dark") => (name: string) => (byCss.has(name) ? cssText(tokens, byCss.get(name)!, mode) : undefined);
  const out: ThemeExtras = { colors: [], fonts: [], lengths: [], numbers: [], shadows: [], type: [] };
  for (const [id, raw] of own) {
    const r = get(resolved, id, theme);
    const where = `${theme} ${id}`;
    switch (raw.$type) {
      case "color":
        out.colors.push({ id, swift: swiftName(id), light: dtcgToRgba(r.light as DtcgColor), dark: dtcgToRgba(r.dark as DtcgColor), source: { light: r.light, dark: r.dark } });
        break;
      case "fontFamily":
        out.fonts.push({ id, swift: fontCase(id), families: r.light as string[] });
        break;
      case "dimension":
        out.lengths.push({ id, swift: swiftName(id), points: pointsOf(r.light, where) });
        break;
      case "number":
        out.numbers.push({ id, swift: swiftName(id), value: r.light as number });
        break;
      case "string":
        out.shadows.push({
          id,
          swift: swiftName(id),
          light: shadowLayer(cssText(tokens, id, "light"), lookup("light"), `${where} (light)`),
          dark: shadowLayer(cssText(tokens, id, "dark"), lookup("dark"), `${where} (dark)`),
        });
        break;
      case "typography": {
        const v = raw.$value as { fontFamily: unknown; fontWeight: number; fontSize: unknown; letterSpacing: unknown; lineHeight: number };
        if (!isAlias(v.fontFamily)) throw new Error(`${where}: fontFamily must name one of the theme's font tokens`);
        const family = aliasPath(v.fontFamily).join(".");
        if (!own.some(([fid, t]) => fid === family && t.$type === "fontFamily")) throw new Error(`${where}: ${family} is not one of ${theme}'s own font tokens`);
        const textStyle = raw.$extensions?.["bot.ouro"]?.appleTextStyle;
        if (!textStyle || !(APPLE_TEXT_STYLES as readonly string[]).includes(textStyle)) throw new Error(`${where}: $extensions["bot.ouro"].appleTextStyle must be one of ${APPLE_TEXT_STYLES.join(", ")}`);
        out.type.push({
          id,
          swift: swiftName(id),
          family: fontCase(family),
          weight: v.fontWeight,
          size: pointsOf(v.fontSize, `${where} fontSize`),
          textStyle,
          tracking: pointsOf(v.letterSpacing, `${where} letterSpacing`),
          lineHeight: v.lineHeight,
        });
        break;
      }
      default:
        throw new Error(`${where}: Apple has no use for a theme's own ${raw.$type} token yet`);
    }
  }
  return out;
}

/** The Swift for one theme's extras: `.empty` when it has none. */
function swiftExtras(e: ThemeExtras): string {
  if (Object.values(e).every((list) => list.length === 0)) return ".empty";
  const dict = (entries: string[], indent: string) => (entries.length ? `[\n${entries.map((x) => `${indent}    ${x}`).join(",\n")}\n${indent}]` : "[:]");
  const i = "            ";
  const layer = (l: ShadowLayer) => `OuroShadowLayer(color: ${swiftRgba(l.color)}, radius: ${fixed(l.radius)}, x: ${fixed(l.x)}, y: ${fixed(l.y)})`;
  return `OuroThemeExtras(
${i}light: ${dict(e.colors.map((c) => `.${c.swift}: ${swiftColor(c.source.light, c.id)}`), i)},
${i}dark: ${dict(e.colors.map((c) => `.${c.swift}: ${swiftColor(c.source.dark, c.id)}`), i)},
${i}fonts: ${dict(e.fonts.map((f) => `.${f.swift}: [${f.families.map((x) => JSON.stringify(x)).join(", ")}]`), i)},
${i}lengths: ${dict(e.lengths.map((l) => `.${l.swift}: ${fixed(l.points)}`), i)},
${i}numbers: ${dict(e.numbers.map((n) => `.${n.swift}: ${fixed(n.value)}`), i)},
${i}shadows: ${dict(e.shadows.map((s) => `.${s.swift}: OuroShadow(light: ${layer(s.light)}, dark: ${layer(s.dark)})`), i)},
${i}type: ${dict(e.type.map((t) => `.${t.swift}: OuroTypeToken(family: .${t.family}, weight: ${t.weight}, size: ${fixed(t.size)}, textStyle: .${t.textStyle}, tracking: ${fixed(t.tracking)}, lineHeight: ${fixed(t.lineHeight)})`), i)}
        )`;
}

/** One generated enum of token names, the union over every theme. */
function swiftEnum(name: string, doc: string, cases: Map<string, string>): string {
  const body = [...cases].map(([swift, id]) => `    case ${swift} = ${JSON.stringify(id)}`).join("\n");
  return `/// ${doc}\npublic enum ${name}: String, CaseIterable, Hashable, Sendable {\n${body}\n}\n`;
}

export async function renderApple(version: string): Promise<string> {
  const base = await resolve(await layered());
  const raw = await layered();
  const description = (id: string) => raw.get(id)?.$description;
  const comment = (id: string, indent: string) => (description(id) ? `${indent}/// ${description(id)}\n` : "");

  const durations = ["fast", "base", "slow", "press", "sheet", "draw"];
  const eases = [...raw.keys()].filter((id) => id.startsWith("ouro.ease.") && raw.get(id)!.$type === "cubicBezier");

  const allExtras = new Map<ThemeName, ThemeExtras>();
  for (const theme of THEMES) allExtras.set(theme, await themeExtras(theme));
  const union = (kind: keyof ThemeExtras) => new Map([...allExtras.values()].flatMap((e) => e[kind].map((x) => [x.swift, x.id] as [string, string])));
  const extrasSwift = `${swiftEnum("OuroExtraColor", "A colour token a theme defines for itself; its raw value is the CSS name without \\`--\\`.", union("colors"))}
${swiftEnum("OuroExtraFont", "A font-family token a theme defines for itself.", union("fonts"))}
${swiftEnum("OuroExtraLength", "A length token a theme defines for itself, in points.", union("lengths"))}
${swiftEnum("OuroExtraNumber", "A plain number a theme defines for itself, such as a tracking in em.", union("numbers"))}
${swiftEnum("OuroExtraShadow", "A shadow a theme defines for itself.", union("shadows"))}
${swiftEnum("OuroExtraType", "A text role a theme defines for itself.", union("type"))}
/// One shadow in one colour mode, as SwiftUI's \`shadow(color:radius:x:y:)\` takes it: the radius is half the CSS blur.
public struct OuroShadowLayer: Sendable, Equatable {
    public let color: Color
    public let radius: Double
    public let x: Double
    public let y: Double

    public init(color: Color, radius: Double, x: Double, y: Double) {
        self.color = color
        self.radius = radius
        self.x = x
        self.y = y
    }
}

/// A shadow in light and dark mode; web's dark shadows differ in reach as well as colour.
public struct OuroShadow: Sendable, Equatable {
    public let light: OuroShadowLayer
    public let dark: OuroShadowLayer

    public init(light: OuroShadowLayer, dark: OuroShadowLayer) {
        self.light = light
        self.dark = dark
    }

    public func layer(_ scheme: ColorScheme) -> OuroShadowLayer {
        scheme == .dark ? dark : light
    }
}

/// A text role: its family, weight and size at the default Dynamic Type size, and the style it scales with.
public struct OuroTypeToken: Sendable, Equatable {
    public let family: OuroExtraFont
    /// The CSS weight, 100 to 900.
    public let weight: Int
    /// Points at the default text size (web's rem at ${POINTS_PER_REM} points per rem).
    public let size: Double
    public let textStyle: Font.TextStyle
    /// Letter spacing in points at \`size\`.
    public let tracking: Double
    /// Line height as a multiple of \`size\`.
    public let lineHeight: Double

    public init(family: OuroExtraFont, weight: Int, size: Double, textStyle: Font.TextStyle, tracking: Double, lineHeight: Double) {
        self.family = family
        self.weight = weight
        self.size = size
        self.textStyle = textStyle
        self.tracking = tracking
        self.lineHeight = lineHeight
    }
}

/// The tokens a theme defines for itself. A theme without one of them answers nil.
public struct OuroThemeExtras: Sendable {
    public let light: [OuroExtraColor: Color]
    public let dark: [OuroExtraColor: Color]
    /// Each font token's families, most preferred first, as CSS lists them.
    public let fonts: [OuroExtraFont: [String]]
    public let lengths: [OuroExtraLength: Double]
    public let numbers: [OuroExtraNumber: Double]
    public let shadows: [OuroExtraShadow: OuroShadow]
    public let type: [OuroExtraType: OuroTypeToken]

    /// No tokens of its own.
    public static let empty = OuroThemeExtras(light: [:], dark: [:], fonts: [:], lengths: [:], numbers: [:], shadows: [:], type: [:])

    public init(
        light: [OuroExtraColor: Color],
        dark: [OuroExtraColor: Color],
        fonts: [OuroExtraFont: [String]],
        lengths: [OuroExtraLength: Double],
        numbers: [OuroExtraNumber: Double],
        shadows: [OuroExtraShadow: OuroShadow],
        type: [OuroExtraType: OuroTypeToken]
    ) {
        self.light = light
        self.dark = dark
        self.fonts = fonts
        self.lengths = lengths
        self.numbers = numbers
        self.shadows = shadows
        self.type = type
    }

    /// Every colour for a colour scheme.
    public func colors(_ scheme: ColorScheme) -> [OuroExtraColor: Color] {
        scheme == .dark ? dark : light
    }

    /// One colour for a colour scheme, or nil when the theme doesn't define it.
    public func color(_ token: OuroExtraColor, _ scheme: ColorScheme) -> Color? {
        colors(scheme)[token]
    }
}
`;

  const out: string[] = [];
  out.push(`// OuroTokens.swift — Ouro HX tokens for Apple platforms.
// Generated by ourostack/ouro-ui-core ${version} from tokens/*.tokens.json (DTCG 2025.10).
// Don't edit; change the tokens and run \`pnpm tokens\`. MIT License.

import SwiftUI

/// The themes Ouro HX ships, as on https://ui.ouroboros.bot/.
public enum OuroThemeName: String, CaseIterable, Sendable {
${THEMES.map((t) => `    case ${t}`).join("\n")}
}

/// One colour mode's colours. The names are Ouro HX's CSS variables in camel case: \`--primary-foreground\` is \`primaryForeground\`.
public struct OuroColors: Sendable {
${APPLE_COLORS.map((c) => `    public let ${swiftName(c)}: Color`).join("\n")}

    public init(
${APPLE_COLORS.map((c) => `        ${swiftName(c)}: Color`).join(",\n")}
    ) {
${APPLE_COLORS.map((c) => `        self.${swiftName(c)} = ${swiftName(c)}`).join("\n")}
    }
}

${extrasSwift}
/// A theme: its colours in light and dark mode, its corner radius, and its own tokens.
public struct OuroTheme: Sendable {
    public let name: OuroThemeName
    public let light: OuroColors
    public let dark: OuroColors
    /// The base corner radius in points (CSS \`--radius\` at ${POINTS_PER_REM} points per rem).
    public let radius: Double
    /// The tokens only this theme defines, such as Cookbook's \`sj-*\`. Empty for the others.
    public let extras: OuroThemeExtras

    public init(name: OuroThemeName, light: OuroColors, dark: OuroColors, radius: Double, extras: OuroThemeExtras = .empty) {
        self.name = name
        self.light = light
        self.dark = dark
        self.radius = radius
        self.extras = extras
    }

    /// The colours for a colour scheme, such as \`@Environment(\\.colorScheme)\`.
    public func colors(_ scheme: ColorScheme) -> OuroColors {
        scheme == .dark ? dark : light
    }
}

/// A CSS \`cubic-bezier()\` easing as SwiftUI's timing curve.
public struct OuroCubicBezier: Sendable, Equatable {
    public let x1: Double
    public let y1: Double
    public let x2: Double
    public let y2: Double

    public init(x1: Double, y1: Double, x2: Double, y2: Double) {
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    }

    public func animation(duration: Double) -> Animation {
        .timingCurve(x1, y1, x2, y2, duration: duration)
    }
}

/// Ouro HX's tokens: motion, and every theme's colours.
public struct OuroTokens: Sendable {
    /// The theme ui.ouroboros.bot opens on.
    public static let defaultTheme: OuroThemeName = .pearl

    /// Durations in seconds.
    public enum Duration {`);
  for (const d of durations) out.push(`${comment(`ouro.duration.${d}`, "        ")}        public static let ${d}: Double = ${seconds(get(base, `ouro.duration.${d}`, "Duration").light, d)}`);
  out.push(`    }

    /// Easing curves.
    public enum Ease {`);
  for (const id of eases) {
    const [x1, y1, x2, y2] = get(base, id, "Ease").light as number[];
    out.push(`${comment(id, "        ")}        public static let ${swiftName(id.slice("ouro.ease.".length))} = OuroCubicBezier(x1: ${fixed(x1!)}, y1: ${fixed(y1!)}, x2: ${fixed(x2!)}, y2: ${fixed(y2!)})`);
  }
  const spring = (id: string) => get(base, id, "Spring").light;
  out.push(`    }

    /// The spring Ouro HX moves with.
    public enum Spring {
        /// The CSS spring's full settle time in seconds (\`--ouro-spring-duration\`).
        public static let duration: Double = ${seconds(spring("ouro.spring.duration"), "spring.duration")}
${comment("ouro.spring.visual-duration", "        ")}        public static let visualDuration: Double = ${seconds(spring("ouro.spring.visual-duration"), "spring.visual-duration")}
${comment("ouro.spring.bounce", "        ")}        public static let bounce: Double = ${fixed(spring("ouro.spring.bounce") as number)}
        /// The same spring in SwiftUI.
        public static let animation: Animation = .spring(duration: visualDuration, bounce: bounce)
    }

    /// Press feedback.
    public enum Press {
        /// The scale a control shrinks to while pressed.
        public static let scale: Double = ${fixed(get(base, "ouro.press.scale", "Press").light as number)}
    }

    /// A theme by name.
    public static func theme(_ name: OuroThemeName) -> OuroTheme {
        switch name {
${THEMES.map((t) => `        case .${t}: return ${t}`).join("\n")}
        }
    }
`);
  for (const theme of THEMES) {
    const tokens = await resolve(await layered(theme));
    const colors = (mode: "light" | "dark") =>
      `OuroColors(\n${APPLE_COLORS.map((c) => `            ${swiftName(c)}: ${swiftColor(get(tokens, c, theme)[mode], `${theme} ${c} (${mode})`)}`).join(",\n")}\n        )`;
    out.push(`    public static let ${theme} = OuroTheme(
        name: .${theme},
        light: ${colors("light")},
        dark: ${colors("dark")},
        radius: ${points(get(tokens, "radius", theme).light, `${theme} radius`)},
        extras: ${swiftExtras(allExtras.get(theme)!)}
    )
`);
  }
  out.push("}\n");
  return out.join("\n");
}
