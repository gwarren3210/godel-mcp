import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  formatDescription,
  formatFinancials,
  formatHistorical,
  formatLiveQuoteResult,
  formatMostActive,
  formatNews,
  formatQuote,
  formatRatings,
  formatSearch,
} from "./format.js";
import type { GodelDataProvider } from "./provider.js";
import { describeError } from "./util/errors.js";

type TextResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };
const ok = (text: string): TextResult => ({ content: [{ type: "text", text }] });
const fail = (err: unknown): TextResult => ({ content: [{ type: "text", text: `Error: ${describeError(err)}` }], isError: true });
const ticker = z.string().min(1).transform((t) => t.trim().toUpperCase());

/** Register the terminal tools, backed by an injected data provider. */
export function registerTools(server: McpServer, provider: GodelDataProvider): void {
  server.registerTool(
    "godel_describe",
    {
      title: "Security description",
      description: "Overview for a ticker: name, exchange, instrument type, last close, CIK/LEI.",
      inputSchema: z.object({ ticker: ticker.describe("Ticker symbol, e.g. AAPL") }),
    },
    async ({ ticker }): Promise<TextResult> => {
      try {
        return ok(formatDescription(await provider.describe(ticker)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_quote",
    {
      title: "Quote snapshot",
      description: "Delayed last-close snapshot for a ticker (last, volume, dollar volume).",
      inputSchema: z.object({ ticker: ticker.describe("Ticker symbol, e.g. TSLA") }),
    },
    async ({ ticker }): Promise<TextResult> => {
      try {
        return ok(formatQuote(await provider.quote(ticker)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_financials",
    {
      title: "Financial statements",
      description: "Standardized annual financials for a ticker (revenue, margins, income, cash flows) plus valuation multiples.",
      inputSchema: z.object({
        ticker: ticker.describe("Ticker symbol, e.g. MSFT"),
        periods: z.number().int().min(1).max(10).default(5).describe("How many fiscal years"),
      }),
    },
    async ({ ticker, periods }): Promise<TextResult> => {
      try {
        return ok(formatFinancials(await provider.financials(ticker), periods));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_historical",
    {
      title: "Historical prices",
      description: "Historical OHLCV bars for a ticker at a given resolution.",
      inputSchema: z.object({
        ticker: ticker.describe("Ticker symbol, e.g. NVDA"),
        resolution: z.string().default("1D").describe("Bar resolution, e.g. 1D, 1W"),
        bars: z.number().int().min(1).max(500).default(30).describe("Number of bars"),
      }),
    },
    async ({ ticker, resolution, bars }): Promise<TextResult> => {
      try {
        return ok(formatHistorical(await provider.historical(ticker, resolution, bars)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_ratings",
    {
      title: "Analyst ratings",
      description: "Recent analyst rating actions and price targets for a ticker.",
      inputSchema: z.object({ ticker: ticker.describe("Ticker symbol, e.g. AAPL") }),
    },
    async ({ ticker }): Promise<TextResult> => {
      try {
        return ok(formatRatings(await provider.ratings(ticker)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_most_active",
    {
      title: "Most active",
      description: "Most active securities across the market.",
      inputSchema: z.object({
        tab: z.enum(["ACTIVE", "GAINERS", "LOSERS"]).default("ACTIVE").describe("Leaderboard"),
        rows: z.number().int().min(1).max(100).default(25).describe("How many rows"),
      }),
    },
    async ({ tab, rows }): Promise<TextResult> => {
      try {
        return ok(formatMostActive(await provider.mostActive(tab, rows)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_search",
    {
      title: "Search",
      description: "Search for instruments, legal entities, and news matching a query.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search text, e.g. a company name or ticker"),
        types: z.string().default("instruments,legal_entities,news").describe("Comma-separated result types"),
      }),
    },
    async ({ query, types }): Promise<TextResult> => {
      try {
        return ok(formatSearch(await provider.search(query, types)));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_news",
    {
      title: "News & filings",
      description: "Recent news and filings, optionally filtered to a ticker.",
      inputSchema: z.object({
        ticker: z.string().min(1).transform((t) => t.trim().toUpperCase()).optional().describe("Optional ticker filter"),
        limit: z.number().int().min(1).max(50).default(15).describe("Max articles"),
      }),
    },
    async ({ ticker, limit }): Promise<TextResult> => {
      try {
        const articles = await provider.news(ticker, limit);
        return ok(formatNews(articles, ticker ? `${ticker} NEWS & FILINGS` : "MARKET NEWS & FILINGS"));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "godel_live_quote",
    {
      title: "Live quote (real-time)",
      description: "Real-time quote for a ticker. Requires a provider with live access.",
      inputSchema: z.object({ ticker: ticker.describe("Ticker symbol, e.g. AAPL") }),
    },
    async ({ ticker }): Promise<TextResult> => {
      try {
        return ok(formatLiveQuoteResult(await provider.liveQuote(ticker)));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
