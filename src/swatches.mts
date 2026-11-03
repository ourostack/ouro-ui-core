// dist/swatches.html: every theme's colours as the tokens resolve them, in light and dark, so a
// person can see what a release carries. These are the values OuroTokens.swift uses.
import { dtcgToRgba, rgbaToHex } from "./color.mts";
import type { DtcgColor } from "./css-value.mts";
import { APPLE_COLORS } from "./apple.mts";
import { layered, resolve, THEMES } from "./tokens.mts";

const css = (value: unknown) => {
  const { r, g, b, a } = dtcgToRgba(value as DtcgColor);
  const hex = rgbaToHex({ r, g, b, a });
  return { fill: a < 1 ? `rgb(${[r, g, b].map((c) => Math.round(c * 255)).join(" ")} / ${Math.round(a * 1000) / 1000})` : hex, label: a < 1 ? `${hex} · ${Math.round(a * 100)}%` : hex };
};

export async function renderSwatches(version: string): Promise<string> {
  const sections: string[] = [];
  for (const theme of THEMES) {
    const tokens = await resolve(await layered(theme));
    const panel = (mode: "light" | "dark") => {
      const bg = css(tokens.get("background")![mode]).fill;
      const fg = css(tokens.get("foreground")![mode]).fill;
      const chips = APPLE_COLORS.map((name) => {
        const c = css(tokens.get(name)![mode]);
        return `<li><span class="chip" style="background:${c.fill}"></span><span class="name">${name}</span><span class="hex">${c.label}</span></li>`;
      }).join("");
      return `<div class="panel" style="background:${bg};color:${fg}"><h3>${mode}</h3><ul>${chips}</ul></div>`;
    };
    sections.push(`<section><h2>${theme[0]!.toUpperCase()}${theme.slice(1)}</h2><div class="modes">${panel("light")}${panel("dark")}</div></section>`);
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ouro UI core ${version} swatches</title>
<style>
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 0; padding: 32px 16px 64px; background: #fafafa; color: #1d1d1f; }
  header, section { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.01em; }
  header p { margin: 0 0 32px; color: #6a6a6f; }
  h2 { font-size: 18px; margin: 32px 0 12px; }
  h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; opacity: 0.7; }
  .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
  .panel { padding: 20px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px 14px; }
  li { display: grid; grid-template-columns: 28px 1fr; column-gap: 8px; align-items: center; font-size: 12px; }
  .chip { grid-row: span 2; width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35); }
  .name { font-weight: 600; }
  .hex { font-family: ui-monospace, monospace; opacity: 0.75; }
</style>
</head>
<body>
<header>
  <h1>Ouro UI core ${version}: every swatch, light and dark</h1>
  <p>Six themes, resolved from tokens/*.tokens.json: the same colours dist/apple/OuroTokens.swift hands to SwiftUI, and the same values dist/web/ writes as CSS.</p>
</header>
${sections.join("\n")}
</body>
</html>
`;
}
