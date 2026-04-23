import "server-only";

import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { fromAmountUnit, fromFxUnit } from "@/lib/money";

type Ticker = {
  name: string;
  value: number;
  pct: number | null;
};

async function getLatestTwo(instrumentId: number) {
  return db
    .select()
    .from(schema.priceSnapshots)
    .where(eq(schema.priceSnapshots.instrumentId, instrumentId))
    .orderBy(desc(schema.priceSnapshots.ts))
    .limit(2);
}

async function getBenchTickers(): Promise<Ticker[]> {
  const all = await db.select().from(schema.instruments);
  const benches = all.filter((i) => i.kind === "benchmark");
  const out: Ticker[] = [];
  for (const b of benches) {
    const snaps = await getLatestTwo(b.id);
    if (snaps.length === 0) continue;
    const cur = fromAmountUnit(snaps[0].price, snaps[0].currency);
    const prev = snaps[1]
      ? fromAmountUnit(snaps[1].price, snaps[1].currency)
      : null;
    const pct = prev && prev > 0 ? ((cur - prev) / prev) * 100 : null;
    out.push({ name: b.name, value: cur, pct });
  }
  return out;
}

async function getFxTicker(): Promise<Ticker | null> {
  const rows = await db
    .select()
    .from(schema.fxRates)
    .where(eq(schema.fxRates.base, "USD"))
    .orderBy(desc(schema.fxRates.ts))
    .limit(2);
  if (rows.length === 0) return null;
  const cur = fromFxUnit(rows[0].rate);
  const prev = rows[1] ? fromFxUnit(rows[1].rate) : null;
  const pct = prev && prev > 0 ? ((cur - prev) / prev) * 100 : null;
  return { name: "USD/KRW", value: cur, pct };
}

const fmtNum = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

export async function TickerStrip() {
  const [benches, fx] = await Promise.all([getBenchTickers(), getFxTicker()]);
  const tickers = [...benches, ...(fx ? [fx] : [])];
  if (tickers.length === 0) return null;

  return (
    <div className="flex h-9 items-center overflow-hidden border-b border-vaulty-line bg-vaulty-surfaceAlt px-6">
      {tickers.map((ix, i) => (
        <div
          key={ix.name}
          className={`flex items-baseline gap-2 pr-5 font-mono ${
            i < tickers.length - 1 ? "mr-5 border-r border-vaulty-line" : ""
          }`}
        >
          <span className="text-[9px] tracking-[1px] text-vaulty-inkMuted">
            {ix.name}
          </span>
          <span className="text-[12px] font-medium text-vaulty-ink">
            {fmtNum(ix.value)}
          </span>
          {ix.pct !== null && (
            <span
              className={`text-[10px] ${
                ix.pct >= 0 ? "text-vaulty-up" : "text-vaulty-down"
              }`}
            >
              {fmtPct(ix.pct)}
            </span>
          )}
        </div>
      ))}
      <div className="flex-1" />
      <div className="font-mono text-[9px] tracking-[1px] text-vaulty-inkMuted">
        DELAYED · 15MIN
      </div>
    </div>
  );
}
