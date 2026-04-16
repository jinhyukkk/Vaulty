import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/utils";
import { krw, krwCompact, qty as qtyFmt, signedPct } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";

const assetClassLabel: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <Card className="p-0">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          보유 현황
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2">자산</th>
              <th className="px-4 py-2">자산군</th>
              <th className="px-4 py-2 text-right">수량</th>
              <th className="px-4 py-2 text-right">평균 단가</th>
              <th className="px-4 py-2 text-right">현재가</th>
              <th className="px-4 py-2 text-right">평가액(KRW)</th>
              <th className="px-4 py-2 text-right">손익(KRW)</th>
              <th className="px-4 py-2 text-right">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {holdings.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  보유 자산이 없습니다. 거래 내역에서 매수 기록을 추가하세요.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const pnlClass =
                  h.unrealizedPnlKrw >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400";
                return (
                  <tr key={`${h.symbol}-${h.assetClass}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {h.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {h.symbol}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {assetClassLabel[h.assetClass] ?? h.assetClass}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {qtyFmt(h.quantity, h.assetClass)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {h.currency === "KRW"
                        ? krw(h.avgCost)
                        : `${h.currency} ${h.avgCost.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {h.currentPrice === null
                        ? "-"
                        : h.currency === "KRW"
                          ? krw(h.currentPrice)
                          : `${h.currency} ${h.currentPrice.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-50">
                      {krwCompact(h.marketValueKrw)}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-3 text-right tabular-nums font-medium",
                        pnlClass,
                      )}
                    >
                      {krwCompact(h.unrealizedPnlKrw)}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-3 text-right tabular-nums font-medium",
                        pnlClass,
                      )}
                    >
                      {h.returnRatio === null ? "-" : signedPct(h.returnRatio)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
