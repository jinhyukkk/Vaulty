"use client";

import { useState } from "react";
import { PerfChart } from "@/components/charts/PerfChart";
import { krwCompact } from "@/lib/format";

type RevenuePoint = { month: string; revenue: number };

const RANGES: { key: string; months: number }[] = [
  { key: "1M", months: 1 },
  { key: "3M", months: 3 },
  { key: "6M", months: 6 },
  { key: "1Y", months: 12 },
  { key: "ALL", months: 999 },
];

export function PortfolioValueChart({ data }: { data: RevenuePoint[] }) {
  const [range, setRange] = useState("3M");

  const months = RANGES.find((r) => r.key === range)?.months ?? 3;
  const sliced = data.slice(Math.max(0, data.length - months - 1));
  const series = sliced.map((p) => p.revenue);
  const labels = sliced.map((p) => p.month);

  const first = series[0] ?? 0;
  const last = series.at(-1) ?? 0;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const mom =
    data.length >= 2
      ? ((last - data[data.length - 2].revenue) /
          (data[data.length - 2].revenue || 1)) *
        100
      : 0;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const maxDd =
    max > 0
      ? ((Math.min(...series.map((_, i, arr) => {
          const peak = Math.max(...arr.slice(0, i + 1));
          return arr[i] - peak;
        })) /
          max) *
          100) *
        -1 *
        -1
      : 0;

  const stats: [string, string, string][] = [
    [
      range,
      `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
      changePct >= 0 ? "text-vaulty-up" : "text-vaulty-down",
    ],
    [
      "MoM",
      `${mom >= 0 ? "+" : ""}${mom.toFixed(2)}%`,
      mom >= 0 ? "text-vaulty-up" : "text-vaulty-down",
    ],
    ["PEAK", krwCompact(max), "text-vaulty-ink"],
    ["TROUGH", krwCompact(min), "text-vaulty-ink"],
    [
      "MAX DD",
      `${maxDd.toFixed(1)}%`,
      "text-vaulty-down",
    ],
  ];

  return (
    <div className="rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px]">
      <div className="mb-3.5 flex items-baseline justify-between border-b border-vaulty-lineSoft pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[16px] font-medium tracking-[-0.2px] text-vaulty-ink">
            포트폴리오 성과
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            PERFORMANCE · {range}
          </div>
        </div>
        <div className="flex gap-0 rounded-vault bg-vaulty-surfaceAlt p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 font-mono text-[10px] tracking-[1px] transition-colors ${
                range === r.key
                  ? "bg-vaulty-surface text-vaulty-ink shadow-sm"
                  : "text-vaulty-inkMuted"
              }`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>
      <PerfChart
        series={series}
        labels={labels}
        height={200}
        color="#2F4A3A"
        formatValue={krwCompact}
      />
      <div className="mt-3.5 flex gap-1 border-t border-vaulty-lineSoft pt-3">
        {stats.map(([label, value, color], i) => (
          <div
            key={label}
            className={`flex-1 px-2.5 py-1 ${
              i < stats.length - 1 ? "border-r border-vaulty-lineSoft" : ""
            }`}
          >
            <div className="font-mono text-[9px] tracking-[1px] text-vaulty-inkMuted">
              {label}
            </div>
            <div className={`mt-0.5 font-mono text-[13px] font-medium ${color}`}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
