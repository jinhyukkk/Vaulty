// 일별 시세·환율 백필
// 사용:
//   npx tsx scripts/backfill-prices.ts [일수=365]
//
// Yahoo historical (yahoo-finance2) + Upbit candles/days + Frankfurter timeseries.
// 모든 적재는 (instrument_id, ts) / (base, quote, ts) UNIQUE로 중복 안전.

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import YahooFinance from "yahoo-finance2";

import * as schema from "../src/db/schema";
import { toAmountUnit, toFxUnit } from "../src/lib/money";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";
const sqlite = new Database(dbFile);
const db = drizzle(sqlite, { schema });

const days = Number(process.argv[2] ?? 365);
const end = new Date();
const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

function unixDay(d: Date): number {
  // 일별 스냅샷은 해당 일 23:00 UTC로 정규화 (중복 방지)
  const copy = new Date(d);
  copy.setUTCHours(23, 0, 0, 0);
  return Math.floor(copy.getTime() / 1000);
}

async function backfillYahoo(instruments: (typeof schema.instruments.$inferSelect)[]) {
  const yf = new YahooFinance();
  let total = 0;
  for (const ins of instruments) {
    try {
      const rows = await yf.historical(ins.providerSymbol, {
        period1: start,
        period2: end,
        interval: "1d",
      });
      for (const row of rows) {
        if (typeof row.close !== "number") continue;
        await db
          .insert(schema.priceSnapshots)
          .values({
            instrumentId: ins.id,
            currency: ins.currency,
            price: toAmountUnit(row.close, ins.currency),
            ts: unixDay(row.date),
          })
          .onConflictDoNothing();
        total++;
      }
      console.log(`yahoo ${ins.providerSymbol}: ${rows.length}건`);
    } catch (e) {
      console.error(`yahoo ${ins.providerSymbol} 실패: ${(e as Error).message}`);
    }
  }
  return total;
}

async function backfillUpbit(instruments: (typeof schema.instruments.$inferSelect)[]) {
  let total = 0;
  for (const ins of instruments) {
    try {
      // Upbit candles/days: 최대 200일 단위
      let remaining = days;
      let to: string | undefined = undefined;
      while (remaining > 0) {
        const count = Math.min(200, remaining);
        const url = `https://api.upbit.com/v1/candles/days?market=${encodeURIComponent(ins.providerSymbol)}&count=${count}${to ? `&to=${encodeURIComponent(to)}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`upbit ${res.status}`);
        const arr = (await res.json()) as Array<{
          candle_date_time_utc: string;
          trade_price: number;
        }>;
        if (arr.length === 0) break;
        for (const c of arr) {
          const d = new Date(c.candle_date_time_utc + "Z");
          await db
            .insert(schema.priceSnapshots)
            .values({
              instrumentId: ins.id,
              currency: ins.currency,
              price: toAmountUnit(c.trade_price, ins.currency),
              ts: unixDay(d),
            })
            .onConflictDoNothing();
          total++;
        }
        remaining -= arr.length;
        to = arr[arr.length - 1].candle_date_time_utc + "Z";
        if (arr.length < count) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      console.log(`upbit ${ins.providerSymbol}: 누적 ${total}건`);
    } catch (e) {
      console.error(`upbit ${ins.providerSymbol} 실패: ${(e as Error).message}`);
    }
  }
  return total;
}

async function backfillFx(currencies: string[]) {
  let total = 0;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  for (const cur of currencies) {
    if (cur === "KRW") continue;
    try {
      const url = `https://api.frankfurter.app/${iso(start)}..${iso(end)}?from=${cur}&to=KRW`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`frankfurter ${res.status}`);
      const json = (await res.json()) as {
        rates?: Record<string, { KRW: number }>;
      };
      const rates = json.rates ?? {};
      for (const [day, obj] of Object.entries(rates)) {
        if (typeof obj.KRW !== "number") continue;
        const ts = unixDay(new Date(day + "T12:00:00Z"));
        await db
          .insert(schema.fxRates)
          .values({
            base: cur,
            quote: "KRW",
            rate: toFxUnit(obj.KRW),
            ts,
          })
          .onConflictDoNothing();
        total++;
      }
      console.log(`fx ${cur}->KRW: ${Object.keys(rates).length}건`);
    } catch (e) {
      console.error(`fx ${cur} 실패: ${(e as Error).message}`);
    }
  }
  return total;
}

async function main() {
  console.log(`백필 시작: 최근 ${days}일, DB ${dbFile}`);

  const allInstruments = await db.select().from(schema.instruments);
  const yahoo = allInstruments.filter((i) => i.provider === "yahoo");
  const upbit = allInstruments.filter((i) => i.provider === "upbit");

  const totalPrices =
    (await backfillYahoo(yahoo)) + (await backfillUpbit(upbit));

  const foreignCurrencies = Array.from(
    new Set(
      allInstruments
        .map((i) => i.currency.toUpperCase())
        .filter((c) => c !== "KRW"),
    ),
  );
  const totalFx = await backfillFx(foreignCurrencies);

  console.log(`백필 완료: 시세 ${totalPrices}건, 환율 ${totalFx}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
