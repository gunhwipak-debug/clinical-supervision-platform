import { getTossClient } from "@csp/shared/payments/toss";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { payments, profiles, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "../../../../../../lib/api/envelope";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../../../../lib/auth/current-admin";
import { cancelRequestBookingAndGoogleEvent } from "../../../../../../lib/calendar-sync";
import {
  sendManyAdminNotifications,
  type SendAdminNotificationInput
} from "../../../../../../lib/notifications";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ reason: z.string().trim().min(30).max(1000) });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentAdmin();
  if (!current) return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "환불 승인 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const tossClient = getTossClient();
  const result = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: parsedBody.data.reason,
      phiAccess: true
    },
    async (tx) => {
      const refund = await payments.getRefundById(tx, parsedParams.data.id);
      if (!refund) return { kind: "not_found" as const };
      if (refund.status !== "requested" || !refund.paymentKey) {
        return { kind: "invalid_state" as const };
      }

      await tossClient.refund({
        paymentKey: refund.paymentKey,
        cancelAmount: refund.amountKrw,
        cancelReason: parsedBody.data.reason
      });

      const completed = await payments.completeRefund(tx, refund.id);
      if (!completed) return { kind: "invalid_state" as const };

      await profiles.tryInsertAuditLog(tx, {
        actorUserId: current.session.userId,
        actorRole: "admin",
        action: "refund.approve",
        targetType: "refund",
        targetId: refund.id,
        reason: parsedBody.data.reason
      });

      if (completed.paymentStatus === "refunded") {
        assertTransition(completed.requestStatus, "refunded", "admin");
        await supervision.updateSupervisionRequestStatus(
          tx,
          completed.supervisionRequestId,
          "refunded",
          completed.requestStatus
        );
        await cancelRequestBookingAndGoogleEvent(tx, completed.supervisionRequestId);
      }

      const target = await supervision.getSupervisionRequestDetails(
        tx,
        completed.supervisionRequestId
      );
      return { kind: "ok" as const, refund: completed, request: target };
    }
  );

  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 환불 상태에서는 처리할 수 없습니다."),
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

  if (result.request) {
    const origin = new URL(request.url).origin;
    const items: SendAdminNotificationInput[] = [
      {
        body: "관리자가 환불 요청을 승인했습니다. 결제와 예약 상태를 확인해주세요.",
        href: `/payments/${result.refund.paymentId}`,
        kind: "refund_approved_supervisee",
        metadata: {
          paymentId: result.refund.paymentId,
          refundId: result.refund.id,
          requestId: result.refund.supervisionRequestId
        },
        origin,
        target: { role: "supervisee" as const, userId: result.request.superviseeId },
        title: "환불이 승인되었습니다"
      }
    ];

    if (result.request.supervisorId) {
      items.push({
        body: "관리자가 환불 요청을 승인했습니다. 전액 환불이면 연결된 예약 일정도 취소됩니다.",
        href: `/supervisor/requests/${result.refund.supervisionRequestId}`,
        kind: "refund_approved_supervisor",
        metadata: {
          paymentId: result.refund.paymentId,
          refundId: result.refund.id,
          requestId: result.refund.supervisionRequestId
        },
        origin,
        target: { role: "supervisor" as const, userId: result.request.supervisorId },
        title: "담당 의뢰 환불이 승인되었습니다"
      });
    }

    await sendManyAdminNotifications(db, items);
  }

  return envelope({ refund: result.refund }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
