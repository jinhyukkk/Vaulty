import "server-only";

import YahooFinance from "yahoo-finance2";

import { getHoldings } from "./holdings";

let yfClient: InstanceType<typeof YahooFinance> | null = null;
function getYf() {
  if (!yfClient) yfClient = new YahooFinance();
  return yfClient;
}

export type NewsItem = {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number; // unix seconds
  relatedTickers: string[];
  relatedName?: string;
};

// 15분 캐시 — 반복 호출 방지
type CacheEntry = { ts: number; data: NewsItem[] };
let cache: CacheEntry | null = null;
const TTL_MS = 15 * 60 * 1000;

async function searchNewsForSymbol(
  symbol: string,
  name?: string,
): Promise<NewsItem[]> {
  try {
    const r = await getYf().search(symbol, {
      newsCount: 4,
      quotesCount: 0,
      enableFuzzyQuery: false,
    });
    return (r.news ?? []).map((n) => ({
      id: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: Math.floor(new Date(n.providerPublishTime).getTime() / 1000),
      relatedTickers: n.relatedTickers ?? [symbol],
      relatedName: name,
    }));
  } catch {
    return [];
  }
}

export async function getNews(limit = 6): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return cache.data.slice(0, limit);
  }

  // 상위 보유 5종목 기준으로 뉴스 수집
  const holdings = await getHoldings();
  const top = holdings
    .filter((h) => h.assetClass !== "cash")
    .slice(0, 5)
    .map((h) => ({
      symbol:
        h.assetClass === "kr_equity" && /^\d+$/.test(h.symbol)
          ? `${h.symbol}.KS`
          : h.symbol,
      name: h.name,
    }));

  const batches = await Promise.all(
    top.map(({ symbol, name }) => searchNewsForSymbol(symbol, name)),
  );

  // 중복 제거 + 최신순 정렬
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  items.sort((a, b) => b.publishedAt - a.publishedAt);

  cache = { ts: Date.now(), data: items };
  return items.slice(0, limit);
}

export function timeAgo(ts: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
