// Mock portfolio data for Vaulty
const PORTFOLIO = {
  totalKRW: 487_340_000,
  todayPnLKRW: 3_842_000,
  todayPct: 0.79,
  allTimePnLKRW: 82_140_000,
  allTimePct: 20.26,
  cashKRW: 34_200_000,
};

const ALLOCATION = [
  { key: 'kr_stock', label: '국내 주식', en: 'KR Equity', value: 142_800_000, pct: 29.3, color: '#2F4A3A' },
  { key: 'us_stock', label: '해외 주식', en: 'US Equity', value: 168_500_000, pct: 34.6, color: '#8C6A3E' },
  { key: 'etf', label: 'ETF / 펀드', en: 'ETF/Fund', value: 84_200_000, pct: 17.3, color: '#B8925A' },
  { key: 'bond', label: '채권', en: 'Bonds', value: 32_600_000, pct: 6.7, color: '#6B7F6F' },
  { key: 'crypto', label: '암호화폐', en: 'Crypto', value: 25_040_000, pct: 5.1, color: '#4A3A2A' },
  { key: 'cash', label: '현금성', en: 'Cash', value: 34_200_000, pct: 7.0, color: '#C9BFA6' },
];

const HOLDINGS = [
  { ticker: '005930', name: '삼성전자', en: 'Samsung Elec.', type: 'KR', account: 'kiwoom-kr', qty: 420, avg: 71200, price: 74300, value: 31_206_000, pnl: 1_302_000, pct: 4.35 },
  { ticker: '373220', name: 'LG에너지솔루션', en: 'LGES', type: 'KR', account: 'kiwoom-kr', qty: 60, avg: 420000, price: 398500, value: 23_910_000, pnl: -1_290_000, pct: -5.12 },
  { ticker: 'AAPL', name: '애플', en: 'Apple Inc.', type: 'US', account: 'mirae-us', qty: 85, avg: 182.40, price: 221.30, value: 25_954_650, pnl: 4_556_320, pct: 21.33 },
  { ticker: 'NVDA', name: '엔비디아', en: 'NVIDIA', type: 'US', account: 'mirae-us', qty: 42, avg: 480.20, price: 918.70, value: 53_252_820, pnl: 25_398_290, pct: 91.24 },
  { ticker: 'TSLA', name: '테슬라', en: 'Tesla', type: 'US', account: 'mirae-us', qty: 48, avg: 240.80, price: 256.40, value: 16_984_128, pnl: 1_033_344, pct: 6.48 },
  { ticker: 'QQQ', name: 'Invesco QQQ', en: 'QQQ ETF', type: 'ETF', account: 'toss-etf', qty: 32, avg: 402.10, price: 478.20, value: 21_112_512, pnl: 3_360_384, pct: 18.93 },
  { ticker: '069500', name: 'KODEX 200', en: 'KODEX 200', type: 'ETF', account: 'toss-etf', qty: 580, avg: 34800, price: 36240, value: 21_019_200, pnl: 835_200, pct: 4.14 },
  { ticker: 'BTC', name: '비트코인', en: 'Bitcoin', type: 'CRYPTO', account: 'upbit-crypto', qty: 0.18, avg: 84_000_000, price: 128_400_000, value: 23_112_000, pnl: 7_992_000, pct: 52.86 },
];

