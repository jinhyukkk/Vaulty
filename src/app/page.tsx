import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { TickerStrip } from "@/components/layout/TickerStrip";
import { KpiSection } from "@/components/blocks/KpiSection";
import { PortfolioValueSection } from "@/components/blocks/PortfolioValueSection";
import { AllocationSection } from "@/components/blocks/AllocationSection";
import { HoldingsPreview } from "@/components/blocks/HoldingsPreview";
import { WatchlistBlock } from "@/components/blocks/WatchlistBlock";
import { NewsBlock } from "@/components/blocks/NewsBlock";
import {
  KpiSectionSkeleton,
  ChartSkeleton,
} from "@/components/blocks/skeletons";

export default function Home() {
  return (
    <>
      <Header title="대시보드" subtitle="DASHBOARD · OVERVIEW" />
      <Suspense fallback={null}>
        <TickerStrip />
      </Suspense>
      <main className="flex-1 space-y-3 overflow-auto p-4">
        <Suspense fallback={<KpiSectionSkeleton />}>
          <KpiSection />
        </Suspense>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <PortfolioValueSection />
            </Suspense>
          </div>
          <Suspense fallback={<ChartSkeleton />}>
            <AllocationSection />
          </Suspense>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <HoldingsPreview />
            </Suspense>
          </div>
          <div className="flex flex-col gap-3">
            <Suspense fallback={<ChartSkeleton />}>
              <NewsBlock />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <WatchlistBlock />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
