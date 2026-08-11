// Dense, monospaced panels for tool output. Pure presentation over the domain
// types in provider.ts — no knowledge of where the data comes from.

import type {
  DescriptionInfo,
  Financials,
  HistoricalSeries,
  LiveQuote,
  MostActiveRow,
  NewsArticle,
  QuoteSnapshot,
  RatingsReport,
  SearchHit,
} from "./provider.js";

export function compact(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return String(n);
}

export function num(n: number | undefined | null, digits = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function tsDate(ms: number | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toISOString().slice(0, 10);
}
const padR = (s: string, w: number): string => (s.length >= w ? s : s + " ".repeat(w - s.length));
const padL = (s: string, w: number): string => (s.length >= w ? s : " ".repeat(w - s.length) + s);

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const head = headers.map((h, i) => padR(h, widths[i] ?? h.length)).join("  ");
  const sep = widths.map((w) => "─".repeat(w)).join("  ");
  const body = rows.map((r) => r.map((c, i) => (i === 0 ? padR(c, widths[i] ?? c.length) : padL(c, widths[i] ?? c.length))).join("  "));
  return [head, sep, ...body].join("\n");
}

export function formatDescription(d: DescriptionInfo): string {
  return [
    `${d.ticker}  ${d.name}`,
    `${d.exchange ?? "—"}   ${d.instrumentType ?? "EQUITY"}   ${d.currency ?? ""}`.trim(),
    "",
    `Last Close   ${num(d.lastClose)}`,
    `Volume       ${compact(d.lastVolume)}`,
    `CIK          ${d.cik ?? "—"}`,
    `LEI          ${d.lei ?? "—"}`,
  ].join("\n");
}

export function formatQuote(q: QuoteSnapshot): string {
  return [
    `${q.ticker}  ${q.name ?? ""}   (delayed snapshot)`.trimEnd(),
    "",
    `Last     ${num(q.last)}`,
    `Volume   ${compact(q.volume)}`,
    `$ Volume ${compact(q.dollarVolume)}`,
    `Exchange ${q.exchange ?? "—"}`,
  ].join("\n");
}

const FINANCIAL_ORDER = [
  "Revenue",
  "COGS",
  "Gross Profit",
  "SG&A Expense",
  "R&D Expense",
  "Operating Expenses",
  "Operating Income",
  "Pretax Income",
  "Net Income",
  "EBITDA",
  "Net Cash from Operating Activities",
  "Net Cash from Investing Activities",
  "Net Cash from Financing Activities",
  "Free Cash Flow",
  "Total Assets",
  "Total Liabilities",
  "Total Equity",
  "Cash and Equivalents",
  "Total Debt",
];

export function formatFinancials(f: Financials, periods = 5): string {
  const nameById = new Map(f.types.map((t) => [t.id, t.name]));
  const annual = f.rows.filter((r) => r.periodicity === "ANNUAL" && r.actual !== null);
  const years = [...new Set(annual.map((r) => r.fiscalYear))].sort((a, b) => b - a).slice(0, periods);

  const byName = new Map<string, Map<number, number | null>>();
  for (const row of annual) {
    if (!years.includes(row.fiscalYear)) continue;
    const name = nameById.get(row.metricId) ?? `#${row.metricId}`;
    if (!byName.has(name)) byName.set(name, new Map());
    byName.get(name)!.set(row.fiscalYear, row.actual);
  }

  const ordered = [
    ...FINANCIAL_ORDER.filter((n) => byName.has(n)),
    ...[...byName.keys()].filter((n) => !FINANCIAL_ORDER.includes(n)),
  ].slice(0, 22);

  const headers = ["Metric", ...years.map(String)];
  const rows = ordered.map((name) => [name, ...years.map((y) => compact(byName.get(name)?.get(y)))]);

  const m = f.multiples ?? {};
  const mult = (k: string): string => {
    const v = (m as Record<string, { last4Q?: { value?: number } }>)[k]?.last4Q?.value;
    return v === undefined ? "—" : v.toFixed(2);
  };
  const valuation = `Valuation (LTM)   P/E ${mult("pe")}   P/S ${mult("ps")}   P/B ${mult("pb")}   P/CF ${mult("pcf")}`;
  return `${f.ticker}  FINANCIALS  (${f.currency}, annual)\n\n${table(headers, rows)}\n\n${valuation}`;
}

export function formatHistorical(s: HistoricalSeries): string {
  const headers = ["Date", "Open", "High", "Low", "Close", "Volume"];
  const rows = s.bars.map((b) => [tsDate(b.time), num(b.open), num(b.high), num(b.low), num(b.close), compact(b.volume)]);
  return `${s.ticker}  HISTORY  ${s.resolution}  (${s.bars.length} bars)\n\n${table(headers, rows)}`;
}

export function formatRatings(r: RatingsReport): string {
  if (r.ratings.length === 0) return `${r.ticker}: no analyst ratings.`;
  const headers = ["Date", "Firm", "Action", "Rating", "PT", "Prior PT"];
  const rows = r.ratings.map((x) => [
    x.date ?? "—",
    (x.firm ?? "—").slice(0, 22),
    x.change ?? "—",
    x.ratingCurrent ?? "—",
    num(x.priceTargetCurrent),
    num(x.priceTargetPrior),
  ]);
  return `${r.ticker}  ANALYST RATINGS  (${r.exchange ?? ""} ${r.currency ?? ""})\n\n${table(headers, rows)}`;
}

export function formatMostActive(rows_: MostActiveRow[]): string {
  const headers = ["Ticker", "Mkt Cap", "$ Volume", "Name"];
  const rows = rows_.map((s) => [s.ticker, compact(s.marketCap), compact(s.dollarVolume), (s.name ?? "").slice(0, 36)]);
  return `MOST ACTIVE\n\n${table(headers, rows)}`;
}

export function formatSearch(hits: SearchHit[]): string {
  if (hits.length === 0) return "No matches.";
  return hits.slice(0, 30).map((h) => `[${h.kind}] ${h.label}${h.detail ? `  (${h.detail})` : ""}  #${h.id}`).join("\n");
}

export function formatNews(articles: NewsArticle[], title = "NEWS & FILINGS"): string {
  if (articles.length === 0) return "No articles.";
  return (
    `${title}\n\n` +
    articles
      .map((a, i) => {
        const when = a.publishedMs ? new Date(a.publishedMs).toISOString().replace("T", " ").slice(0, 16) + "Z" : "—";
        const tickers = a.securityIds.length ? `  [${a.securityIds.slice(0, 8).join(",")}]` : "";
        return `${padL(String(i + 1), 2)}. ${a.title}\n    ${a.source ?? a.feedId ?? "—"}  ${when}${tickers}`;
      })
      .join("\n\n")
  );
}

export function formatLiveQuoteResult(q: LiveQuote): string {
  const sign = q.changePercent !== undefined && q.changePercent > 0 ? "+" : "";
  const lines = [
    `${q.ticker}  LIVE`,
    "",
    `Last     ${q.last ?? "—"}`,
    `Change   ${q.changePercent !== undefined ? `${sign}${q.changePercent}%` : "—"}`,
  ];
  if (q.raw) lines.push("", `source: ${q.raw}`);
  return lines.join("\n");
}
