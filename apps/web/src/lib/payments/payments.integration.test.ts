import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { signDevTossWebhookPayload } from "@csp/shared/payments/toss";
import { calendar, payments, withUserContext } from "@csp/db";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "../auth/current-user";

const migrations = [
  "packages/db/drizzle/0000_initial_schema.sql",
  "packages/db/drizzle/0001_rls_policies.sql",
  "packages/db/drizzle/0002_app_role_and_fixes.sql",
  "packages/db/drizzle/0003_default_privileges.sql",
  "packages/db/drizzle/0004_auth_columns.sql",
  "packages/db/drizzle/0005_auth_tokens.sql",
  "packages/db/drizzle/0006_totp_recovery_codes.sql",
  "packages/db/drizzle/0007_specialty_catalog_seed.sql",
  "packages/db/drizzle/0008_profile_constraints.sql",
  "packages/db/drizzle/0009_supervision_request_constraints.sql",
  "packages/db/drizzle/0010_payments_constraints.sql",
  "packages/db/drizzle/0014_google_calendar.sql"
] as const;

const superviseeId = "40000000-0000-0000-0000-000000000001";
const otherSuperviseeId = "40000000-0000-0000-0000-000000000002";
const supervisorId = "40000000-0000-0000-0000-000000000003";
const adminId = "40000000-0000-0000-0000-000000000004";
const productId = "40000000-0000-0000-0000-000000000101";
const supervisorProfileId = "40000000-0000-0000-0000-000000000102";
const adminReason = "Administrative refund and payout review reason";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
  process.env["TOSS_MODE"] = "dev";
  process.env["TOSS_CLIENT_KEY"] = "test-client";
  process.env["TOSS_WEBHOOK_SECRET"] = "test-webhook-secret";
  await applyMigrations();
  await seedDomain();
});

afterEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  await pg.close();
});

