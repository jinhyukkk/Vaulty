import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { refreshAll } from "@/lib/pricing/refresh";

export async function POST() {
  try {
    const summary = await refreshAll();
    revalidatePath("/");
    revalidatePath("/holdings");
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
