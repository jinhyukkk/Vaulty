import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";
import { toAmountUnit, toFxUnit, toQtyUnit } from "../lib/money";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";
const sqlite = new Database(dbFile);
const db = drizzle(sqlite, { schema });

function unix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

async function main() {
  console.log("seed 시작:", dbFile);

  // 기존 데이터 초기화 (개발용)
  sqlite.exec("DELETE FROM transactions");
  sqlite.exec("DELETE FROM price_snapshots");
  sqlite.exec("DELETE FROM fx_rates");
  sqlite.exec("DELETE FROM instruments");
  sqlite.exec("DELETE FROM accounts");

  // 계좌
  const [mainBrokerage] = await db
    .insert(schema.accounts)
    .values({ name: "국내 증권계좌", kind: "brokerage", currency: "KRW" })
    .returning();
  const [usBrokerage] = await db
    .insert(schema.accounts)
    .values({ name: "해외 증권계좌", kind: "brokerage", currency: "USD" })
    .returning();
  const [upbitAcc] = await db
    .insert(schema.accounts)
    .values({ name: "업비트", kind: "exchange", currency: "KRW" })
    .returning();
  const [krwBank] = await db
    .insert(schema.accounts)
    .values({ name: "원화 예금", kind: "bank", currency: "KRW" })
    .returning();

  // 자산 마스터
  const [samsung] = await db
    .insert(schema.instruments)
    .values({
      symbol: "005930",
      assetClass: "kr_equity",
      name: "삼성전자",
      currency: "KRW",
      provider: "yahoo",
      providerSymbol: "005930.KS",
    })
    .returning();
  const [kodex200] = await db
    .insert(schema.instruments)
    .values({
      symbol: "069500",
      assetClass: "kr_equity",
      name: "KODEX 200",
      currency: "KRW",
      provider: "yahoo",
      providerSymbol: "069500.KS",
    })
    .returning();
  const [voo] = await db
    .insert(schema.instruments)
    .values({
      symbol: "VOO",
      assetClass: "us_equity",
      name: "Vanguard S&P 500 ETF",
      currency: "USD",
      provider: "yahoo",
      providerSymbol: "VOO",
    })
    .returning();
  const [btc] = await db
    .insert(schema.instruments)
    .values({
      symbol: "BTC",
      assetClass: "crypto",
      name: "Bitcoin",
      currency: "KRW",
      provider: "upbit",
      providerSymbol: "KRW-BTC",
    })
    .returning();

  // 거래 (매수)
  await db.insert(schema.transactions).values([
    {
      accountId: mainBrokerage.id,
      instrumentId: samsung.id,
      type: "buy",
      ts: unix("2026-01-08"),
      quantity: toQtyUnit(10),
      price: toAmountUnit(75000, "KRW"),
      amount: -toAmountUnit(750000, "KRW"),
      currency: "KRW",
      note: "시초 매수",
    },
    {
      accountId: mainBrokerage.id,
      instrumentId: samsung.id,
      type: "buy",
      ts: unix("2026-02-12"),
      quantity: toQtyUnit(5),
      price: toAmountUnit(78000, "KRW"),
      amount: -toAmountUnit(390000, "KRW"),
      currency: "KRW",
    },
    {
      accountId: mainBrokerage.id,
      instrumentId: kodex200.id,
      type: "buy",
      ts: unix("2026-01-15"),
      quantity: toQtyUnit(30),
      price: toAmountUnit(38000, "KRW"),
      amount: -toAmountUnit(1140000, "KRW"),
      currency: "KRW",
    },
    {
      accountId: usBrokerage.id,
      instrumentId: voo.id,
      type: "buy",
      ts: unix("2026-02-03"),
      quantity: toQtyUnit(4),
      price: toAmountUnit(520, "USD"),
      amount: -toAmountUnit(2080, "USD"),
      currency: "USD",
      fxRate: toFxUnit(1340),
    },
    {
      accountId: upbitAcc.id,
      instrumentId: btc.id,
      type: "buy",
      ts: unix("2026-01-20"),
      quantity: toQtyUnit(0.02),
      price: toAmountUnit(92000000, "KRW"),
      amount: -toAmountUnit(1840000, "KRW"),
      currency: "KRW",
    },
    {
      accountId: mainBrokerage.id,
      instrumentId: samsung.id,
      type: "dividend",
      ts: unix("2026-03-30"),
      amount: toAmountUnit(5580, "KRW"),
      currency: "KRW",
      note: "분기 배당 (세후)",
    },
    // 매도
    {
      accountId: mainBrokerage.id,
      instrumentId: kodex200.id,
      type: "sell",
      ts: unix("2026-04-05"),
      quantity: toQtyUnit(10),
      price: toAmountUnit(40500, "KRW"),
      amount: toAmountUnit(405000, "KRW"),
      currency: "KRW",
    },
    // 현금 입출금
    {
      accountId: krwBank.id,
      instrumentId: null,
      type: "deposit",
      ts: unix("2026-01-02"),
      amount: toAmountUnit(5000000, "KRW"),
      currency: "KRW",
      note: "시작 잔고",
    },
  ]);

  // 최신 시세 스냅샷
  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.priceSnapshots).values([
    {
      instrumentId: samsung.id,
      currency: "KRW",
      price: toAmountUnit(82500, "KRW"),
      ts: now,
    },
    {
      instrumentId: kodex200.id,
      currency: "KRW",
      price: toAmountUnit(41200, "KRW"),
      ts: now,
    },
    {
      instrumentId: voo.id,
      currency: "USD",
      price: toAmountUnit(545, "USD"),
      ts: now,
    },
    {
      instrumentId: btc.id,
      currency: "KRW",
      price: toAmountUnit(105000000, "KRW"),
      ts: now,
    },
  ]);

  await db.insert(schema.fxRates).values({
    base: "USD",
    quote: "KRW",
    rate: toFxUnit(1358),
    ts: now,
  });

  console.log("seed 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
