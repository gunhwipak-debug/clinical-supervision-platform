import { describe, expect, it } from "vitest";
import {
  DevTossClient,
  getTossClient,
  signDevTossWebhookPayload,
  TossWebhookSignatureError
} from "./index";
import { TossConfigurationError } from "./errors";

describe("DevTossClient", () => {
  const client = new DevTossClient({
    clientKey: "client-test",
    webhookSecret: "webhook-secret",
    now: () => new Date("2026-05-19T00:00:00.000Z")
  });

  it("returns deterministic intent order ids", async () => {
    await expect(
      client.createIntent({
        paymentId: "pay_1",
        amount: 1000,
        orderName: "슈퍼비전",
        customerEmail: "user@example.com"
      })
    ).resolves.toMatchObject({
      orderId: "csp-dev-pay_1",
      amount: 1000,
      clientKey: "client-test"
    });
  });

  it("confirms idempotently for the same payment key and amount", async () => {
    const first = await client.confirm({
      paymentId: "pay_1",
      orderId: "order_1",
      paymentKey: "payment-key",
      amount: 120000
    });
    const second = await client.confirm({
      paymentId: "pay_1",
      orderId: "order_1",
      paymentKey: "payment-key",
      amount: 120000
    });

    expect(second).toEqual(first);
  });

  it("returns partial refund success", async () => {
    await expect(
      client.refund({
        paymentKey: "payment-key",
        cancelAmount: 30000,
        cancelReason: "부분 환불 승인"
      })
    ).resolves.toMatchObject({
      paymentKey: "payment-key",
      canceledAmount: 30000,
      status: "CANCELED"
    });
  });

  it("rejects webhook signature mismatch", async () => {
    const rawBody = JSON.stringify({
      eventId: "evt_1",
      eventType: "PAYMENT_CONFIRMED",
      orderId: "order_1",
      paymentKey: "payment-key",
      amount: 120000
    });
    await expect(
      client.parseWebhook({
        signature: "wrong",
        rawBody,
        payload: rawBody
      })
    ).rejects.toBeInstanceOf(TossWebhookSignatureError);
  });

  it("verifies webhook signatures against raw body bytes", async () => {
    const rawBody = JSON.stringify({
      eventId: "evt_1",
      eventType: "PAYMENT_CONFIRMED",
      orderId: "order_1",
      paymentKey: "payment-key",
      amount: 120000
    });

    await expect(
      client.parseWebhook({
        rawBody,
        payload: rawBody,
        signature: signDevTossWebhookPayload(rawBody, "webhook-secret")
      })
    ).resolves.toMatchObject({ eventId: "evt_1" });
  });

  it("does not allow the dev client in production mode", () => {
    expect(() =>
      getTossClient({
        NODE_ENV: "production",
        TOSS_MODE: "dev"
      })
    ).toThrow(TossConfigurationError);
  });
});
