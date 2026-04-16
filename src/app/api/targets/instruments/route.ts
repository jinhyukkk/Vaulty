import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { InstrumentTargetBatchSchema } from "@/lib/validators/target";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = InstrumentTargetBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { targets } = parsed.data;
  const now = Math.floor(Date.now() / 1000);

  // 자산군별 합계 검증 — 각 클래스 내 합이 0 또는 10000
  if (targets.length > 0) {
    const instruments = await db
      .select()
      .from(schema.instruments)
      .where(
        inArray(
          schema.instruments.id,
          targets.map((t) => t.instrumentId),
        ),
      );
    const byClass = new Map<string, number>();
    for (const t of targets) {
      const ins = instruments.find((i) => i.id === t.instrumentId);
      if (!ins) continue;
      byClass.set(
        ins.assetClass,
        (byClass.get(ins.assetClass) ?? 0) + t.targetBpsInClass,
      );
    }
    for (const [cls, sum] of byClass) {
      if (sum !== 0 && sum !== 10000) {
        return NextResponse.json(
          {
            error: `${cls} 자산군 내 종목 비중 합이 100%가 아닙니다 (현재 ${(sum / 100).toFixed(1)}%)`,
          },
          { status: 400 },
        );
      }
    }
  }

  // 0 인 항목은 삭제, 나머지는 upsert
  const toDelete = targets.filter((t) => t.targetBpsInClass === 0);
  const toUpsert = targets.filter((t) => t.targetBpsInClass > 0);

  if (toDelete.length > 0) {
    await db
      .delete(schema.targetInstruments)
      .where(
        inArray(
          schema.targetInstruments.instrumentId,
          toDelete.map((t) => t.instrumentId),
        ),
      );
  }

  for (const t of toUpsert) {
    await db
      .insert(schema.targetInstruments)
      .values({
        instrumentId: t.instrumentId,
        targetBpsInClass: t.targetBpsInClass,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.targetInstruments.instrumentId,
        set: { targetBpsInClass: t.targetBpsInClass, updatedAt: now },
      });
  }

  revalidatePath("/rebalance");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const idRaw = url.searchParams.get("instrumentId");
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await db
    .delete(schema.targetInstruments)
    .where(eq(schema.targetInstruments.instrumentId, id));
  revalidatePath("/rebalance");
  return NextResponse.json({ ok: true });
}
