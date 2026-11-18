export const MCP_APP_MIME = "text/html;profile=mcp-app";

// MCP_APP_MIME above is MCP Apps' content type for an HTML view (SEP-1865). (No comment goes before the first
// statement: shadcn's CLI drops it when web's registry installs this file.)
//
// The MCP Apps adapter for Ouro's composed UI (src/composed.mts): the `ui://` resource a server lists for its HX view,
// the tool `_meta` that links a tool to it, and a tool result that carries Ouro's composed tree or an update to it.
// MCP Apps is the transport, not the format: a result may carry the tree itself (`structuredContent.ouro`, here), an
// update to the tree the view already draws (`structuredContent.ouro.update`, here) or an A2UI stream
// (`structuredContent.a2ui`, a2ui.mts's `mcpAppToolResult`), and web's view draws each. Decisions:
// docs/decisions/2026-11-14-composed-ui-own-tree.md, docs/decisions/2026-11-18-composed-tree-updates.md.
//
// It imports only composed.mts. Apps vendor it from a release as `ouro-mcp-app.mts`, beside `ouro-composed.mts`.

import { COMPOSED_VERSION, treeUpdateProblems, validateTree, type Catalog, type ComposedNode, type Json, type Obj, type TreeUpdate } from "./composed.mts";

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

/**
 * A tool result carrying an update to the tree the view already draws (`TreeUpdate`), in `structuredContent.ouro.update`:
 * the nodes it replaces by id and the data it sets by JSON pointer, so the agent resends only what changed. Throws, with
 * the problems, when the update's shape, a node or a data path doesn't validate; the view applies it with
 * `applyTreeUpdate`, which also checks each id against the tree it draws and validates the tree it gives.
 */
export function mcpAppTreeUpdateResult(args: { text: string; catalog: Catalog; update: TreeUpdate }) {
  const problems = treeUpdateProblems(args.catalog, args.update);
  if (problems.length) throw new Error(`the tree update doesn't validate: ${problems.map((p) => `${p.path} ${p.message}`).join("; ")}`);
  return {
    content: [{ type: "text" as const, text: args.text }],
    structuredContent: { ouro: { version: COMPOSED_VERSION, catalogId: args.catalog.catalogId, update: args.update as unknown as Json } },
  };
}
