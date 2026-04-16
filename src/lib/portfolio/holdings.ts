import "server-only";

import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import {
  fromAmountUnit,
  fromFxUnit,
  fromQtyUnit,
} from "@/lib/money";

import type { AllocationRow, AssetClass, Holding } from "./types";

type InstrumentRow = typeof schema.instruments.$inferSelect;
type TxnRow = typeof schema.transactions.$inferSelect;

async function getLatestPrice(instrumentId: number) {
  const row = await db
    .select()
    .from(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, instrumentId))
    .orderBy(desc(schema.priceSnapshots.ts))
    .limit(1);
  return row[0] ?? null;
}

async function getLatestFxRate(base: string, quote: string): Promise<number> {
  if (base.toUpperCase() === quote.toUpperCase()) return 1;
  const row = await db
    .select()
    .from(schema.fxRates)
    .where(eq(schema.fxRates.base, base))
    .orderBy(desc(schema.fxRates.ts))
    .limit(1);
  const r = row[0];
  if (!r) return 1;
  return fromFxUnit(r.rate);
}

// 평균단가 기반 보유 계산
function reduceTxns(
  txns: TxnRow[],
  instrument: InstrumentRow,
): { quantity: number; avgCost: number; costBasis: number } {
  let qty = 0;
  let avg = 0;
  let cost = 0;

  const currency = instrument.currency;

  for (const t of txns) {
    if (t.type === "buy") {
      const q = fromQtyUnit(t.quantity ?? 0);
      const p = fromAmountUnit(t.price ?? 0, currency);
      const newQty = qty + q;
      if (newQty > 0) {
        avg = (qty * avg + q * p) / newQty;
      }
      qty = newQty;
      cost += q * p;
    } else if (t.type === "sell") {
      const q = fromQtyUnit(t.quantity ?? 0);
      qty -= q;
      cost -= q * avg;
      if (qty <= 1e-9) {
        qty = 0;
        avg = 0;
        cost = 0;
      }
    }
    // dividend/interest/fee/tax는 수량·평균단가에 영향 없음
  }

  return { quantity: qty, avgCost: avg, costBasis: cost };
}

export async function getHoldings(): Promise<Holding[]> {
  const [instrumentsAll, txnsAll] = await Promise.all([
    db.select().from(schema.instruments),
    db.select().from(schema.transactions),
  ]);
  const instruments = instrumentsAll.filter((i) => i.kind !== "benchmark");

  const results: Holding[] = [];

  for (const ins of instruments) {
    const txns = txnsAll
      .filter((t) => t.instrumentId === ins.id)
      .sort((a, b) => a.ts - b.ts);
    const { quantity, avgCost, costBasis } = reduceTxns(txns, ins);
    if (quantity <= 0) continue;

    const snap = await getLatestPrice(ins.id);
    const currentPrice = snap
      ? fromAmountUnit(snap.price, snap.currency)
      : null;
    const marketValue = currentPrice !== null ? currentPrice * quantity : 0;

    const toKrw = await getLatestFxRate(ins.currency, "KRW");
    const marketValueKrw = marketValue * toKrw;
    const costBasisKrw = costBasis * toKrw;
    const unrealizedPnlKrw = marketValueKrw - costBasisKrw;
    const returnRatio =
      currentPrice !== null && avgCost > 0 ? currentPrice / avgCost - 1 : null;

    results.push({
      instrumentId: ins.id,
      symbol: ins.symbol,
      name: ins.name,
      assetClass: ins.assetClass as AssetClass,
      currency: ins.currency,
      quantity,
      avgCost,
      currentPrice,
      marketValue,
      marketValueKrw,
      costBasisKrw,
      unrealizedPnlKrw,
      returnRatio,
    });
  }

  return results.sort((a, b) => b.marketValueKrw - a.marketValueKrw);
}

// 현금 잔고: 계좌별 모든 거래 amount 합 (환산 KRW)
export async function getCashBalanceKrw(): Promise<number> {
  const [accounts, txns] = await Promise.all([
    db.select().from(schema.accounts),
    db.select().from(schema.transactions),
  ]);

  let totalKrw = 0;
  for (const acc of accounts) {
    const fx = await getLatestFxRate(acc.currency, "KRW");
    const sum = txns
      .filter((t) => t.accountId === acc.id)
      .reduce((s, t) => s + fromAmountUnit(t.amount, t.currency), 0);
    totalKrw += sum * fx;
  }
  return totalKrw;
}

export async function getAllocation(): Promise<AllocationRow[]> {
  const holdings = await getHoldings();
  const cash = await getCashBalanceKrw();

  const byClass = new Map<string, number>();
  for (const h of holdings) {
    byClass.set(
      h.assetClass,
      (byClass.get(h.assetClass) ?? 0) + h.marketValueKrw,
    );
  }
  if (cash > 0) byClass.set("cash", cash);

  const labelMap: Record<string, string> = {
    kr_equity: "국내 주식",
    us_equity: "해외 주식",
    crypto: "암호화폐",
    cash: "현금",
  };

  const total = Array.from(byClass.values()).reduce((s, v) => s + v, 0) || 1;
  return Array.from(byClass.entries())
    .map(([k, v]) => ({
      assetClass: k as AllocationRow["assetClass"],
      label: labelMap[k] ?? k,
      valueKrw: v,
      ratio: v / total,
    }))
    .sort((a, b) => b.valueKrw - a.valueKrw);
}

export async function getTotalValueKrw(): Promise<number> {
  const [holdings, cash] = await Promise.all([
    getHoldings(),
    getCashBalanceKrw(),
  ]);
  return holdings.reduce((s, h) => s + h.marketValueKrw, 0) + cash;
}
