// KOSPI/S&P500 벤치마크 instrument 등록 후 일별 시세 백필
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq } from "drizzle-orm";
import YahooFinance from "yahoo-finance2";

import * as schema from "../src/db/schema";
import { toAmountUnit } from "../src/lib/money";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";
const sqlite = new Database(dbFile);
const db = drizzle(sqlite, { schema });

const BENCHMARKS = [
  {
    symbol: "KOSPI",
    name: "KOSPI 종합주가지수",
    providerSymbol: "^KS11",
    currency: "KRW",
    assetClass: "kr_equity",
  },
  {
    symbol: "SP500",
    name: "S&P 500",
    providerSymbol: "^GSPC",
    currency: "USD",
    assetClass: "us_equity",
  },
];

function unixDay(d: Date): number {
  const c = new Date(d);
  c.setUTCHours(23, 0, 0, 0);
  return Math.floor(c.getTime() / 1000);
}

async function main() {
  const yf = new YahooFinance();
  const days = Number(process.argv[2] ?? 365);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400 * 1000);

  for (const b of BENCHMARKS) {
    const [found] = await db
      .select()
      .from(schema.instruments)
      .where(
        and(
          eq(schema.instruments.symbol, b.symbol),
          eq(schema.instruments.assetClass, b.assetClass),
        ),
      );
    let id = found?.id;
    if (!id) {
      const [ins] = await db
        .insert(schema.instruments)
        .values({
          symbol: b.symbol,
          assetClass: b.assetClass,
          name: b.name,
          currency: b.currency,
          provider: "yahoo",
          providerSymbol: b.providerSymbol,
          kind: "benchmark",
        })
        .returning();
      id = ins.id;
      console.log(`등록: ${b.symbol} (id=${id})`);
    } else {
      await db
        .update(schema.instruments)
        .set({ kind: "benchmark" })
        .where(eq(schema.instruments.id, id));
      console.log(`존재: ${b.symbol} (id=${id})`);
    }

    const rows = await yf.historical(b.providerSymbol, {
      period1: start,
      period2: end,
      interval: "1d",
    });
    let count = 0;
    for (const r of rows) {
      if (typeof r.close !== "number") continue;
      await db
        .insert(schema.priceSnapshots)
        .values({
          instrumentId: id,
          currency: b.currency,
          price: toAmountUnit(r.close, b.currency),
          ts: unixDay(r.date),
        })
        .onConflictDoNothing();
      count++;
    }
    console.log(`  ${b.providerSymbol}: ${count}건 스냅샷`);
  }

  console.log("완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
