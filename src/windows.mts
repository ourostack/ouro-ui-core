// Ouro HX for Windows: renders dist/windows/OuroTokens.cs (C# for WinUI 3) and dist/windows/OuroTokens.xaml (a WinUI
// ResourceDictionary for the default theme). Colours are resolved here, as for Apple and Android, because XAML has no
// var(). The CSS has light and dark values and no high-contrast ones; the XAML's HighContrast dictionary hands every
// brush to Windows' contrast theme instead, as https://learn.microsoft.com/windows/apps/design/accessibility/high-contrast-themes
// asks. WinUI's Color has no Display P3, so an oklch() colour outside sRGB is written clipped to sRGB, and says so.
// A theme's own extras (Cookbook's sj-* tokens) reach Apple only for now; Windows takes them when an app needs them.
import { dtcgToRgba, oklchToDisplayP3, rgbaToHex } from "./color.mts";
import type { DtcgColor } from "./css-value.mts";
import { APPLE_COLORS, swiftName } from "./apple.mts";
import { composeSpring } from "./android.mts";
import { layered, resolve, THEMES, type Resolved } from "./tokens.mts";

/** The colours each theme carries on Windows: the same names as Apple's and Android's. */
export const WINDOWS_COLORS = APPLE_COLORS;

/** Effective pixels per rem: WinUI's body text and the web's default root font size agree on 16 at 100% scale. */
const EPX_PER_REM = 16;

