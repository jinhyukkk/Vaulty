"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";
import {
  AvailableChartColors,
  getColorClassName,
  type AvailableChartColorsKeys,
} from "@/lib/chartUtils";
import { krwCompact } from "@/lib/format";

type AllocationRow = {
  assetClass: string;
  label: string;
  valueKrw: number;
  ratio: number;
};

const PALETTE: AvailableChartColorsKeys[] = AvailableChartColors.slice(0, 5);

export function AllocationChart({ data }: { data: AllocationRow[] }) {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
        자산군 비중
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">현재 기준</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="valueKrw"
                nameKey="label"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    className={getColorClassName(
                      PALETTE[i % PALETTE.length],
                      "fill",
                    )}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid rgb(229 231 235)",
                  fontSize: 12,
                }}
                formatter={(v: number) => krwCompact(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2">
          {data.map((row, i) => (
            <li
              key={row.assetClass}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block size-2.5 rounded-full ${getColorClassName(
                    PALETTE[i % PALETTE.length],
                    "bg",
                  )}`}
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {row.label}
                </span>
              </span>
              <span className="tabular-nums text-gray-900 dark:text-gray-50">
                {(row.ratio * 100).toFixed(1)}% · {krwCompact(row.valueKrw)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
