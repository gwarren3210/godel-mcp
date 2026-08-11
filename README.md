# godel-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
[Godel Terminal](https://godelterminal.com)-style research as tools for AI
clients — describe a security, pull financials, historical prices, analyst
ratings, most-active, search, news, and live quotes.

The server is a **tool surface over a pluggable data provider**. It defines the
tools and the data contract (`GodelDataProvider`); *how* the data is fetched is
supplied by whatever provider you inject. It ships with a sample-data provider so
you can run it immediately, and can be embedded with your own.

```
you ──ask──▶ Claude ──MCP──▶ godel-mcp ──▶ GodelDataProvider (you supply)
                                  │
                          formats dense, terminal-style panels
```

## Tools

| Tool | Returns |
|------|---------|
| `godel_describe` | Security overview (name, exchange, last close, CIK/LEI) |
| `godel_quote` | Delayed last-close snapshot |
| `godel_financials` | Annual financials + valuation multiples |
| `godel_historical` | Historical OHLCV bars |
| `godel_ratings` | Analyst rating actions and price targets |
| `godel_most_active` | Most active by dollar volume |
| `godel_search` | Instruments / legal entities / news |
| `godel_news` | Recent news & filings |
| `godel_live_quote` | Real-time quote (needs a live-capable provider) |

## Try it (sample data)

```bash
npm install
npm run demo      # in-process MCP round-trip printing formatted panels
npm run dev       # run the server over stdio with the sample provider
```

## Embed it with your own data

Implement `GodelDataProvider` and pass it to `buildServer` / `startStdio`:

```ts
import { startStdio, type GodelDataProvider } from "godel-mcp";

const provider: GodelDataProvider = {
  async describe(ticker) { /* ... */ },
  async financials(ticker) { /* ... */ },
  async liveQuote(ticker) { /* ... */ },
  // ...the rest of the interface
};

await startStdio(provider); // serves all tools over stdio, backed by your data
```

The data-access layer lives outside this repo by design — this package is just
the MCP surface and formatting.

## Layout

```
src/
  index.ts         entry — runs with the sample provider over stdio
  server.ts        buildServer(provider)
  stdio-run.ts     startStdio(provider)
  tools.ts         MCP tool definitions (call the provider, format results)
  provider.ts      GodelDataProvider interface + domain types
  format.ts        dense terminal-style panels
  mock-provider.ts sample-data provider
examples/demo.ts   in-process MCP demo
test/              formatting + MCP round-trip
```

## Development

```bash
npm run typecheck
npm test           # vitest: formatting + full MCP round-trip against the sample provider
```

## License

MIT — see [LICENSE](LICENSE). Not affiliated with or endorsed by Godel Terminal / DL Software.
