type StackBarProps = {
  data: { key: string; label: string; pct: number; color: string }[];
  height?: number;
  gap?: number;
};

export function StackBar({ data, height = 6, gap = 2 }: StackBarProps) {
  return (
    <div className="flex w-full" style={{ gap, height }}>
      {data.map((d) => (
        <div
          key={d.key}
          title={`${d.label} ${d.pct.toFixed(1)}%`}
          style={{ flex: d.pct, background: d.color, height: "100%" }}
        />
      ))}
    </div>
  );
}
