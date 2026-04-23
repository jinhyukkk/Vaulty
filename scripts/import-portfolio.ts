/**
 * 스프레드시트 포트폴리오 데이터를 Vaulty DB로 임포트합니다.
 * 실행: npx tsx scripts/import-portfolio.ts
 *
 * 주의: 이 스크립트는 1회성 초기 임포트용입니다.
 *       이미 데이터가 있는 경우 중복 삽입을 막기 위해 실행 전 확인하세요.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { toAmountUnit, toQtyUnit } from "../src/lib/money";

const DB_FILE =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./vaultly.db";
const sqlite = new Database(DB_FILE);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

// 보유 현황 기준 스냅샷 날짜 (2025-01-01 기준으로 임포트)
const IMPORT_DATE = "2025-01-01T00:00:00Z";
const IMPORT_TS = Math.floor(new Date(IMPORT_DATE).getTime() / 1000);

// ────────────────────────────────────────────────────────────────────────────
// 1. 계좌 정의
// ────────────────────────────────────────────────────────────────────────────
const ACCOUNT_DEFS = [
  { name: "국내주식 계좌", kind: "brokerage", currency: "KRW" },
  { name: "ISA 계좌", kind: "brokerage", currency: "KRW" },
  { name: "해외주식 계좌", kind: "brokerage", currency: "USD" },
  { name: "원화 현금", kind: "bank", currency: "KRW" },
  { name: "달러 현금", kind: "bank", currency: "USD" },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// 2. 종목 마스터 정의
// ────────────────────────────────────────────────────────────────────────────
const INSTRUMENT_DEFS = [
  // 국내 주식
  {
    symbol: "483290",
    name: "배당타겟커버드콜",
    assetClass: "kr_equity",
    currency: "KRW",
    provider: "yahoo",
    providerSymbol: "483290.KS",
  },
  {
    symbol: "105560",
    name: "KB금융",
    assetClass: "kr_equity",
    currency: "KRW",
    provider: "yahoo",
    providerSymbol: "105560.KS",
  },
  {
    symbol: "138040",
    name: "메리츠금융지주",
    assetClass: "kr_equity",
    currency: "KRW",
    provider: "yahoo",
    providerSymbol: "138040.KS",
  },
  {
    symbol: "035420",
    name: "NAVER",
    assetClass: "kr_equity",
    currency: "KRW",
    provider: "yahoo",
    providerSymbol: "035420.KS",
  },
  // NH-Amundi 펀드 (거래소 미상장, 자동 시세 없음)
  {
    symbol: "NHAMUNDI",
    name: "NH-Amundi 한국미국성장",
    assetClass: "kr_equity",
    currency: "KRW",
    provider: "cash",
    providerSymbol: "NHAMUNDI",
  },
  // 미국 주식 / ETF
  {
    symbol: "GOOGL",
    name: "알파벳 A",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "GOOGL",
  },
  {
    symbol: "TSM",
    name: "TSMC",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "TSM",
  },
  {
    symbol: "QLD",
    name: "ProShares Ultra QQQ (QLD)",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "QLD",
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ ETF",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "QQQ",
  },
  {
    symbol: "NVDA",
    name: "엔비디아",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "NVDA",
  },
  {
    symbol: "NFLX",
    name: "넷플릭스",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "NFLX",
  },
  {
    symbol: "SOXL",
    name: "Direxion SOXL",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "SOXL",
  },
  {
    symbol: "CPNG",
    name: "쿠팡",
    assetClass: "us_equity",
    currency: "USD",
    provider: "yahoo",
    providerSymbol: "CPNG",
  },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// 3. 거래 내역 정의 (현재 보유 포지션 → 가상 매수 + 현금 입금)
// ────────────────────────────────────────────────────────────────────────────
// accountName, instrumentSymbol(null이면 현금거래), type, qty, price, amount, currency, note
type TxDef = {
  accountName: string;
  instrumentSymbol: string | null;
  type: string;
  qty: number | null;
  price: number | null;
  amount: number; // 절대값, 부호는 type에 따라 자동 결정
  currency: string;
  note?: string;
};

const TX_DEFS: TxDef[] = [
  // ── 국내주식 계좌 ──────────────────────────────────────
  {
    accountName: "국내주식 계좌",
    instrumentSymbol: "NHAMUNDI",
    type: "buy",
    qty: 1,
    price: 12_000_000,
    amount: 12_000_000,
    currency: "KRW",
    note: "초기 임포트 - NH-Amundi 한국미국성장 펀드",
  },
  {
    accountName: "국내주식 계좌",
    instrumentSymbol: "483290",
    type: "buy",
    qty: 1271, // 12,751,943 / 10,033 ≈ 1271
    price: 10_033,
    amount: 12_751_943,
    currency: "KRW",
    note: "초기 임포트 - 배당타겟커버드콜",
  },
  {
    accountName: "국내주식 계좌",
    instrumentSymbol: "035420",
    type: "buy",
    qty: 10,
    price: 282_000,
    amount: 2_820_000,
    currency: "KRW",
    note: "초기 임포트 - NAVER",
  },
  {
    accountName: "국내주식 계좌",
    instrumentSymbol: "138040",
    type: "buy",
    qty: 9,
    price: 114_800,
    amount: 1_033_200,
    currency: "KRW",
    note: "초기 임포트 - 메리츠금융지주",
  },

  // ── ISA 계좌 ───────────────────────────────────────────
  {
    accountName: "ISA 계좌",
    instrumentSymbol: "105560",
    type: "buy",
    qty: 14,
    price: 149_450,
    amount: 2_092_300,
    currency: "KRW",
    note: "초기 임포트 - KB금융 (ISA)",
  },
  {
    accountName: "ISA 계좌",
    instrumentSymbol: "138040",
    type: "buy",
    qty: 18,
    price: 113_250,
    amount: 2_038_500,
    currency: "KRW",
    note: "초기 임포트 - 메리츠금융지주 (ISA)",
  },

  // ── 해외주식 계좌 ──────────────────────────────────────
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "GOOGL",
    type: "buy",
    qty: 34,
    price: 237.1,
    amount: 8_061.4,
    currency: "USD",
    note: "초기 임포트 - 알파벳 A",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "TSM",
    type: "buy",
    qty: 21,
    price: 273.26,
    amount: 5_738.46,
    currency: "USD",
    note: "초기 임포트 - TSMC",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "QLD",
    type: "buy",
    qty: 100,
    price: 66.02,
    amount: 6_602.0,
    currency: "USD",
    note: "초기 임포트 - QLD",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "QQQ",
    type: "buy",
    qty: 9,
    price: 550.29,
    amount: 4_952.61,
    currency: "USD",
    note: "초기 임포트 - QQQ",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "NVDA",
    type: "buy",
    qty: 25,
    price: 142.79,
    amount: 3_569.75,
    currency: "USD",
    note: "초기 임포트 - 엔비디아",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "NFLX",
    type: "buy",
    qty: 40,
    price: 113.83,
    amount: 4_553.2,
    currency: "USD",
    note: "초기 임포트 - 넷플릭스",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "SOXL",
    type: "buy",
    qty: 26,
    price: 55.05,
    amount: 1_431.3,
    currency: "USD",
    note: "초기 임포트 - SOXL",
  },
  {
    accountName: "해외주식 계좌",
    instrumentSymbol: "CPNG",
    type: "buy",
    qty: 70,
    price: 28.17,
    amount: 1_971.9,
    currency: "USD",
    note: "초기 임포트 - 쿠팡",
  },

  // ── 현금 입금 ──────────────────────────────────────────
  {
    accountName: "원화 현금",
    instrumentSymbol: null,
    type: "deposit",
    qty: null,
    price: null,
    amount: 60_310_464,
    currency: "KRW",
    note: "초기 임포트 - 원화 예수금",
  },
  {
    accountName: "달러 현금",
    instrumentSymbol: null,
    type: "deposit",
    qty: null,
    price: null,
    amount: 19_882.54,
    currency: "USD",
    note: "초기 임포트 - 달러 예수금",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 4. 목표 비중 정의 (basis points, 합계 10000 = 100%)
// ────────────────────────────────────────────────────────────────────────────
// 스프레드시트 목표: 국내주식 5%, 미국주식 40%, 글로벌ETF 30%, 미국채권 10%, 현금 10%, 암호화폐 5%
// → Vaulty 자산군으로 합산:
//   kr_equity:  5%  (국내주식)
//   us_equity: 80%  (미국주식 40% + 글로벌ETF 30% + 미국채권 10%)
//   cash:      10%  (원화 5% + 달러 5%)
//   crypto:     5%
const TARGET_DEFS = [
  { assetClass: "kr_equity", targetBps: 500 },
  { assetClass: "us_equity", targetBps: 8000 },
  { assetClass: "cash", targetBps: 1000 },
  { assetClass: "crypto", targetBps: 500 },
] as const;

// ────────────────────────────────────────────────────────────────────────────
// 실행
// ────────────────────────────────────────────────────────────────────────────
const SIGN: Record<string, 1 | -1> = {
  buy: -1,
  sell: 1,
  dividend: 1,
  interest: 1,
  fee: -1,
  tax: -1,
  deposit: 1,
  withdraw: -1,
  fx: 1,
};

async function main() {
  console.log("=== Vaulty 포트폴리오 임포트 시작 ===\n");

  // ── 기존 데이터 확인 ──────────────────────────────────
  const existingAccounts = db.select().from(schema.accounts).all();
  if (existingAccounts.length > 0) {
    console.error(
      `⚠️  이미 ${existingAccounts.length}개의 계좌가 존재합니다.`,
    );
    console.error("   중복 임포트를 방지하기 위해 종료합니다.");
    console.error(
      "   초기화 후 다시 실행하려면: rm vaultly.db && npx drizzle-kit push",
    );
    process.exit(1);
  }

  // ── 1. 계좌 생성 ──────────────────────────────────────
  console.log("1. 계좌 생성...");
  const accountMap = new Map<string, number>();
  for (const def of ACCOUNT_DEFS) {
    const [row] = db
      .insert(schema.accounts)
      .values({ name: def.name, kind: def.kind, currency: def.currency })
      .returning({ id: schema.accounts.id })
      .all();
    accountMap.set(def.name, row.id);
    console.log(`   ✓ ${def.name} (id=${row.id})`);
  }

  // ── 2. 종목 마스터 생성 ───────────────────────────────
  console.log("\n2. 종목 마스터 생성...");
  const instrumentMap = new Map<string, number>();
  for (const def of INSTRUMENT_DEFS) {
    const [row] = db
      .insert(schema.instruments)
      .values({
        symbol: def.symbol,
        name: def.name,
        assetClass: def.assetClass,
        currency: def.currency,
        provider: def.provider,
        providerSymbol: def.providerSymbol,
        kind: "asset",
      })
      .returning({ id: schema.instruments.id })
      .all();
    instrumentMap.set(def.symbol, row.id);
    console.log(`   ✓ ${def.symbol} - ${def.name} (id=${row.id})`);
  }

  // ── 3. 거래 내역 생성 ─────────────────────────────────
  console.log("\n3. 거래 내역 생성...");
  let txCount = 0;
  for (const def of TX_DEFS) {
    const accountId = accountMap.get(def.accountName);
    if (!accountId) {
      console.error(`   ✗ 계좌를 찾을 수 없음: ${def.accountName}`);
      continue;
    }

    const instrumentId = def.instrumentSymbol
      ? instrumentMap.get(def.instrumentSymbol)
      : undefined;

    if (def.instrumentSymbol && !instrumentId) {
      console.error(`   ✗ 종목을 찾을 수 없음: ${def.instrumentSymbol}`);
      continue;
    }

    const sign = SIGN[def.type] ?? 1;
    const amountRaw =
      sign * Math.abs(toAmountUnit(def.amount, def.currency));
    const qtyRaw = def.qty !== null ? toQtyUnit(def.qty) : null;
    const priceRaw =
      def.price !== null
        ? toAmountUnit(def.price, def.currency)
        : null;

    db.insert(schema.transactions)
      .values({
        accountId,
        instrumentId: instrumentId ?? null,
        type: def.type,
        ts: IMPORT_TS,
        quantity: qtyRaw,
        price: priceRaw,
        amount: amountRaw,
        currency: def.currency,
        note: def.note ?? null,
      })
      .run();

    console.log(
      `   ✓ [${def.type}] ${def.instrumentSymbol ?? "현금"} - ${def.accountName}`,
    );
    txCount++;
  }

  // ── 4. 목표 비중 설정 ─────────────────────────────────
  console.log("\n4. 목표 비중 설정...");
  for (const def of TARGET_DEFS) {
    db.insert(schema.targetAllocations)
      .values({
        assetClass: def.assetClass,
        targetBps: def.targetBps,
      })
      .run();
    console.log(
      `   ✓ ${def.assetClass}: ${def.targetBps / 100}%`,
    );
  }

  console.log(`
=== 임포트 완료 ===
  계좌:       ${ACCOUNT_DEFS.length}개
  종목:       ${INSTRUMENT_DEFS.length}개
  거래 내역:  ${txCount}건
  목표 비중:  ${TARGET_DEFS.length}개 자산군

다음 단계:
  1. 현재 시세 갱신: curl -X POST http://localhost:3000/api/prices/refresh
  2. 브라우저에서 http://localhost:3000 확인
`);
}

main()
  .catch((e) => {
    console.error("임포트 실패:", e);
    process.exit(1);
  })
  .finally(() => sqlite.close());
