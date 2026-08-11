// End-to-end demo: builds the server around the sample-data provider, links an
// in-process MCP client, and calls tools.  npx tsx examples/demo.ts

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { MockProvider } from "../src/mock-provider.js";
import { buildServer } from "../src/server.js";

async function main(): Promise<void> {
  const { server } = buildServer(new MockProvider());
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await server.connect(serverT);

  const client = new Client({ name: "demo", version: "0.1.0" });
  await client.connect(clientT);

  const { tools } = await client.listTools();
  console.log(`Connected. ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}\n`);

  for (const call of [
    { name: "godel_describe", arguments: { ticker: "AAPL" } },
    { name: "godel_financials", arguments: { ticker: "AAPL", periods: 3 } },
  ]) {
    const res = await client.callTool(call);
    const text = (res.content as Array<{ text?: string }>).map((c) => c.text ?? "").join("\n");
    console.log(`${"═".repeat(60)}\n▶ ${call.name}\n${"═".repeat(60)}\n${text}\n`);
  }

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
