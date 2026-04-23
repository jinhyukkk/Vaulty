"use client";

import { useState } from "react";

export type DonutDatum = {
  key: string;
  label: string;
  pct: number;
  color: string;
};

type DonutChartProps = {
  data: DonutDatum[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
};

export function DonutChart({
  data,
  size = 150,
  stroke = 20,
  centerLabel = "자산 배분",
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;

  return (
    <svg
      width={size}
      height={size}
      style={{ overflow: "visible", display: "block" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E8E2D1"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const len = (d.pct / 100) * c;
        const off = c - (acc / 100) * c;
        const isHover = hover === i;
        const seg = (
          <circle
            key={d.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={isHover ? stroke + 4 : stroke}
            strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: "stroke-width .2s, opacity .2s",
              opacity: hover !== null && !isHover ? 0.35 : 1,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        );
        acc += d.pct;
        return seg;
      })}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        className="fill-vaulty-inkMuted"
        style={{ fontSize: 10, letterSpacing: 1.5 }}
      >
        TOTAL
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        className="fill-vaulty-ink font-serif"
        style={{ fontSize: 24, fontWeight: 500 }}
      >
        {hover !== null ? `${data[hover].pct.toFixed(1)}%` : "100%"}
      </text>
      <text
        x={cx}
        y={cy + 34}
        textAnchor="middle"
        className="fill-vaulty-inkMuted"
        style={{ fontSize: 10, letterSpacing: 0.5 }}
      >
        {hover !== null ? data[hover].label : centerLabel}
      </text>
    </svg>
  );
}
