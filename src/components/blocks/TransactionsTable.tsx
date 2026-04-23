import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { TransactionDialog } from "@/components/blocks/TransactionDialog";
import { cx } from "@/lib/utils";
import { date, qty as qtyFmt } from "@/lib/format";
import { fromAmountUnit, fromQtyUnit } from "@/lib/money";
import type { TransactionRow } from "@/lib/data";

type Account = { id: number; name: string; currency: string };
type Instrument = {
  id: number;
  name: string;
  symbol: string;
  currency: string;
};

const typeLabel: Record<string, string> = {
  buy: "매수",
  sell: "매도",
  dividend: "배당",
  interest: "이자",
  fee: "수수료",
  tax: "세금",
  deposit: "입금",
  withdraw: "출금",
  fx: "환전",
};

const typeClass: Record<string, string> = {
  buy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sell: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  dividend:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  deposit:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  withdraw:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function TransactionsTable({
  rows,
  accounts,
  instruments,
}: {
  rows: TransactionRow[];
  accounts: Account[];
  instruments: Instrument[];
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          거래 로그
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-4 py-2">일시</th>
              <th className="px-4 py-2">타입</th>
              <th className="px-4 py-2">자산</th>
              <th className="px-4 py-2">계좌</th>
              <th className="px-4 py-2 text-right">수량</th>
              <th className="px-4 py-2 text-right">단가</th>
              <th className="px-4 py-2 text-right">금액</th>
              <th className="px-4 py-2">메모</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  거래가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 tabular-nums">{date(r.ts)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        typeClass[r.type] ??
                          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                      )}
                    >
                      {typeLabel[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-50">
                    {r.instrumentName ?? "-"}
                    {r.instrumentSymbol ? (
                      <span className="ml-1 text-xs text-gray-500">
                        ({r.instrumentSymbol})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {r.accountName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.quantity === null
                      ? "-"
                      : qtyFmt(fromQtyUnit(r.quantity), r.assetClass ?? undefined)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.price === null
                      ? "-"
                      : `${r.currency} ${fromAmountUnit(
                          r.price,
                          r.currency,
                        ).toLocaleString("ko-KR")}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {`${r.currency} ${fromAmountUnit(
                      r.amount,
                      r.currency,
                    ).toLocaleString("ko-KR")}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {r.note ?? ""}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TransactionDialog
                        mode="edit"
                        accounts={accounts}
                        instruments={instruments}
                        initial={{
                          id: r.id,
                          accountId: (accounts.find((a) => a.name === r.accountName)?.id ?? 0) as unknown as number,
                          instrumentId:
                            instruments.find((i) => i.symbol === r.instrumentSymbol)
                              ?.id ?? null,
                          type: r.type as never,
                          ts: date(r.ts),
                          quantity:
                            r.quantity === null
                              ? null
                              : (fromQtyUnit(r.quantity) as unknown as number),
                          price:
                            r.price === null
                              ? null
                              : (fromAmountUnit(
                                  r.price,
                                  r.currency,
                                ) as unknown as number),
                          amount: Math.abs(
                            fromAmountUnit(r.amount, r.currency),
                          ) as unknown as number,
                          currency: r.currency,
                          note: r.note ?? "",
                        }}
                      />
                      <DeleteButton
                        url={`/api/transactions/${r.id}`}
                        confirmMessage="이 거래를 삭제하시겠습니까?"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
