import assert from "node:assert/strict";
import { test } from "node:test";
import { renderAndroid, kotlinName } from "../src/android.mts";
import { renderApple } from "../src/apple.mts";
import { THEMES } from "../src/tokens.mts";
import { csharpName, renderWindowsCs, renderWindowsXaml, SYSTEM_COLORS, WINDOWS_COLORS } from "../src/windows.mts";

/** Each theme's block of a generated file: from its start to the next theme or the end. */
function themeBlocks(text: string, start: (t: string) => RegExp): Map<string, string> {
  const out = new Map<string, string>();
  for (const t of THEMES) {
    const m = start(t).exec(text);
    assert.ok(m, `no ${t} theme`);
    const rest = text.slice(m.index);
    const next = THEMES.map((o) => (o === t ? -1 : rest.search(start(o)))).filter((i) => i > 0);
    out.set(t, rest.slice(0, next.length ? Math.min(...next) : undefined));
  }
  return out;
}

const modes = (block: string, light: string, dark: string) => {
  const l = block.indexOf(light);
  const d = block.indexOf(dark);
  return { light: block.slice(l, d), dark: block.slice(d) };
};

const pascal = (t: string) => t[0]!.toUpperCase() + t.slice(1);

/** Windows' colour as AARRGGBB, and the clipped note when it has one. */
function csArgb(mode: string, name: string): { argb: string; clipped: boolean } {
  const m = new RegExp(`\\b${name}: Color\\.FromArgb\\(0x([0-9A-F]{2}), 0x([0-9A-F]{2}), 0x([0-9A-F]{2}), 0x([0-9A-F]{2})\\)( /\\*[^\\n]*clipped[^\\n]*\\*/)?[,)]`).exec(mode);
  assert.ok(m, `Windows has no ${name}`);
  return { argb: `${m[1]}${m[2]}${m[3]}${m[4]}`, clipped: Boolean(m[5]) };
}

