type SparkProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function Spark({ data, width = 64, height = 18, color = "#2F4A3A" }: SparkProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => height - ((v - min) / range) * height;
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}
