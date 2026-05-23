import { assertTransition } from "@csp/shared/supervision/status-machine";
import { payments, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { cancelRequestBookingAndGoogleEvent } from "@/lib/calendar-sync";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "의뢰 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const basic = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, parsed.data.id)
  );

  if (!basic)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (!isRequestOwner(current, basic)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  try {
    assertTransition(basic.status, "cancelled", "supervisee");
  } catch {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 의뢰를 취소할 수 없습니다."),
      409
    );
  }

  const updated = await withUserContext(db, contextFor(current), (tx) =>
    supervision.updateSupervisionRequestStatus(tx, parsed.data.id, "cancelled")
  );
  await withUserContext(db, contextFor(current), (tx) =>
    payments.cancelPendingPaymentsForRequest(tx, parsed.data.id)
  );

  const calendarSync = basic.supervisorId
    ? await withUserContext(
        db,
        { userId: basic.supervisorId, role: "supervisor", phiAccess: true },
        (tx) =>
          cancelRequestBookingAndGoogleEvent(tx, {
            origin: new URL(request.url).origin,
            requestId: parsed.data.id
          })
      )
    : "no_event";

  if (basic.supervisorId) {
    await sendUserNotification(db, {
      body: cancelNotificationBody(calendarSync),
      href: `/supervisor/requests/${parsed.data.id}`,
      kind: "supervision_request_cancelled_supervisor",
      metadata: { requestId: parsed.data.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisor", userId: basic.supervisorId },
      title: "의뢰가 취소되었습니다"
    });
  }

  return envelope({ calendarSync, request: updated }, null, 200);
}

function cancelNotificationBody(calendarSync: string): string {
  if (calendarSync === "cancelled") {
    return "슈퍼바이지가 예약된 슈퍼비전 의뢰를 취소했습니다. 연결된 구글 캘린더 일정도 함께 정리되었습니다.";
  }
  if (calendarSync === "needs_reauth_or_config" || calendarSync === "failed") {
    return "슈퍼바이지가 예약된 슈퍼비전 의뢰를 취소했습니다. 구글 캘린더 일정은 자동 정리에 실패했으니 캘린더에서 직접 확인해주세요.";
  }
  return "슈퍼바이지가 예약된 슈퍼비전 의뢰를 취소했습니다.";
}
