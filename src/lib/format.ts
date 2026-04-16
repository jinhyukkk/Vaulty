const krwFmt = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function krw(n: number): string {
  return krwFmt.format(n);
}

export function usd(n: number): string {
  return usdFmt.format(n);
}

export function krwCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}₩${(abs / 1e12).toFixed(2)}조`;
  if (abs >= 1e8) return `${sign}₩${(abs / 1e8).toFixed(2)}억`;
  if (abs >= 1e4) return `${sign}₩${(abs / 1e4).toFixed(1)}만`;
  return krw(n);
}

export function pct(ratio: number, digits = 2): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function signedPct(ratio: number, digits = 2): string {
  const sign = ratio > 0 ? "+" : "";
  return `${sign}${pct(ratio, digits)}`;
}

export function signed(n: number, formatter: (n: number) => string): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatter(n)}`;
}

// 자산군별 수량 자릿수
const QTY_DIGITS: Record<string, number> = {
  kr_equity: 0,
  us_equity: 4,
  crypto: 8,
  cash: 0,
};

export function qty(value: number, assetClass = "us_equity"): string {
  const digits = QTY_DIGITS[assetClass] ?? 4;
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function date(d: Date | number): string {
  const dt = typeof d === "number" ? new Date(d * 1000) : d;
  return dt.toISOString().slice(0, 10);
}
