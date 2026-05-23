import { createHmac, timingSafeEqual } from "node:crypto";
import type { TossClient, TossIntentInput, TossWebhookParseInput } from "./client";
import { TossWebhookSignatureError } from "./dev";
import { TossConfigurationError } from "./errors";
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

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export class TossApiError extends Error {
  constructor(
    readonly code: string,
    message = code
  ) {
    super(message);
  }
}

export class ProdTossClient implements TossClient {
  private readonly clientKey: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(input: {
    clientKey: string;
    secretKey: string;
    webhookSecret: string;
    baseUrl?: string;
    fetch?: FetchLike;
  }) {
    if (!input.clientKey || !input.secretKey || !input.webhookSecret) {
      throw new TossConfigurationError(
        "TOSS_CLIENT_KEY, TOSS_SECRET_KEY, and TOSS_WEBHOOK_SECRET are required for TOSS_MODE=prod"
      );
    }
    this.clientKey = input.clientKey;
    this.secretKey = input.secretKey;
    this.webhookSecret = input.webhookSecret;
    this.baseUrl = input.baseUrl?.replace(/\/$/u, "") ?? "https://api.tosspayments.com";
    this.fetchImpl = input.fetch ?? fetch;
  }

  createIntent(input: TossIntentInput): Promise<TossPaymentIntent> {
    return Promise.resolve(
      tossPaymentIntentSchema.parse({
        paymentId: input.paymentId,
        orderId: `csp-${input.paymentId}`,
        amount: input.amount,
        orderName: input.orderName,
        customerEmail: input.customerEmail ?? null,
        clientKey: this.clientKey
      })
    );
  }

  async confirm(input: TossConfirmInput): Promise<TossConfirmResult> {
    const parsed = tossConfirmInputSchema.parse(input);
    const response = await this.fetchImpl(`${this.baseUrl}/v1/payments/confirm`, {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify({
        paymentKey: parsed.paymentKey,
        orderId: parsed.orderId,
        amount: parsed.amount
      })
    });
    const data = await parseTossJson(response, "toss_confirm_failed");
    const result = tossConfirmResultSchema.parse({
      paymentKey: data["paymentKey"],
      orderId: data["orderId"],
      amount: data["totalAmount"] ?? data["amount"],
      approvedAt: data["approvedAt"],
      status: data["status"]
    });
    if (result.amount !== parsed.amount) {
      throw new TossApiError("amount_mismatch", "Confirmed amount did not match input");
    }
    return result;
  }

  async refund(input: TossRefundInput): Promise<TossRefundResult> {
    const parsed = tossRefundInputSchema.parse(input);
    const response = await this.fetchImpl(
      `${this.baseUrl}/v1/payments/${encodeURIComponent(parsed.paymentKey)}/cancel`,
      {
        method: "POST",
        headers: this.jsonHeaders(),
        body: JSON.stringify({
          cancelAmount: parsed.cancelAmount,
          cancelReason: parsed.cancelReason
        })
      }
    );
    const data = await parseTossJson(response, "toss_refund_failed");
    const cancels = data["cancels"];
    const cancel =
      Array.isArray(cancels) && cancels.length > 0
        ? normalizeRecord(cancels[cancels.length - 1])
        : data;
    return tossRefundResultSchema.parse({
      paymentKey: data["paymentKey"] ?? parsed.paymentKey,
      canceledAmount: cancel["cancelAmount"] ?? data["canceledAmount"],
      canceledAt: cancel["canceledAt"] ?? data["canceledAt"],
      status: "CANCELED"
    });
  }

  parseWebhook(input: TossWebhookParseInput): Promise<TossWebhookEvent> {
    if (!isValidTossSignature(input.rawBody, input.signature, this.webhookSecret)) {
      return Promise.reject(new TossWebhookSignatureError());
    }
    return Promise.resolve(tossWebhookEventSchema.parse(JSON.parse(input.rawBody)));
  }

  private jsonHeaders(): Record<string, string> {
    return {
      authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`,
      "content-type": "application/json"
    };
  }
}

export function signTossWebhookPayload(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("base64");
}

function isValidTossSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(signTossWebhookPayload(rawBody, secret));
  const provided = Buffer.from(signature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

async function parseTossJson(
  response: Response,
  code: string
): Promise<Record<string, unknown>> {
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new TossApiError(code, textValue(data["message"]) ?? code);
  }
  return data;
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function textValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