describe("payments integration", () => {
  it("issues an intent from a submitted request and moves it to awaiting_payment", async () => {
    const requestId = await seedRequest("submitted");

    const response = await callIntent(
      currentUser(superviseeId, "supervisee"),
      requestId
    );
    const body = (await response.json()) as PaymentIntentEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.amount).toBe(120000);
    expect(body.data?.pgOrderId).toContain(body.data?.paymentId ?? "missing");
    await expectRequestStatus(requestId, "awaiting_payment");
    await expectPaymentCount(1);
  });

  it("reuses the existing pending payment when retrying an awaiting payment", async () => {
    const { paymentId, requestId } = await createIntent();

    const response = await callIntent(
      currentUser(superviseeId, "supervisee"),
      requestId
    );
    const body = (await response.json()) as PaymentIntentEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.paymentId).toBe(paymentId);
    expect(body.data?.pgOrderId).toContain(paymentId);
    await expectRequestStatus(requestId, "awaiting_payment");
    await expectPaymentCount(1);
  });

  it("rejects intent creation for non-submitted requests", async () => {
    const requestId = await seedRequest("draft");

    const response = await callIntent(
      currentUser(superviseeId, "supervisee"),
      requestId
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(409);
    expect(body.error?.code).toBe("invalid_state");
  });

  it("rejects intent creation for another supervisee request", async () => {
    const requestId = await seedRequest("submitted", otherSuperviseeId);

    const response = await callIntent(
      currentUser(superviseeId, "supervisee"),
      requestId
    );
    const body = (await response.json()) as ApiEnvelope;

    expect([403, 404]).toContain(response.status);
    expect(["forbidden", "not_found"]).toContain(body.error?.code);
  });

  it("confirms payment and advances the request to supervisor review", async () => {
    const { paymentId, requestId } = await createIntent();

    const response = await callConfirm(currentUser(superviseeId, "supervisee"), {
      paymentId,
      pgPaymentKey: "payment-key-1",
      amount: 120000
    });
    const body = (await response.json()) as PaymentEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.payment.status).toBe("paid");
    await expectRequestStatus(requestId, "awaiting_supervisor_review");
    await expectNotificationKinds(requestId, [
      "payment_confirmed_supervisee",
      "payment_confirmed_supervisor"
    ]);
  });

  it("confirms idempotently with the same payment key", async () => {
    const { paymentId, requestId } = await createIntent();
    await callConfirm(currentUser(superviseeId, "supervisee"), {
      paymentId,
      pgPaymentKey: "payment-key-idempotent",
      amount: 120000
    });

    const response = await callConfirm(currentUser(superviseeId, "supervisee"), {
      paymentId,
      pgPaymentKey: "payment-key-idempotent",
      amount: 120000
    });
    const body = (await response.json()) as PaymentEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.idempotent).toBe(true);
    await expectRequestStatus(requestId, "awaiting_supervisor_review");
    await expectPaymentCount(1);
  });

  it("rejects confirm amount mismatch without changing state", async () => {
    const { paymentId, requestId } = await createIntent();

    const response = await callConfirm(currentUser(superviseeId, "supervisee"), {
      paymentId,
      pgPaymentKey: "payment-key-wrong",
      amount: 119000
    });
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(422);
    expect(body.error?.code).toBe("amount_mismatch");
    await expectRequestStatus(requestId, "awaiting_payment");
  });

  it("allows supervisees to cancel awaiting_payment requests", async () => {
    const { paymentId, requestId } = await createIntent();

    const response = await callCancel(
      currentUser(superviseeId, "supervisee"),
      requestId
    );
    const body = (await response.json()) as {
      data?: { request?: { status: string } };
    };

    expect(response.status).toBe(200);
    expect(body.data?.request?.status).toBe("cancelled");
    await expectPaymentStatus(paymentId, "cancelled");
  });

  it("creates a requested refund", async () => {
    const { paymentId } = await createPaidPayment("awaiting_supervisor_review");

    const response = await callRefund(
      currentUser(superviseeId, "supervisee"),
      paymentId,
      {
        reason: "슈퍼비전 진행 전 환불 요청"
      }
    );
    const body = (await response.json()) as RefundEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.refund.status).toBe("requested");
  });

  it("approves a full refund and moves the request to refunded", async () => {
    const { paymentId, requestId } = await createPaidPayment(
      "awaiting_supervisor_review"
    );
    const bookingId = await seedBooking(requestId);
    await connectGoogleCalendar();
    await linkGoogleEvent(bookingId, "refund-google-event-1");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const refundId = await createRefund(paymentId, 120000);

    const response = await callAdminApprove(refundId);
    const body = (await response.json()) as RefundEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.refund.paymentStatus).toBe("refunded");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events/refund-google-event-1"),
      expect.objectContaining({ method: "DELETE" })
    );
    await expectRequestStatus(requestId, "refunded");
    await expectBookingStatus(bookingId, "cancelled");
    await expectGoogleEventCancelled(bookingId);
    await expectNotificationKinds(requestId, [
      "refund_approved_supervisee",
      "refund_approved_supervisor"
    ]);
  });

  it("approves a partial refund and keeps the request workflow state", async () => {
    const { paymentId, requestId } = await createPaidPayment(
      "awaiting_supervisor_review"
    );
    const refundId = await createRefund(paymentId, 30000);

    const response = await callAdminApprove(refundId);
    const body = (await response.json()) as RefundEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.refund.paymentStatus).toBe("partially_refunded");
    await expectRequestStatus(requestId, "awaiting_supervisor_review");
  });

  it("rejects a requested refund", async () => {
    const { paymentId } = await createPaidPayment("awaiting_supervisor_review");
    const refundId = await createRefund(paymentId, 30000);

    const response = await callAdminReject(refundId);
    const body = (await response.json()) as RefundEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.refund.status).toBe("rejected");
  });

  it("computes payouts with completed refunds deducted from supervisor net", async () => {
    await createPaidPayment("completed", {
      amountKrw: 120000,
      paidAt: "2026-05-10T00:00:00.000Z"
    });
    const refunded = await createPaidPayment("completed", {
      amountKrw: 80000,
      paidAt: "2026-05-11T00:00:00.000Z"
    });
    const refundId = await createRefund(refunded.paymentId, 20000);
    await callAdminApprove(refundId);

    const response = await callPayoutCompute("2026-05-01", "2026-05-15");
    const body = (await response.json()) as PayoutEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.payouts[0]?.grossKrw).toBe(200000);
    expect(body.data?.payouts[0]?.platformFeeKrw).toBe(40000);
    expect(body.data?.payouts[0]?.netKrw).toBe(140000);
  });

  it("excludes undelivered and refund-pending payments from payout computation", async () => {
    await createPaidPayment("awaiting_supervisor_review", {
      amountKrw: 120000,
      paidAt: "2026-05-10T00:00:00.000Z"
    });
    const refundPending = await createPaidPayment("completed", {
      amountKrw: 80000,
      paidAt: "2026-05-11T00:00:00.000Z"
    });
    await createRefund(refundPending.paymentId, 10000);
    await createPaidPayment("completed", {
      amountKrw: 60000,
      paidAt: "2026-05-12T00:00:00.000Z"
    });

    const response = await callPayoutCompute("2026-05-01", "2026-05-15");
    const body = (await response.json()) as PayoutEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.payouts[0]?.grossKrw).toBe(60000);
    expect(body.data?.payouts[0]?.platformFeeKrw).toBe(12000);
    expect(body.data?.payouts[0]?.netKrw).toBe(48000);
  });

  it("rejects webhooks with invalid signatures", async () => {
    const response = await callWebhook(
      {
        eventId: "evt_bad",
        eventType: "PAYMENT_CONFIRMED",
        orderId: "missing",
        paymentKey: "payment-key",
        amount: 120000
      },
      "wrong"
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe("unauthorized");
  });

  it("handles duplicate webhook events idempotently through payment state", async () => {
    const { paymentId } = await createIntent();
    const payment = await payments.getPaymentById(db, paymentId);

    const payload = {
      eventId: "evt_confirm",
      eventType: "PAYMENT_CONFIRMED",
      orderId: payment?.pgOrderId ?? "",
      paymentKey: "payment-key-webhook",
      amount: 120000
    };
    const first = await callWebhook(payload, signWebhookPayload(payload));
    const second = await callWebhook(payload, signWebhookPayload(payload));
    const firstBody = (await first.json()) as { data?: { processed: boolean } };
    const secondBody = (await second.json()) as { data?: { processed: boolean } };

    expect(firstBody.data?.processed).toBe(true);
    expect(secondBody.data?.processed).toBe(false);
    await expectPaymentCount(1);
  });

  it("reconciles webhook retries when payment is paid but request is still awaiting payment", async () => {
    const { paymentId, requestId } = await createIntent();
    const payment = await payments.getPaymentById(db, paymentId);
    await db.execute(sql`
      update payments
      set status = 'paid',
          paid_at = now(),
          pg_payment_key = 'payment-key-webhook-retry'
      where id = ${paymentId}
    `);

    const payload = {
      eventId: "evt_reconcile_paid_request",
      eventType: "PAYMENT_CONFIRMED",
      orderId: payment?.pgOrderId ?? "",
      paymentKey: "payment-key-webhook-retry",
      amount: 120000
    };
    const response = await callWebhook(payload, signWebhookPayload(payload));
    const body = (await response.json()) as { data?: { processed: boolean } };

    expect(response.status).toBe(200);
    expect(body.data?.processed).toBe(false);
    await expectRequestStatus(requestId, "awaiting_supervisor_review");
  });

  it("upserts payouts when the same period is computed twice", async () => {
    await createPaidPayment("completed", {
      amountKrw: 120000,
      paidAt: "2026-05-10T00:00:00.000Z"
    });

    await callPayoutCompute("2026-05-01", "2026-05-15");
    await callPayoutCompute("2026-05-01", "2026-05-15");

    const rows = rowsOf<{ count: number }>(
      await db.execute(sql`select count(*)::int as count from payouts`)
    );
    expect(rows[0]?.count).toBe(1);
  });

  it("does not overwrite paid payout rows when recomputing a period", async () => {
    await createPaidPayment("completed", {
      amountKrw: 120000,
      paidAt: "2026-05-10T00:00:00.000Z"
    });
    await callPayoutCompute("2026-05-01", "2026-05-15");
    await db.execute(sql`
      update payouts
      set status = 'paid',
          gross_krw = 120000,
          platform_fee_krw = 24000,
          net_krw = 96000,
          paid_at = now()
    `);
    await createPaidPayment("completed", {
      amountKrw: 80000,
      paidAt: "2026-05-11T00:00:00.000Z"
    });

    const response = await callPayoutCompute("2026-05-01", "2026-05-15");
    const body = (await response.json()) as PayoutEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.payouts[0]?.status).toBe("paid");
    expect(body.data?.payouts[0]?.grossKrw).toBe(120000);
    expect(body.data?.payouts[0]?.netKrw).toBe(96000);
  });
});

