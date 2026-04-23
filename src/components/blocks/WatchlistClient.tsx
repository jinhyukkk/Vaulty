"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WatchlistRow } from "@/lib/portfolio/watchlist";

type AddableInstrument = {
  id: number;
  symbol: string;
  name: string;
  assetClass: string;
};

type Props = {
  rows: WatchlistRow[];
  addable: AddableInstrument[];
};

const fmtPrice = (v: number, currency: string) => {
  if (currency === "KRW")
    return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  return (
    "$" +
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
const fmtPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

export function WatchlistClient({ rows, addable }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState<string>("");

  const add = () => {
    if (!pick) return;
    startTransition(async () => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instrumentId: Number(pick) }),
      });
      if (res.ok) {
        setPick("");
        setAdding(false);
        router.refresh();
      }
    });
  };

  const remove = (id: number) => {
    startTransition(async () => {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <div className="rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px]">
      <div className="mb-3.5 flex items-baseline justify-between border-b border-vaulty-lineSoft pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[16px] font-medium text-vaulty-ink">
            워치리스트
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            WATCHLIST
          </div>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="border-none bg-transparent p-0 text-[14px] text-vaulty-accent hover:opacity-70"
          aria-label="관심 종목 추가"
        >
          {adding ? "×" : "+"}
        </button>
      </div>

      {adding && (
        <div className="mb-3 flex gap-2 border-b border-vaulty-lineSoft pb-3">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="flex-1 rounded-vault border border-vaulty-line bg-vaulty-surface px-2 py-1 text-[11px] text-vaulty-ink outline-none"
          >
            <option value="">-- 종목 선택 --</option>
            {addable.map((i) => (
              <option key={i.id} value={i.id}>
                {i.symbol} · {i.name}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={!pick || pending}
            className="rounded-vault bg-vaulty-accent px-3 py-1 font-mono text-[10px] text-vaulty-surface disabled:opacity-50"
          >
            추가
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="py-6 text-center font-mono text-[10px] text-vaulty-inkMuted">
          추적 중인 종목이 없습니다
        </div>
      ) : (
        rows.map((w, i) => (
          <div
            key={w.id}
            className={`group flex items-center justify-between py-1.5 ${
              i < rows.length - 1 ? "border-b border-vaulty-lineSoft" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="font-mono text-[11px] font-medium text-vaulty-ink">
                  {w.symbol}
                </div>
                <button
                  onClick={() => remove(w.id)}
                  disabled={pending}
                  className="hidden border-none bg-transparent p-0 text-[11px] leading-none text-vaulty-inkMuted hover:text-vaulty-down group-hover:inline"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
              <div className="truncate text-[9.5px] text-vaulty-inkMuted">
                {w.name}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-[11px] text-vaulty-ink">
                {w.price !== null ? fmtPrice(w.price, w.currency) : "—"}
              </div>
              <div
                className={`font-mono text-[10px] ${
                  w.changePct === null
                    ? "text-vaulty-inkMuted"
                    : w.changePct >= 0
                      ? "text-vaulty-up"
                      : "text-vaulty-down"
                }`}
              >
                {w.changePct !== null ? fmtPct(w.changePct) : "—"}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
