import "server-only";

import { krwCompact, signedPct } from "@/lib/format";

import { getAllocation, getHoldings, getTotalValueKrw } from "./holdings";
import { getValueSeries } from "./timeSeries";
import type { Kpi } from "./types";

export async function getKpis(): Promise<Kpi[]> {
  const [total, holdings, series, allocation] = await Promise.all([
    getTotalValueKrw(),
    getHoldings(),
    getValueSeries(),
    getAllocation(),
  ]);

  const unrealized = holdings.reduce((s, h) => s + h.unrealizedPnlKrw, 0);
  const costBasis = holdings.reduce((s, h) => s + h.costBasisKrw, 0);
  const returnRatio = costBasis > 0 ? unrealized / costBasis : 0;

  const prevMonth = series.at(-2)?.revenue ?? total;
  const mtdChange = prevMonth > 0 ? total / prevMonth - 1 : 0;

  const jan = series[0]?.revenue ?? total;
  const ytdChange = jan > 0 ? total / jan - 1 : 0;

  const cashRow = allocation.find((a) => a.assetClass === "cash");
  const cashRatio = cashRow?.ratio ?? 0;

  const spark = series.map((p) => p.revenue);

  return [
    {
      title: "총 자산",
      subtitle: "TOTAL ASSETS",
      value: krwCompact(total),
      change: `${holdings.length}개 보유 종목`,
      changeType: "neutral",
      spark,
    },
    {
      title: "미실현 손익",
      subtitle: "UNREALIZED P&L",
      value: krwCompact(unrealized),
      change: `${signedPct(returnRatio)} 수익률`,
      changeType: unrealized >= 0 ? "positive" : "negative",
      spark,
    },
    {
      title: "MTD",
      subtitle: "MONTH-TO-DATE",
      value: signedPct(mtdChange),
      change: "전월 대비",
      changeType: mtdChange >= 0 ? "positive" : "negative",
      spark: spark.slice(-3),
    },
    {
      title: "YTD",
      subtitle: "YEAR-TO-DATE",
      value: signedPct(ytdChange),
      change: `현금 비중 ${(cashRatio * 100).toFixed(1)}%`,
      changeType: ytdChange >= 0 ? "positive" : "negative",
      spark,
    },
  ];
}