type ApiEnvelope = {
  error: { code: string } | null;
};

type PaymentIntentEnvelope = {
  data?: { paymentId: string; pgOrderId: string; amount: number };
  error: { code: string } | null;
};

type PaymentEnvelope = {
  data?: { payment: payments.PaymentRecord; idempotent?: boolean };
  error: { code: string } | null;
};

type RefundEnvelope = {
  data?: { refund: payments.RefundRecord };
  error: { code: string } | null;
};

type PayoutEnvelope = {
  data?: { payouts: payments.PayoutRecord[] };
  error: { code: string } | null;
};

async function createIntent(): Promise<{ paymentId: string; requestId: string }> {
  const requestId = await seedRequest("submitted");
  const response = await callIntent(currentUser(superviseeId, "supervisee"), requestId);
  const body = (await response.json()) as PaymentIntentEnvelope;
  return { paymentId: body.data?.paymentId ?? "", requestId };
}

async function createPaidPayment(
  requestStatus: "paid" | "awaiting_supervisor_review" | "completed",
  options: { amountKrw?: number; paidAt?: string } = {}
): Promise<{ paymentId: string; requestId: string }> {
  const amountKrw = options.amountKrw ?? 120000;
  const fee = Math.floor(amountKrw * 0.2);
  const requestId = await seedRequest(requestStatus);
  const paymentId = randomUUID();
  await db.execute(sql`
    insert into payments (
      id,
      supervision_request_id,
      amount_krw,
      platform_fee_krw,
      supervisor_net_krw,
      pg_order_id,
      pg_payment_key,
      status,
      paid_at
    ) values (
      ${paymentId},
      ${requestId},
      ${amountKrw},
      ${fee},
      ${amountKrw - fee},
      ${`order-${paymentId}`},
      ${`payment-key-${paymentId}`},
      'paid',
      ${options.paidAt ?? "2026-05-10T00:00:00.000Z"}
    )
  `);
  return { paymentId, requestId };
}

