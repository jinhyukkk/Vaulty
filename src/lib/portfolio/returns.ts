import "server-only";

import { asc } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { fromAmountUnit, fromFxUnit, fromQtyUnit } from "@/lib/money";

export type DailyPoint = { date: string; value: number; netCf: number };
export type TwrSeries = { date: string; twr: number; cumulative: number };

// 일별 포트폴리오 가치·순현금흐름 시계열.
// 입력 거래와 (일별) 시세·환율을 바탕으로 거래 첫 날부터 오늘까지 산출.
export async function getDailySeries(): Promise<DailyPoint[]> {
  const [instruments, txns, prices, fxs] = await Promise.all([
    db.select().from(schema.instruments),
    db.select().from(schema.transactions).orderBy(asc(schema.transactions.ts)),
    db.select().from(schema.priceSnapshots).orderBy(asc(schema.priceSnapshots.ts)),
    db.select().from(schema.fxRates).orderBy(asc(schema.fxRates.ts)),
  ]);
  if (txns.length === 0) return [];

  const DAY = 86400;
  const startDay = Math.floor(txns[0].ts / DAY) * DAY;
  const endDay = Math.floor(Date.now() / 1000 / DAY) * DAY;

  // 인덱싱: 일자별 마지막 시세·환율 추적을 위해 forward-fill
  const priceByIns = new Map<number, Array<{ ts: number; price: number; currency: string }>>();
  for (const p of prices) {
    const arr = priceByIns.get(p.instrumentId) ?? [];
    arr.push({
      ts: p.ts,
      price: fromAmountUnit(p.price, p.currency),
      currency: p.currency,
    });
    priceByIns.set(p.instrumentId, arr);
  }
  const fxByKey = new Map<string, Array<{ ts: number; rate: number }>>();
  for (const f of fxs) {
    const key = `${f.base.toUpperCase()}->${f.quote.toUpperCase()}`;
    const arr = fxByKey.get(key) ?? [];
    arr.push({ ts: f.ts, rate: fromFxUnit(f.rate) });
    fxByKey.set(key, arr);
  }

  function findLatest<T extends { ts: number }>(
    arr: T[] | undefined,
    upto: number,
  ): T | null {
    if (!arr || arr.length === 0) return null;
    let lo = 0;
    let hi = arr.length - 1;
    let ans: T | null = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].ts <= upto) {
        ans = arr[mid];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  function fxKrw(cur: string, ts: number): number {
    if (cur.toUpperCase() === "KRW") return 1;
    const key = `${cur.toUpperCase()}->KRW`;
    return findLatest(fxByKey.get(key), ts)?.rate ?? 1;
  }

  // 거래를 시간순으로 누적하며 일 단위로 이벤트 처리
  const qtyByIns = new Map<number, number>();
  let cashKrw = 0;
  let netCfToday = 0;
  let txIdx = 0;

  const points: DailyPoint[] = [];

  for (let t = startDay; t <= endDay; t += DAY) {
    const dayEnd = t + DAY - 1;
    netCfToday = 0;

    while (txIdx < txns.length && txns[txIdx].ts <= dayEnd) {
      const tx = txns[txIdx];
      const fx = fxKrw(tx.currency, tx.ts);
      const amountKrw = fromAmountUnit(tx.amount, tx.currency) * fx;
      cashKrw += amountKrw;

      // 수량 업데이트
      if (tx.instrumentId !== null) {
        if (tx.type === "buy") {
          qtyByIns.set(
            tx.instrumentId,
            (qtyByIns.get(tx.instrumentId) ?? 0) + fromQtyUnit(tx.quantity ?? 0),
          );
        } else if (tx.type === "sell") {
          qtyByIns.set(
            tx.instrumentId,
            (qtyByIns.get(tx.instrumentId) ?? 0) - fromQtyUnit(tx.quantity ?? 0),
          );
        }
      }

      // 외부 자금 유출입만 TWR의 CF 로 집계 (deposit/withdraw)
      if (tx.type === "deposit" || tx.type === "withdraw") {
        netCfToday += amountKrw;
      }
      txIdx++;
    }

    // 일말 포트폴리오 시장가치 계산
    let holdingsKrw = 0;
    for (const [id, q] of qtyByIns) {
      if (q <= 0) continue;
      const ins = instruments.find((x) => x.id === id);
      if (!ins) continue;
      const p = findLatest(priceByIns.get(id), dayEnd);
      if (!p) continue;
      const fx = fxKrw(ins.currency, dayEnd);
      holdingsKrw += q * p.price * fx;
    }

    const total = holdingsKrw + cashKrw;
    const iso = new Date(t * 1000).toISOString().slice(0, 10);
    points.push({ date: iso, value: total, netCf: netCfToday });
  }

  return points;
}

// 시간가중수익률 (modified Dietz 근사 — 일별 연결)
//   r_i = (V_i_end - CF_i) / V_i_start - 1
//   TWR = Π(1 + r_i) - 1
// 여기서 CF_i 는 당일 발생한 외부 현금흐름.
export function computeTwrSeries(points: DailyPoint[]): TwrSeries[] {
  const out: TwrSeries[] = [];
  let cum = 1;
  let prevValue: number | null = null;
  for (const p of points) {
    if (prevValue === null || prevValue <= 0) {
      prevValue = p.value;
      out.push({ date: p.date, twr: 0, cumulative: 0 });
      continue;
    }
    const r = prevValue > 0 ? (p.value - p.netCf) / prevValue - 1 : 0;
    cum *= 1 + r;
    out.push({ date: p.date, twr: r, cumulative: cum - 1 });
    prevValue = p.value;
  }
  return out;
}

// 최대낙폭 (MDD)
export function computeMdd(points: DailyPoint[]): number {
  let peak = 0;
  let mdd = 0;
  for (const p of points) {
    if (p.value > peak) peak = p.value;
    if (peak > 0) {
      const dd = (p.value - peak) / peak;
      if (dd < mdd) mdd = dd;
    }
  }
  return mdd;
}

// 연환산 변동성 (일별 수익률 기반)
export function computeAnnualVol(twr: TwrSeries[]): number {
  const rs = twr.slice(1).map((x) => x.twr);
  if (rs.length < 2) return 0;
  const mean = rs.reduce((s, v) => s + v, 0) / rs.length;
  const variance =
    rs.reduce((s, v) => s + (v - mean) ** 2, 0) / (rs.length - 1);
  const sigma = Math.sqrt(variance);
  return sigma * Math.sqrt(252);
}

// 샤프 — 무위험 연이자 기본 3.5%
export function computeSharpe(
  twr: TwrSeries[],
  riskFreeAnnual = 0.035,
): number | null {
  const rs = twr.slice(1).map((x) => x.twr);
  if (rs.length < 2) return null;
  const mean = rs.reduce((s, v) => s + v, 0) / rs.length;
  const annualReturn = mean * 252;
  const vol = computeAnnualVol(twr);
  if (vol === 0) return null;
  return (annualReturn - riskFreeAnnual) / vol;
}
