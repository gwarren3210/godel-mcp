// The data contract between the MCP tools and whatever supplies the data.
//
// This repo defines the *interface* and the domain types the tools format —
// it does not implement data access. A consumer supplies a `GodelDataProvider`
// (e.g. a private package that talks to the live service) via `buildServer`.

export interface DescriptionInfo {
  ticker: string;
  name: string;
  exchange?: string;
  currency?: string;
  instrumentType?: string;
  cik?: number;
  lei?: string;
  lastClose?: number;
  lastVolume?: number;
}

export interface QuoteSnapshot {
  ticker: string;
  name?: string;
  last?: number;
  volume?: number;
  dollarVolume?: number;
  exchange?: string;
}

export interface FinancialMetricType {
  id: number;
  name: string;
  description?: string;
}

export interface FinancialMetricRow {
  metricId: number;
  periodicity: string;
  fiscalYear: number;
  fiscalPeriod: number;
  periodEnd: string;
  actual: number | null;
  estimate: number | null;
}

export interface Financials {
  ticker: string;
  currency: string;
  types: FinancialMetricType[];
  rows: FinancialMetricRow[];
  multiples?: Record<string, unknown>;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoricalSeries {
  ticker: string;
  resolution: string;
  bars: Bar[];
}

export interface Rating {
  date?: string;
  firm?: string;
  analyst?: string;
  change?: string;
  ratingCurrent?: string;
  ratingPrior?: string;
  priceTargetCurrent?: number;
  priceTargetPrior?: number;
}

export interface RatingsReport {
  ticker: string;
  name?: string;
  exchange?: string;
  currency?: string;
  ratings: Rating[];
}

export interface MostActiveRow {
  ticker: string;
  name?: string;
  marketCap?: number;
  dollarVolume?: number;
}

export interface SearchHit {
  kind: "instrument" | "legalEntity" | "person" | "news";
  id: number | string;
  label: string;
  detail?: string;
}

export interface NewsArticle {
  title: string;
  source?: string;
  feedId?: string;
  publishedMs?: number;
  securityIds: string[];
  url?: string;
  description?: string;
}

export interface LiveQuote {
  ticker: string;
  last?: number;
  changePercent?: number;
  raw?: string;
}

/** Everything the MCP tools need. Implemented by a data-access package. */
export interface GodelDataProvider {
  describe(ticker: string): Promise<DescriptionInfo>;
  quote(ticker: string): Promise<QuoteSnapshot>;
  financials(ticker: string): Promise<Financials>;
  historical(ticker: string, resolution: string, bars: number): Promise<HistoricalSeries>;
  ratings(ticker: string): Promise<RatingsReport>;
  mostActive(tab: string, rows: number): Promise<MostActiveRow[]>;
  search(query: string, types: string): Promise<SearchHit[]>;
  news(ticker: string | undefined, limit: number): Promise<NewsArticle[]>;
  liveQuote(ticker: string): Promise<LiveQuote>;
}
