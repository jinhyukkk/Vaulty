import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db, schema } from "@/db/client";
import { toAmountUnit, toQtyUnit } from "@/lib/money";
import { ImportBatchSchema } from "@/lib/validators/import";

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

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = ImportBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const values = parsed.data.rows.map((r) => {
    const ts = Math.floor(new Date(r.ts).getTime() / 1000);
    const sign = signByType[r.type] ?? 1;
    const amountUnit = sign * Math.abs(toAmountUnit(r.amount, r.currency));
    return {
      accountId: r.accountId,
      instrumentId: r.instrumentId ?? null,
      type: r.type,
      ts,
      quantity:
        r.quantity !== null && r.quantity !== undefined
          ? toQtyUnit(r.quantity)
          : null,
      price:
        r.price !== null && r.price !== undefined
          ? toAmountUnit(r.price, r.currency)
          : null,
      amount: amountUnit,
      currency: r.currency,
      note: r.note ?? null,
    };
  });

  // ts 가 유효한 행만
  const valid = values.filter((v) => !Number.isNaN(v.ts));
  if (valid.length === 0) {
    return NextResponse.json({ error: "no valid rows" }, { status: 400 });
  }

  await db.insert(schema.transactions).values(valid);

  revalidatePath("/");
  revalidatePath("/holdings");
  revalidatePath("/transactions");
  revalidatePath("/analytics");

  return NextResponse.json({ ok: true, inserted: valid.length });
}