// Cash accounts — by broker/type
const ACCOUNTS = [
  {
    id: 'kiwoom-kr', broker: '키움증권', brokerEn: 'Kiwoom',
    name: '종합매매 1234-5678', type: 'KR', typeLabel: '국내주식',
    currency: 'KRW', balance: 12_840_000, available: 8_420_000, pending: 4_420_000,
    margin: 0, marginLimit: 50_000_000, color: '#2F4A3A',
  },
  {
    id: 'mirae-us', broker: '미래에셋', brokerEn: 'Mirae Asset',
    name: '해외주식 9876-5432', type: 'US', typeLabel: '해외주식',
    currency: 'USD', balance: 8_420, available: 6_180, pending: 2_240,
    balanceKRW: 11_619_600, availableKRW: 8_528_400, pendingKRW: 3_091_200,
    margin: 0, marginLimit: 30_000, color: '#8C6A3E',
  },
  {
    id: 'toss-etf', broker: '토스증권', brokerEn: 'Toss',
    name: 'ETF 적립식 4321-0987', type: 'ETF', typeLabel: 'ETF·펀드',
    currency: 'KRW', balance: 6_840_000, available: 6_840_000, pending: 0,
    margin: 0, marginLimit: 0, color: '#B8925A',
    autoDebit: { amount: 1_000_000, date: 25, next: '11/25' },
  },
  {
    id: 'upbit-crypto', broker: '업비트', brokerEn: 'Upbit',
    name: '원화입출금 계정', type: 'CRYPTO', typeLabel: '암호화폐',
    currency: 'KRW', balance: 2_100_000, available: 2_100_000, pending: 0,
    margin: 0, marginLimit: 0, color: '#4A3A2A',
  },
  {
    id: 'kb-cma', broker: 'KB증권', brokerEn: 'KB',
    name: 'CMA 종합자산 2580-1472', type: 'CASH', typeLabel: 'CMA·예수금',
    currency: 'KRW', balance: 4_000_000, available: 4_000_000, pending: 0,
    margin: 0, marginLimit: 0, color: '#6B7F6F',
    yield: 3.45,
  },
];

const INDICES = [
  { name: 'KOSPI', value: 2847.62, chg: 18.34, pct: 0.65 },
  { name: 'KOSDAQ', value: 862.40, chg: -3.12, pct: -0.36 },
  { name: 'S&P 500', value: 5842.10, chg: 24.60, pct: 0.42 },
  { name: 'NASDAQ', value: 19284.5, chg: 112.3, pct: 0.59 },
  { name: 'USD/KRW', value: 1380.40, chg: -2.80, pct: -0.20 },
];

// Build a gentle upward-trending series for the perf chart (90 points)
const buildPerfSeries = (n = 90, start = 100, vol = 1.2, trend = 0.18) => {
  const out = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    const noise = (Math.sin(i * 0.7) + Math.cos(i * 0.23) * 0.8 + Math.sin(i * 1.3) * 0.4) * vol;
    v += trend + noise * 0.3;
    out.push(Number(v.toFixed(2)));
  }
  return out;
};
const PERF_SERIES = buildPerfSeries(90, 100, 1.6, 0.22);
const BENCH_SERIES = buildPerfSeries(90, 100, 1.0, 0.12);

const INSIGHTS = [
  { tag: 'REBALANCE', title: '해외 주식 비중이 목표치(30%)보다 4.6%p 높습니다', body: 'NVDA 일부 차익실현을 고려해보세요. 채권 비중을 10%로 올리면 변동성이 18% 감소합니다.', action: '리밸런싱 시뮬레이션' },
  { tag: 'DIVIDEND', title: '이번 달 예상 배당금 ₩842,000', body: 'AAPL, 삼성전자, KODEX 200에서 배당 지급 예정. 작년 대비 +12.3%', action: '배당 캘린더' },
  { tag: 'RISK', title: '포트폴리오 Beta 1.24 — 시장보다 공격적', body: '현재 구성은 상승장에서 유리하나, 하락 시 낙폭이 큽니다. 방어주 비중 검토 권장.', action: '리스크 리포트' },
];

const NEWS = [
  { src: 'Bloomberg', time: '2h', head: 'Fed signals patient stance as core inflation cools', tag: 'MACRO' },
  { src: '한국경제', time: '3h', head: '삼성전자, HBM4 양산 앞당겨…엔비디아 공급 확대', tag: 'KR EQUITY' },
  { src: 'Reuters', time: '5h', head: 'Nvidia shares hit fresh record on sovereign AI demand', tag: 'US EQUITY' },
  { src: 'FT', time: '6h', head: 'Korean won steadies as BOK holds rates, eyes on Q2 CPI', tag: 'FX' },
];

const WATCHLIST = [
  { ticker: 'MSFT', price: 462.30, pct: 1.24 },
  { ticker: '035720', name: '카카오', price: 41200, pct: -2.14 },
  { ticker: 'ETH', price: 5_124_000, pct: 3.42 },
  { ticker: 'GOOGL', price: 192.80, pct: 0.68 },
];

Object.assign(window, { PORTFOLIO, ALLOCATION, HOLDINGS, ACCOUNTS, INDICES, PERF_SERIES, BENCH_SERIES, INSIGHTS, NEWS, WATCHLIST });
