import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { KpiSection } from "@/components/blocks/KpiSection";
import { PortfolioValueSection } from "@/components/blocks/PortfolioValueSection";
import { AllocationSection } from "@/components/blocks/AllocationSection";
import {
  KpiSectionSkeleton,
  ChartSkeleton,
} from "@/components/blocks/skeletons";

export default function Home() {
  return (
    <>
      <Header title="대시보드" />
      <section className="flex-1 space-y-6 px-6 py-6">
        <Suspense fallback={<KpiSectionSkeleton />}>
          <KpiSection />
        </Suspense>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<ChartSkeleton />}>
              <PortfolioValueSection />
            </Suspense>
          </div>
          <Suspense fallback={<ChartSkeleton />}>
            <AllocationSection />
          </Suspense>
        </div>
      </section>
    </>
  );
}
