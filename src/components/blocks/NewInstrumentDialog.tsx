"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import type { z } from "zod";

import { Button } from "@/components/ui/Button";
import { cx, focusInput } from "@/lib/utils";
import { NewInstrumentSchema } from "@/lib/validators/account";

type FormIn = z.input<typeof NewInstrumentSchema>;
type FormOut = z.output<typeof NewInstrumentSchema>;

export function NewInstrumentDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(NewInstrumentSchema),
    defaultValues: {
      assetClass: "kr_equity",
      provider: "yahoo",
      currency: "KRW",
    },
  });

  const assetClass = watch("assetClass");

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/instruments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "요청 실패");
        return;
      }
      reset({ assetClass: "kr_equity", provider: "yahoo", currency: "KRW" });
      setOpen(false);
      router.refresh();
    });
  });

  const inputBase = cx(
    "mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  const hint: Record<string, string> = {
    kr_equity: "예: 005930.KS (삼성전자), 069500.KS (KODEX 200)",
    us_equity: "예: VOO, AAPL, QQQ",
    crypto: "예: KRW-BTC, KRW-ETH",
    cash: "예: KRW-CASH",
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary">
          <RiAddLine className="mr-1 size-4" />
          자산 추가
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
            새 자산 추가
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            시세 연동을 위해 자산군에 맞는 provider 심볼을 입력하세요.
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">심볼</span>
              <input
                type="text"
                {...register("symbol")}
                className={inputBase}
                placeholder="005930"
              />
            </label>
            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">자산군</span>
              <select {...register("assetClass")} className={inputBase}>
                <option value="kr_equity">국내 주식/ETF</option>
                <option value="us_equity">해외 주식/ETF</option>
                <option value="crypto">암호화폐</option>
                <option value="cash">현금</option>
              </select>
            </label>
            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">이름</span>
              <input
                type="text"
                {...register("name")}
                className={inputBase}
                placeholder="삼성전자"
              />
            </label>
            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">통화</span>
              <select {...register("currency")} className={inputBase}>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </label>
            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                시세 Provider
              </span>
              <select {...register("provider")} className={inputBase}>
                <option value="yahoo">Yahoo Finance</option>
                <option value="upbit">업비트</option>
                <option value="cash">현금(미조회)</option>
              </select>
            </label>
            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Provider 심볼
              </span>
              <input
                type="text"
                {...register("providerSymbol")}
                className={inputBase}
                placeholder={hint[assetClass] ?? ""}
              />
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                {hint[assetClass]}
              </span>
            </label>

            {(errors.symbol || errors.name || errors.providerSymbol) && (
              <p className="col-span-2 text-xs text-red-600 dark:text-red-400">
                입력값을 확인하세요.
              </p>
            )}
            {error && (
              <p className="col-span-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="col-span-2 mt-2 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
