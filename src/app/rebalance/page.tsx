import { Header } from "@/components/layout/Header";
import { TargetEditor } from "@/components/blocks/TargetEditor";
import { InstrumentTargetEditor } from "@/components/blocks/InstrumentTargetEditor";
import {
  RebalanceTable,
  InstrumentRebalanceTable,
} from "@/components/blocks/RebalanceTable";
import {
  getRebalancePlan,
  getTargets,
  getInstrumentTargets,
} from "@/lib/portfolio/rebalance";
import { getHoldings } from "@/lib/data";

type AssetClass = "kr_equity" | "us_equity" | "crypto" | "cash";

export default async function RebalancePage() {
  const [{ classRows, instrumentRows, targetsDefined }, targets, instTargets, holdings] =
    await Promise.all([
      getRebalancePlan(),
      getTargets(),
      getInstrumentTargets(),
      getHoldings(),
    ]);

  const initialClass: Record<AssetClass, number> = {
    kr_equity: 0,
    us_equity: 0,
    crypto: 0,
    cash: 0,
  };
  for (const t of targets) {
    if (t.assetClass in initialClass) {
      initialClass[t.assetClass as AssetClass] = t.targetBps / 100;
    }
  }

  const initialInstrument: Record<number, number> = {};
  for (const t of instTargets) {
    initialInstrument[t.instrumentId] = t.targetBpsInClass / 100;
  }

  return (
    <>
      <Header title="리밸런싱" subtitle="REBALANCE" />
      <section className="flex-1 space-y-3 overflow-auto p-4">
        <TargetEditor initial={initialClass} />
        <InstrumentTargetEditor
          holdings={holdings}
          initial={initialInstrument}
        />
        <RebalanceTable rows={classRows} targetsDefined={targetsDefined} />
        <InstrumentRebalanceTable rows={instrumentRows} />
      </section>
    </>
  );
}
