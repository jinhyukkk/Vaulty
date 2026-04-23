import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { KpiCard } from "@/components/blocks/KpiCard";
import { TwrChart, type TwrMergedPoint } from "@/components/blocks/TwrChart";
import {
  ChartSkeleton,
  KpiSectionSkeleton,
} from "@/components/blocks/skeletons";
import { signedPct } from "@/lib/format";
import {
  computeAnnualVol,
  computeMdd,
  computeSharpe,
  computeTwrSeries,
  getDailySeries,
} from "@/lib/portfolio/returns";
import { getBenchmarkSeries } from "@/lib/portfolio/benchmark";
import type { AvailableChartColorsKeys } from "@/lib/chartUtils";

async function AnalyticsKpis() {
  const daily = await getDailySeries();
  const twr = computeTwrSeries(daily);
  const lastCum = twr.at(-1)?.cumulative ?? 0;
  const mdd = computeMdd(daily);
  const vol = computeAnnualVol(twr);
  const sharpe = computeSharpe(twr);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="누적 TWR"
        value={signedPct(lastCum)}
        change={`최근 ${daily.length}일`}
        changeType={lastCum >= 0 ? "positive" : "negative"}
      />
      <KpiCard
        title="최대 낙폭 (MDD)"
        value={signedPct(mdd)}
        change="고점 대비"
        changeType={mdd < -0.1 ? "negative" : "neutral"}
      />
      <KpiCard
        title="연변동성"
        value={signedPct(vol)}
        change="일별 수익률 기준"
        changeType="neutral"
      />
      <KpiCard
        title="샤프 비율"
        value={sharpe === null ? "-" : sharpe.toFixed(2)}
        change="무위험 3.5% 가정"
        changeType={sharpe !== null && sharpe >= 1 ? "positive" : "neutral"}
      />
    </div>
  );
}

async function TwrSection() {
  const daily = await getDailySeries();
  const twr = computeTwrSeries(daily);
  const startTs =
    daily.length > 0
      ? Math.floor(new Date(daily[0].date).getTime() / 1000)
      : undefined;

  const [kospi, sp500] = await Promise.all([
    getBenchmarkSeries("KOSPI", startTs),
    getBenchmarkSeries("SP500", startTs),
  ]);

  // merge by date
  const byDate = new Map<string, TwrMergedPoint>();
  for (const t of twr) {
    byDate.set(t.date, { date: t.date, portfolio: t.cumulative });
  }
  for (const k of kospi) {
    const prev = byDate.get(k.date) ?? { date: k.date };
    prev.KOSPI = k.cumulative;
    byDate.set(k.date, prev as TwrMergedPoint);
  }
  for (const s of sp500) {
    const prev = byDate.get(s.date) ?? { date: s.date };
    prev.SP500 = s.cumulative;
    byDate.set(s.date, prev as TwrMergedPoint);
  }

  const merged = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const series: { key: string; label: string; color: AvailableChartColorsKeys }[] = [
    { key: "portfolio", label: "포트폴리오", color: "emerald" },
  ];
  if (kospi.length > 0) series.push({ key: "KOSPI", label: "KOSPI", color: "blue" });
  if (sp500.length > 0) series.push({ key: "SP500", label: "S&P 500", color: "violet" });

  return <TwrChart data={merged} series={series} />;
}

export default function AnalyticsPage() {
  return (
    <>
      <Header title="성과 분석" subtitle="ANALYTICS" />
      <section className="flex-1 space-y-3 overflow-auto p-4">
        <Suspense fallback={<KpiSectionSkeleton />}>
          <AnalyticsKpis />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TwrSection />
        </Suspense>
      </section>
    </>
  );
}
