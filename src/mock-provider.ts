import type {
  DescriptionInfo,
  Financials,
  GodelDataProvider,
  HistoricalSeries,
  LiveQuote,
  MostActiveRow,
  NewsArticle,
  QuoteSnapshot,
  RatingsReport,
  SearchHit,
} from "./provider.js";

// A self-contained provider with generic sample data — lets the server run and
// its tools be exercised with no data access. Swap in a real GodelDataProvider
// for live data.
export class MockProvider implements GodelDataProvider {
  async describe(ticker: string): Promise<DescriptionInfo> {
    return {
      ticker,
      name: `${ticker} Sample Corp.`,
      exchange: "SAMPLE",
      currency: "USD",
      instrumentType: "EQUITY",
      cik: 111111,
      lastClose: 100.25,
      lastVolume: 12_000_000,
    };
  }

  async quote(ticker: string): Promise<QuoteSnapshot> {
    return { ticker, name: `${ticker} Sample Corp.`, last: 100.25, volume: 12_000_000, dollarVolume: 1_203_000_000, exchange: "SAMPLE" };
  }

  async financials(ticker: string): Promise<Financials> {
    const years = [2025, 2024, 2023];
    const types = [
      { id: 1, name: "Revenue" },
      { id: 2, name: "Gross Profit" },
      { id: 3, name: "Net Income" },
    ];
    const data: Record<number, number[]> = { 1: [10e9, 9e9, 8e9], 2: [4e9, 3.6e9, 3.2e9], 3: [2e9, 1.8e9, 1.5e9] };
    const rows = types.flatMap((t) =>
      years.map((y, i) => ({ metricId: t.id, periodicity: "ANNUAL", fiscalYear: y, fiscalPeriod: -1, periodEnd: `${y}-12-31`, actual: data[t.id]![i] ?? null, estimate: null })),
    );
    return { ticker, currency: "USD", types, rows, multiples: { pe: { last4Q: { value: 22.5 } } } };
  }

  async historical(ticker: string, resolution: string, bars: number): Promise<HistoricalSeries> {
    const out = Array.from({ length: Math.min(bars, 5) }, (_, i) => ({
      time: 1_700_000_000_000 + i * 86_400_000,
      open: 100 + i,
      high: 101 + i,
      low: 99 + i,
      close: 100.5 + i,
      volume: 10_000_000 + i * 100_000,
    }));
    return { ticker, resolution, bars: out };
  }

  async ratings(ticker: string): Promise<RatingsReport> {
    return {
      ticker,
      name: `${ticker} Sample Corp.`,
      exchange: "SAMPLE",
      currency: "USD",
      ratings: [{ date: "2026-01-15", firm: "Sample Securities", change: "Maintains", ratingCurrent: "Buy", priceTargetCurrent: 130 }],
    };
  }

  async mostActive(): Promise<MostActiveRow[]> {
    return [
      { ticker: "AAA", name: "Alpha Sample Inc.", marketCap: 1.2e12, dollarVolume: 8e9 },
      { ticker: "BBB", name: "Beta Sample Corp.", marketCap: 5e11, dollarVolume: 3e9 },
    ];
  }

  async search(query: string): Promise<SearchHit[]> {
    return [{ kind: "instrument", id: 1, label: `${query.toUpperCase()} — ${query} Sample Corp.`, detail: "EQUITY SAMPLE" }];
  }

  async news(ticker: string | undefined): Promise<NewsArticle[]> {
    return [
      {
        title: `Sample headline for ${ticker ?? "the market"}`,
        source: "Sample Newswire",
        feedId: "sample",
        publishedMs: 1_700_000_000_000,
        securityIds: ticker ? [ticker] : [],
      },
    ];
  }

  async liveQuote(ticker: string): Promise<LiveQuote> {
    return { ticker, last: 100.25, changePercent: 0.63, raw: "sample provider" };
  }
}
