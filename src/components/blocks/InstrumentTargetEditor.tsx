"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cx, focusInput } from "@/lib/utils";

type Holding = {
  instrumentId: number | null;
  symbol: string;
  name: string;
  assetClass: string;
};

const classLabel: Record<string, string> = {
  kr_equity: "국내 주식",
  us_equity: "해외 주식",
  crypto: "암호화폐",
  cash: "현금",
};

export function InstrumentTargetEditor({
  holdings,
  initial, // { [instrumentId]: percent 0~100 (자산군 내) }
}: {
  holdings: Holding[];
  initial: Record<number, number>;
}) {
  const [values, setValues] = useState<Record<number, number>>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const byClass = new Map<string, Holding[]>();
  for (const h of holdings) {
    if (!h.instrumentId) continue;
    const arr = byClass.get(h.assetClass) ?? [];
    arr.push(h);
    byClass.set(h.assetClass, arr);
  }

  const sumByClass = new Map<string, number>();
  for (const [cls, list] of byClass) {
    sumByClass.set(
      cls,
      list.reduce((s, h) => s + (values[h.instrumentId as number] ?? 0), 0),
    );
  }

  const onChange = (id: number, v: string) => {
    setSaved(false);
    const num = Number(v);
    setValues((prev) => ({ ...prev, [id]: Number.isNaN(num) ? 0 : num }));
  };

  const onSave = () => {
    for (const [cls, sum] of sumByClass) {
      if (sum !== 0 && Math.abs(sum - 100) > 0.01) {
        setError(
          `${classLabel[cls] ?? cls} 합계가 100%가 아닙니다 (현재 ${sum.toFixed(1)}%)`,
        );
        return;
      }
    }
    setError(null);

    const targets = Object.entries(values).map(([id, p]) => ({
      instrumentId: Number(id),
      targetBpsInClass: Math.round(p * 100),
    }));

    startTransition(async () => {
      const res = await fetch("/api/targets/instruments", {
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
    "block w-20 rounded-md border-gray-300 bg-white text-right text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  if (holdings.filter((h) => h.instrumentId).length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            종목별 목표 비중 (자산군 내)
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            각 자산군 내 합이 100%가 되도록 설정하세요. 비워두면 해당 자산군은
            자동 분배.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {Array.from(byClass.entries()).map(([cls, list]) => {
          const sum = sumByClass.get(cls) ?? 0;
          return (
            <div
              key={cls}
              className="rounded-md border border-gray-200 p-3 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {classLabel[cls] ?? cls}
                </div>
                <div
                  className={cx(
                    "text-xs tabular-nums",
                    Math.abs(sum - 100) < 0.01 || sum === 0
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  합계 {sum.toFixed(1)}%
                </div>
              </div>
              <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-800">
                {list.map((h) => (
                  <li
                    key={h.instrumentId}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {h.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {h.symbol}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={values[h.instrumentId as number] ?? 0}
                        onChange={(e) =>
                          onChange(h.instrumentId as number, e.target.value)
                        }
                        className={inputBase}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
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
          {pending ? "저장 중..." : "종목 목표 저장"}
        </Button>
      </div>
    </Card>
  );
}
