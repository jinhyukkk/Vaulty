import { z } from "zod";

export const NewAccountSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(["brokerage", "bank", "exchange", "wallet"]),
  currency: z.string().min(3).max(3),
});

export type NewAccountInput = z.infer<typeof NewAccountSchema>;

export const NewInstrumentSchema = z.object({
  symbol: z.string().min(1).max(40),
  assetClass: z.enum(["kr_equity", "us_equity", "crypto", "cash"]),
  name: z.string().min(1).max(120),
  currency: z.string().min(3).max(3),
  provider: z.enum(["yahoo", "upbit", "cash"]),
  providerSymbol: z.string().min(1).max(60),
});

export type NewInstrumentInput = z.infer<typeof NewInstrumentSchema>;
