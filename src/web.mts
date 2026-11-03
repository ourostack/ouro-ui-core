// Ouro HX for web: renders templates/web/**.css into dist/web/.
//
// A template is the stylesheet with each custom property's value replaced by a placeholder, so the
// prose, the order and the non-token CSS (@font-face, keyframes, Tailwind's @theme and @utility)
// stay exactly as web writes them, and every value comes from the tokens:
//   {{primary}}               the token's CSS text in the light (default) mode
//   {{primary@dark}}          its CSS text in the dark mode
//   {{ouro.ease.out|description}}  its $description
import { readdir, readFile } from "node:fs/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { cssText, layered, THEMES, type ThemeName, type TokenMap } from "./tokens.mts";

export const PLACEHOLDER = /\{\{([\w.-]+)(@dark|\|description)?\}\}/g;

export function render(template: string, tokens: TokenMap, file = "template"): string {
  const out = template.replace(PLACEHOLDER, (_, id: string, suffix: string | undefined) => {
    if (suffix === "|description") {
      const description = tokens.get(id)?.$description;
      if (!description) throw new Error(`${file}: ${id} has no $description`);
      return description;
    }
    if (suffix === "@dark") return cssText(tokens, id, "dark");
    return cssText(tokens, id, "light");
  });
  const leftover = /\{\{[^}]*\}\}/.exec(out);
  if (leftover) throw new Error(`${file}: malformed placeholder ${leftover[0]}`);
  return out;
}

const templatesRoot = new URL("../templates/web/", import.meta.url);

/** Every web template, relative to templates/web/, with the theme it is rendered against. */
export async function webTemplates(): Promise<{ path: string; theme: ThemeName | undefined }[]> {
  const entries = await readdir(templatesRoot, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".css"))
    .map((e) => relative(fileURLToPath(templatesRoot), `${e.parentPath}/${e.name}`))
    .sort()
    .map((path) => {
      const theme = /^themes\/([\w-]+)\.css$/.exec(path)?.[1];
      if (theme && !THEMES.includes(theme as ThemeName)) throw new Error(`templates/web/${path}: no token set for theme ${theme}`);
      return { path, theme: theme as ThemeName | undefined };
    });
}

export async function renderWeb(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const { path, theme } of await webTemplates()) {
    const template = await readFile(new URL(path, templatesRoot), "utf8");
    out.set(`web/${path}`, render(template, await layered(theme), `templates/web/${path}`));
  }
  return out;
}
