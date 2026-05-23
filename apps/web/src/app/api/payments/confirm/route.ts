import { getTossClient } from "@csp/shared/payments/toss";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { payments, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { sendManyNotifications, type SendNotificationInput } from "@/lib/notifications";
import { paymentConfirmSchema } from "@/lib/payments/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paymentConfirmSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "결제 승인 정보가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const tossClient = getTossClient();
  const result = await withUserContext(db, contextFor(current), async (tx) => {
    const payment = await payments.getPaymentById(tx, parsed.data.paymentId);
    if (!payment) return { kind: "not_found" as const };
    if (payment.superviseeId !== current.session.userId) {
      return { kind: "forbidden" as const };
    }
    if (payment.amountKrw !== parsed.data.amount) {
      return { kind: "amount_mismatch" as const };
    }
    if (
      payment.status === "paid" &&
      payment.pgPaymentKey === parsed.data.pgPaymentKey
    ) {
      return { kind: "ok" as const, payment, idempotent: true };
    }
    if (payment.status !== "pending" || payment.requestStatus !== "awaiting_payment") {
      return { kind: "invalid_state" as const };
    }

    const confirmed = await tossClient.confirm({
      paymentId: payment.id,
      orderId: payment.pgOrderId,
      paymentKey: parsed.data.pgPaymentKey,
      amount: parsed.data.amount
    });
    if (confirmed.amount !== payment.amountKrw) {
      return { kind: "amount_mismatch" as const };
    }

    assertTransition("awaiting_payment", "paid", "system");
    assertTransition("paid", "awaiting_supervisor_review", "system");
    const paid = await payments.markPaymentPaid(tx, {
      paymentId: payment.id,
      paymentKey: parsed.data.pgPaymentKey
    });
    if (!paid) return { kind: "invalid_state" as const };

    const paidStatus = await supervision.updateSupervisionRequestStatus(
      tx,
      payment.supervisionRequestId,
      "paid",
      "awaiting_payment"
    );
    if (!paidStatus) return { kind: "invalid_state" as const };
    const reviewStatus = await supervision.updateSupervisionRequestStatus(
      tx,
      payment.supervisionRequestId,
      "awaiting_supervisor_review",
      "paid"
    );
    if (!reviewStatus) return { kind: "invalid_state" as const };

    return { kind: "ok" as const, payment: paid, idempotent: false };
  });

  if (result.kind === "forbidden") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (result.kind === "amount_mismatch") {
    return envelope(
      null,
      apiError("amount_mismatch", "결제 금액이 일치하지 않습니다."),
      422
    );
  }
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 결제 상태에서는 처리할 수 없습니다."),
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

  if (!result.idempotent) {
    const origin = new URL(request.url).origin;
    const notifications: SendNotificationInput[] = [
      {
        body: "결제가 완료되었습니다. 슈퍼바이저가 의뢰 내용을 검토하면 다음 단계가 표시됩니다.",
        href: `/requests/${result.payment.supervisionRequestId}`,
        kind: "payment_confirmed_supervisee",
        metadata: {
          paymentId: result.payment.id,
          requestId: result.payment.supervisionRequestId
        },
        origin,
        target: { role: "supervisee" as const, userId: result.payment.superviseeId },
        title: "결제가 완료되었습니다"
      }
    ];

    if (result.payment.supervisorId) {
      notifications.push({
        body: "결제가 완료되어 새 의뢰가 검토 대기열에 들어왔습니다. 의뢰 내용을 확인하고 수락 또는 거절을 선택해주세요.",
        href: `/supervisor/requests/${result.payment.supervisionRequestId}`,
        kind: "payment_confirmed_supervisor",
        metadata: {
          paymentId: result.payment.id,
          requestId: result.payment.supervisionRequestId
        },
        origin,
        target: { role: "supervisor" as const, userId: result.payment.supervisorId },
        title: "검토 대기 의뢰가 도착했습니다"
      });
    }

    await sendManyNotifications(db, notifications);
  }

  return envelope(
    { payment: result.payment, idempotent: result.idempotent },
    null,
    200
  );
}
