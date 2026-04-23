export type AssetClass = "kr_equity" | "us_equity" | "crypto" | "cash";

export type Holding = {
  instrumentId: number | null;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  quantity: number; // 표시 단위
  avgCost: number; // 거래통화 표시 단위
  currentPrice: number | null; // 거래통화 표시 단위
  marketValue: number; // 거래통화 표시 단위
  marketValueKrw: number; // KRW 환산
  costBasisKrw: number;
  unrealizedPnlKrw: number;
  returnRatio: number | null; // (현재가/평균단가 - 1)
  priceHistory?: number[]; // 최근 30일 일별 종가 (거래통화 기준)
};

export type AccountHoldings = {
  accountId: number;
  accountName: string;
  accountKind: string;
  currency: string;
  cashKrw: number;
  holdings: Holding[];
  equityKrw: number;
  pnlKrw: number;
  pnlRatio: number;
  totalKrw: number;
};

export type AllocationRow = {
  assetClass: AssetClass | "cash";
  label: string;
  valueKrw: number;
  ratio: number;
};

export type Kpi = {
  title: string;
  subtitle?: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  spark?: number[];
};

export type RevenuePoint = { month: string; revenue: number };
