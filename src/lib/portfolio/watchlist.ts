import "server-only";

import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { fromAmountUnit } from "@/lib/money";

export type WatchlistRow = {
  id: number;
  instrumentId: number;
  symbol: string;
  name: string;
  assetClass: string;
  currency: string;
  price: number | null;
  changePct: number | null;
};

async function latestTwoPrices(instrumentId: number) {
  return db
    .select()
    .from(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, instrumentId))
    .orderBy(desc(schema.priceSnapshots.ts))
    .limit(2);
}

export async function getWatchlist(): Promise<WatchlistRow[]> {
  const items = await db
    .select({
      id: schema.watchlistItems.id,
      instrumentId: schema.watchlistItems.instrumentId,
      createdAt: schema.watchlistItems.createdAt,
      symbol: schema.instruments.symbol,
      name: schema.instruments.name,
      assetClass: schema.instruments.assetClass,
      currency: schema.instruments.currency,
    })
    .from(schema.watchlistItems)
    .leftJoin(
      schema.instruments,
      eq(schema.watchlistItems.instrumentId, schema.instruments.id),
    )
    .orderBy(desc(schema.watchlistItems.createdAt));

  const rows: WatchlistRow[] = [];
  for (const item of items) {
    if (!item.symbol) continue;
    const snaps = await latestTwoPrices(item.instrumentId);
    const cur = snaps[0]
      ? fromAmountUnit(snaps[0].price, snaps[0].currency)
      : null;
    const prev = snaps[1]
      ? fromAmountUnit(snaps[1].price, snaps[1].currency)
      : null;
    const changePct =
      cur !== null && prev !== null && prev > 0 ? ((cur - prev) / prev) * 100 : null;
    rows.push({
      id: item.id,
      instrumentId: item.instrumentId,
      symbol: item.symbol,
      name: item.name!,
      assetClass: item.assetClass!,
      currency: item.currency!,
      price: cur,
      changePct,
    });
  }
  return rows;
}
