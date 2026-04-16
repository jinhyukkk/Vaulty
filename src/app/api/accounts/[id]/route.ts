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

  const refs = await db
    .select({ id: schema.transactions.id })
    .from(schema.transactions)
    .where(eq(schema.transactions.accountId, id))
    .limit(1);
  if (refs.length > 0) {
    return NextResponse.json(
      { error: "이 계좌를 참조하는 거래가 있어 삭제할 수 없습니다." },
      { status: 409 },
    );
  }

  const result = await db
    .delete(schema.accounts)
    .where(eq(schema.accounts.id, id))
    .returning({ id: schema.accounts.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  revalidatePath("/settings");
  return NextResponse.json({ ok: true });
}
