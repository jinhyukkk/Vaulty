"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { getColorClassName, type AvailableChartColorsKeys } from "@/lib/chartUtils";
import { signedPct } from "@/lib/format";

// merged: [{date, portfolio, KOSPI, SP500, ...}]
export type TwrMergedPoint = { date: string; [key: string]: string | number };

type Series = { key: string; label: string; color: AvailableChartColorsKeys };

export function TwrChart({
  data,
  series,
}: {
  data: TwrMergedPoint[];
  series: Series[];
}) {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
        누적 TWR vs 벤치마크
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        외부 입출금 영향을 제거한 순수 운용 성과와 주요 지수 비교
      </p>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-800"
            />
            <XAxis
              dataKey="date"
              className="fill-gray-500 text-xs dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
              minTickGap={40}
            />
            <YAxis
              className="fill-gray-500 text-xs dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => signedPct(v, 1)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgb(229 231 235)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                signedPct(value),
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                dot={false}
                strokeWidth={2}
                className={getColorClassName(s.color, "stroke")}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
