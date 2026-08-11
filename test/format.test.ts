import { describe, expect, it } from "vitest";
import { compact, formatFinancials, pct } from "../src/format.js";
import type { Financials } from "../src/provider.js";

describe("number formatting", () => {
  it("compacts magnitudes", () => {
    expect(compact(4.16e11)).toBe("416.00B");
    expect(compact(5.29e12)).toBe("5.29T");
    expect(compact(null)).toBe("—");
  });
  it("signs percentages", () => {
    expect(pct(1.2)).toBe("+1.20%");
    expect(pct(-3)).toBe("-3.00%");
  });
});

describe("formatFinancials", () => {
  const f: Financials = {
    ticker: "AAPL",
    currency: "USD",
    types: [
      { id: 1, name: "Revenue" },
      { id: 2, name: "Net Income" },
    ],
    rows: [
      { metricId: 1, periodicity: "ANNUAL", fiscalYear: 2025, fiscalPeriod: -1, periodEnd: "2025-12-31", actual: 416_160_000_000, estimate: null },
      { metricId: 2, periodicity: "ANNUAL", fiscalYear: 2025, fiscalPeriod: -1, periodEnd: "2025-12-31", actual: 112_010_000_000, estimate: null },
      { metricId: 1, periodicity: "ANNUAL", fiscalYear: 2027, fiscalPeriod: -1, periodEnd: "2027-12-31", actual: null, estimate: 5 },
    ],
    multiples: { pe: { last4Q: { value: 35.47 } } },
  };

  it("pivots realized annual metrics and excludes estimate-only years", () => {
    const out = formatFinancials(f, 5);
    expect(out).toContain("Revenue");
    expect(out).toContain("416.16B");
    expect(out).toContain("Net Income");
    expect(out).toContain("P/E 35.47");
    expect(out).not.toContain("2027");
  });
});
