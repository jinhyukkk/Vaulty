import { getHoldings } from "@/lib/data";
import { krwCompact, signedPct } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  kr_equity: "KR",
  us_equity: "US",
  crypto: "CR",
  cash: "$",
};

export async function HoldingsPreview() {
  const holdings = await getHoldings();

  return (
    <div className="overflow-hidden rounded-vault border border-vaulty-line bg-vaulty-surface">
      <div className="flex items-baseline justify-between border-b border-vaulty-lineSoft px-[18px] py-3.5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[16px] font-medium text-vaulty-ink">
            보유 종목
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            {holdings.length} POSITIONS
          </div>
        </div>
        <a
          href="/holdings"
          className="font-mono text-[10px] text-vaulty-inkMuted hover:text-vaulty-ink"
        >
          전체 보기 →
        </a>
      </div>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-vaulty-surfaceAlt">
            {["종목 · NAME", "수량", "현재가", "평가금액", "손익 %"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-3.5 py-2 font-mono text-[9px] font-medium tracking-[1px] text-vaulty-inkMuted ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {holdings.slice(0, 10).map((h) => {
            const pnlPositive = (h.unrealizedPnlKrw ?? 0) >= 0;
            const pnlColor = pnlPositive ? "text-vaulty-up" : "text-vaulty-down";
            return (
              <tr
                key={h.instrumentId ?? h.symbol}
                className="border-b border-vaulty-lineSoft transition-colors hover:bg-vaulty-surfaceAlt"
              >
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-vault bg-vaulty-bronzeSoft font-mono text-[9px] font-semibold tracking-[0.5px] text-vaulty-bronze"
                    >
                      {TYPE_LABEL[h.assetClass] ?? h.assetClass.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-vaulty-ink">
                        {h.name}
                      </div>
                      <div className="font-mono text-[9px] text-vaulty-inkMuted">
                        {h.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-[11px] text-vaulty-inkSoft">
                  {h.quantity < 1
                    ? h.quantity.toFixed(4)
                    : Math.round(h.quantity).toLocaleString()}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-[11px] text-vaulty-ink">
                  {h.currentPrice !== null
                    ? h.currency === "KRW"
                      ? h.currentPrice.toLocaleString("ko-KR", {
                          maximumFractionDigits: 0,
                        })
                      : "$" +
                        h.currentPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                    : "—"}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono text-[11px] font-medium text-vaulty-ink">
                  {krwCompact(h.marketValueKrw)}
                </td>
                <td className="px-3.5 py-2.5 text-right">
                  <div
                    className={`font-mono text-[11px] font-medium ${pnlColor}`}
                  >
                    {h.returnRatio !== null ? signedPct(h.returnRatio) : "—"}
                  </div>
                  <div className={`font-mono text-[9.5px] opacity-75 ${pnlColor}`}>
                    {pnlPositive ? "+" : ""}
                    {krwCompact(h.unrealizedPnlKrw)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
