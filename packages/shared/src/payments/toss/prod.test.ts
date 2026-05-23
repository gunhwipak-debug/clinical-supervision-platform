import { describe, expect, it } from "vitest";
import { TossWebhookSignatureError } from "./dev";
import { TossConfigurationError } from "./errors";
import { ProdTossClient, signTossWebhookPayload, TossApiError } from "./prod";

describe("ProdTossClient", () => {
  it("requires production credentials", () => {
    expect(
      () =>
        new ProdTossClient({
          clientKey: "",
          secretKey: "",
          webhookSecret: ""
        })
    ).toThrow(TossConfigurationError);
  });

  it("confirms payments through injected fetch", async () => {
    const calls: Array<{ url: string; auth: string | null }> = [];
    const client = new ProdTossClient({
      clientKey: "client-key",
      secretKey: "secret-key",
      webhookSecret: "webhook-secret",
      baseUrl: "https://toss.example.test",
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        calls.push({
          url: urlForFetchInput(input),
          auth: headers.get("authorization")
        });
        return Promise.resolve(
          Response.json({
            paymentKey: "payment-key",
            orderId: "order-id",
            totalAmount: 120000,
            approvedAt: "2026-05-20T00:00:00.000Z",
            status: "DONE"
          })
        );
      }
    });

    await expect(
      client.confirm({
        paymentId: "payment-id",
        orderId: "order-id",
        paymentKey: "payment-key",
        amount: 120000
      })
    ).resolves.toMatchObject({ paymentKey: "payment-key", amount: 120000 });
    expect(calls[0]?.url).toBe("https://toss.example.test/v1/payments/confirm");
    expect(calls[0]?.auth).toMatch(/^Basic /u);
  });

  it("rejects amount mismatches returned from Toss", async () => {
    const client = new ProdTossClient({
      clientKey: "client-key",
      secretKey: "secret-key",
      webhookSecret: "webhook-secret",
      fetch: () =>
        Promise.resolve(
          Response.json({
            paymentKey: "payment-key",
            orderId: "order-id",
            totalAmount: 119000,
            approvedAt: "2026-05-20T00:00:00.000Z",
            status: "DONE"
          })
        )
    });

    await expect(
      client.confirm({
        paymentId: "payment-id",
        orderId: "order-id",
        paymentKey: "payment-key",
        amount: 120000
      })
    ).rejects.toBeInstanceOf(TossApiError);
  });

  it("refunds through injected fetch", async () => {
    const client = new ProdTossClient({
      clientKey: "client-key",
      secretKey: "secret-key",
      webhookSecret: "webhook-secret",
      fetch: () =>
        Promise.resolve(
          Response.json({
            paymentKey: "payment-key",
            cancels: [
              {
                cancelAmount: 30000,
                canceledAt: "2026-05-20T00:00:00.000Z"
              }
            ]
          })
        )
    });

    await expect(
      client.refund({
        paymentKey: "payment-key",
        cancelAmount: 30000,
        cancelReason: "운영 환불 테스트"
      })
    ).resolves.toMatchObject({
      paymentKey: "payment-key",
      canceledAmount: 30000,
      status: "CANCELED"
    });
  });

  it("verifies webhook HMAC signatures", async () => {
    const payload = {
      eventId: "evt_1",
      eventType: "PAYMENT_CONFIRMED",
      orderId: "order_1",
      paymentKey: "payment-key",
      amount: 120000
    };
    const rawBody = JSON.stringify(payload);
    const client = new ProdTossClient({
      clientKey: "client-key",
      secretKey: "secret-key",
      webhookSecret: "webhook-secret",
      fetch: () => Promise.resolve(Response.json({}))
    });

    await expect(
      client.parseWebhook({
        payload,
        rawBody,
        signature: signTossWebhookPayload(rawBody, "webhook-secret")
      })
    ).resolves.toMatchObject({ eventId: "evt_1" });
    await expect(
      client.parseWebhook({ payload, rawBody, signature: "wrong" })
    ).rejects.toBeInstanceOf(TossWebhookSignatureError);
  });

  it("rejects the same parsed object when the raw body serialization differs", async () => {
    const firstRawBody =
      '{"eventId":"evt_1","eventType":"PAYMENT_CONFIRMED","orderId":"order_1","paymentKey":"payment-key","amount":120000}';
    const reorderedRawBody =
      '{"amount":120000,"paymentKey":"payment-key","orderId":"order_1","eventType":"PAYMENT_CONFIRMED","eventId":"evt_1"}';
    expect(JSON.parse(firstRawBody)).toEqual(JSON.parse(reorderedRawBody));
    const client = new ProdTossClient({
      clientKey: "client-key",
      secretKey: "secret-key",
      webhookSecret: "webhook-secret",
      fetch: () => Promise.resolve(Response.json({}))
    });

    await expect(
      client.parseWebhook({
        payload: JSON.parse(reorderedRawBody),
        rawBody: reorderedRawBody,
        signature: signTossWebhookPayload(firstRawBody, "webhook-secret")
      })
    ).rejects.toBeInstanceOf(TossWebhookSignatureError);
  });
});

function urlForFetchInput(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}
