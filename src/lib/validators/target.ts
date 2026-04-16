import { z } from "zod";

const TargetRow = z.object({
  assetClass: z.enum(["kr_equity", "us_equity", "crypto", "cash"]),
  targetBps: z.coerce.number().int().min(0).max(10000),
});

export const TargetBatchSchema = z.object({
  targets: z.array(TargetRow).min(1).max(10),
});

export type TargetRowInput = z.infer<typeof TargetRow>;

const InstrumentTargetRow = z.object({
  instrumentId: z.coerce.number().int().positive(),
  targetBpsInClass: z.coerce.number().int().min(0).max(10000),
});

export const InstrumentTargetBatchSchema = z.object({
  targets: z.array(InstrumentTargetRow).max(100),
});

export type InstrumentTargetInput = z.infer<typeof InstrumentTargetRow>;