/** A token name in PascalCase: `primary-foreground` is `PrimaryForeground`. */
export const csharpName = (token: string) => {
  const camel = swiftName(token);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/** A C# double literal with at most four decimals. */
export const cdouble = (x: number) => {
  const s = (Math.round(x * 10000) / 10000).toFixed(4).replace(/0+$/, "").replace(/\.$/, ".0");
  return s === "-0.0" ? "0.0" : s;
};

/** A colour as four bytes (alpha, red, green, blue), clipped to sRGB, and whether it had to be clipped. */
export function windowsArgb(value: unknown, where: string): { argb: [number, number, number, number]; note: string | null } {
  const c = value as DtcgColor;
  if (!c || typeof c !== "object" || !("colorSpace" in c)) throw new Error(`${where} is not a colour`);
  const rgba = dtcgToRgba(c);
  const hex = rgbaToHex(rgba);
  const byte = (i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const p3 = c.colorSpace === "oklch" ? oklchToDisplayP3(...(c.components.map((x) => (x === "none" ? 0 : x)) as [number, number, number])) : null;
  return {
    argb: [Math.round(rgba.a * 255), byte(0), byte(1), byte(2)],
    note: p3 ? `oklch(${c.components.join(" ")}), outside sRGB; ${hex} clipped, because WinUI's Color has no Display P3` : null,
  };
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

function csharpColor(value: unknown, where: string): string {
  const { argb, note } = windowsArgb(value, where);
  return `Color.FromArgb(${argb.map((n) => `0x${hex2(n)}`).join(", ")})${note ? ` /* ${note} */` : ""}`;
}

function xamlColor(value: unknown, where: string): { text: string; note: string | null } {
  const { argb, note } = windowsArgb(value, where);
  return { text: `#${argb.map(hex2).join("")}`, note };
}

function millis(value: unknown, where: string): number {
  const d = value as { value: number; unit: string };
  if (d?.unit === "ms") return Math.round(d.value);
  if (d?.unit === "s") return Math.round(d.value * 1000);
  throw new Error(`${where} is not a duration`);
}

function epx(value: unknown, where: string): number {
  const d = value as { value: number; unit: string };
  if (d?.unit === "rem") return d.value * EPX_PER_REM;
  if (d?.unit === "px") return d.value;
  throw new Error(`${where} is not a dimension`);
}

const get = (map: Map<string, Resolved>, id: string, where: string) => {
  const r = map.get(id);
  if (!r) throw new Error(`${where}: no token ${id}`);
  return r;
};

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The system colours a Windows contrast theme defines, as Microsoft Learn's "Contrast themes" page names them. */
export const SYSTEM_COLORS = [
  "SystemColorWindowColor", "SystemColorWindowTextColor", "SystemColorButtonFaceColor", "SystemColorButtonTextColor",
  "SystemColorHighlightColor", "SystemColorHighlightTextColor", "SystemColorHotlightColor", "SystemColorGrayTextColor",
] as const;
type SystemColor = (typeof SYSTEM_COLORS)[number];

/**
 * The system colour each Ouro colour becomes under a contrast theme. Surfaces take Window, controls take ButtonFace,
 * the primary action and focus take Highlight, and text and borders take the text colour on their surface. Status,
 * chart and avatar colours collapse to text colour: a contrast theme keeps a few colours on purpose, so meaning must
 * already be carried by text or an icon (Ouro HX's claims require that on every platform).
 */
export function contrastColor(token: (typeof WINDOWS_COLORS)[number]): SystemColor {
  switch (token) {
    case "background": case "card": case "popover": case "sidebar":
    case "destructive-foreground": case "success-foreground": case "warning-foreground":
      return "SystemColorWindowColor";
    case "secondary": case "muted": case "accent": case "sidebar-accent": case "input":
      return "SystemColorButtonFaceColor";
    case "secondary-foreground": case "accent-foreground": case "sidebar-accent-foreground":
      return "SystemColorButtonTextColor";
    case "primary": case "sidebar-primary": case "ring": case "sidebar-ring":
      return "SystemColorHighlightColor";
    case "primary-foreground": case "sidebar-primary-foreground":
      return "SystemColorHighlightTextColor";
    default:
      return "SystemColorWindowTextColor";
  }
}

/** The tokens' motion and the default theme's radius, shared by both files. */
async function motion() {
  const base = await resolve(await layered());
  const raw = await layered();
  const durations = ["fast", "base", "slow", "press", "sheet", "draw"];
  const eases = [...raw.keys()].filter((id) => id.startsWith("ouro.ease.") && raw.get(id)!.$type === "cubicBezier");
  return { base, raw, durations, eases };
}

export async function renderWindowsCs(version: string): Promise<string> {
  const { base, raw, durations, eases } = await motion();
  const doc = (id: string, indent: string) => (raw.get(id)?.$description ? `${indent}/// <summary>${xmlEscape(raw.get(id)!.$description!)}</summary>\n` : "");
  const visual = millis(get(base, "ouro.spring.visual-duration", "Spring").light, "spring.visual-duration");
  const bounce = get(base, "ouro.spring.bounce", "Spring").light as number;
  const spring = composeSpring(visual / 1000, bounce);
  const out: string[] = [];
  out.push(`// OuroTokens.cs — Ouro HX tokens for Windows (WinUI 3).
// Generated by ourostack/ouro-ui-core ${version} from tokens/*.tokens.json (DTCG 2025.10).
// Don't edit; change the tokens and run \`pnpm tokens\`. MIT License.
using Windows.UI;

namespace Ouro.UI.Hx.Tokens;

/// <summary>The themes Ouro HX ships, as on https://ui.ouroboros.bot/.</summary>
public enum OuroThemeName
{
${THEMES.map((t) => `    ${csharpName(t)},`).join("\n")}
}

/// <summary>One colour mode's colours. The names are Ouro HX's CSS variables in PascalCase: <c>--primary-foreground</c> is <c>PrimaryForeground</c>.</summary>
public sealed record OuroColors(
${WINDOWS_COLORS.map((c, i) => `    Color ${csharpName(c)}${i === WINDOWS_COLORS.length - 1 ? ");" : ","}`).join("\n")}

/// <summary>A theme: its colours in light and dark mode, and its corner radius.</summary>
/// <param name="Radius">The base corner radius in effective pixels (CSS <c>--radius</c> at ${EPX_PER_REM} epx per rem).</param>
public sealed record OuroTheme(OuroThemeName Name, OuroColors Light, OuroColors Dark, double Radius)
{
    /// <summary>The colours for dark or light mode, such as <c>ActualTheme == ElementTheme.Dark</c>.</summary>
    public OuroColors Colors(bool dark) => dark ? Dark : Light;
}

/// <summary>A cubic Bézier easing curve, as CSS and <c>Compositor.CreateCubicBezierEasingFunction</c> take it.</summary>
public readonly record struct OuroCubicBezier(double X1, double Y1, double X2, double Y2);

/// <summary>Ouro HX's tokens: motion, and every theme's colours.</summary>
public static class OuroTokens
{
    /// <summary>The theme ui.ouroboros.bot opens on.</summary>
    public static OuroThemeName DefaultTheme => OuroThemeName.Pearl;

    /// <summary>Durations in milliseconds.</summary>
    public static class Duration
    {`);
  for (const d of durations) out.push(`${doc(`ouro.duration.${d}`, "        ")}        public const int ${csharpName(d)} = ${millis(get(base, `ouro.duration.${d}`, "Duration").light, d)};`);
  out.push(`    }

    /// <summary>Easing curves.</summary>
    public static class Ease
    {`);
  for (const id of eases) {
    const [x1, y1, x2, y2] = get(base, id, "Ease").light as number[];
    out.push(`${doc(id, "        ")}        public static readonly OuroCubicBezier ${csharpName(id.slice("ouro.ease.".length))} = new(${cdouble(x1!)}, ${cdouble(y1!)}, ${cdouble(x2!)}, ${cdouble(y2!)});`);
  }
  out.push(`    }

    /// <summary>The spring Ouro HX moves with, as a visual duration and a bounce, and as Composition's spring takes it.</summary>
    public static class Spring
    {
        /// <summary>The CSS spring's full settle time in milliseconds (<c>--ouro-spring-duration</c>).</summary>
        public const int DurationMilliseconds = ${millis(get(base, "ouro.spring.duration", "Spring").light, "spring.duration")};
${doc("ouro.spring.visual-duration", "        ")}        public const int VisualDurationMilliseconds = ${visual};
${doc("ouro.spring.bounce", "        ")}        public const double Bounce = ${cdouble(bounce)};
        /// <summary>1 − bounce, for <c>SpringScalarNaturalMotionAnimation.DampingRatio</c>.</summary>
        public const double DampingRatio = ${cdouble(spring.dampingRatio)};
        /// <summary>The undamped period, 2π / √stiffness, which equals the visual duration; for <c>SpringScalarNaturalMotionAnimation.Period</c>.</summary>
        public const int PeriodMilliseconds = ${visual};
    }

    /// <summary>Press feedback.</summary>
    public static class Press
    {
        /// <summary>The scale a control shrinks to while pressed.</summary>
        public const double Scale = ${cdouble(get(base, "ouro.press.scale", "Press").light as number)};
    }

    /// <summary>A theme by name.</summary>
    public static OuroTheme Theme(OuroThemeName name) => name switch
    {
${THEMES.map((t) => `        OuroThemeName.${csharpName(t)} => ${csharpName(t)},`).join("\n")}
        _ => throw new System.ArgumentOutOfRangeException(nameof(name)),
    };
`);
  for (const theme of THEMES) {
    const tokens = await resolve(await layered(theme));
    const colors = (mode: "light" | "dark") =>
      `new OuroColors(\n${WINDOWS_COLORS.map((c, i) => `            ${csharpName(c)}: ${csharpColor(get(tokens, c, theme)[mode], `${theme} ${c} (${mode})`)}${i === WINDOWS_COLORS.length - 1 ? ")" : ","}`).join("\n")}`;
    const radius = epx(get(tokens, "radius", theme).light, `${theme} radius`);
    out.push(`    public static readonly OuroTheme ${csharpName(theme)} = new(
        Name: OuroThemeName.${csharpName(theme)},
        Light: ${colors("light")},
        Dark: ${colors("dark")},
        Radius: ${cdouble(radius)});
`);
  }
  out.push("}\n");
  return out.join("\n");
}

export async function renderWindowsXaml(version: string): Promise<string> {
  const theme = "pearl";
  const tokens = await resolve(await layered(theme));
  const radius = epx(get(tokens, "radius", theme).light, `${theme} radius`);
  const mode = (m: "light" | "dark") =>
    WINDOWS_COLORS.map((c) => {
      const { text, note } = xamlColor(get(tokens, c, theme)[m], `${theme} ${c} (${m})`);
      const n = csharpName(c);
      return `            <Color x:Key="Ouro${n}Color">${text}</Color>${note ? ` <!-- ${note} -->` : ""}
            <SolidColorBrush x:Key="Ouro${n}Brush" Color="{ThemeResource Ouro${n}Color}" />`;
    }).join("\n");
  const contrast = WINDOWS_COLORS.map((c) => {
    const n = csharpName(c);
    const sys = contrastColor(c);
    return `            <StaticResource x:Key="Ouro${n}Color" ResourceKey="${sys}" />
            <SolidColorBrush x:Key="Ouro${n}Brush" Color="{ThemeResource ${sys}}" />`;
  }).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<!--
    OuroTokens.xaml: Ouro HX tokens for Windows (WinUI 3), the default theme (Pearl).
    Generated by ourostack/ouro-ui-core ${version} from tokens/*.tokens.json (DTCG 2025.10).
    Don't edit; change the tokens and run pnpm tokens. MIT License.
    Merge it into Application.Resources and use {ThemeResource OuroPrimaryBrush}. Every theme is in OuroTokens.cs.
-->
<ResourceDictionary
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <!-- The base corner radius: CSS radius at ${EPX_PER_REM} effective pixels per rem. -->
    <CornerRadius x:Key="OuroRadius">${cdouble(radius)}</CornerRadius>

    <ResourceDictionary.ThemeDictionaries>
        <ResourceDictionary x:Key="Light">
${mode("light")}
        </ResourceDictionary>

        <ResourceDictionary x:Key="Dark">
${mode("dark")}
        </ResourceDictionary>

        <!--
            A Windows contrast theme replaces app colours by design: the person chose a few system colours, and every
            app draws with them. So under HighContrast each Ouro colour becomes the system colour for its role, and
            follows the person's theme as it changes. Status, chart and avatar colours become text colour, so their
            meaning must be in text or an icon too.
            https://learn.microsoft.com/windows/apps/design/accessibility/high-contrast-themes
        -->
        <ResourceDictionary x:Key="HighContrast">
${contrast}
        </ResourceDictionary>
    </ResourceDictionary.ThemeDictionaries>
</ResourceDictionary>
`;
}
