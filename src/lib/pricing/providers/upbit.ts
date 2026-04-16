import "server-only";

import type { Quote } from "./yahoo";

const BASE = "https://api.upbit.com/v1/ticker";

export async function fetchUpbit(markets: string[]): Promise<Quote[]> {
  if (markets.length === 0) return [];
  const url = `${BASE}?markets=${encodeURIComponent(markets.join(","))}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Upbit fetch failed: ${res.status}`);
  const json = (await res.json()) as Array<{
    market: string;
    trade_price: number;
  }>;
  return json.map((r) => ({
    symbol: r.market,
    price: r.trade_price,
    currency: r.market.split("-")[0]?.toUpperCase() ?? "KRW",
  }));
}