/** Apple's sRGB colour as AARRGGBB, rounded to 8 bits, or null when it is written in Display P3. */
function swiftArgb(mode: string, name: string): string | null {
  const m = new RegExp(`\\b${name}: Color\\((\\.\\w+), red: ([\\d.]+), green: ([\\d.]+), blue: ([\\d.]+), opacity: ([\\d.]+)\\)`).exec(mode);
  assert.ok(m, `Apple has no ${name}`);
  if (m[1] !== ".sRGB") return null;
  const byte = (x: string) => Math.round(Number(x) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${byte(m[5]!)}${byte(m[2]!)}${byte(m[3]!)}${byte(m[4]!)}`;
}

/** Android's clipped sRGB hex (RRGGBB) for a colour it writes in Display P3. */
function kotlinClipped(mode: string, name: string): string {
  const m = new RegExp(`\\b${name} = Color\\([^\\n]*ColorSpaces\\.DisplayP3\\) /\\*[^\\n]*; #([0-9a-f]{6}) clipped \\*/`).exec(mode);
  assert.ok(m, `Android writes ${name} in sRGB, but Windows clipped it`);
  return m[1]!.toUpperCase();
}

const near = (a: string, b: string, where: string) => {
  for (let i = 0; i < 8; i += 2) assert.ok(Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 1, `${where}: Windows ${a}, other ${b}`);
};

test("every Windows colour is Apple's colour, and Android's clipped colour outside sRGB, in every theme and mode", async () => {
  const cs = themeBlocks(await renderWindowsCs("test"), (t) => new RegExp(`public static readonly OuroTheme ${pascal(t)} = new\\(`));
  const swift = themeBlocks(await renderApple("test"), (t) => new RegExp(`static let ${t} = OuroTheme\\(`));
  const kotlin = themeBlocks(await renderAndroid("test"), (t) => new RegExp(`val ${t} = OuroTheme\\(`));
  let compared = 0;
  let clipped = 0;
  for (const theme of THEMES) {
    const w = modes(cs.get(theme)!, "Light:", "Dark:");
    const s = modes(swift.get(theme)!.split("extras:")[0]!, "light", "dark");
    const k = modes(kotlin.get(theme)!, "light", "dark");
    for (const mode of ["light", "dark"] as const) {
      for (const c of WINDOWS_COLORS) {
        const win = csArgb(w[mode], csharpName(c));
        const apple = swiftArgb(s[mode], kotlinName(c));
        const where = `${theme} ${mode} ${c}`;
        assert.equal(win.clipped, apple === null, `${where}: Windows clips it only when Apple writes it in Display P3`);
        // Apple writes four decimals, so its 8-bit value can sit one step from the hex Windows writes.
        if (apple !== null) near(win.argb, apple, where);
        else {
          near(win.argb, `${win.argb.slice(0, 2)}${kotlinClipped(k[mode], kotlinName(c))}`, where);
          clipped++;
        }
        compared++;
      }
    }
  }
  assert.equal(compared, THEMES.length * 2 * WINDOWS_COLORS.length);
  assert.ok(clipped > 0, "no colour outside sRGB was checked");
});

test("motion is Apple's motion, in milliseconds", async () => {
  const cs = await renderWindowsCs("test");
  const swift = await renderApple("test");
  const kotlin = await renderAndroid("test");
  for (const d of ["fast", "base", "slow", "press", "sheet", "draw"]) {
    const s = new RegExp(`static let ${d}: Double = ([\\d.]+)`).exec(swift);
    const w = new RegExp(`public const int ${pascal(d)} = (\\d+);`).exec(cs);
    assert.ok(s && w, `duration ${d}`);
    assert.equal(Number(w[1]), Math.round(Number(s[1]) * 1000), `duration ${d}`);
  }
  for (const [win, and] of [["DurationMilliseconds", "durationMillis"], ["VisualDurationMilliseconds", "visualDurationMillis"]]) {
    const w = new RegExp(`public const int ${win} = (\\d+);`).exec(cs);
    const k = new RegExp(`const val ${and}: Int = (\\d+)`).exec(kotlin);
    assert.ok(w && k, win);
    assert.equal(w[1], k[1], win);
  }
  assert.match(cs, /public const double Scale = 0\.\d+;/);
  assert.match(cs, /public static readonly OuroCubicBezier Out = new\(/);
});

/** A small well-formedness check: tags nest and close, attributes are quoted, comments end. Returns the element tree. */
interface El { name: string; attrs: Record<string, string>; children: El[] }
function parseXml(text: string): El {
  const root: El = { name: "#document", attrs: {}, children: [] };
  const stack = [root];
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf("<", i);
    if (lt < 0) break;
    if (text.startsWith("<!--", lt)) {
      const end = text.indexOf("-->", lt + 4);
      assert.ok(end > 0, "a comment never ends");
      assert.ok(!text.slice(lt + 4, end).includes("--"), "a comment holds --");
      i = end + 3;
      continue;
    }
    if (text.startsWith("<?", lt)) {
      const end = text.indexOf("?>", lt);
      assert.ok(end > 0);
      i = end + 2;
      continue;
    }
    const gt = text.indexOf(">", lt);
    assert.ok(gt > 0, "a tag never ends");
    const body = text.slice(lt + 1, gt);
    if (body.startsWith("/")) {
      const name = body.slice(1).trim();
      const open = stack.pop();
      assert.equal(open?.name, name, `</${name}> closes <${open?.name}>`);
    } else {
      const selfClosing = body.endsWith("/");
      const inner = selfClosing ? body.slice(0, -1) : body;
      const name = /^[\w:.]+/.exec(inner)?.[0];
      assert.ok(name, `a tag has no name: <${body}>`);
      const attrs: Record<string, string> = {};
      const rest = inner.slice(name.length).trim();
      const re = /([\w:.]+)="([^"<]*)"\s*/y;
      let pos = 0;
      while (pos < rest.length) {
        re.lastIndex = pos;
        const m = re.exec(rest);
        assert.ok(m, `bad attribute in <${name}>: ${rest.slice(pos)}`);
        assert.ok(!(m[1]! in attrs), `<${name}> repeats ${m[1]}`);
        attrs[m[1]!] = m[2]!;
        pos = re.lastIndex;
      }
      const el: El = { name, attrs, children: [] };
      stack.at(-1)!.children.push(el);
      if (!selfClosing) stack.push(el);
    }
    i = gt + 1;
  }
  assert.equal(stack.length, 1, `<${stack.at(-1)?.name}> never closes`);
  assert.equal(root.children.length, 1, "one root element");
  return root.children[0]!;
}

