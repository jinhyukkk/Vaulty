import { cx } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className,
      )}
    />
  );
}
