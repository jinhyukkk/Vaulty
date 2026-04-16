import "server-only";

import { db, schema } from "@/db/client";
import { toAmountUnit, toFxUnit } from "@/lib/money";

import { fetchFx } from "./providers/fx";
import { fetchUpbit } from "./providers/upbit";
import { fetchYahoo } from "./providers/yahoo";

export type RefreshSummary = {
  prices: number;
  fx: number;
  failures: string[];
};

export async function refreshAll(): Promise<RefreshSummary> {
  const instruments = await db.select().from(schema.instruments);
  const now = Math.floor(Date.now() / 1000);
  const failures: string[] = [];

  const yahooTargets = instruments.filter((i) => i.provider === "yahoo");
  const upbitTargets = instruments.filter((i) => i.provider === "upbit");

  let priceCount = 0;

  if (yahooTargets.length) {
    try {
      const quotes = await fetchYahoo(yahooTargets.map((i) => i.providerSymbol));
      for (const ins of yahooTargets) {
        const q = quotes.find((x) => x.symbol === ins.providerSymbol);
        if (!q) continue;
        await db
          .insert(schema.priceSnapshots)
          .values({
            instrumentId: ins.id,
            currency: q.currency,
            price: toAmountUnit(q.price, q.currency),
            ts: now,
          })
          .onConflictDoNothing();
        priceCount++;
      }
    } catch (e) {
      failures.push(`yahoo: ${(e as Error).message}`);
    }
  }

  if (upbitTargets.length) {
    try {
      const quotes = await fetchUpbit(
        upbitTargets.map((i) => i.providerSymbol),
      );
      for (const ins of upbitTargets) {
        const q = quotes.find((x) => x.symbol === ins.providerSymbol);
        if (!q) continue;
        await db
          .insert(schema.priceSnapshots)
          .values({
            instrumentId: ins.id,
            currency: q.currency,
            price: toAmountUnit(q.price, q.currency),
            ts: now,
          })
          .onConflictDoNothing();
        priceCount++;
      }
    } catch (e) {
      failures.push(`upbit: ${(e as Error).message}`);
    }
  }

  // 환율: 현재 사용 통화 집합 → KRW
  const foreignCurrencies = Array.from(
    new Set(
      instruments
        .map((i) => i.currency.toUpperCase())
        .filter((c) => c !== "KRW"),
    ),
  );
  let fxCount = 0;
  for (const cur of foreignCurrencies) {
    try {
      const rate = await fetchFx(cur, "KRW");
      await db
        .insert(schema.fxRates)
        .values({
          base: cur,
          quote: "KRW",
          rate: toFxUnit(rate),
          ts: now,
        })
        .onConflictDoNothing();
      fxCount++;
    } catch (e) {
      failures.push(`fx ${cur}->KRW: ${(e as Error).message}`);
    }
  }

  return { prices: priceCount, fx: fxCount, failures };
}
