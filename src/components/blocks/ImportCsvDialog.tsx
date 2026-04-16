"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Papa from "papaparse";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiUploadLine } from "@remixicon/react";

import { Button } from "@/components/ui/Button";
import { cx, focusInput } from "@/lib/utils";

type Account = { id: number; name: string; currency: string };
type Instrument = { id: number; name: string; symbol: string };

// 매핑할 대상 필드
const FIELDS = [
  { key: "ts", label: "일자 (필수, yyyy-mm-dd)" },
  { key: "type", label: "타입 (필수: buy/sell/dividend/...)" },
  { key: "symbol", label: "심볼 (buy/sell/dividend 시 필수)" },
  { key: "quantity", label: "수량" },
  { key: "price", label: "단가" },
  { key: "amount", label: "금액 (절대값 또는 부호포함)" },
  { key: "currency", label: "통화 (미지정 시 계좌 통화)" },
  { key: "note", label: "메모" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export function ImportCsvDialog({
  accounts,
  instruments,
}: {
  accounts: Account[];
  instruments: Instrument[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [accountId, setAccountId] = useState<number | null>(
    accounts[0]?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError(null);
    setResult(null);
  };

  const onFile = (f: File) => {
    reset();
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data as Record<string, string>[]);
        // 자동 매핑 추정
        const auto: Partial<Record<FieldKey, string>> = {};
        for (const h of hdrs) {
          const low = h.toLowerCase();
          if (/(date|일자|날짜|거래일)/i.test(low)) auto.ts ??= h;
          if (/(type|타입|구분|종류)/i.test(low)) auto.type ??= h;
          if (/(symbol|ticker|종목|심볼)/i.test(low)) auto.symbol ??= h;
          if (/(quantity|수량|qty|주수)/i.test(low)) auto.quantity ??= h;
          if (/(price|단가|체결가|매매가)/i.test(low)) auto.price ??= h;
          if (/(amount|금액|거래금액|대금)/i.test(low)) auto.amount ??= h;
          if (/(currency|통화|화폐)/i.test(low)) auto.currency ??= h;
          if (/(note|메모|비고)/i.test(low)) auto.note ??= h;
        }
        setMapping(auto);
      },
      error: (e) => setError(e.message),
    });
  };

  const canSubmit =
    !!accountId && !!mapping.ts && !!mapping.type && !!mapping.amount && rows.length > 0;

  const onSubmit = () => {
    if (!canSubmit || !accountId) return;
    setError(null);
    setResult(null);
    const mapped = rows
      .map((row) => {
        const get = (k: FieldKey) =>
          mapping[k] ? (row[mapping[k] as string] ?? "").trim() : "";
        const symbol = get("symbol").toUpperCase();
        const ins = instruments.find(
          (i) => i.symbol.toUpperCase() === symbol,
        );
        const type = get("type").toLowerCase();
        const currency =
          get("currency").toUpperCase() ||
          accounts.find((a) => a.id === accountId)?.currency ||
          "KRW";
        return {
          accountId,
          instrumentId: ins?.id ?? null,
          type,
          ts: get("ts"),
          quantity: get("quantity") ? Number(get("quantity")) : null,
          price: get("price") ? Number(get("price")) : null,
          amount: Number(get("amount") || 0),
          currency,
          note: get("note") || undefined,
        };
      })
      .filter((r) => r.ts && r.type && !Number.isNaN(r.amount));

    if (mapped.length === 0) {
      setError("유효한 행이 없습니다. 필수 매핑을 확인하세요.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: mapped }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "업로드 실패");
        return;
      }
      setResult(`${j.inserted}건 추가됨`);
      router.refresh();
    });
  };

  const inputBase = cx(
    "mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm",
    "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50",
    focusInput,
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary">
          <RiUploadLine className="mr-1 size-4" />
          CSV 가져오기
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
            거래 CSV 가져오기
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            증권사 MTS 또는 임의의 CSV 파일을 업로드하고 컬럼을 매핑합니다.
            심볼은 자산 마스터에 등록된 값으로 자동 매칭됩니다(미매칭 시 현금성 거래).
          </Dialog.Description>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">계좌</span>
              <select
                value={accountId ?? ""}
                onChange={(e) => setAccountId(Number(e.target.value))}
                className={inputBase}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">파일</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
                className={inputBase}
              />
            </label>
          </div>

          {headers.length > 0 && (
            <>
              <div className="mt-5 text-sm font-semibold text-gray-900 dark:text-gray-50">
                컬럼 매핑
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {f.label}
                    </span>
                    <select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          [f.key]: e.target.value || undefined,
                        }))
                      }
                      className={inputBase}
                    >
                      <option value="">—</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                미리보기: 전체 {rows.length}행, 상위 3행
              </div>
              <div className="mt-2 overflow-x-auto rounded-md border border-gray-200 text-xs dark:border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-2 py-1 text-left text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {rows.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {headers.map((h) => (
                          <td
                            key={h}
                            className="whitespace-nowrap px-2 py-1 text-gray-700 dark:text-gray-300"
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {result && (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
              {result}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary">
                닫기
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              disabled={!canSubmit || pending}
              onClick={onSubmit}
            >
              {pending ? "가져오는 중..." : `${rows.length}건 가져오기`}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
