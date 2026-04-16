import "server-only";

import YahooFinance from "yahoo-finance2";

export type Quote = {
  symbol: string;
  price: number;
  currency: string;
};

let instance: InstanceType<typeof YahooFinance> | null = null;
function getClient() {
  if (!instance) {
    instance = new YahooFinance();
  }
  return instance;
}

// yahoo-finance2: crumb/cookie 자동 처리, 무료·무인증(비공식)
export async function fetchYahoo(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];

  const yf = getClient();
  const results = (await yf.quote(symbols)) as unknown as Array<{
    symbol: string;
    regularMarketPrice?: number;
    currency?: string;
  }>;

  const rows = Array.isArray(results) ? results : [results];

  return rows
    .filter((r): r is typeof r & { regularMarketPrice: number } =>
      typeof r?.regularMarketPrice === "number",
    )
    .map((r) => ({
      symbol: r.symbol,
      price: r.regularMarketPrice,
      currency: (r.currency ?? "USD").toUpperCase(),
    }));
}
