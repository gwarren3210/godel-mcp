import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import { MockProvider } from "../src/mock-provider.js";
import { buildServer } from "../src/server.js";

const EXPECTED_TOOLS = [
  "godel_describe",
  "godel_financials",
  "godel_historical",
  "godel_live_quote",
  "godel_most_active",
  "godel_news",
  "godel_quote",
  "godel_ratings",
  "godel_search",
];

describe("MCP server integration", () => {
  it("advertises every tool and answers a tool call through the protocol", async () => {
    const { server } = buildServer(new MockProvider());
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await server.connect(serverT);

    const client = new Client({ name: "it", version: "0" });
    await client.connect(clientT);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(EXPECTED_TOOLS);
    for (const tool of tools) {
      expect(tool.description, `${tool.name} needs a description`).toBeTruthy();
      expect(tool.inputSchema, `${tool.name} needs an input schema`).toBeTruthy();
    }

    const res = await client.callTool({ name: "godel_describe", arguments: { ticker: "aapl" } });
    const text = (res.content as Array<{ text?: string }>).map((c) => c.text ?? "").join("\n");
    expect(text).toContain("Sample Corp.");

    await client.close();
  });
});
