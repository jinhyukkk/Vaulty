import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// 금액/수량은 정수 최소단위로 저장한다.
// - KRW: 원(scale 1)
// - 외화: 최소단위 1e-4 (예: USD는 1센트의 1/100)
// - 수량: 1e-8 (주식·ETF·코인 공통)
// - 환율: 1e-8
// 자세한 변환 규칙은 src/lib/money.ts 참조.

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // brokerage | bank | exchange | wallet
  kind: text("kind").notNull(),
  // ISO 4217 (KRW, USD 등)
  currency: text("currency").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const instruments = sqliteTable(
  "instruments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    // kr_equity | us_equity | crypto | cash
    assetClass: text("asset_class").notNull(),
    name: text("name").notNull(),
    currency: text("currency").notNull(),
    // 시세 조회 어댑터 키 (yahoo | upbit | cash)
    provider: text("provider").notNull(),
    // 어댑터에 넘길 실제 심볼 (예: "005930.KS", "KRW-BTC")
    providerSymbol: text("provider_symbol").notNull(),
    // asset | benchmark — 벤치마크 지수는 보유/거래에서 제외되고 성과 비교 용도
    kind: text("kind").notNull().default("asset"),
  },
  (t) => ({
    symbolClassUnique: uniqueIndex("instruments_symbol_class_unique").on(
      t.symbol,
      t.assetClass,
    ),
  }),
);

// 거래 타입:
//   buy/sell : instrumentId 필수, quantity/price/amount 모두 채움
//   dividend/interest : instrumentId 있을 수도(배당 종목), amount=수령액
//   fee/tax : amount=지출액(음수 저장), instrumentId 선택
//   deposit/withdraw : 현금 입출금, instrumentId null, amount=부호 포함
//   fx : 환전, instrumentId null, fxRate 필수, amount=도착통화 순증
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  instrumentId: integer("instrument_id").references(() => instruments.id),
  type: text("type").notNull(),
  ts: integer("ts").notNull(),
  quantity: integer("quantity"), // scale 1e-8
  price: integer("price"), // 거래통화 최소단위
  amount: integer("amount").notNull(), // 거래통화 최소단위, 부호 포함(매수/지출=음수, 매도/수령=양수)
  currency: text("currency").notNull(),
  fxRate: integer("fx_rate"), // scale 1e-8, fx 거래 또는 참고용
  note: text("note"),
});

export const priceSnapshots = sqliteTable(
  "price_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id),
    currency: text("currency").notNull(),
    price: integer("price").notNull(), // 거래통화 최소단위
    ts: integer("ts").notNull(),
  },
  (t) => ({
    instrumentTsUnique: uniqueIndex("price_snapshots_instrument_ts_unique").on(
      t.instrumentId,
      t.ts,
    ),
  }),
);

export const fxRates = sqliteTable(
  "fx_rates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    base: text("base").notNull(),
    quote: text("quote").notNull(),
    rate: integer("rate").notNull(), // scale 1e-8
    ts: integer("ts").notNull(),
  },
  (t) => ({
    baseQuoteTsUnique: uniqueIndex("fx_rates_base_quote_ts_unique").on(
      t.base,
      t.quote,
      t.ts,
    ),
  }),
);

// 자산군별 목표 비중 (basis points, 10000 = 100%)
export const targetAllocations = sqliteTable(
  "target_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assetClass: text("asset_class").notNull(),
    targetBps: integer("target_bps").notNull(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    assetClassUnique: uniqueIndex("target_allocations_class_unique").on(
      t.assetClass,
    ),
  }),
);

export type Account = typeof accounts.$inferSelect;
export type Instrument = typeof instruments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type FxRate = typeof fxRates.$inferSelect;
export type TargetAllocation = typeof targetAllocations.$inferSelect;

// 자산군 내 종목별 목표 비중 (basis points of class, 10000 = 100%).
// 예: 국내 주식 버킷 내에서 삼성전자 50%, KODEX 200 50%.
export const targetInstruments = sqliteTable(
  "target_instruments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id),
    targetBpsInClass: integer("target_bps_in_class").notNull(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    instrumentUnique: uniqueIndex("target_instruments_instrument_unique").on(
      t.instrumentId,
    ),
  }),
);

export type TargetInstrument = typeof targetInstruments.$inferSelect;
