"use client";

import { useMemo, useState } from "react";
import { Spark } from "@/components/charts/Spark";
import { StackBar } from "@/components/charts/StackBar";
import { krwCompact, signedPct } from "@/lib/format";
import type { Holding } from "@/lib/portfolio/types";

type AllocationRow = {
  assetClass: string;
  label: string;
  valueKrw: number;
  ratio: number;
};

type Props = {
  holdings: Holding[];
  allocation: AllocationRow[];
  totalValueKrw: number;
};

const CLASS_LABEL: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

const CLASS_COLORS: Record<string, string> = {
  kr_equity: "#2F4A3A",
  us_equity: "#8C6A3E",
  crypto: "#4A3A2A",
  cash: "#C9BFA6",
};

type FilterKey = "all" | "kr_equity" | "us_equity" | "crypto";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "kr_equity", label: "국내 주식" },
  { key: "us_equity", label: "해외 주식" },
  { key: "crypto", label: "암호화폐" },
];

type SortKey = "name" | "qty" | "avg" | "price" | "value" | "pct";

const fmtLocalNum = (v: number, d = 0) =>
  v.toLocaleString("ko-KR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

export function AssetsPage({ holdings, allocation, totalValueKrw }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "value",
    dir: "desc",
  });
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(false);

  const allocForBar = useMemo(
    () =>
      allocation.map((a) => ({
        key: a.assetClass,
        label: a.label,
        pct: a.ratio * 100,
        color: CLASS_COLORS[a.assetClass] ?? "#6B7F6F",
      })),
    [allocation],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: holdings.length };
    for (const h of holdings) c[h.assetClass] = (c[h.assetClass] ?? 0) + 1;
    return c;
  }, [holdings]);

  const rows = useMemo(() => {
    let r = holdings;
    if (filter !== "all") r = r.filter((h) => h.assetClass === filter);
    if (query) {
      const q = query.toLowerCase();
      r = r.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.symbol.toLowerCase().includes(q),
      );
    }
    const dir = sort.dir === "desc" ? -1 : 1;
    r = [...r].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.key === "qty") return (a.quantity - b.quantity) * dir;
      if (sort.key === "avg") return (a.avgCost - b.avgCost) * dir;
      if (sort.key === "price")
        return ((a.currentPrice ?? 0) - (b.currentPrice ?? 0)) * dir;
      if (sort.key === "pct")
        return ((a.returnRatio ?? 0) - (b.returnRatio ?? 0)) * dir;
      return (a.marketValueKrw - b.marketValueKrw) * dir;
    });
    return r;
  }, [holdings, filter, query, sort]);

  const totalValue = rows.reduce((s, h) => s + h.marketValueKrw, 0);
  const totalPnL = rows.reduce((s, h) => s + h.unrealizedPnlKrw, 0);
  const totalCost = totalValue - totalPnL;
  const totalPct = totalCost > 0 ? totalPnL / totalCost : 0;

  const groups = group
    ? FILTERS.slice(1)
        .map((f) => ({
          key: f.key,
          label: f.label,
          items: rows.filter((r) => r.assetClass === f.key),
        }))
        .filter((g) => g.items.length > 0)
    : null;

  const sortBtn = (key: SortKey, label: string, align: "left" | "right" = "right") => {
    const active = sort.key === key;
    return (
      <button
        onClick={() =>
          setSort({ key, dir: active && sort.dir === "desc" ? "asc" : "desc" })
        }
        className={`inline-flex items-center gap-1 border-none bg-transparent p-0 font-mono text-[9px] font-medium tracking-[1px] ${
          active ? "text-vaulty-ink" : "text-vaulty-inkMuted"
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        <span className={`text-[8px] ${active ? "opacity-100" : "opacity-40"}`}>
          {active ? (sort.dir === "desc" ? "▼" : "▲") : "⇅"}
        </span>
      </button>
    );
  };

  const pane = "rounded-vault border border-vaulty-line bg-vaulty-surface";

  return (
    <div className="flex flex-col gap-3">
      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className={`${pane} p-5`}>
          <div className="mb-1.5 font-mono text-[9px] tracking-[2px] text-vaulty-inkMuted">
            FILTERED TOTAL ·{" "}
            {filter === "all"
              ? "전체 자산"
              : FILTERS.find((f) => f.key === filter)?.label}
          </div>
          <div className="font-serif text-[32px] font-medium leading-none tracking-[-0.8px] text-vaulty-ink">
            {krwCompact(totalValue)}
          </div>
          <div className="mt-2.5 flex gap-3.5 font-mono text-[11px]">
            <span
              className={`font-medium ${
                totalPnL >= 0 ? "text-vaulty-up" : "text-vaulty-down"
              }`}
            >
              {totalPnL >= 0 ? "▲" : "▼"} {signedPct(totalPct)}
            </span>
            <span
              className={`${
                totalPnL >= 0 ? "text-vaulty-up" : "text-vaulty-down"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {krwCompact(totalPnL)}
            </span>
            <span className="text-vaulty-inkMuted">
              {rows.length} / {holdings.length} 종목
            </span>
          </div>
        </div>
        {(
          [
            ["투자원금", "COST BASIS", krwCompact(totalCost), "text-vaulty-ink"],
            [
              "평균 수익률",
              "AVG RETURN",
              signedPct(totalPct),
              totalPct >= 0 ? "text-vaulty-up" : "text-vaulty-down",
            ],
            [
              "최대 비중",
              "TOP WEIGHT",
              rows[0]
                ? (
                    (rows[0].marketValueKrw / Math.max(1, totalValueKrw)) *
                    100
                  ).toFixed(1) + "%"
                : "—",
              "text-vaulty-bronze",
            ],
          ] as const
        ).map(([label, en, v, cls], i) => (
          <div key={label} className={`${pane} p-5`}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="font-serif text-[13px] font-medium text-vaulty-ink">
                {label}
              </div>
              <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
                {en}
              </div>
            </div>
            <div
              className={`font-serif text-[26px] font-medium leading-tight tracking-[-0.5px] tabular-nums ${cls}`}
            >
              {v}
            </div>
            {i === 2 && rows[0] && (
              <div className="mt-1 font-mono text-[10px] text-vaulty-inkMuted">
                {rows[0].name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Asset class summary */}
      <div className={`${pane} p-[18px]`}>
        <div className="mb-3.5 flex items-center justify-between border-b border-vaulty-lineSoft pb-2.5">
          <div className="flex items-baseline gap-2.5">
            <div className="font-serif text-[16px] font-medium text-vaulty-ink">
              자산군 요약
            </div>
            <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
              BY ASSET CLASS
            </div>
          </div>
          <div className="w-[220px]">
            <StackBar data={allocForBar} height={5} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {allocation.map((a) => {
            const items = holdings.filter((h) => h.assetClass === a.assetClass);
            const pnlSum = items.reduce((s, h) => s + h.unrealizedPnlKrw, 0);
            const costSum = items.reduce(
              (s, h) => s + (h.marketValueKrw - h.unrealizedPnlKrw),
              0,
            );
            const pct = costSum > 0 ? (pnlSum / costSum) * 100 : 0;
            const clickable =
              items.length > 0 && a.assetClass in CLASS_LABEL && a.assetClass !== "cash";
            return (
              <button
                key={a.assetClass}
                onClick={() => {
                  if (clickable) setFilter(a.assetClass as FilterKey);
                }}
                disabled={!clickable}
                className="border border-vaulty-lineSoft bg-transparent p-3 text-left transition-colors hover:bg-vaulty-surfaceAlt disabled:cursor-default disabled:hover:bg-transparent"
                style={{
                  borderLeft: `3px solid ${CLASS_COLORS[a.assetClass] ?? "#6B7F6F"}`,
                }}
              >
                <div className="mb-1 flex items-baseline justify-between">
                  <div className="font-serif text-[13px] font-medium text-vaulty-ink">
                    {a.label}
                  </div>
                  <div className="font-mono text-[10px] font-medium text-vaulty-inkMuted">
                    {(a.ratio * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="font-mono text-[13px] font-medium text-vaulty-ink">
                  {krwCompact(a.valueKrw)}
                </div>
                {items.length > 0 ? (
                  <div
                    className={`mt-1 font-mono text-[10px] ${
                      pct >= 0 ? "text-vaulty-up" : "text-vaulty-down"
                    }`}
                  >
                    {(pct >= 0 ? "+" : "") + pct.toFixed(2)}% · {items.length}종목
                  </div>
                ) : (
                  <div className="mt-1 font-mono text-[10px] text-vaulty-inkMuted">
                    {a.assetClass === "cash" ? "현금 잔고" : "보유 없음"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className={`${pane} flex flex-wrap items-center gap-3 px-4 py-3`}>
        <div className="flex gap-0 rounded-vault bg-vaulty-surfaceAlt p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-vault px-3 py-1.5 text-[12px] transition-colors ${
                filter === f.key
                  ? "bg-vaulty-surface font-medium text-vaulty-ink shadow-sm"
                  : "text-vaulty-inkMuted"
              }`}
            >
              {f.label}
              <span
                className={`rounded-sm px-1.5 py-[1px] font-mono text-[9px] ${
                  filter === f.key
                    ? "bg-vaulty-surfaceAlt text-vaulty-inkMuted"
                    : "text-vaulty-inkMuted"
                }`}
              >
                {counts[f.key === "all" ? "all" : f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 rounded-vault border border-vaulty-line bg-vaulty-surfaceAlt px-2.5 py-1.5 md:w-[240px]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B8270" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목 검색…"
            className="flex-1 border-none bg-transparent text-[12px] text-vaulty-ink outline-none placeholder:text-vaulty-inkMuted"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-vaulty-inkSoft">
          <input
            type="checkbox"
            checked={group}
            onChange={(e) => setGroup(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          자산군별 그룹
        </label>
      </div>

      {/* Holdings table */}
      <div className={`${pane} overflow-hidden`}>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-vaulty-line bg-vaulty-surfaceAlt">
              <th className="px-4 py-2.5 text-left">{sortBtn("name", "종목 · NAME", "left")}</th>
              <th className="w-[100px] px-3.5 py-2.5 text-left">
                <span className="font-mono text-[9px] font-medium tracking-[1px] text-vaulty-inkMuted">
                  자산군
                </span>
              </th>
              <th className="px-3.5 py-2.5 text-right">{sortBtn("qty", "수량")}</th>
              <th className="px-3.5 py-2.5 text-right">{sortBtn("avg", "평균가")}</th>
              <th className="px-3.5 py-2.5 text-right">{sortBtn("price", "현재가")}</th>
              <th className="px-3.5 py-2.5 text-right">{sortBtn("value", "평가금액")}</th>
              <th className="px-3.5 py-2.5 text-right">{sortBtn("pct", "수익률")}</th>
              <th className="w-[90px] px-3.5 py-2.5 text-right">
                <span className="font-mono text-[9px] font-medium tracking-[1px] text-vaulty-inkMuted">
                  비중
                </span>
              </th>
              <th className="w-[110px] px-3.5 py-2.5 text-right">
                <span className="font-mono text-[9px] font-medium tracking-[1px] text-vaulty-inkMuted">
                  30D 추세
                </span>
              </th>
            </tr>
          </thead>
          {group && groups ? (
            groups.map((g) => (
              <tbody key={g.key}>
                <tr className="bg-vaulty-surfaceAlt">
                  <td
                    colSpan={9}
                    className="border-y border-vaulty-line px-4 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="font-serif text-[13px] font-medium text-vaulty-ink">
                        {g.label}
                      </div>
                      <div className="font-mono text-[10px] text-vaulty-inkMuted">
                        {g.items.length} 종목 ·{" "}
                        {krwCompact(
                          g.items.reduce((s, h) => s + h.marketValueKrw, 0),
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                {g.items.map((h) => (
                  <AssetRow key={h.symbol} h={h} totalValueKrw={totalValueKrw} />
                ))}
              </tbody>
            ))
          ) : (
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-10 text-center font-serif text-[14px] italic text-vaulty-inkMuted"
                  >
                    검색 결과가 없습니다
                  </td>
                </tr>
              ) : (
                rows.map((h) => (
                  <AssetRow key={h.symbol} h={h} totalValueKrw={totalValueKrw} />
                ))
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );

  function AssetRow({
    h,
    totalValueKrw,
  }: {
    h: Holding;
    totalValueKrw: number;
  }) {
    const weight = (h.marketValueKrw / Math.max(1, totalValueKrw)) * 100;
    const weightColor = weight > 15 ? "bg-vaulty-bronze" : "bg-vaulty-inkSoft";
    const weightTextColor =
      weight > 15 ? "text-vaulty-bronze" : "text-vaulty-inkSoft";
    const pnlPositive = h.unrealizedPnlKrw >= 0;
    const pnlClass = pnlPositive ? "text-vaulty-up" : "text-vaulty-down";
    const ticker = h.symbol.slice(0, 2).toUpperCase();

    return (
      <tr className="border-b border-vaulty-lineSoft transition-colors hover:bg-vaulty-surfaceAlt">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-vault bg-vaulty-accentSoft font-serif text-[13px] font-semibold text-vaulty-accent">
              {ticker}
            </div>
            <div>
              <div className="text-[13px] font-medium text-vaulty-ink">
                {h.name}
              </div>
              <div className="font-mono text-[10px] tracking-[0.5px] text-vaulty-inkMuted">
                {h.symbol}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3.5 py-3">
          <span
            className="rounded-sm px-1.5 py-[3px] font-mono text-[9px] tracking-[1px] text-vaulty-bronze"
            style={{ background: "#EADFCB" }}
          >
            {CLASS_LABEL[h.assetClass] ?? h.assetClass}
          </span>
        </td>
        <td className="px-3.5 py-3 text-right font-mono text-[12px] text-vaulty-inkSoft">
          {h.quantity < 1
            ? h.quantity.toFixed(4)
            : fmtLocalNum(Math.round(h.quantity))}
        </td>
        <td className="px-3.5 py-3 text-right font-mono text-[12px] text-vaulty-inkMuted">
          {h.currency === "KRW"
            ? fmtLocalNum(h.avgCost)
            : "$" + h.avgCost.toFixed(2)}
        </td>
        <td className="px-3.5 py-3 text-right font-mono text-[12px] font-medium text-vaulty-ink">
          {h.currentPrice === null
            ? "—"
            : h.currency === "KRW"
              ? fmtLocalNum(h.currentPrice)
              : "$" + h.currentPrice.toFixed(2)}
        </td>
        <td className="px-3.5 py-3 text-right font-mono text-[12px] font-medium text-vaulty-ink">
          {krwCompact(h.marketValueKrw)}
        </td>
        <td className="px-3.5 py-3 text-right">
          <div className={`font-mono text-[12px] font-medium ${pnlClass}`}>
            {h.returnRatio === null ? "—" : signedPct(h.returnRatio)}
          </div>
          <div className={`font-mono text-[10px] opacity-75 ${pnlClass}`}>
            {pnlPositive ? "+" : ""}
            {krwCompact(h.unrealizedPnlKrw)}
          </div>
        </td>
        <td className="px-3.5 py-3 text-right">
          <div className="inline-flex flex-col items-end gap-1">
            <div
              className={`font-mono text-[11px] font-medium ${weightTextColor}`}
            >
              {weight.toFixed(2)}%
            </div>
            <div className="h-[3px] w-[50px] overflow-hidden rounded-sm bg-vaulty-lineSoft">
              <div
                className={`h-full ${weightColor}`}
                style={{ width: `${Math.min(100, weight * 3)}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-3.5 py-3 text-right">
          {h.priceHistory && h.priceHistory.length > 1 ? (
            <div className="inline-block">
              <Spark
                data={h.priceHistory}
                width={96}
                height={24}
                color={pnlPositive ? "#2F6B4F" : "#A83A2C"}
              />
            </div>
          ) : (
            <span className="font-mono text-[10px] text-vaulty-inkMuted">—</span>
          )}
        </td>
      </tr>
    );
  }
}
