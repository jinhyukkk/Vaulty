import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db, schema } from "@/db/client";
import { NewAccountSchema } from "@/lib/validators/account";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = NewAccountSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  await db.insert(schema.accounts).values({
    name: input.name,
    kind: input.kind,
    currency: input.currency.toUpperCase(),
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return NextResponse.json({ ok: true });
}
