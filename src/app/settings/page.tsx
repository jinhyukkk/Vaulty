import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { NewAccountDialog } from "@/components/blocks/NewAccountDialog";
import { NewInstrumentDialog } from "@/components/blocks/NewInstrumentDialog";
import { getAccounts, getInstruments } from "@/lib/data";

const kindLabel: Record<string, string> = {
  brokerage: "증권",
  bank: "은행",
  exchange: "거래소",
  wallet: "월렛",
};

const assetClassLabel: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export default async function SettingsPage() {
  const [accounts, instruments] = await Promise.all([
    getAccounts(),
    getInstruments(),
  ]);

  return (
    <>
      <Header title="설정" />
      <section className="flex-1 space-y-6 px-6 py-6">
        <Card className="max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                계좌
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                증권·은행·거래소·월렛 단위로 관리합니다.
              </p>
            </div>
            <NewAccountDialog />
          </div>
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
            {accounts.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                등록된 계좌가 없습니다.
              </li>
            ) : (
              accounts.map((acc) => (
                <li
                  key={acc.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-50">
                      {acc.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {kindLabel[acc.kind] ?? acc.kind} · {acc.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                      #{acc.id}
                    </span>
                    <DeleteButton
                      url={`/api/accounts/${acc.id}`}
                      confirmMessage={`계좌 "${acc.name}"을 삭제하시겠습니까?`}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                자산 마스터
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                거래 가능한 종목을 등록하면 시세 갱신에 자동 포함됩니다.
              </p>
            </div>
            <NewInstrumentDialog />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">심볼</th>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">자산군</th>
                  <th className="px-3 py-2">통화</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {instruments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      등록된 자산이 없습니다.
                    </td>
                  </tr>
                ) : (
                  instruments.map((ins) => (
                    <tr key={ins.id}>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-50">
                        {ins.symbol}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {ins.name}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        {assetClassLabel[ins.assetClass] ?? ins.assetClass}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        {ins.currency}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        {ins.provider} · {ins.providerSymbol}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <DeleteButton
                          url={`/api/instruments/${ins.id}`}
                          confirmMessage={`자산 "${ins.name}"을 삭제하시겠습니까?`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}
