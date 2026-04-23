import { Spark } from "@/components/charts/Spark";
import { cx } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  subtitle?: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  spark?: number[];
};

export function KpiCard({
  title,
  subtitle,
  value,
  change,
  changeType,
  spark,
}: KpiCardProps) {
  const changeColor =
    changeType === "positive"
      ? "#2F6B4F"
      : changeType === "negative"
        ? "#A83A2C"
        : "#8C6A3E";
  const changeClass =
    changeType === "positive"
      ? "text-vaulty-up"
      : changeType === "negative"
        ? "text-vaulty-down"
        : "text-vaulty-bronze";

  return (
    <div className="relative overflow-hidden rounded-vault border border-vaulty-line bg-vaulty-surface p-[18px]">
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="font-serif text-[13px] font-medium text-vaulty-ink">
          {title}
        </div>
        {subtitle && (
          <div className="font-mono text-[9px] tracking-[1.5px] text-vaulty-inkMuted">
            {subtitle}
          </div>
        )}
      </div>
      <div className="font-serif text-[26px] font-medium leading-tight tracking-[-0.5px] text-vaulty-ink tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <div className={cx("font-mono text-[10px]", changeClass)}>{change}</div>
        {spark && spark.length > 1 && (
          <Spark data={spark} width={64} height={18} color={changeColor} />
        )}
      </div>
    </div>
  );
}
