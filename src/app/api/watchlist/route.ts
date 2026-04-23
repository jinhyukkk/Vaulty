import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db, schema } from "@/db/client";

const CreateSchema = z.object({
  instrumentId: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(schema.watchlistItems)
      .values({ instrumentId: parsed.data.instrumentId });
  } catch (e) {
    return NextResponse.json(
      { error: `중복 또는 DB 에러: ${(e as Error).message}` },
      { status: 409 },
    );
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
