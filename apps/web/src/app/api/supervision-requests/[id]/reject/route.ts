import { assertTransition } from "@csp/shared/supervision/status-machine";
import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { cancelRequestBookingAndGoogleEvent } from "@/lib/calendar-sync";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ reason: z.string().min(2).max(500).optional() });

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

  const parsed = paramsSchema.safeParse(await context.params);
  const body = bodySchema.safeParse(await parseJson(request));
  if (!parsed.success || !body.success) {
    return envelope(
      null,
      apiError("invalid_request", "요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(
    db,
    contextFor(current, request, { phiAccess: true }),
    async (tx) => {
      const target = await supervision.getSupervisionRequestDetails(tx, parsed.data.id);
      if (!target) return { kind: "not_found" as const };
      if (target.supervisorId !== current.session.userId) {
        return { kind: "forbidden" as const };
      }
      if (target.status !== "awaiting_supervisor_review") {
        return { kind: "invalid_state" as const };
      }
      assertTransition("awaiting_supervisor_review", "rejected", "supervisor");
      const updated = await supervision.updateSupervisionRequestStatus(
        tx,
        target.id,
        "rejected",
        "awaiting_supervisor_review"
      );
      const calendarSync = await cancelRequestBookingAndGoogleEvent(tx, {
        origin: new URL(request.url).origin,
        requestId: target.id
      });

      return {
        calendarSync,
        kind: updated ? ("ok" as const) : ("invalid_state" as const),
        request: updated
      };
    }
  );

  if (result.kind === "not_found")
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (result.kind === "forbidden")
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  if (result.request?.superviseeId) {
    await sendUserNotification(db, {
      body: "슈퍼바이저가 의뢰를 거절했습니다. 예약 일정은 취소되었고 필요한 경우 다른 슈퍼바이저를 선택할 수 있습니다.",
      href: `/requests/${parsed.data.id}`,
      kind: "supervision_request_rejected_supervisee",
      metadata: { requestId: parsed.data.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisee", userId: result.request.superviseeId },
      title: "의뢰가 거절되었습니다"
    });
  }

  return envelope(
    { calendarSync: result.calendarSync, request: result.request },
    null,
    200
  );
}
