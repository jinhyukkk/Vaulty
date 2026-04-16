// 정수 최소단위 <-> 표시 단위 변환.
// KRW: scale 1 (원 단위 저장)
// 외화: scale 1e-4 (예: USD는 소수 4자리까지 저장)
// 수량: scale 1e-8
// 환율: scale 1e-8

export const AMOUNT_SCALE: Record<string, number> = {
  KRW: 1,
  USD: 10000,
  EUR: 10000,
  JPY: 100,
  CNY: 10000,
};

export const QTY_SCALE = 1e8;
export const FX_SCALE = 1e8;

export function amountScaleFor(currency: string): number {
  return AMOUNT_SCALE[currency.toUpperCase()] ?? 10000;
}

export function toAmountUnit(value: number, currency: string): number {
  return Math.round(value * amountScaleFor(currency));
}

export function fromAmountUnit(raw: number, currency: string): number {
  return raw / amountScaleFor(currency);
}

export function toQtyUnit(qty: number): number {
  return Math.round(qty * QTY_SCALE);
}

export function fromQtyUnit(raw: number): number {
  return raw / QTY_SCALE;
}

export function toFxUnit(rate: number): number {
  return Math.round(rate * FX_SCALE);
}

export function fromFxUnit(raw: number): number {
  return raw / FX_SCALE;
}

// 외화를 KRW로 환산 (표시 단위 기준)
export function convertToKrw(
  amount: number,
  currency: string,
  krwPerUnit: number,
): number {
  if (currency.toUpperCase() === "KRW") return amount;
  return amount * krwPerUnit;
}
