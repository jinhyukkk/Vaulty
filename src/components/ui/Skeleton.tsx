import { cx } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-vault bg-vaulty-surfaceAlt",
        className,
      )}
    />
  );
}
