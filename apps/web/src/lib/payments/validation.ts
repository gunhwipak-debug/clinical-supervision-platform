import { z } from "zod";

export const paymentIntentSchema = z.object({
  supervisionRequestId: z.uuid()
});

export const paymentConfirmSchema = z.object({
  paymentId: z.uuid(),
  pgPaymentKey: z.string().trim().min(1).max(200),
  amount: z.number().int().positive()
});

export const refundRequestSchema = z.object({
  amount: z.number().int().positive().nullable().optional(),
  reason: z.string().trim().min(1).max(1000)
});

export function platformFee(amountKrw: number): number {
  return Math.floor(amountKrw * 0.2);
}
