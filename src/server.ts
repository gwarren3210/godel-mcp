import { McpServer } from "@modelcontextprotocol/server";
import type { GodelDataProvider } from "./provider.js";
import { registerTools } from "./tools.js";

/** Build the MCP server around a data provider. */
export function buildServer(provider: GodelDataProvider): { server: McpServer } {
  const server = new McpServer({ name: "godel-mcp", version: "0.1.0" });
  registerTools(server, provider);
  return { server };
}