test("the XAML is well formed, with Light, Dark and HighContrast dictionaries holding every key", async () => {
  const xaml = await renderWindowsXaml("v9.9.9");
  assert.match(xaml, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(xaml, /Generated by ourostack\/ouro-ui-core v9\.9\.9/);
  const root = parseXml(xaml);
  assert.equal(root.name, "ResourceDictionary");
  assert.equal(root.attrs.xmlns, "http://schemas.microsoft.com/winfx/2006/xaml/presentation");
  assert.ok(root.children.some((c) => c.name === "CornerRadius" && c.attrs["x:Key"] === "OuroRadius"));
  const themes = root.children.find((c) => c.name === "ResourceDictionary.ThemeDictionaries");
  assert.ok(themes);
  const dicts = new Map(themes.children.map((d) => [d.attrs["x:Key"]!, d]));
  assert.deepEqual([...dicts.keys()], ["Light", "Dark", "HighContrast"]);
  for (const [key, dict] of dicts) {
    const keys = new Set(dict.children.map((c) => c.attrs["x:Key"]));
    assert.equal(keys.size, dict.children.length, `${key} repeats a key`);
    for (const c of WINDOWS_COLORS) {
      assert.ok(keys.has(`Ouro${csharpName(c)}Brush`), `${key} has no Ouro${csharpName(c)}Brush`);
      assert.ok(keys.has(`Ouro${csharpName(c)}Color`), `${key} has no Ouro${csharpName(c)}Color`);
    }
    assert.equal(keys.size, WINDOWS_COLORS.length * 2, `${key} holds a key it shouldn't`);
  }
  for (const el of dicts.get("HighContrast")!.children) {
    const sys = el.name === "SolidColorBrush" ? /^\{ThemeResource (\w+)\}$/.exec(el.attrs.Color ?? "")?.[1] : el.attrs.ResourceKey;
    assert.ok(sys && (SYSTEM_COLORS as readonly string[]).includes(sys), `${el.attrs["x:Key"]} under HighContrast uses ${sys}, not a system contrast colour`);
  }
  // Light and Dark colours are the C# file's Pearl colours.
  const cs = await renderWindowsCs("test");
  const pearl = modes(cs.slice(cs.indexOf("OuroTheme Pearl = new(")), "Light:", "Dark:");
  for (const mode of ["Light", "Dark"] as const) {
    for (const c of WINDOWS_COLORS) {
      const n = csharpName(c);
      const xamlHex = new RegExp(`<Color x:Key="Ouro${n}Color">#([0-9A-F]{8})</Color>`).exec(xaml.slice(xaml.indexOf(`x:Key="${mode}"`)));
      assert.ok(xamlHex, `${mode} ${n}`);
      assert.equal(xamlHex[1], csArgb(pearl[mode === "Light" ? "light" : "dark"], n).argb, `${mode} ${n}`);
    }
  }
});

test("the C# file names its version, namespace and every theme", async () => {
  const cs = await renderWindowsCs("v9.9.9");
  assert.match(cs, /^\/\/ OuroTokens\.cs/);
  assert.match(cs, /Generated by ourostack\/ouro-ui-core v9\.9\.9/);
  assert.match(cs, /^namespace Ouro\.UI\.Hx\.Tokens;$/m);
  for (const t of THEMES) assert.match(cs, new RegExp(`OuroThemeName\\.${pascal(t)} => ${pascal(t)},`));
  assert.match(cs, /OuroTheme Pearl = new\([\s\S]*?Radius: \d+(\.\d+)?\);\n/);
  // Braces and parentheses balance outside comments and strings, so the file at least has the right shape.
  const code = cs.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"\n]*"/g, '""');
  for (const [o, c] of [["{", "}"], ["(", ")"]] as const) assert.equal(code.split(o).length, code.split(c).length, `${o}${c} balance`);
});
