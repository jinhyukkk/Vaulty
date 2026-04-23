"use client";

import { useState } from "react";
import { krwCompact, signedPct } from "@/lib/format";
import type { AccountHoldings } from "@/lib/portfolio/types";

type Props = {
  accounts: AccountHoldings[];
};

const KIND_LABEL: Record<string, string> = {
  brokerage: "증권",
  bank: "은행",
  exchange: "거래소",
  wallet: "월렛",
};

const KIND_COLORS: Record<string, string> = {
  brokerage: "#2F4A3A",
  bank: "#6B7F6F",
  exchange: "#8C6A3E",
  wallet: "#4A3A2A",
};

const fmtLocalNum = (v: number) =>
  v.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export function CashManagement({ accounts }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    accounts[0]?.accountId ?? null,
  );
  const selected = accounts.find((a) => a.accountId === selectedId) ?? accounts[0];

  const grandTotal = accounts.reduce((s, a) => s + a.totalKrw, 0);
  const totalCash = accounts.reduce((s, a) => s + a.cashKrw, 0);
  const totalEquity = accounts.reduce((s, a) => s + a.equityKrw, 0);
  const totalPnL = accounts.reduce((s, a) => s + a.pnlKrw, 0);
  const totalPositions = accounts.reduce((s, a) => s + a.holdings.length, 0);

  if (!selected || accounts.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-vault border border-vaulty-line bg-vaulty-surface">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-vaulty-lineSoft px-5 py-4">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[17px] font-medium tracking-[-0.2px] text-vaulty-ink">
            계좌 · 포지션 관리
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            ACCOUNTS · LINKED POSITIONS
          </div>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 border-b border-vaulty-lineSoft md:grid-cols-4">
        {(
          [
            [
              "총 자산",
              "TOTAL",
              krwCompact(grandTotal),
              "text-vaulty-ink",
              `${accounts.length}개 계좌 · ${totalPositions}종목`,
            ],
            [
              "주식 평가액",
              "EQUITY",
              krwCompact(totalEquity),
              "text-vaulty-accent",
              `${grandTotal > 0 ? ((totalEquity / grandTotal) * 100).toFixed(1) : 0}% 비중`,
            ],
            [
              "예수금",
              "CASH",
              krwCompact(totalCash),
              "text-vaulty-bronze",
              `${grandTotal > 0 ? ((totalCash / grandTotal) * 100).toFixed(1) : 0}% 비중`,
            ],
            [
              "평가 손익",
              "P&L",
              (totalPnL >= 0 ? "+" : "") + krwCompact(totalPnL),
              totalPnL >= 0 ? "text-vaulty-up" : "text-vaulty-down",
              "전체 누적",
            ],
          ] as const
        ).map(([label, en, v, cls, sub], i) => (
          <div
            key={label}
            className={`px-5 py-4 ${
              i < 3 ? "md:border-r md:border-vaulty-lineSoft" : ""
            }`}
          >
            <div className="mb-1 flex items-baseline justify-between">
              <div className="font-serif text-[12px] font-medium text-vaulty-inkSoft">
                {label}
              </div>
              <div className="font-mono text-[8px] tracking-[1.5px] text-vaulty-inkMuted">
                {en}
              </div>
            </div>
            <div
              className={`font-serif text-[22px] font-medium leading-tight tracking-[-0.4px] ${cls}`}
            >
              {v}
            </div>
            <div className="mt-1 font-mono text-[10px] text-vaulty-inkMuted">
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Account list + detail split */}
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.3fr]">
        {/* Left: account list */}
        <div className="md:border-r md:border-vaulty-lineSoft">
          <div className="flex items-center justify-between border-b border-vaulty-lineSoft bg-vaulty-surfaceAlt px-5 py-2.5">
            <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
              ACCOUNTS · {accounts.length}
            </div>
          </div>
          {accounts.map((a) => {
            const isSel = selectedId === a.accountId;
            const cashPct = a.totalKrw > 0 ? (a.cashKrw / a.totalKrw) * 100 : 0;
            const equityPct = 100 - cashPct;
            const color = KIND_COLORS[a.accountKind] ?? "#6B7F6F";
            return (
              <div
                key={a.accountId}
                onClick={() => setSelectedId(a.accountId)}
                className={`cursor-pointer border-b border-vaulty-lineSoft px-5 py-3.5 transition-colors ${
                  isSel
                    ? "bg-vaulty-accentSoft"
                    : "hover:bg-vaulty-surfaceAlt"
                }`}
                style={{
                  borderLeft: isSel
                    ? `3px solid #2F4A3A`
                    : "3px solid transparent",
                }}
              >
                <div className="mb-2.5 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-vault font-serif text-[13px] font-semibold text-white"
                    style={{ background: color }}
                  >
                    {a.accountName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <div className="font-serif text-[14px] font-medium text-vaulty-ink">
                        {a.accountName}
                      </div>
                      <div
                        className="rounded-sm px-1.5 py-[2px] font-mono text-[8px] tracking-[1px]"
                        style={{ color, background: color + "18" }}
                      >
                        {KIND_LABEL[a.accountKind] ?? a.accountKind}
                      </div>
                      {a.currency !== "KRW" && (
                        <div className="rounded-sm border border-vaulty-bronzeSoft px-1 py-[1px] font-mono text-[8px] tracking-[1px] text-vaulty-bronze">
                          {a.currency}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-vaulty-inkMuted">
                      {a.holdings.length > 0
                        ? `${a.holdings.length}종목 보유`
                        : "보유 종목 없음"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[14px] font-medium text-vaulty-ink">
                      {krwCompact(a.totalKrw)}
                    </div>
                    {a.holdings.length > 0 && (
                      <div
                        className={`mt-0.5 font-mono text-[10px] ${
                          a.pnlKrw >= 0 ? "text-vaulty-up" : "text-vaulty-down"
                        }`}
                      >
                        {signedPct(a.pnlRatio)} ·{" "}
                        {a.pnlKrw >= 0 ? "+" : ""}
                        {krwCompact(a.pnlKrw)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Composition bar */}
                <div>
                  <div className="flex h-[5px] overflow-hidden rounded-sm bg-vaulty-lineSoft">
                    {a.equityKrw > 0 && (
                      <div
                        style={{ width: `${equityPct}%`, background: color }}
                      />
                    )}
                    <div
                      className="bg-vaulty-bronzeSoft"
                      style={{ width: `${cashPct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[9px] text-vaulty-inkMuted">
                    <span>주식 {krwCompact(a.equityKrw)}</span>
                    <span>현금 {krwCompact(a.cashKrw)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: selected account detail */}
        <div className="flex flex-col bg-vaulty-surface">
          <div className="flex items-center gap-3 border-b border-vaulty-lineSoft px-5 py-3.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-vault font-serif text-[15px] font-semibold text-white"
              style={{
                background: KIND_COLORS[selected.accountKind] ?? "#6B7F6F",
              }}
            >
              {selected.accountName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[16px] font-medium text-vaulty-ink">
                {selected.accountName} ·{" "}
                {KIND_LABEL[selected.accountKind] ?? selected.accountKind}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-vaulty-inkMuted">
                {selected.currency} 기준 {selected.holdings.length}종목
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 border-b border-vaulty-lineSoft">
            {(
              [
                ["계좌 총액", krwCompact(selected.totalKrw), "text-vaulty-ink"],
                ["주식 평가", krwCompact(selected.equityKrw), "text-vaulty-accent"],
                ["예수금", krwCompact(selected.cashKrw), "text-vaulty-bronze"],
                [
                  "손익",
                  selected.holdings.length > 0
                    ? signedPct(selected.pnlRatio)
                    : "—",
                  selected.pnlKrw >= 0 ? "text-vaulty-up" : "text-vaulty-down",
                ],
              ] as const
            ).map(([label, v, cls], i) => (
              <div
                key={label}
                className={`px-4 py-2.5 ${
                  i < 3 ? "border-r border-vaulty-lineSoft" : ""
                }`}
              >
                <div className="mb-0.5 font-mono text-[9px] tracking-[1px] text-vaulty-inkMuted">
                  {label}
                </div>
                <div className={`font-mono text-[13px] font-medium ${cls}`}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* Linked holdings */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between bg-vaulty-surfaceAlt px-5 py-2.5">
              <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
                LINKED HOLDINGS · {selected.holdings.length}
              </div>
            </div>
            {selected.holdings.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mb-1.5 font-serif text-[14px] italic text-vaulty-inkMuted">
                  보유 종목이 없습니다
                </div>
                <div className="font-mono text-[10px] text-vaulty-inkMuted">
                  이 계좌로 첫 매수를 시작해보세요
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {selected.holdings.map((h, i) => {
                    const weight =
                      selected.totalKrw > 0
                        ? (h.marketValueKrw / selected.totalKrw) * 100
                        : 0;
                    const pnlPositive = h.unrealizedPnlKrw >= 0;
                    const pnlClass = pnlPositive
                      ? "text-vaulty-up"
                      : "text-vaulty-down";
                    return (
                      <tr
                        key={h.symbol}
                        className={`transition-colors hover:bg-vaulty-surfaceAlt ${
                          i < selected.holdings.length - 1
                            ? "border-b border-vaulty-lineSoft"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-vault bg-vaulty-accentSoft font-serif text-[11px] font-semibold text-vaulty-accent">
                              {h.symbol.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[12.5px] font-medium text-vaulty-ink">
                                {h.name}
                              </div>
                              <div className="font-mono text-[9.5px] text-vaulty-inkMuted">
                                {h.symbol} ·{" "}
                                {h.quantity < 1
                                  ? h.quantity.toFixed(4)
                                  : fmtLocalNum(Math.round(h.quantity))}주
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="font-mono text-[12px] font-medium text-vaulty-ink">
                            {krwCompact(h.marketValueKrw)}
                          </div>
                          <div className="font-mono text-[10px] text-vaulty-inkMuted">
                            계좌 내 {weight.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div
                            className={`font-mono text-[12px] font-medium ${pnlClass}`}
                          >
                            {h.returnRatio !== null
                              ? signedPct(h.returnRatio)
                              : "—"}
                          </div>
                          <div
                            className={`font-mono text-[10px] opacity-75 ${pnlClass}`}
                          >
                            {pnlPositive ? "+" : ""}
                            {krwCompact(h.unrealizedPnlKrw)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
