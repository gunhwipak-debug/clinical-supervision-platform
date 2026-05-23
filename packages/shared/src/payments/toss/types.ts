import { z } from "zod";

export const tossPaymentIntentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  orderName: z.string().min(1),
  customerEmail: z.email().nullable().optional(),
  clientKey: z.string().min(1)
});

export const tossConfirmInputSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  paymentKey: z.string().min(1),
  amount: z.number().int().positive()
});

export const tossConfirmResultSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  approvedAt: z.string().min(1),
  status: z.literal("DONE")
});

export const tossRefundInputSchema = z.object({
  paymentKey: z.string().min(1),
  cancelAmount: z.number().int().positive(),
  cancelReason: z.string().min(1)
});

export const tossRefundResultSchema = z.object({
  paymentKey: z.string().min(1),
  canceledAmount: z.number().int().positive(),
  canceledAt: z.string().min(1),
  status: z.literal("CANCELED")
});

export const tossWebhookEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(["PAYMENT_CONFIRMED", "PAYMENT_CANCELED", "PAYMENT_FAILED"]),
  paymentKey: z.string().min(1).nullable().optional(),
  orderId: z.string().min(1),
  amount: z.number().int().positive().nullable().optional()
});

export type TossPaymentIntent = z.infer<typeof tossPaymentIntentSchema>;
export type TossConfirmInput = z.infer<typeof tossConfirmInputSchema>;
export type TossConfirmResult = z.infer<typeof tossConfirmResultSchema>;
export type TossRefundInput = z.infer<typeof tossRefundInputSchema>;
export type TossRefundResult = z.infer<typeof tossRefundResultSchema>;
export type TossWebhookEvent = z.infer<typeof tossWebhookEventSchema>;
