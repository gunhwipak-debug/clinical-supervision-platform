import { calendar, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import {
  getGoogleCalendarConfig,
  googleCalendarBlockReason,
  listBusyIntervalsForConnection
} from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const db = createRuntimeDatabase();
  const connection = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: current.session.role,
      phiAccess: true
    },
    (tx) => calendar.getConnectionForUser(tx, current.session.userId)
  );

  if (!connection) {
    return envelope(
      null,
      apiError("calendar_not_connected", "구글 캘린더가 아직 연동되지 않았습니다."),
      404
    );
  }

  const config = getGoogleCalendarConfig(new URL(request.url).origin);
  const calendarBlock = googleCalendarBlockReason(connection, config);
  if (calendarBlock === "calendar_config_required") {
    return envelope(
      null,
      apiError(
        "calendar_config_required",
        "서비스의 구글 캘린더 OAuth 설정이 없어 연동 상태를 점검할 수 없습니다."
      ),
      503
    );
  }
  if (calendarBlock === "calendar_reauth_required") {
    await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => calendar.markConnectionStatus(tx, connection.id, "needs_reauth")
    );
    return envelope(
      null,
      apiError("calendar_reauth_required", "구글 캘린더 재인증이 필요합니다."),
      409
    );
  }
  if (calendarBlock === "calendar_sync_failed") {
    await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => calendar.markConnectionStatus(tx, connection.id, "error")
    ).catch(() => undefined);
  }

  const now = new Date();
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);

  try {
    const busy = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => listBusyIntervalsForConnection(tx, connection, config, now, twoWeeksLater)
    );

    return envelope(
      {
        busyCount: busy.length,
        checkedAt: new Date().toISOString(),
        providerAccountEmail: connection.providerAccountEmail
      },
      null,
      200
    );
  } catch {
    return envelope(
      null,
      apiError(
        "calendar_sync_failed",
        "구글 캘린더 연동 상태를 확인하지 못했습니다."
      ),
      422
    );
  }
}
