import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { HoldingsTable } from "@/components/blocks/HoldingsTable";
import { TableSkeleton } from "@/components/blocks/skeletons";
import { getHoldings } from "@/lib/data";

async function HoldingsSection() {
  const holdings = await getHoldings();
  return <HoldingsTable holdings={holdings} />;
}

export default function HoldingsPage() {
  return (
    <>
      <Header title="보유 현황" />
      <section className="flex-1 px-6 py-6">
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <HoldingsSection />
        </Suspense>
      </section>
    </>
  );
}
