import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/utils";
import { krwCompact } from "@/lib/format";
import type {
  InstrumentRebalanceRow,
  RebalanceRow,
} from "@/lib/portfolio/rebalance";

function actionOf(delta: number) {
  if (Math.abs(delta) < 10000) return { label: "유지", cls: "text-gray-500 dark:text-gray-400" };
  if (delta > 0) return { label: "매수", cls: "text-emerald-600 dark:text-emerald-400" };
  return { label: "매도", cls: "text-red-600 dark:text-red-400" };
}

export function RebalanceTable({
  rows,
  targetsDefined,
}: {
  rows: RebalanceRow[];
  targetsDefined: boolean;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          자산군 리밸런싱 제안
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {targetsDefined
            ? "목표 대비 매수/매도가 필요한 금액과 예상 세금/수수료 (KRW)"
            : "목표 비중이 설정되지 않았습니다. 위에서 먼저 저장하세요."}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2">자산군</th>
              <th className="px-4 py-2 text-right">현재</th>
              <th className="px-4 py-2 text-right">목표</th>
              <th className="px-4 py-2 text-right">현재 평가액</th>
              <th className="px-4 py-2 text-right">조정 금액</th>
              <th className="px-4 py-2 text-right">예상 세금/수수료</th>
              <th className="px-4 py-2 text-right">세후 순조정</th>
              <th className="px-4 py-2">행동</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.map((r) => {
              const act = actionOf(r.deltaKrw);
              const cost = r.sellTaxKrw + r.buyFeeKrw;
              return (
                <tr key={r.assetClass}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-50">
                    <div>{r.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {r.taxNote}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(r.currentRatio * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {(r.targetRatio * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {krwCompact(r.currentKrw)}
                  </td>
                  <td
                    className={cx(
                      "px-4 py-3 text-right tabular-nums font-medium",
                      act.cls,
                    )}
                  >
                    {krwCompact(r.deltaKrw)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                    {cost > 0 ? krwCompact(cost) : "-"}
                  </td>
                  <td
                    className={cx(
                      "px-4 py-3 text-right tabular-nums font-medium",
                      act.cls,
                    )}
                  >
                    {krwCompact(r.netDeltaKrw)}
                  </td>
                  <td className={cx("px-4 py-3 font-medium", act.cls)}>
                    {act.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const classLabel: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export function InstrumentRebalanceTable({
  rows,
}: {
  rows: InstrumentRebalanceRow[];
}) {
  if (rows.length === 0) return null;

  const grouped = new Map<string, InstrumentRebalanceRow[]>();
  for (const r of rows) {
    const arr = grouped.get(r.assetClass) ?? [];
    arr.push(r);
    grouped.set(r.assetClass, arr);
  }

  return (
    <Card className="p-0">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          종목 단위 리밸런싱 제안
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          자산군 목표 달성을 위해 종목별 매매 금액 (세후)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2">자산군 / 종목</th>
              <th className="px-4 py-2 text-right">자산군 내 목표</th>
              <th className="px-4 py-2 text-right">현재 평가액</th>
              <th className="px-4 py-2 text-right">조정 금액</th>
              <th className="px-4 py-2 text-right">세후 순조정</th>
              <th className="px-4 py-2">행동</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {Array.from(grouped.entries()).flatMap(([cls, list]) => [
              <tr key={`h-${cls}`} className="bg-gray-50 dark:bg-gray-900/40">
                <td
                  colSpan={6}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400"
                >
                  {classLabel[cls] ?? cls}
                </td>
              </tr>,
              ...list.map((r) => {
                const act = actionOf(r.deltaKrw);
                return (
                  <tr key={r.instrumentId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {r.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {r.symbol}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {(r.targetRatioInClass * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {krwCompact(r.currentKrw)}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-3 text-right tabular-nums font-medium",
                        act.cls,
                      )}
                    >
                      {krwCompact(r.deltaKrw)}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-3 text-right tabular-nums font-medium",
                        act.cls,
                      )}
                    >
                      {krwCompact(r.netDeltaKrw)}
                    </td>
                    <td className={cx("px-4 py-3 font-medium", act.cls)}>
                      {act.label}
                    </td>
                  </tr>
                );
              }),
            ])}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
