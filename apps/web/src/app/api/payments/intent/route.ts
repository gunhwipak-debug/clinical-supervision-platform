import { randomUUID } from "node:crypto";
import { getTossClient } from "@csp/shared/payments/toss";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { payments, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { paymentIntentSchema, platformFee } from "@/lib/payments/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paymentIntentSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "결제 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const tossClient = getTossClient();
  const result = await withUserContext(db, contextFor(current), async (tx) => {
    const source = await payments.getIntentSource(tx, parsed.data.supervisionRequestId);
    if (!source) return { kind: "not_found" as const };
    if (source.superviseeId !== current.session.userId) {
      return { kind: "forbidden" as const };
    }
    if (source.status === "awaiting_payment") {
      const existing = await payments.getPendingPaymentForRequest(tx, source.requestId);
      if (!existing) return { kind: "invalid_state" as const };
      const intent = await tossClient.createIntent({
        paymentId: existing.id,
        amount: existing.amountKrw,
        orderName: source.productTitle,
        customerEmail: current.user.email
      });
      return { kind: "ok" as const, payment: existing, intent };
    }
    if (source.status !== "submitted") {
      return { kind: "invalid_state" as const };
    }

    assertTransition("submitted", "awaiting_payment", "supervisee");
    const paymentId = randomUUID();
    const fee = platformFee(source.priceKrw);
    const intent = await tossClient.createIntent({
      paymentId,
      amount: source.priceKrw,
      orderName: source.productTitle,
      customerEmail: current.user.email
    });

    const updated = await supervision.updateSupervisionRequestStatus(
      tx,
      source.requestId,
      "awaiting_payment",
      "submitted"
    );
    if (!updated) return { kind: "invalid_state" as const };

    const payment = await payments.createPendingPayment(tx, {
      id: paymentId,
      supervisionRequestId: source.requestId,
      amountKrw: source.priceKrw,
      platformFeeKrw: fee,
      supervisorNetKrw: source.priceKrw - fee,
      pgOrderId: intent.orderId
    });
    if (!payment) return { kind: "not_found" as const };

    return { kind: "ok" as const, payment, intent };
  });

  if (result.kind === "forbidden") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 의뢰 상태에서는 결제를 시작할 수 없습니다."),
      409
    );
  }
  if (result.kind === "not_found") {
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  }

  return envelope(
    {
      paymentId: result.payment.id,
      pgOrderId: result.payment.pgOrderId,
      amount: result.payment.amountKrw,
      paymentMode: paymentRuntimeMode(),
      tossClientPayload: result.intent
    },
    null,
    200
  );
}

function paymentRuntimeMode(): "dev" | "prod" {
  return process.env["NODE_ENV"] !== "production" && process.env["TOSS_MODE"] === "dev"
    ? "dev"
    : "prod";
}
