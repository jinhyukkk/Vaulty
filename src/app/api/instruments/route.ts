import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db, schema } from "@/db/client";
import { NewInstrumentSchema } from "@/lib/validators/account";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = NewInstrumentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  try {
    await db.insert(schema.instruments).values({
      symbol: input.symbol.toUpperCase(),
      assetClass: input.assetClass,
      name: input.name,
      currency: input.currency.toUpperCase(),
      provider: input.provider,
      providerSymbol: input.providerSymbol,
    });
  } catch (e) {
    // UNIQUE(symbol, asset_class) 충돌
    return NextResponse.json(
      { error: `중복 또는 DB 에러: ${(e as Error).message}` },
      { status: 409 },
    );
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return NextResponse.json({ ok: true });
}
