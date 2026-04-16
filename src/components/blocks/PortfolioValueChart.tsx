"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { getColorClassName } from "@/lib/chartUtils";
import { krw, krwCompact } from "@/lib/format";

type RevenuePoint = { month: string; revenue: number };

export function PortfolioValueChart({ data }: { data: RevenuePoint[] }) {
  const strokeClass = getColorClassName("blue", "stroke");
  const fillClass = getColorClassName("blue", "fill");

  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
        포트폴리오 가치 추이
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">최근 12개월</p>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" className={fillClass} stopOpacity={0.3} />
                <stop offset="95%" className={fillClass} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-800"
            />
            <XAxis
              dataKey="month"
              className="fill-gray-500 text-xs dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="fill-gray-500 text-xs dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => krwCompact(v)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgb(229 231 235)",
                fontSize: 12,
              }}
              formatter={(value: number) => [krw(value), "총 자산"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              strokeWidth={2}
              className={strokeClass}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
