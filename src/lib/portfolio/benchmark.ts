import "server-only";

import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { fromAmountUnit } from "@/lib/money";

export type BenchmarkSeries = { date: string; cumulative: number; symbol: string };

export async function getBenchmarkSeries(
  symbol: string,
  fromTs?: number,
): Promise<BenchmarkSeries[]> {
  const [ins] = await db
    .select()
    .from(schema.instruments)
    .where(eq(schema.instruments.symbol, symbol));
  if (!ins) return [];

  const prices = await db
    .select()
    .from(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, ins.id))
    .orderBy(asc(schema.priceSnapshots.ts));
  if (prices.length === 0) return [];

  const start = fromTs
    ? prices.find((p) => p.ts >= fromTs) ?? prices[0]
    : prices[0];
  const basePrice = fromAmountUnit(start.price, start.currency);
  if (basePrice <= 0) return [];

  return prices
    .filter((p) => p.ts >= start.ts)
    .map((p) => ({
      date: new Date(p.ts * 1000).toISOString().slice(0, 10),
      cumulative: fromAmountUnit(p.price, p.currency) / basePrice - 1,
      symbol,
    }));
}
