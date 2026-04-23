"use client";

import { useId, useRef, useState } from "react";

type PerfChartProps = {
  series: number[];
  bench?: number[];
  width?: number;
  height?: number;
  color?: string;
  showBench?: boolean;
  labels?: string[];
  formatValue?: (v: number) => string;
};

export function PerfChart({
  series,
  bench,
  width = 600,
  height = 200,
  color = "#2F4A3A",
  showBench = true,
  labels,
  formatValue,
}: PerfChartProps) {
  const primary = color;
  const all = [...series, ...(bench ?? [])];
  const min = Math.min(...all) * 0.98;
  const max = Math.max(...all) * 1.02;
  const xStep = width / Math.max(1, series.length - 1);
  const toY = (v: number) => height - ((v - min) / (max - min || 1)) * height;
  const pathLine = series
    .map((v, i) => `${i === 0 ? "M" : "L"}${i * xStep},${toY(v)}`)
    .join(" ");
  const pathArea = pathLine + ` L${width},${height} L0,${height} Z`;
  const benchPath = bench
    ? bench
        .map((v, i) => `${i === 0 ? "M" : "L"}${i * xStep},${toY(v)}`)
        .join(" ")
    : "";

  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.min(
      series.length - 1,
      Math.max(0, Math.round((x / rect.width) * (series.length - 1))),
    );
    setHover(i);
  };

  const reactId = useId();
  const gradId = `perf-grad-${reactId.replace(/:/g, "")}`;
  const fmt =
    formatValue ??
    ((v: number) =>
      v.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block", cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.22" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            y1={height * f}
            x2={width}
            y2={height * f}
            stroke="#E8E2D1"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}
        <path d={pathArea} fill={`url(#${gradId})`} />
        {showBench && bench && (
          <path
            d={benchPath}
            fill="none"
            stroke="#8B8270"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        )}
        <path
          d={pathLine}
          fill="none"
          stroke={primary}
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && (
          <g>
            <line
              x1={hover * xStep}
              y1="0"
              x2={hover * xStep}
              y2={height}
              stroke="#1C1A15"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <circle
              cx={hover * xStep}
              cy={toY(series[hover])}
              r="4"
              fill="#FBF8F1"
              stroke={primary}
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute rounded-vault border border-vaulty-line bg-vaulty-surface px-2.5 py-1.5 font-mono text-[11px] text-vaulty-ink"
          style={{
            left: `${(hover / Math.max(1, series.length - 1)) * 100}%`,
            top: 8,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          {labels && labels[hover] ? `${labels[hover]} · ` : ""}
          {fmt(series[hover])}
          {bench && bench[hover] !== undefined && (
            <span className="ml-2 text-vaulty-inkMuted">
              vs {fmt(bench[hover])}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
