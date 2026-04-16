import "server-only";

import { db, schema } from "@/db/client";

import { getAllocation, getHoldings, getTotalValueKrw } from "./holdings";
import { estimateTax } from "./tax";

export type RebalanceRow = {
  assetClass: string;
  label: string;
  targetRatio: number;
  currentRatio: number;
  currentKrw: number;
  targetKrw: number;
  deltaKrw: number; // 양수 = 매수 필요, 음수 = 매도
  sellTaxKrw: number;
  buyFeeKrw: number;
  netDeltaKrw: number;
  taxNote: string;
};

export type InstrumentRebalanceRow = {
  instrumentId: number;
  symbol: string;
  name: string;
  assetClass: string;
  targetRatioInClass: number;
  currentRatioInClass: number;
  currentKrw: number;
  targetKrw: number;
  deltaKrw: number;
  sellTaxKrw: number;
  buyFeeKrw: number;
  netDeltaKrw: number;
};

const labelMap: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export async function getRebalancePlan(): Promise<{
  total: number;
  classRows: RebalanceRow[];
  instrumentRows: InstrumentRebalanceRow[];
  targetsDefined: boolean;
}> {
  const [allocation, total, classTargets, instrumentTargets, holdings] =
    await Promise.all([
      getAllocation(),
      getTotalValueKrw(),
      db.select().from(schema.targetAllocations),
      db.select().from(schema.targetInstruments),
      getHoldings(),
    ]);

  const classByName = new Map<string, { ratio: number; valueKrw: number }>();
  for (const a of allocation) {
    classByName.set(a.assetClass, { ratio: a.ratio, valueKrw: a.valueKrw });
  }

  const classSet = new Set<string>([
    ...classTargets.map((t) => t.assetClass),
    ...allocation.map((a) => a.assetClass),
    "kr_equity",
    "us_equity",
    "crypto",
    "cash",
  ]);

  // 자산군별 평균 수익률 (세금 추정용)
  const avgGainByClass = new Map<string, number>();
  for (const h of holdings) {
    const arr = avgGainByClass.get(h.assetClass) ?? 0;
    avgGainByClass.set(
      h.assetClass,
      arr + (h.returnRatio ?? 0) * h.marketValueKrw,
    );
  }
  const classValueSum = new Map<string, number>();
  for (const h of holdings) {
    classValueSum.set(
      h.assetClass,
      (classValueSum.get(h.assetClass) ?? 0) + h.marketValueKrw,
    );
  }

  const classRows: RebalanceRow[] = [];
  for (const cls of classSet) {
    const target = classTargets.find((t) => t.assetClass === cls);
    const targetRatio = target ? target.targetBps / 10000 : 0;
    const current = classByName.get(cls) ?? { ratio: 0, valueKrw: 0 };
    const targetKrw = total * targetRatio;
    const deltaKrw = targetKrw - current.valueKrw;

    const sumValue = classValueSum.get(cls) ?? 0;
    const avgGainWeighted = avgGainByClass.get(cls) ?? 0;
    const avgGainRatio = sumValue > 0 ? avgGainWeighted / sumValue : 0;

    const tax = estimateTax(cls, deltaKrw, avgGainRatio);
    const taxNote =
      cls === "kr_equity"
        ? "거래세 0.18%, 양도세 비과세(대주주 제외)"
        : cls === "us_equity"
          ? "양도세 22% (250만원 공제 미반영)"
          : cls === "crypto"
            ? "2026 비과세, 거래 수수료 0.05%"
            : "세금·수수료 없음";

    classRows.push({
      assetClass: cls,
      label: labelMap[cls] ?? cls,
      targetRatio,
      currentRatio: current.ratio,
      currentKrw: current.valueKrw,
      targetKrw,
      deltaKrw,
      sellTaxKrw: tax.sellTaxKrw,
      buyFeeKrw: tax.buyFeeKrw,
      netDeltaKrw: tax.netDeltaKrw,
      taxNote,
    });
  }
  classRows.sort((a, b) => b.targetRatio - a.targetRatio);

  // 종목 단위 제안: 자산군의 targetKrw 내에서 인스트루먼트 목표 비중 적용
  const instrumentRows: InstrumentRebalanceRow[] = [];
  const classTargetByClass = new Map(
    classRows.map((r) => [r.assetClass, r.targetKrw]),
  );

  const instrumentCurrent = new Map<number, (typeof holdings)[number]>();
  for (const h of holdings) {
    if (h.instrumentId !== null) instrumentCurrent.set(h.instrumentId, h);
  }

  const targetsByClass = new Map<string, typeof instrumentTargets>();
  for (const t of instrumentTargets) {
    const h = instrumentCurrent.get(t.instrumentId);
    const klass = h?.assetClass;
    if (!klass) continue;
    const arr = targetsByClass.get(klass) ?? [];
    arr.push(t);
    targetsByClass.set(klass, arr);
  }

  for (const cls of classSet) {
    const classTargetKrw = classTargetByClass.get(cls) ?? 0;
    const targetsInClass = targetsByClass.get(cls) ?? [];

    for (const tInst of targetsInClass) {
      const ratio = tInst.targetBpsInClass / 10000;
      const targetKrw = classTargetKrw * ratio;

      const h = instrumentCurrent.get(tInst.instrumentId);
      if (!h) continue;
      const currentKrw = h.marketValueKrw;
      const deltaKrw = targetKrw - currentKrw;
      const currentClassKrw = classValueSum.get(cls) ?? 0;
      const currentRatioInClass =
        currentClassKrw > 0 ? currentKrw / currentClassKrw : 0;
      const tax = estimateTax(cls, deltaKrw, h.returnRatio ?? 0);

      instrumentRows.push({
        instrumentId: tInst.instrumentId,
        symbol: h.symbol,
        name: h.name,
        assetClass: cls,
        targetRatioInClass: ratio,
        currentRatioInClass,
        currentKrw,
        targetKrw,
        deltaKrw,
        sellTaxKrw: tax.sellTaxKrw,
        buyFeeKrw: tax.buyFeeKrw,
        netDeltaKrw: tax.netDeltaKrw,
      });
    }
  }

  instrumentRows.sort((a, b) => b.targetRatioInClass - a.targetRatioInClass);

  return {
    total,
    classRows,
    instrumentRows,
    targetsDefined: classTargets.length > 0,
  };
}

export async function getTargets() {
  return db.select().from(schema.targetAllocations);
}

export async function getInstrumentTargets() {
  return db.select().from(schema.targetInstruments);
}
