# Vaulty

개인 자산 포트폴리오 관리 대시보드. Next.js 16 App Router + SQLite 로컬 파일 DB 기반의 단일 사용자 전용 앱입니다.

## 주요 기능

| 페이지 | 설명 |
|---|---|
| **대시보드** | 총자산(KRW), 미실현 손익, MTD/YTD 수익률, 포트폴리오 가치 추이, 자산군 비중 |
| **보유 현황** | 자산별 수량·평균단가·현재가·평가액·수익률 |
| **거래 내역** | 매수/매도/배당/이자/수수료/세금/입출금/환전, 수정·삭제, CSV 가져오기 |
| **성과 분석** | 일별 TWR 누적 곡선, KOSPI·S&P 500 벤치마크 비교, MDD·연변동성·샤프 비율 |
| **리밸런싱** | 자산군·종목 단위 목표 비중 설정, 세금/수수료 반영 제안 금액 |
| **설정** | 계좌·종목 마스터 CRUD |

**자동 시세 갱신** — 서버 부팅 시 1회 + KST 장마감(평일 16:10)·미국장 종가(화-토 07:30)·코인/환율 5분 주기 자동 갱신

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack, React 18.3) |
| 스타일 | Tailwind CSS 3.4 + Radix UI |
| DB | SQLite (better-sqlite3) + Drizzle ORM |
| 시세 | yahoo-finance2 · 업비트 공개 API · Frankfurter FX |
| 차트 | Recharts |
| 폼 검증 | Zod + react-hook-form |
| 스케줄 | node-cron (`src/instrumentation.ts`) |
| CSV | papaparse |

## 요구 환경

- Node.js 20+
- npm

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. DB 스키마 적용 (SQLite 파일 자동 생성)
npx drizzle-kit push

# 3. 샘플 데이터 + 벤치마크 시드 (선택)
npx tsx src/db/seed.ts
npx tsx scripts/seed-benchmarks.ts 180

# 4. 과거 시세 백필 (선택 — 일별 TWR 곡선 정확도 향상)
npx tsx scripts/backfill-prices.ts 180

# 5. 개발 서버 시작
npm run dev
# → http://localhost:3000
```

## 환경변수

`.env.local` 파일을 생성합니다 (기본값으로도 동작):

```
DATABASE_URL=file:./vaultly.db
```

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                대시보드
│   ├── holdings/               보유 현황
│   ├── transactions/           거래 내역
│   ├── analytics/              성과 분석
│   ├── rebalance/              리밸런싱
│   ├── settings/               계좌·자산 관리
│   └── api/
│       ├── accounts/           계좌 CRUD
│       ├── instruments/        종목 CRUD
│       ├── transactions/       거래 CRUD + CSV 가져오기
│       ├── targets/            자산군·종목 목표 비중
│       └── prices/refresh      시세·환율 갱신 트리거
├── db/
│   ├── schema.ts               Drizzle 테이블 정의
│   ├── client.ts               better-sqlite3 싱글톤
│   ├── seed.ts                 샘플 데이터
│   └── verify.ts               테이블 row 수 확인
└── lib/
    ├── money.ts                정수 최소단위 ↔ 표시 단위 변환
    ├── format.ts               KRW / % / 수량 포매터
    ├── validators/             Zod 입력 스키마
    ├── portfolio/              holdings · pnl · returns · rebalance · tax
    └── pricing/                providers (yahoo / upbit / fx) + refresh + scheduler

scripts/
├── backfill-prices.ts          일별 시세·환율 백필
└── seed-benchmarks.ts          KOSPI·S&P 500 벤치마크 등록

drizzle/                        마이그레이션 SQL
```

## 데이터 모델

| 테이블 | 용도 |
|---|---|
| `accounts` | 계좌 (증권/은행/거래소/월렛, 통화) |
| `instruments` | 자산 마스터 (심볼·자산군·provider, `kind=asset\|benchmark`) |
| `transactions` | 거래 로그 (매수/매도/배당/이자/수수료/세금/입출금/환전) |
| `price_snapshots` | 일별/즉시 시세 스냅샷 — UNIQUE(instrument_id, ts) |
| `fx_rates` | 통화 환율 — UNIQUE(base, quote, ts) |
| `target_allocations` | 자산군 목표 비중 (basis points) |
| `target_instruments` | 자산군 내 종목 목표 비중 (basis points) |

> 금액·수량은 모두 **정수 최소단위**로 저장합니다 (KRW: 1원, USD: 1/10000, 수량·환율: 1/1e8). 부동소수 누적 오차를 방지합니다.

## 시세 데이터 소스

| 자산군 | Provider | 비고 |
|---|---|---|
| 국내 주식/ETF | Yahoo Finance (`005930.KS`) | 비공식, 무인증 |
| 해외 주식/ETF | Yahoo Finance (`VOO`) | 동일 |
| 암호화폐 | 업비트 (`KRW-BTC`) | 공개 ticker |
| 환율 | Frankfurter (ECB 기준) | 무료·무인증 |
| 벤치마크 | Yahoo (`^KS11`, `^GSPC`) | KOSPI / S&P 500 |

## 시세 갱신 스케줄 (KST 기준)

```
10 16 * * 1-5    국내 주식·ETF (평일 장마감 후)
30 7  * * 2-6    미국 주식·ETF (전일 US 종가)
*/5 * * * *      암호화폐·환율 (5분 주기)
서버 부팅 직후   1회 즉시 갱신
```

> Next.js 서버 프로세스가 살아있는 환경에서만 동작합니다. Vercel 등 서버리스 배포 시에는 별도 Cron Job으로 `POST /api/prices/refresh`를 호출하세요.

## 세금·수수료 기본값 (한국 개인)

`src/lib/portfolio/tax.ts`의 `DEFAULT_TAX_PROFILES`:

| 자산군 | 양도세 | 매수 수수료 | 매도 수수료·거래세 |
|---|---|---|---|
| 국내 주식 | 0% (대주주 제외) | 0.015% | 0.18% (거래세 포함) |
| 해외 주식 | 22% (250만원 공제 미반영) | 0.025% | 0.025% |
| 암호화폐 | 0% (2027년 과세 예정) | 0.05% | 0.05% |
| 현금 | 0% | 0% | 0% |

> 세금 추정은 리밸런싱 의사결정용 근사치입니다. 연간 공제·손익 통산·대주주 판정 등은 반영되지 않습니다.

## 주요 명령

```bash
npm run dev              # 개발 서버 (스케줄러 자동 시작)
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npx drizzle-kit generate # 스키마 변경 마이그레이션 생성
npx drizzle-kit push     # 마이그레이션 적용
npx tsx src/db/verify.ts # 테이블 row 수 확인
```

## 한계

- **단일 사용자·로컬 전용** — 인증·멀티테넌시 없음
- **세금 추정 근사치** — 연간 공제·손익 통산·대주주 판정 미반영
- **Yahoo Finance 비공식 API** — 차단 시 `src/lib/pricing/providers/yahoo.ts` 교체 필요
- **리밸런싱 제안은 참고용** — 실제 거래는 사용자 판단에 따름

## 라이선스

사적 용도 프로젝트.
