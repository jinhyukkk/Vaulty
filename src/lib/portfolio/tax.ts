// 한국 개인 투자자 기준 단순화된 세율 모델 (MVP).
// 실제 세금은 보유 기간, 대주주 여부, 연간 공제, 손익 통산 등에 따라 복잡 —
// 여기서는 리밸런싱 의사결정용 '대략적 비용' 추정만 제공.

export type TaxProfile = {
  assetClass: string;
  // 매도 시 자본이득에 대한 과세율 (정률 근사)
  capitalGainsRate: number;
  // 매도 시 거래세·증권거래세 등 정률 비용
  sellFeeRate: number;
  // 매수 시 수수료 정률 비용
  buyFeeRate: number;
  note: string;
};

export const DEFAULT_TAX_PROFILES: Record<string, TaxProfile> = {
  kr_equity: {
    assetClass: "kr_equity",
    capitalGainsRate: 0, // 일반 개인은 상장주식 양도차익 비과세(대주주 제외)
    sellFeeRate: 0.0018, // 증권거래세 0.18% (KOSPI 기준, KOSDAQ 0.18%)
    buyFeeRate: 0.00015, // 브로커 수수료 근사
    note: "대주주 제외 양도차익 비과세, 거래세 0.18%",
  },
  us_equity: {
    assetClass: "us_equity",
    capitalGainsRate: 0.22, // 해외주식 양도소득세 22% (250만원 공제는 표시 시 고려)
    sellFeeRate: 0.00025, // 브로커 수수료 근사
    buyFeeRate: 0.00025,
    note: "해외주식 양도소득세 22% (250만원/년 기본공제 미반영)",
  },
  crypto: {
    assetClass: "crypto",
    capitalGainsRate: 0, // 2026 현재 비과세 (2027 금융투자소득세 예정)
    sellFeeRate: 0.0005, // 거래소 수수료 근사
    buyFeeRate: 0.0005,
    note: "2027년 금융투자소득세 전 과세 유예",
  },
  cash: {
    assetClass: "cash",
    capitalGainsRate: 0,
    sellFeeRate: 0,
    buyFeeRate: 0,
    note: "현금 이동은 세금/수수료 없음",
  },
};

export type TaxEstimate = {
  // 매도에 따른 예상 비용 (양도세 + 거래세), 양수
  sellTaxKrw: number;
  // 매수에 따른 예상 비용, 양수
  buyFeeKrw: number;
  netDeltaKrw: number; // deltaKrw 에 비용을 차감 반영
};

// 자본이득 비율 추정: 자산군 평균 수익률 사용. 현재 평가손익률을 기준.
export function estimateTax(
  assetClass: string,
  deltaKrw: number, // 양수=매수, 음수=매도
  unrealizedGainRatio: number, // 현재 평균 수익률 (0.2 = +20%)
): TaxEstimate {
  const profile =
    DEFAULT_TAX_PROFILES[assetClass] ?? DEFAULT_TAX_PROFILES.cash;
  if (deltaKrw >= 0) {
    const buyFeeKrw = deltaKrw * profile.buyFeeRate;
    return {
      sellTaxKrw: 0,
      buyFeeKrw,
      netDeltaKrw: deltaKrw - buyFeeKrw,
    };
  }
  const sellAmount = Math.abs(deltaKrw);
  const estimatedGain = sellAmount * Math.max(0, unrealizedGainRatio);
  const capitalGainsTax = estimatedGain * profile.capitalGainsRate;
  const sellFee = sellAmount * profile.sellFeeRate;
  const sellTaxKrw = capitalGainsTax + sellFee;
  return {
    sellTaxKrw,
    buyFeeKrw: 0,
    netDeltaKrw: deltaKrw + sellTaxKrw, // 실수취는 감소 (deltaKrw가 음수이므로 덜 음수로)
  };
}
