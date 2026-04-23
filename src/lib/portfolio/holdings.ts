import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import {
  fromAmountUnit,
  fromFxUnit,
  fromQtyUnit,
} from "@/lib/money";

import type {
  AccountHoldings,
  AllocationRow,
  AssetClass,
  Holding,
} from "./types";

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

async function getPriceHistory(
  instrumentId: number,
  days = 30,
): Promise<number[]> {
  const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
  const rows = await db
    .select()
    .from(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, instrumentId))
    .orderBy(asc(schema.priceSnapshots.ts));
  // 일별 스냅샷 + 실시간 5분 snapshot이 섞여 있으니 하루 한 점만 사용 (ts 기준 day 버킷).
  const byDay = new Map<string, { ts: number; price: number; currency: string }>();
  for (const r of rows) {
    if (r.ts < cutoff) continue;
    const day = new Date(r.ts * 1000).toISOString().slice(0, 10);
    byDay.set(day, { ts: r.ts, price: r.price, currency: r.currency });
  }
  const sorted = Array.from(byDay.values()).sort((a, b) => a.ts - b.ts);
  return sorted.map((r) => fromAmountUnit(r.price, r.currency));
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

async function buildHolding(
  ins: InstrumentRow,
  txns: TxnRow[],
  opts: { includeHistory?: boolean } = {},
): Promise<Holding | null> {
  const { quantity, avgCost, costBasis } = reduceTxns(txns, ins);
  if (quantity <= 0) return null;

  const snap = await getLatestPrice(ins.id);
  const currentPrice = snap ? fromAmountUnit(snap.price, snap.currency) : null;
  const marketValue = currentPrice !== null ? currentPrice * quantity : 0;

  const toKrw = await getLatestFxRate(ins.currency, "KRW");
  const marketValueKrw = marketValue * toKrw;
  const costBasisKrw = costBasis * toKrw;
  const unrealizedPnlKrw = marketValueKrw - costBasisKrw;
  const returnRatio =
    currentPrice !== null && avgCost > 0 ? currentPrice / avgCost - 1 : null;

  const priceHistory = opts.includeHistory
    ? await getPriceHistory(ins.id, 30)
    : undefined;

  return {
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
    priceHistory,
  };
}

// 기본: 종목 단위로 전 계좌 합산. includeHistory=true면 30일 price history 포함.
export async function getHoldings(
  opts: { includeHistory?: boolean } = {},
): Promise<Holding[]> {
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
    const h = await buildHolding(ins, txns, opts);
    if (h) results.push(h);
  }
  return results.sort((a, b) => b.marketValueKrw - a.marketValueKrw);
}

// 계좌별 포지션 + 현금 + 총계
export async function getHoldingsByAccount(): Promise<AccountHoldings[]> {
  const [accounts, instrumentsAll, txnsAll] = await Promise.all([
    db.select().from(schema.accounts),
    db.select().from(schema.instruments),
    db.select().from(schema.transactions),
  ]);
  const instruments = instrumentsAll.filter((i) => i.kind !== "benchmark");

  const result: AccountHoldings[] = [];

  for (const acc of accounts) {
    const fxToKrw = await getLatestFxRate(acc.currency, "KRW");

    // 이 계좌의 현금: 모든 거래의 amount 합 (거래통화 기준)
    const accTxns = txnsAll.filter((t) => t.accountId === acc.id);
    const cashRaw = accTxns.reduce(
      (s, t) => s + fromAmountUnit(t.amount, t.currency),
      0,
    );
    const cashKrw = cashRaw * fxToKrw;

    // 이 계좌의 종목별 포지션
    const holdings: Holding[] = [];
    for (const ins of instruments) {
      const txns = accTxns
        .filter((t) => t.instrumentId === ins.id)
        .sort((a, b) => a.ts - b.ts);
      if (txns.length === 0) continue;
      const h = await buildHolding(ins, txns);
      if (h) holdings.push(h);
    }
    holdings.sort((a, b) => b.marketValueKrw - a.marketValueKrw);

    const equityKrw = holdings.reduce((s, h) => s + h.marketValueKrw, 0);
    const costKrw = holdings.reduce((s, h) => s + h.costBasisKrw, 0);
    const pnlKrw = equityKrw - costKrw;
    const pnlRatio = costKrw > 0 ? pnlKrw / costKrw : 0;
    const totalKrw = equityKrw + cashKrw;

    result.push({
      accountId: acc.id,
      accountName: acc.name,
      accountKind: acc.kind,
      currency: acc.currency,
      cashKrw,
      holdings,
      equityKrw,
      pnlKrw,
      pnlRatio,
      totalKrw,
    });
  }

  return result.sort((a, b) => b.totalKrw - a.totalKrw);
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
