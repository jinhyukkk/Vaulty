import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await db.delete(schema.watchlistItems).where(eq(schema.watchlistItems.id, numId));
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
