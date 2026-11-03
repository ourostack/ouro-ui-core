// A token's path and its CSS custom property name are one rule apart: join the path with "-".
// `primary-foreground` is --primary-foreground; `ouro.duration.fast` is --ouro-duration-fast.
// The one exception is the `shadcn` group: shadcn's stock --input and --radius, which ouro-base.css
// writes for an app whose theme has neither, so they don't collide with Ouro's own `input` and `radius`.

/** The `--ouro-<group>-…` prefixes that become a nested group, as the fixed interface names them. */
const OURO_GROUPS = ["duration", "ease", "spring", "press", "backdrop", "shadow"] as const;

export const SHADCN_GROUP = "shadcn";

export function pathToCssName(path: readonly string[]): string {
  const parts = path[0] === SHADCN_GROUP ? path.slice(1) : path;
  return `--${parts.join("-")}`;
}

export function cssNameToPath(name: string, { shadcn = false } = {}): string[] {
  const bare = name.replace(/^--/, "");
  if (shadcn) return [SHADCN_GROUP, bare];
  if (!bare.startsWith("ouro-")) return [bare];
  const rest = bare.slice("ouro-".length);
  const group = OURO_GROUPS.find((g) => rest === g || rest.startsWith(`${g}-`));
  if (!group || rest === group) return ["ouro", rest];
  return ["ouro", group, rest.slice(group.length + 1)];
}

export const pathId = (path: readonly string[]) => path.join(".");
