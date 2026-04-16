import { z } from "zod";

export const NewTransactionSchema = z.object({
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
  ts: z.string().min(1), // ISO date (yyyy-MM-dd)
  quantity: z.coerce.number().nullable().optional(),
  price: z.coerce.number().nullable().optional(),
  amount: z.coerce.number(),
  currency: z.string().min(1),
  note: z.string().optional(),
});

export type NewTransactionInput = z.infer<typeof NewTransactionSchema>;