async function createRefund(paymentId: string, amountKrw: number): Promise<string> {
  const refund = await withUserContext(
    db,
    { userId: superviseeId, role: "supervisee" },
    (tx) =>
      payments.createRefundRequest(tx, {
        paymentId,
        amountKrw,
        reason: "환불 요청",
        initiatedBy: superviseeId
      })
  );
  return refund?.id ?? "";
}

async function seedBooking(requestId: string): Promise<string> {
  const bookingId = randomUUID();
  await db.execute(sql`
    insert into bookings (
      id,
      supervision_request_id,
      scheduled_start,
      scheduled_end,
      status
    ) values (
      ${bookingId},
      ${requestId},
      '2026-06-01T01:00:00.000Z',
      '2026-06-01T02:00:00.000Z',
      'scheduled'
    )
  `);
  return bookingId;
}

async function connectGoogleCalendar(): Promise<void> {
  process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
  await withUserContext(
    db,
    { userId: supervisorId, role: "supervisor", phiAccess: true },
    async (tx) =>
      calendar.upsertGoogleConnection(tx, {
        accessToken: "google-access-token",
        accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        calendarId: "primary",
        providerAccountEmail: "pay-supervisor@example.com",
        refreshToken: "google-refresh-token",
        userId: supervisorId
      })
  );
}

async function linkGoogleEvent(
  bookingId: string,
  providerEventId: string
): Promise<void> {
  await withUserContext(db, { userId: superviseeId, role: "supervisee" }, async (tx) =>
    calendar.createCalendarEventLink(tx, { bookingId, providerEventId })
  );
}

async function callIntent(current: CurrentUser, requestId: string): Promise<Response> {
  mockWebRuntime(current);
  const { POST } = await import("../../app/api/payments/intent/route");
  return POST(jsonRequest({ supervisionRequestId: requestId }));
}

