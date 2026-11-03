// Reads the custom property declarations out of one of web's token stylesheets, line by line,
// and says which colour mode each belongs to. The stylesheets are formatted one declaration per
// line, which the importer checks before it trusts this reader.

export type Mode = "light" | "dark" | "both";

export interface Declaration {
  line: number;
  indent: string;
  name: string;
  value: string;
  comment: string | undefined;
  mode: Mode;
}

const DECLARATION = /^(\s*)(--[\w-]+): (.*?);(?: \/\* (.*) \*\/)?$/;

function modeOf(stack: string[]): Mode | null {
  const selector = stack.at(-1);
  if (selector === "@theme inline" || selector === ":root, .dark") return "both";
  if (selector === ":root") return "light";
  if (selector === ".dark") return "dark";
  if (selector === ":root:where(:not(.light, .dark))" && stack.at(-2) === "@media (prefers-color-scheme: dark)") return "dark";
  return null;
}

export function readDeclarations(css: string): { lines: string[]; declarations: Declaration[] } {
  const lines = css.split("\n");
  const stack: string[] = [];
  const declarations: Declaration[] = [];
  lines.forEach((text, index) => {
    const open = /^\s*(.*?)\s*\{\s*$/.exec(text);
    if (open && !text.trimStart().startsWith("--")) {
      stack.push(open[1]!);
      return;
    }
    if (/^\s*\}\s*$/.test(text)) {
      stack.pop();
      return;
    }
    if (!/^\s*--/.test(text)) return;
    const m = DECLARATION.exec(text);
    if (!m) throw new Error(`line ${index + 1}: a custom property this reader cannot split: ${text}`);
    const mode = modeOf(stack);
    if (!mode) throw new Error(`line ${index + 1}: ${m[2]} sits in a block with no colour mode: ${stack.join(" > ")}`);
    declarations.push({ line: index, indent: m[1]!, name: m[2]!, value: m[3]!, comment: m[4], mode });
  });
  return { lines, declarations };
}
