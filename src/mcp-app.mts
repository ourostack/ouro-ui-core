export const MCP_APP_MIME = "text/html;profile=mcp-app";

// MCP_APP_MIME above is MCP Apps' content type for an HTML view (SEP-1865). (No comment goes before the first
// statement: shadcn's CLI drops it when web's registry installs this file.)
//
// The MCP Apps adapter for Ouro's composed UI (src/composed.mts): the `ui://` resource a server lists for its HX view,
// the tool `_meta` that links a tool to it, and a tool result that carries Ouro's composed tree. MCP Apps is the
// transport, not the format: a result may carry the tree itself (`structuredContent.ouro`, here) or an A2UI stream
// (`structuredContent.a2ui`, a2ui.mts's `mcpAppToolResult`), and web's view draws either. Decision:
// docs/decisions/2026-11-14-composed-ui-own-tree.md.
//
// It imports only composed.mts. Apps vendor it from a release as `ouro-mcp-app.mts`, beside `ouro-composed.mts`.

import { COMPOSED_VERSION, validateTree, type Catalog, type ComposedNode, type Json, type Obj } from "./composed.mts";

/** The `ui://` resource a server lists and serves for its HX view (the HTML web's `mcp-app` kit builds). */
export function mcpAppResource(args: { uri: string; name: string; description?: string; html: string }) {
  if (!args.uri.startsWith("ui://")) throw new Error(`MCP Apps resources use ui://, got ${args.uri}. Fix: such as ui://spoonjoy/hx.`);
  return {
    listing: { uri: args.uri, name: args.name, ...(args.description ? { description: args.description } : {}), mimeType: MCP_APP_MIME },
    contents: { uri: args.uri, mimeType: MCP_APP_MIME, text: args.html },
  };
}

/** The `_meta` that links a tool to the view, so hosts render its results with HX. */
export const mcpAppToolMeta = (uri: string) => ({ ui: { resourceUri: uri } });

/**
 * A tool result carrying Ouro's composed tree: `content` is the text an agent and a text-only host read, and
 * `structuredContent.ouro` the tree the view draws, with `data`, the data model its fields start from, when it has one. Throws, with the problems, when the tree doesn't validate against the
 * catalog; the view validates it again against the catalog it was built with.
 */
export function mcpAppTreeResult(args: { text: string; catalog: Catalog; tree: ComposedNode; data?: Obj }) {
  const problems = validateTree(args.catalog, args.tree);
  if (problems.length) throw new Error(`the composed tree doesn't validate: ${problems.map((p) => `${p.path} ${p.message}`).join("; ")}`);
  return {
    content: [{ type: "text" as const, text: args.text }],
    structuredContent: { ouro: { version: COMPOSED_VERSION, catalogId: args.catalog.catalogId, tree: args.tree as unknown as Json, ...(args.data ? { data: args.data } : {}) } },
  };
}
