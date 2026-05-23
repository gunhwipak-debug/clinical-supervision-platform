import { payments, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { refundRequestSchema } from "@/lib/payments/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const REFUND_CUTOFF_MS = 24 * 60 * 60 * 1000;
const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (
    current.session.role === "admin" &&
    (request.headers.get("x-admin-reason") ?? "").trim().length < 30
  ) {
    return envelope(
      null,
      apiError("admin_reason_required", "관리자 작업 사유를 30자 이상 입력해주세요."),
      403
    );
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = refundRequestSchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "환불 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(db, contextFor(current, request), async (tx) => {
    const payment = await payments.getPaymentById(tx, parsedParams.data.id);
    if (!payment) return { kind: "not_found" as const };
    if (
      current.session.role !== "admin" &&
      payment.superviseeId !== current.session.userId
    ) {
      return { kind: "forbidden" as const };
    }
    if (payment.status !== "paid" && payment.status !== "partially_refunded") {
      return { kind: "invalid_state" as const };
    }
    if (current.session.role !== "admin") {
      const detail = await supervision.getSupervisionRequestDetails(
        tx,
        payment.supervisionRequestId
      );
      const scheduledStart = detail?.scheduledStart
        ? new Date(detail.scheduledStart)
        : null;
      if (
        scheduledStart &&
        scheduledStart.getTime() - Date.now() < REFUND_CUTOFF_MS &&
        detail?.status !== "completed"
      ) {
        return { kind: "refund_cutoff" as const };
      }
    }

    const refund = await payments.createRefundRequest(tx, {
      paymentId: payment.id,
      amountKrw: parsedBody.data.amount ?? payment.amountKrw,
      reason: parsedBody.data.reason,
      initiatedBy: current.session.userId
    });

    if (!refund) return { kind: "amount_mismatch" as const };
    return { kind: "ok" as const, refund };
  });

  if (result.kind === "forbidden") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 결제 상태에서는 처리할 수 없습니다."),
      409
    );
  }
  if (result.kind === "amount_mismatch") {
    return envelope(
      null,
      apiError("amount_mismatch", "환불 금액이 올바르지 않습니다."),
      422
    );
  }
  if (result.kind === "refund_cutoff") {
    return envelope(
      null,
      apiError(
        "refund_cutoff",
        "세션 시작 24시간 전부터는 자동 환불 요청 대신 관리자 문의가 필요합니다."
      ),
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

  return envelope({ refund: result.refund }, null, 200);
}
