"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cx, focusInput } from "@/lib/utils";

type AssetClass = "kr_equity" | "us_equity" | "crypto" | "cash";

const LABELS: Record<AssetClass, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export function TargetEditor({
  initial,
}: {
  initial: Record<AssetClass, number>; // percent (0~100)
}) {
  const [values, setValues] = useState<Record<AssetClass, number>>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const sum =
    values.kr_equity + values.us_equity + values.crypto + values.cash;

  const onChange = (k: AssetClass, v: string) => {
    setSaved(false);
    const num = Number(v);
    setValues((prev) => ({ ...prev, [k]: Number.isNaN(num) ? 0 : num }));
  };

  const onSave = () => {
    if (Math.abs(sum - 100) > 0.01) {
      setError(`합계가 100%여야 합니다. 현재 ${sum.toFixed(1)}%`);
      return;
    }
    setError(null);
    const targets = (Object.keys(LABELS) as AssetClass[]).map((k) => ({
      assetClass: k,
      targetBps: Math.round(values[k] * 100),
    }));
    startTransition(async () => {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targets }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "저장 실패");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  const inputBase = cx(
    "mt-1 block w-full rounded-md border-gray-300 bg-white text-right text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            목표 비중
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            자산군별 목표 비중을 설정하면 아래 제안 테이블에 편차가 표시됩니다.
          </p>
        </div>
        <div
          className={cx(
            "text-sm font-semibold tabular-nums",
            Math.abs(sum - 100) < 0.01
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        >
          합계 {sum.toFixed(1)}%
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(LABELS) as AssetClass[]).map((k) => (
          <label key={k} className="text-sm">
            <span className="text-gray-700 dark:text-gray-300">{LABELS[k]}</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={values[k]}
                onChange={(e) => onChange(k, e.target.value)}
                className={cx(inputBase, "pr-7")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                %
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {error && (
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
        )}
        {saved && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            저장됨
          </span>
        )}
        <Button onClick={onSave} disabled={pending}>
          {pending ? "저장 중..." : "목표 저장"}
        </Button>
      </div>
    </Card>
  );
}
