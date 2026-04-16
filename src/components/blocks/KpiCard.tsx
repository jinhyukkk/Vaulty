import { Card } from "@/components/ui/Card";
import { cx } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
};

export function KpiCard({ title, value, change, changeType }: KpiCardProps) {
  const changeClass =
    changeType === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : changeType === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-gray-500 dark:text-gray-400";

  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
        {value}
      </p>
      <p className={cx("mt-1 text-sm font-medium", changeClass)}>{change}</p>
    </Card>
  );
}
