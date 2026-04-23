"use client";

import { DonutChart, type DonutDatum } from "@/components/charts/DonutChart";
import { StackBar } from "@/components/charts/StackBar";
import { krwCompact } from "@/lib/format";

type AllocationRow = {
  assetClass: string;
  label: string;
  valueKrw: number;
  ratio: number;
};

const CLASS_COLORS: Record<string, string> = {
  kr_equity: "#2F4A3A",
  us_equity: "#8C6A3E",
  crypto: "#4A3A2A",
  cash: "#C9BFA6",
};
const FALLBACK_COLORS = ["#2F4A3A", "#8C6A3E", "#B8925A", "#6B7F6F", "#4A3A2A", "#C9BFA6"];

export function AllocationChart({ data }: { data: AllocationRow[] }) {
  const donutData: DonutDatum[] = data.map((row, i) => ({
    key: row.assetClass,
    label: row.label,
    pct: row.ratio * 100,
    color: CLASS_COLORS[row.assetClass] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div className="rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px]">
      <div className="mb-3.5 flex items-baseline justify-between border-b border-vaulty-lineSoft pb-2.5">
        <div className="flex items-baseline gap-2.5">
          <div className="font-serif text-[16px] font-medium tracking-[-0.2px] text-vaulty-ink">
            자산 배분
          </div>
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            ALLOCATION
          </div>
        </div>
      </div>
      <div className="my-1 flex justify-center pb-3.5">
        <DonutChart data={donutData} size={150} stroke={20} />
      </div>
      <StackBar data={donutData} height={6} />
      <div className="mt-3">
        {donutData.map((a, i) => (
          <div
            key={a.key}
            className="flex items-center gap-2 py-[5px] text-[11px]"
          >
            <span
              className="h-2 w-2 shrink-0"
              style={{ background: a.color, borderRadius: 1 }}
            />
            <span className="flex-1 text-vaulty-inkSoft">{a.label}</span>
            <span className="font-mono text-[10px] text-vaulty-inkMuted">
              {krwCompact(data[i].valueKrw)}
            </span>
            <span className="min-w-[42px] text-right font-mono font-medium text-vaulty-ink tabular-nums">
              {a.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
