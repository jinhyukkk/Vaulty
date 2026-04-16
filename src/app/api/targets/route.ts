import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db, schema } from "@/db/client";
import { TargetBatchSchema } from "@/lib/validators/target";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = TargetBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sum = parsed.data.targets.reduce((s, t) => s + t.targetBps, 0);
  if (sum !== 0 && sum !== 10000) {
    return NextResponse.json(
      { error: `목표 비중 합계는 100% (=10000 bps)여야 합니다. 현재 ${(sum / 100).toFixed(1)}%` },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  for (const t of parsed.data.targets) {
    await db
      .insert(schema.targetAllocations)
      .values({
        assetClass: t.assetClass,
        targetBps: t.targetBps,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.targetAllocations.assetClass,
        set: { targetBps: t.targetBps, updatedAt: now },
      });
  }

  revalidatePath("/rebalance");
  return NextResponse.json({ ok: true });
}
