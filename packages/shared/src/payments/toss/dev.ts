import { createHmac, timingSafeEqual } from "node:crypto";
import type { TossClient, TossIntentInput, TossWebhookParseInput } from "./client";
import {
  tossConfirmInputSchema,
  tossConfirmResultSchema,
  tossPaymentIntentSchema,
  tossRefundInputSchema,
  tossRefundResultSchema,
  tossWebhookEventSchema,
  type TossConfirmInput,
  type TossConfirmResult,
  type TossPaymentIntent,
  type TossRefundInput,
  type TossRefundResult,
  type TossWebhookEvent
} from "./types";

export class TossWebhookSignatureError extends Error {
  readonly code = "webhook_signature_invalid";

  constructor() {
    super("Invalid Toss webhook signature");
  }
}

export class DevTossClient implements TossClient {
  constructor(
    private readonly config: {
      clientKey: string;
      webhookSecret: string;
      now?: () => Date;
    }
  ) {}

  createIntent(input: TossIntentInput): Promise<TossPaymentIntent> {
    return Promise.resolve(
      tossPaymentIntentSchema.parse({
        paymentId: input.paymentId,
        orderId: `csp-dev-${input.paymentId}`,
        amount: input.amount,
        orderName: input.orderName,
        customerEmail: input.customerEmail ?? null,
        clientKey: this.config.clientKey
      })
    );
  }

  confirm(input: TossConfirmInput): Promise<TossConfirmResult> {
    const parsed = tossConfirmInputSchema.parse(input);
    return Promise.resolve(
      tossConfirmResultSchema.parse({
        paymentKey: parsed.paymentKey,
        orderId: parsed.orderId,
        amount: parsed.amount,
        approvedAt: this.nowIso(),
        status: "DONE"
      })
    );
  }

  refund(input: TossRefundInput): Promise<TossRefundResult> {
    const parsed = tossRefundInputSchema.parse(input);
    return Promise.resolve(
      tossRefundResultSchema.parse({
        paymentKey: parsed.paymentKey,
        canceledAmount: parsed.cancelAmount,
        canceledAt: this.nowIso(),
        status: "CANCELED"
      })
    );
  }

  parseWebhook(input: TossWebhookParseInput): Promise<TossWebhookEvent> {
    if (
      !isValidDevTossSignature(
        input.rawBody,
        input.signature,
        this.config.webhookSecret
      )
    ) {
      return Promise.reject(new TossWebhookSignatureError());
    }

    return Promise.resolve(tossWebhookEventSchema.parse(JSON.parse(input.rawBody)));
  }

  private nowIso(): string {
    return (this.config.now?.() ?? new Date()).toISOString();
  }
}

function isValidDevTossSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signDevTossWebhookPayload(rawBody, secret));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function signDevTossWebhookPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}