async function callConfirm(
  current: CurrentUser,
  body: { paymentId: string; pgPaymentKey: string; amount: number }
): Promise<Response> {
  mockWebRuntime(current);
  const { POST } = await import("../../app/api/payments/confirm/route");
  return POST(jsonRequest(body));
}

async function callCancel(current: CurrentUser, requestId: string): Promise<Response> {
  mockWebRuntime(current);
  const { POST } = await import("../../app/api/supervision-requests/[id]/cancel/route");
  return POST(jsonRequest({}), { params: Promise.resolve({ id: requestId }) });
}

async function callRefund(
  current: CurrentUser,
  paymentId: string,
  body: { amount?: number; reason: string }
): Promise<Response> {
  mockWebRuntime(current);
  const { POST } = await import("../../app/api/payments/[id]/refund/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: paymentId }) });
}

async function callWebhook(payload: unknown, signature: string): Promise<Response> {
  mockWebhookRuntime();
  const { POST } = await import("../../app/api/payments/webhook/route");
  const rawBody = JSON.stringify(payload);
  return POST(
    new NextRequest("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "toss-signature": signature
      },
      body: rawBody
    })
  );
}

function signWebhookPayload(payload: unknown): string {
  return signDevTossWebhookPayload(JSON.stringify(payload), "test-webhook-secret");
}

async function callAdminApprove(refundId: string): Promise<Response> {
  mockAdminRuntime();
  const { POST } =
    await import("../../../../admin/src/app/api/admin/refunds/[id]/approve/route");
  return POST(adminRequest({ reason: adminReason }), {
    params: Promise.resolve({ id: refundId })
  });
}

async function callAdminReject(refundId: string): Promise<Response> {
  mockAdminRuntime();
  const { POST } =
    await import("../../../../admin/src/app/api/admin/refunds/[id]/reject/route");
  return POST(adminRequest({ reason: adminReason }), {
    params: Promise.resolve({ id: refundId })
  });
}

async function callPayoutCompute(
  periodStart: string,
  periodEnd: string
): Promise<Response> {
  mockAdminRuntime();
  const { POST } =
    await import("../../../../admin/src/app/api/admin/payouts/compute/route");
  return POST(adminRequest({ periodStart, periodEnd }));
}

function mockWebRuntime(current: CurrentUser): void {
  vi.resetModules();
  vi.doMock("@/lib/auth/current-user", () => ({
    getCurrentUser: () => Promise.resolve(current)
  }));
  vi.doMock("@/lib/auth/database", () => ({
    createRuntimeDatabase: () => db,
    createAuthDatabase: () => db
  }));
}

function mockWebhookRuntime(): void {
  vi.resetModules();
  vi.doMock("@/lib/auth/database", () => ({
    createRuntimeDatabase: () => db,
    createAuthDatabase: () => db
  }));
}

function mockAdminRuntime(): void {
  vi.resetModules();
  const envelopeMock = () => ({
    apiError: (code: string, message: string) => ({ code, message }),
    envelope: (data: unknown, error: unknown, status: number) =>
      Response.json(
        { data, error },
        {
          status,
          headers: { "X-Robots-Tag": "noindex" }
        }
      )
  });
  const adminMock = () => ({
    getCurrentAdmin: () => Promise.resolve(currentUser(adminId, "admin")),
    createRuntimeDatabase: () => db,
    createServiceDatabase: () => db
  });
  vi.doMock("@/lib/api/envelope", envelopeMock);
  vi.doMock("@/lib/auth/current-admin", adminMock);
  vi.doMock("../../../../admin/src/lib/api/envelope", envelopeMock);
  vi.doMock("../../../../admin/src/lib/auth/current-admin", adminMock);
}

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/payments/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function adminRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-reason": adminReason
    },
    body: JSON.stringify(body)
  });
}

function currentUser(
  userId: string,
  role: "supervisee" | "supervisor" | "admin"
): CurrentUser {
  return {
    session: {
      userId,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
      sessionId: "test"
    },
    user: {
      id: userId,
      email: `${role}@example.com`,
      role,
      status: "active",
      totpSecretEnc: null,
      totpEnabled: role === "admin",
      passwordChangedAt: null
    }
  };
}

