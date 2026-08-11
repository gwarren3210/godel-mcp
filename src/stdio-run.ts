import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import type { GodelDataProvider } from "./provider.js";
import { buildServer } from "./server.js";

/** Build the server for a provider and serve it over stdio. */
export async function startStdio(provider: GodelDataProvider): Promise<void> {
  const { server } = buildServer(provider);
  await server.connect(new StdioServerTransport());
}
