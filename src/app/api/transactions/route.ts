import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db, schema } from "@/db/client";
import { toAmountUnit, toQtyUnit } from "@/lib/money";
import { NewTransactionSchema } from "@/lib/validators/transaction";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = NewTransactionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const ts = Math.floor(new Date(input.ts).getTime() / 1000);
  if (Number.isNaN(ts)) {
    return NextResponse.json({ error: "invalid ts" }, { status: 400 });
  }

  // 부호 규칙: 매수/수수료/세금/출금은 음수 amount, 매도/배당/이자/입금은 양수
  const signByType: Record<string, 1 | -1> = {
    buy: -1,
    sell: 1,
    dividend: 1,
    interest: 1,
    fee: -1,
    tax: -1,
    deposit: 1,
    withdraw: -1,
    fx: 1,
  };
  const sign = signByType[input.type] ?? 1;
  const amountUnit = sign * Math.abs(toAmountUnit(input.amount, input.currency));

  await db.insert(schema.transactions).values({
    accountId: input.accountId,
    instrumentId: input.instrumentId ?? null,
    type: input.type,
    ts,
    quantity:
      input.quantity !== null && input.quantity !== undefined
        ? toQtyUnit(input.quantity)
        : null,
    price:
      input.price !== null && input.price !== undefined
        ? toAmountUnit(input.price, input.currency)
        : null,
    amount: amountUnit,
    currency: input.currency,
    note: input.note ?? null,
  });

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/transactions");

  return NextResponse.json({ ok: true });
}
