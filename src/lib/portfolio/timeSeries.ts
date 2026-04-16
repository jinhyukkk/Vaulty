import "server-only";

import { and, lte, desc } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { fromAmountUnit, fromFxUnit, fromQtyUnit } from "@/lib/money";

export type RevenuePoint = { month: string; revenue: number };

// 월별 포트폴리오 가치 추이 (최근 12개월).
// 월말 시점 기준:
//   - 보유 수량: 월말까지 누적 거래
//   - 시세: 해당 월말 이전의 가장 최신 price_snapshot
//   - 환율: 해당 월말 이전의 가장 최신 fx_rate
// 백필 스크립트로 일별 스냅샷이 쌓이면 정확한 월말값으로 계산됨.

async function priceAt(
  instrumentId: number,
  endTs: number,
): Promise<{ price: number; currency: string } | null> {
  const row = await db
    .select()
    .from(schema.priceSnapshots)
    .where(
      and(
        // 해당 시점 이전(포함)
        lte(schema.priceSnapshots.ts, endTs),
      ),
    )
    .orderBy(desc(schema.priceSnapshots.ts))
    .limit(50);
  const snap = row.find((r) => r.instrumentId === instrumentId);
  if (!snap) return null;
  return {
    price: fromAmountUnit(snap.price, snap.currency),
    currency: snap.currency,
  };
}

async function fxAt(
  base: string,
  quote: string,
  endTs: number,
): Promise<number> {
  if (base.toUpperCase() === quote.toUpperCase()) return 1;
  const row = await db
    .select()
    .from(schema.fxRates)
    .where(lte(schema.fxRates.ts, endTs))
    .orderBy(desc(schema.fxRates.ts))
    .limit(50);
  const snap = row.find(
    (r) =>
      r.base.toUpperCase() === base.toUpperCase() &&
      r.quote.toUpperCase() === quote.toUpperCase(),
  );
  return snap ? fromFxUnit(snap.rate) : 1;
}

export async function getValueSeries(): Promise<RevenuePoint[]> {
  const [instruments, txns] = await Promise.all([
    db.select().from(schema.instruments),
    db.select().from(schema.transactions),
  ]);

  const now = new Date();
  const points: RevenuePoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const endTs = Math.floor(d.getTime() / 1000);
    let totalKrw = 0;

    // 자산별 누적 수량 * 시점 시세
    const qtyByIns = new Map<number, number>();
    for (const t of txns) {
      if (t.ts > endTs) continue;
      if (!t.instrumentId) continue;
      if (t.type === "buy") {
        qtyByIns.set(
          t.instrumentId,
          (qtyByIns.get(t.instrumentId) ?? 0) + fromQtyUnit(t.quantity ?? 0),
        );
      } else if (t.type === "sell") {
        qtyByIns.set(
          t.instrumentId,
          (qtyByIns.get(t.instrumentId) ?? 0) - fromQtyUnit(t.quantity ?? 0),
        );
      }
    }
    for (const [id, q] of qtyByIns) {
      if (q <= 0) continue;
      const ins = instruments.find((x) => x.id === id);
      if (!ins) continue;
      const p = await priceAt(id, endTs);
      if (!p) continue;
      const fx = await fxAt(ins.currency, "KRW", endTs);
      totalKrw += q * p.price * fx;
    }

    // 현금 잔고 (월말 시점 환율 기준)
    for (const t of txns) {
      if (t.ts > endTs) continue;
      const fx = await fxAt(t.currency, "KRW", endTs);
      totalKrw += fromAmountUnit(t.amount, t.currency) * fx;
    }

    // 현금은 위 루프에서 instrumentId=null인 거래 포함.
    // buy/sell은 보유 계산과 겹칠 수 있어 빼야 함 — buy는 음수 amount로 cash에서 이미 차감됨 OK.

    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({ month, revenue: Math.max(0, Math.round(totalKrw)) });
  }

  return points;
}

