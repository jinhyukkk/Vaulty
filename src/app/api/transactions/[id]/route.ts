import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { toAmountUnit, toQtyUnit } from "@/lib/money";
import { NewTransactionSchema } from "@/lib/validators/transaction";

function parseId(param: string): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });

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

  const sign = signByType[input.type] ?? 1;
  const amountUnit = sign * Math.abs(toAmountUnit(input.amount, input.currency));

  const result = await db
    .update(schema.transactions)
    .set({
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
    })
    .where(eq(schema.transactions.id, id))
    .returning({ id: schema.transactions.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/transactions");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const result = await db
    .delete(schema.transactions)
    .where(eq(schema.transactions.id, id))
    .returning({ id: schema.transactions.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/transactions");
  return NextResponse.json({ ok: true });
}
