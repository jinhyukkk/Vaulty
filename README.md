# Vaultly

개인 자산 포트폴리오 관리 대시보드. Next.js 16 + Tailwind + Tremor 스타일 + SQLite 로컬 파일 DB.

## 기능

- **대시보드** — 총자산(KRW), 미실현 손익, MTD/YTD, 포트폴리오 가치 추이, 자산군 비중
- **보유 현황** — 자산별 수량·평균단가·현재가·평가액·수익률
- **거래 내역** — 매수/매도/배당/이자/수수료/세금/입출금/환전, 수정·삭제, CSV 가져오기
- **성과 분석** — 일별 TWR 누적 곡선, KOSPI·S&P 500 벤치마크 비교, MDD·연변동성·샤프 비율
- **리밸런싱** — 자산군·종목 단위 목표 비중, 세금/수수료 반영 제안 금액
- **자동 시세 갱신** — 부팅 시 1회 + KST 장마감(16:10 평일)·미국장 종가(07:30 화-토)·코인/환율 5분 주기
- **계좌/자산 관리** — 계좌·종목 마스터 CRUD, 벤치마크 분리 관리

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack, React 18.3) |
| 스타일 | Tailwind 3.4 + Tremor Raw (MIT) |
| DB | SQLite(better-sqlite3) + Drizzle ORM |
| 시세 | yahoo-finance2 · 업비트 공개 API · Frankfurter FX |
| 검증 | Zod · react-hook-form |
| 차트 | Recharts |
| 스케줄 | node-cron (`src/instrumentation.ts`) |
| CSV | papaparse |
| 기타 | @radix-ui 일습, @remixicon/react, date-fns |

## 요구 환경

- Node 20+
- npm

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 스키마 적용 (SQLite 파일 자동 생성)
npx drizzle-kit push

# 3. 샘플 데이터 + 벤치마크 시드
npx tsx src/db/seed.ts
npx tsx scripts/seed-benchmarks.ts 180

# 4. 과거 시세 백필 (선택, 일별 TWR 곡선 정확도 향상)
npx tsx scripts/backfill-prices.ts 180

# 5. 개발 서버
npm run dev
# → http://localhost:3000
```

## 환경변수

`.env.local` (선택, 기본값으로 동작):

```
DATABASE_URL=file:./vaultly.db
```

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                    대시보드
│   ├── holdings/                   보유 현황
│   ├── transactions/               거래 내역
│   ├── analytics/                  성과 분석
│   ├── rebalance/                  리밸런싱
│   ├── settings/                   계좌·자산 관리
│   └── api/
│       ├── transactions/           POST + [id]: PATCH/DELETE + import
│       ├── accounts/               POST + [id]: DELETE
│       ├── instruments/            POST + [id]: DELETE
│       ├── targets/                POST (자산군 목표) + instruments/ (종목 목표)
│       └── prices/refresh          POST (시세·환율 갱신)
├── components/
│   ├── ui/                         Card, Button, Skeleton, DeleteButton
│   ├── layout/                     Sidebar, Header, RefreshButton
│   └── blocks/                     KpiCard, 차트·테이블·Dialog 등 도메인 UI
├── db/
│   ├── schema.ts                   Drizzle 테이블 정의
│   ├── client.ts                   better-sqlite3 싱글톤
│   ├── seed.ts                     샘플 데이터
│   └── verify.ts                   테이블 row 확인
├── lib/
│   ├── money.ts                    정수 최소단위 ↔ 표시 단위
│   ├── format.ts                   krw / pct / qty / krwCompact
│   ├── env.ts                      zod 환경변수
│   ├── utils.ts                    Tremor cx/focusInput/focusRing
│   ├── chartUtils.ts               Tremor chartColors 9색 팔레트
│   ├── validators/                 zod 입력 스키마
│   ├── portfolio/                  holdings · pnl · returns · rebalance · tax
│   └── pricing/                    providers(yahoo/upbit/fx) + refresh + scheduler
├── instrumentation.ts              node-cron 등록 (서버 부팅 시)
scripts/
├── backfill-prices.ts              일별 시세·환율 백필
└── seed-benchmarks.ts              KOSPI·S&P 500 벤치마크 등록
drizzle/                            마이그레이션 SQL
```

