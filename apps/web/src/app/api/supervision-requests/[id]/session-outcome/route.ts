import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { sendManyNotifications } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  outcome: z.enum(["completed", "no_show_supervisee", "no_show_supervisor"])
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.session.role !== "supervisor") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "세션 결과 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(db, contextFor(current), async (tx) => {
    const detail = await supervision.getSupervisionRequestDetails(
      tx,
      parsedParams.data.id
    );
    if (!detail) return { kind: "not_found" as const };
    if (detail.supervisorId !== current.session.userId) {
      return { kind: "forbidden" as const };
    }
    if (!canRecordOutcome(detail.status)) {
      return { kind: "invalid_state" as const };
    }
    if (
      !detail.scheduledEnd ||
      (detail.bookingStatus !== "scheduled" && detail.bookingStatus !== "rescheduled")
    ) {
      return { kind: "booking_not_found" as const };
    }
    const scheduledEnd = new Date(detail.scheduledEnd);
    if (Number.isNaN(scheduledEnd.getTime()) || scheduledEnd.getTime() > Date.now()) {
      return { kind: "session_not_ended" as const };
    }
    const booking = await supervision.updateBookingOutcomeForRequest(tx, {
      requestId: detail.id,
      status: parsedBody.data.outcome
    });
    if (!booking) return { kind: "booking_not_found" as const };
    return { detail, kind: "ok" as const };
  });

  if (result.kind === "not_found")
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (result.kind === "forbidden")
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  if (result.kind === "booking_not_found")
    return envelope(
      null,
      apiError("booking_not_found", "결과를 기록할 예약을 찾을 수 없습니다."),
      404
    );
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 세션 결과를 기록할 수 없습니다."),
      409
    );
  }
  if (result.kind === "session_not_ended") {
    return envelope(
      null,
      apiError("session_not_ended", "세션 종료 시간이 지난 뒤 결과를 기록할 수 있습니다."),
      409
    );
  }

  const label = outcomeLabel(parsedBody.data.outcome);
  await sendManyNotifications(db, [
    {
      body: `슈퍼비전 세션 결과가 '${label}'로 기록되었습니다.`,
      href: `/requests/${parsedParams.data.id}`,
      kind: "session_outcome_supervisee",
      metadata: { outcome: parsedBody.data.outcome, requestId: parsedParams.data.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisee", userId: result.detail.superviseeId },
      title: "세션 결과가 기록되었습니다"
    },
    {
      body: `슈퍼비전 세션 결과가 '${label}'로 기록되었습니다.`,
      href: `/supervisor/requests/${parsedParams.data.id}`,
      kind: "session_outcome_supervisor",
      metadata: { outcome: parsedBody.data.outcome, requestId: parsedParams.data.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisor", userId: current.session.userId },
      title: "세션 결과가 기록되었습니다"
    }
  ]);

  const updated = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, parsedParams.data.id)
  );
  return envelope({ request: updated }, null, 200);
}

function canRecordOutcome(status: string): boolean {
  return ["accepted", "in_review", "meeting_scheduled"].includes(status);
}

function outcomeLabel(outcome: z.infer<typeof bodySchema>["outcome"]): string {
  const labels = {
    completed: "세션 완료",
    no_show_supervisee: "슈퍼바이지 불참",
    no_show_supervisor: "슈퍼바이저 불참"
  };
  return labels[outcome];
}
