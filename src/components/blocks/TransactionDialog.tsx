"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { RiAddLine, RiEdit2Line } from "@remixicon/react";
import type { z } from "zod";

import { Button } from "@/components/ui/Button";
import { cx, focusInput } from "@/lib/utils";
import { NewTransactionSchema } from "@/lib/validators/transaction";

type FormIn = z.input<typeof NewTransactionSchema>;
type FormOut = z.output<typeof NewTransactionSchema>;

type Account = { id: number; name: string; currency: string };
type Instrument = {
  id: number;
  name: string;
  symbol: string;
  currency: string;
};

export type TransactionInitial = Partial<FormIn> & { id?: number };

type Props = {
  accounts: Account[];
  instruments: Instrument[];
  mode?: "create" | "edit";
  initial?: TransactionInitial;
  trigger?: React.ReactNode;
};

export function TransactionDialog({
  accounts,
  instruments,
  mode = "create",
  initial,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const defaults: Partial<FormIn> = {
    ts: today,
    currency: accounts[0]?.currency ?? "KRW",
    type: "buy",
    ...initial,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: defaults,
  });

  const type = watch("type");
  const needsInstrument = type === "buy" || type === "sell" || type === "dividend";

  const onSubmit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const url =
        mode === "edit" && initial?.id
          ? `/api/transactions/${initial.id}`
          : "/api/transactions";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "요청 실패");
        return;
      }
      if (mode === "create") {
        reset(defaults);
      }
      setOpen(false);
      router.refresh();
    });
  });

  const inputBase = cx(
    "mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  const defaultTrigger =
    mode === "edit" ? (
      <Button variant="ghost" size="sm" aria-label="수정">
        <RiEdit2Line className="size-4" />
      </Button>
    ) : (
      <Button size="sm">
        <RiAddLine className="mr-1 size-4" />
        거래 추가
      </Button>
    );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger ?? defaultTrigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-dialogOverlayShow" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-lg data-[state=open]:animate-dialogContentShow dark:border-gray-800 dark:bg-gray-900">
          <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {mode === "edit" ? "거래 수정" : "새 거래 추가"}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "edit"
              ? "거래 내용을 수정합니다."
              : "거래 유형과 금액을 입력하세요. 매수/매도는 수량과 단가도 필요합니다."}
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">계좌</span>
              <select {...register("accountId")} className={inputBase}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">타입</span>
              <select {...register("type")} className={inputBase}>
                <option value="buy">매수</option>
                <option value="sell">매도</option>
                <option value="dividend">배당</option>
                <option value="interest">이자</option>
                <option value="fee">수수료</option>
                <option value="tax">세금</option>
                <option value="deposit">입금</option>
                <option value="withdraw">출금</option>
              </select>
            </label>

            {needsInstrument && (
              <label className="col-span-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">자산</span>
                <select {...register("instrumentId")} className={inputBase}>
                  <option value="">선택</option>
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.symbol})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">일자</span>
              <input type="date" {...register("ts")} className={inputBase} />
            </label>

            <label className="col-span-1 text-sm">
              <span className="text-gray-700 dark:text-gray-300">통화</span>
              <select {...register("currency")} className={inputBase}>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </select>
            </label>

            {needsInstrument && (
              <>
                <label className="col-span-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">수량</span>
                  <input
                    type="number"
                    step="any"
                    {...register("quantity")}
                    className={inputBase}
                  />
                </label>
                <label className="col-span-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">단가</span>
                  <input
                    type="number"
                    step="any"
                    {...register("price")}
                    className={inputBase}
                  />
                </label>
              </>
            )}

            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                금액 (절대값, 부호는 타입으로 자동)
              </span>
              <input
                type="number"
                step="any"
                {...register("amount")}
                className={inputBase}
              />
            </label>

            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">메모</span>
              <input type="text" {...register("note")} className={inputBase} />
            </label>

            {(errors.accountId || errors.amount || errors.ts) && (
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
              <Button type="submit" disabled={submitting}>
                {submitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// 기존 호출 호환 래퍼
export function NewTransactionDialog(props: Omit<Props, "mode" | "initial">) {
  return <TransactionDialog {...props} mode="create" />;
}
