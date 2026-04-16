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
import { NewAccountSchema } from "@/lib/validators/account";

type FormIn = z.input<typeof NewAccountSchema>;
type FormOut = z.output<typeof NewAccountSchema>;

export function NewAccountDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(NewAccountSchema),
    defaultValues: { currency: "KRW", kind: "brokerage" },
  });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "요청 실패");
        return;
      }
      reset({ currency: "KRW", kind: "brokerage" });
      setOpen(false);
      router.refresh();
    });
  });

  const inputBase = cx(
    "mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary">
          <RiAddLine className="mr-1 size-4" />
          계좌 추가
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
            새 계좌 추가
          </Dialog.Title>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300">이름</span>
              <input
                type="text"
                {...register("name")}
                className={inputBase}
                placeholder="예: 키움 위탁계좌"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300">종류</span>
              <select {...register("kind")} className={inputBase}>
                <option value="brokerage">증권</option>
                <option value="bank">은행</option>
                <option value="exchange">거래소</option>
                <option value="wallet">월렛</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300">기본 통화</span>
              <select {...register("currency")} className={inputBase}>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
              </select>
            </label>
            {(errors.name || errors.kind) && (
              <p className="text-xs text-red-600 dark:text-red-400">
                입력값을 확인하세요.
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
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
