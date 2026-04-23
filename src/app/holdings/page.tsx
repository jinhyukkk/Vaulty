import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { AssetsPage } from "@/components/blocks/AssetsPage";
import { ChartSkeleton } from "@/components/blocks/skeletons";
import {
  getAllocation,
  getHoldings,
  getHoldingsByAccount,
  getTotalValueKrw,
} from "@/lib/data";
import { CashManagement } from "@/components/blocks/CashManagement";

async function AssetsSection() {
  const [holdings, allocation, totalValueKrw, accountHoldings] =
    await Promise.all([
      getHoldings({ includeHistory: true }),
      getAllocation(),
      getTotalValueKrw(),
      getHoldingsByAccount(),
    ]);
  return (
    <div className="flex flex-col gap-3">
      <AssetsPage
        holdings={holdings}
        allocation={allocation}
        totalValueKrw={totalValueKrw}
      />
      <CashManagement accounts={accountHoldings} />
    </div>
  );
}

export default function HoldingsPage() {
  return (
    <>
      <Header title="자산" subtitle="ASSETS · HOLDINGS" />
      <section className="flex-1 overflow-auto p-4">
        <Suspense fallback={<ChartSkeleton />}>
          <AssetsSection />
        </Suspense>
      </section>
    </>
  );
}