async function expectRequestStatus(requestId: string, status: string): Promise<void> {
  const rows = rowsOf<{ status: string }>(
    await db.execute(
      sql`select status from supervision_requests where id = ${requestId}`
    )
  );
  expect(rows[0]?.status).toBe(status);
}

async function expectBookingStatus(bookingId: string, status: string): Promise<void> {
  const rows = rowsOf<{ status: string }>(
    await db.execute(sql`select status from bookings where id = ${bookingId}`)
  );
  expect(rows[0]?.status).toBe(status);
}

async function expectGoogleEventCancelled(bookingId: string): Promise<void> {
  const rows = rowsOf<{ cancelledAt: Date | string | null }>(
    await db.execute(sql`
      select cancelled_at as "cancelledAt"
      from external_calendar_events
      where booking_id = ${bookingId}
    `)
  );
  expect(rows[0]?.cancelledAt).toBeTruthy();
}

async function expectPaymentCount(count: number): Promise<void> {
  const rows = rowsOf<{ count: number }>(
    await db.execute(sql`select count(*)::int as count from payments`)
  );
  expect(rows[0]?.count).toBe(count);
}

async function expectPaymentStatus(paymentId: string, status: string): Promise<void> {
  const rows = rowsOf<{ status: string }>(
    await db.execute(sql`select status from payments where id = ${paymentId}`)
  );
  expect(rows[0]?.status).toBe(status);
}

async function expectNotificationKinds(
  requestId: string,
  expectedKinds: string[]
): Promise<void> {
  const rows = rowsOf<{ kind: string }>(
    await db.execute(sql`
      select kind
      from notifications
      where payload->'metadata'->>'requestId' = ${requestId}
      order by kind
    `)
  );
  expect(rows.map((row) => row.kind)).toEqual([...expectedKinds].sort());
}

async function seedRequest(status: string, userId = superviseeId): Promise<string> {
  const requestId = randomUUID();
  await db.execute(sql`
    insert into supervision_requests (
      id,
      supervisee_id,
      supervisor_id,
      service_product_id,
      status,
      retention_days,
      retention_expires_at,
      urgency
    ) values (
      ${requestId},
      ${userId},
      ${supervisorId},
      ${productId},
      ${status},
      30,
      now() + interval '30 days',
      'normal'
    )
  `);
  return requestId;
}

async function applyMigrations(): Promise<void> {
  for (const migration of migrations) {
    const statements = readFileSync(migration, "utf8")
      .replace(
        /CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint\n?/u,
        ""
      )
      .split(/--> statement-breakpoint/g)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pg.query(statement);
    }
  }

  await pg.query(`
    create or replace function pgp_sym_encrypt(data text, key text, options text)
    returns bytea
    language sql
    immutable
    as $$ select convert_to(data, 'UTF8') $$
  `);
  await pg.query(`
    create or replace function pgp_sym_decrypt(data bytea, key text, options text)
    returns text
    language sql
    immutable
    as $$ select convert_from(data, 'UTF8') $$
  `);
}

async function seedDomain(): Promise<void> {
  await db.execute(sql`
    insert into users (id, email, role, password_hash, totp_enabled)
    values
      (${superviseeId}, 'pay-supervisee@example.com', 'supervisee', 'hash', false),
      (${otherSuperviseeId}, 'pay-other@example.com', 'supervisee', 'hash', false),
      (${supervisorId}, 'pay-supervisor@example.com', 'supervisor', 'hash', true),
      (${adminId}, 'pay-admin@example.com', 'admin', 'hash', true)
  `);
  await db.execute(sql`
    insert into supervisor_profiles (
      id,
      user_id,
      display_name,
      verification_status,
      visibility
    ) values (
      ${supervisorProfileId},
      ${supervisorId},
      '결제 테스트 슈퍼바이저',
      'approved',
      'public'
    )
  `);
  await db.execute(sql`
    insert into service_products (
      id,
      supervisor_profile_id,
      kind,
      title,
      price_krw,
      active
    ) values (
      ${productId},
      ${supervisorProfileId},
      'async_comment',
      '결제 테스트 상품',
      120000,
      true
    )
  `);
}

function rowsOf<TRow>(result: TRow[] | { rows: TRow[] }): TRow[] {
  return Array.isArray(result) ? result : result.rows;
}
