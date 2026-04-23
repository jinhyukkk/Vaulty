import "server-only";

import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db/client";

export { getKpis } from "@/lib/portfolio/kpi";
export {
  getAllocation,
  getHoldings,
  getHoldingsByAccount,
  getTotalValueKrw,
} from "@/lib/portfolio/holdings";
export { getValueSeries } from "@/lib/portfolio/timeSeries";

export async function getAccounts() {
  return db.select().from(schema.accounts).orderBy(schema.accounts.id);
}

export type TransactionRow = {
  id: number;
  ts: number;
  type: string;
  amount: number;
  currency: string;
  quantity: number | null;
  price: number | null;
  note: string | null;
  accountName: string | null;
  instrumentName: string | null;
  instrumentSymbol: string | null;
  assetClass: string | null;
};

export async function getTransactionsWithJoins(): Promise<TransactionRow[]> {
  return db
    .select({
      id: schema.transactions.id,
      ts: schema.transactions.ts,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      currency: schema.transactions.currency,
      quantity: schema.transactions.quantity,
      price: schema.transactions.price,
      note: schema.transactions.note,
      accountName: schema.accounts.name,
      instrumentName: schema.instruments.name,
      instrumentSymbol: schema.instruments.symbol,
      assetClass: schema.instruments.assetClass,
    })
    .from(schema.transactions)
    .leftJoin(
      schema.accounts,
      eq(schema.transactions.accountId, schema.accounts.id),
    )
    .leftJoin(
      schema.instruments,
      eq(schema.transactions.instrumentId, schema.instruments.id),
    )
    .orderBy(desc(schema.transactions.ts))
    .limit(200);
}

export async function getInstruments() {
  const rows = await db
    .select()
    .from(schema.instruments)
    .orderBy(schema.instruments.symbol);
  return rows.filter((r) => r.kind !== "benchmark");
}

export async function getBenchmarks() {
  const rows = await db
    .select()
    .from(schema.instruments)
    .orderBy(schema.instruments.symbol);
  return rows.filter((r) => r.kind === "benchmark");
}
