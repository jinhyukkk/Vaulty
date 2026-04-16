import { z } from "zod";

export const ImportRowSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  instrumentId: z.coerce.number().int().positive().nullable().optional(),
  type: z.enum([
    "buy",
    "sell",
    "dividend",
    "interest",
    "fee",
    "tax",
    "deposit",
    "withdraw",
    "fx",
  ]),
  ts: z.string().min(1),
  quantity: z.coerce.number().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  note: z.string().optional(),
});

export const ImportBatchSchema = z.object({
  rows: z.array(ImportRowSchema).min(1).max(1000),
});

export type ImportRow = z.infer<typeof ImportRowSchema>;