## 데이터 모델

| 테이블 | 용도 |
|---|---|
| `accounts` | 계좌 (증권/은행/거래소/월렛, 통화) |
| `instruments` | 자산 마스터 (심볼·자산군·provider, `kind=asset\|benchmark`) |
| `transactions` | 거래 로그 (매수/매도/배당/이자/수수료/세금/입출금/환전) |
| `price_snapshots` | 일별/즉시 시세 스냅샷, UNIQUE(instrument_id, ts) |
| `fx_rates` | 통화 환율, UNIQUE(base, quote, ts) |
| `target_allocations` | 자산군 목표 비중 (bps) |
| `target_instruments` | 자산군 내 종목 목표 비중 (bps) |

금액·수량은 모두 **정수 최소단위**로 저장 (KRW: 원, USD: 1/10000, 수량·환율: 1/1e8). 부동소수 누적 오차 방지.

## 주요 명령

```bash
npm run dev              # 개발 서버 (스케줄러 자동 시작)
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npx drizzle-kit generate # 스키마 변경 마이그레이션 생성
npx drizzle-kit push     # 마이그레이션 적용
npx tsx src/db/verify.ts # 테이블 row 카운트 확인
```

## 시세 데이터 소스

| 자산군 | Provider | 비고 |
|---|---|---|
| 국내 주식/ETF | Yahoo Finance (`005930.KS`) | 비공식, 무인증 |
| 해외 주식/ETF | Yahoo Finance (`VOO`) | 동일 |
| 암호화폐 | 업비트 (`KRW-BTC`) | 공개 ticker |
| 환율 | Frankfurter (ECB 기준) | 무료·무인증 |
| 벤치마크 | Yahoo (`^KS11`, `^GSPC`) | KOSPI / S&P 500 |

## 세금·수수료 기본값 (한국 개인)

`src/lib/portfolio/tax.ts` 의 `DEFAULT_TAX_PROFILES`:

| 자산군 | 양도세 | 거래/수수료 |
|---|---|---|
| 국내 주식 | 0 (대주주 제외) | 거래세 0.18% + 수수료 0.015% |
| 해외 주식 | 22% (250만원 공제 미반영) | 0.025% × 2 |
| 암호화폐 | 0 (2027 과세 유예) | 0.05% × 2 |
| 현금 | 0 | 0 |

## 스케줄 (KST 기준)

```
10 16 * * 1-5    국내 주식·ETF (장마감 후)
30 7  * * 2-6    미국 주식·ETF (전일 US 종가)
*/5 * * * *      암호화폐·환율
부팅 직후 1회
```

Next.js 서버 프로세스가 살아있는 환경에서만 동작. Vercel 배포 시 별도 Vercel Cron Job으로 `/api/prices/refresh` POST 호출 필요.

## 한계

- 단일 사용자·로컬 전용. 인증/멀티테넌시 없음
- 세금 추정은 근사치 (연간 공제·손익 통산·대주주 판정 등 미반영)
- Yahoo Finance는 비공식 API — 차단 시 `src/lib/pricing/providers/yahoo.ts` 교체 필요
- `yahoo-finance2.historical()` deprecated (내부적으로 `chart()`로 매핑)
- 리밸런싱 제안은 의사결정 보조용, 실제 거래는 사용자 판단

## Claude Code 하네스

`.claude/` 에 5명 에이전트 팀과 3개 스킬 포함:

- `project-manager` — 작업 분해·조율
- `finance-domain-analyst` — 도메인 모델·계산식
- `backend-architect` — API·DB·파이프라인
- `viz-ux-engineer` — Tremor·차트·포매팅
- `security-reviewer` — 비밀·OAuth·RLS
- 스킬: `portfolio-calc`, `tremor-block-mapping`, `vaultly-orchestrator`

신규 기능 요청 시 `vaultly-orchestrator` 스킬이 자동 트리거되어 팀이 분업.

## 라이선스

사적 용도 프로젝트. Tremor Raw 코드 차용 부분은 원본 MIT 고지를 따름.
