import { getTossClient, TossWebhookSignatureError } from "@csp/shared/payments/toss";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { payments, supervision } from "@csp/db";
import type { SupervisionStatus } from "@csp/shared/supervision/status-machine";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const tossClient = getTossClient();
  const rawBody = await request.text();
  let event;
  try {
    event = await tossClient.parseWebhook({
      signature: request.headers.get("toss-signature"),
      rawBody,
      payload: rawBody
    });
  } catch (error) {
    if (error instanceof TossWebhookSignatureError) {
      return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
    }
    return envelope(
      null,
      apiError("invalid_request", "웹훅 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createAuthDatabase();
  if (event.eventType !== "PAYMENT_CONFIRMED") {
    return envelope({ ok: true, processed: false }, null, 200);
  }

  const payment = await payments.getPaymentByOrderId(db, event.orderId);
  if (!payment)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (event.amount !== payment.amountKrw || !event.paymentKey) {
    return envelope(
      null,
      apiError("amount_mismatch", "결제 금액이 일치하지 않습니다."),
      422
    );
  }
  if (payment.status === "paid" || payment.status === "partially_refunded") {
    const reconciled = await reconcilePaidRequest(db, payment);
    if (!reconciled) return reconciliationFailed(event.eventId);
    return envelope({ ok: true, processed: false, eventId: event.eventId }, null, 200);
  }
  if (payment.status !== "pending" || payment.requestStatus !== "awaiting_payment") {
    return envelope(
      null,
      apiError("invalid_state", "현재 결제 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  assertTransition("awaiting_payment", "paid", "system");
  assertTransition("paid", "awaiting_supervisor_review", "system");
  const paid = await payments.markPaymentPaid(db, {
    paymentId: payment.id,
    paymentKey: event.paymentKey
  });
  if (!paid) {
    const latest = await payments.getPaymentByOrderId(db, event.orderId);
    if (!latest || latest.status !== "paid") {
      return reconciliationFailed(event.eventId);
    }
    const reconciled = await reconcilePaidRequest(db, latest);
    if (!reconciled) return reconciliationFailed(event.eventId);
    return envelope({ ok: true, processed: false, eventId: event.eventId }, null, 200);
  }

  const reconciled = await reconcilePaidRequest(db, paid);
  if (!reconciled) return reconciliationFailed(event.eventId);

  return envelope({ ok: true, processed: true, eventId: event.eventId }, null, 200);
}

async function reconcilePaidRequest(
  db: Parameters<typeof payments.getPaymentByOrderId>[0],
  payment: payments.PaymentRecord
): Promise<boolean> {
  if (payment.requestStatus === "awaiting_payment") {
    assertTransition("awaiting_payment", "paid", "system");
    assertTransition("paid", "awaiting_supervisor_review", "system");
    const paidStatus = await supervision.updateSupervisionRequestStatus(
      db,
      payment.supervisionRequestId,
      "paid",
      "awaiting_payment"
    );
    if (!paidStatus) return false;
    const reviewStatus = await supervision.updateSupervisionRequestStatus(
      db,
      payment.supervisionRequestId,
      "awaiting_supervisor_review",
      "paid"
    );
    return Boolean(reviewStatus);
  }

  if (payment.requestStatus === "paid") {
    assertTransition("paid", "awaiting_supervisor_review", "system");
    const reviewStatus = await supervision.updateSupervisionRequestStatus(
      db,
      payment.supervisionRequestId,
      "awaiting_supervisor_review",
      "paid"
    );
    return Boolean(reviewStatus);
  }

  return isPostPaymentRequestStatus(payment.requestStatus);
}

function isPostPaymentRequestStatus(status: SupervisionStatus): boolean {
  return [
    "awaiting_supervisor_review",
    "accepted",
    "additional_info_requested",
    "in_review",
    "feedback_submitted",
    "meeting_scheduled",
    "meeting_completed",
    "completion_record_issued",
    "completed",
    "rejected",
    "refunded",
    "expired"
  ].includes(status);
}

function reconciliationFailed(eventId: string) {
  return envelope(
    { ok: false, processed: false, eventId },
    apiError(
      "payment_reconciliation_failed",
      "결제는 확인되었지만 내부 상태 반영이 완료되지 않았습니다. 웹훅 재시도가 필요합니다."
    ),
    500
  );
}
