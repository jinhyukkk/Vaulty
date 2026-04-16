import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  // 거래가 참조 중이면 삭제 불가 (안전)
  const refs = await db
    .select({ id: schema.transactions.id })
    .from(schema.transactions)
    .where(eq(schema.transactions.instrumentId, id))
    .limit(1);
  if (refs.length > 0) {
    return NextResponse.json(
      { error: "이 자산을 참조하는 거래가 있어 삭제할 수 없습니다." },
      { status: 409 },
    );
  }

  // 시세 스냅샷 정리 후 자산 삭제
  await db
    .delete(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, id));
  const result = await db
    .delete(schema.instruments)
    .where(eq(schema.instruments.id, id))
    .returning({ id: schema.instruments.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  revalidatePath("/settings");
  revalidatePath("/holdings");
  return NextResponse.json({ ok: true });
}
