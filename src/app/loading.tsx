import { Header } from "@/components/layout/Header";
import {
  KpiSectionSkeleton,
  ChartSkeleton,
} from "@/components/blocks/skeletons";

export default function Loading() {
  return (
    <>
      <Header title="대시보드" />
      <section className="flex-1 px-6 py-6">
        <KpiSectionSkeleton />
        <div className="mt-6">
          <ChartSkeleton />
        </div>
      </section>
    </>
  );
}
