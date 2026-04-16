import "server-only";

// Frankfurter API: 완전 무료, 키 불필요, ECB 레퍼런스 환율
// https://www.frankfurter.app
const BASE = "https://api.frankfurter.app/latest";

export async function fetchFx(base: string, quote: string): Promise<number> {
  const b = base.toUpperCase();
  const q = quote.toUpperCase();
  if (b === q) return 1;

  const url = `${BASE}?from=${encodeURIComponent(b)}&to=${encodeURIComponent(q)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rate = json.rates?.[q];
  if (typeof rate !== "number") {
    throw new Error(`FX rate missing: ${b}->${q}`);
  }
  return rate;
}
