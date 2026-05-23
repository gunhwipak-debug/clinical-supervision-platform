import { calendar, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import {
  cancelGoogleCalendarEvent,
  getGoogleCalendarConfig,
  revokeGoogleCalendarConnection
} from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const db = createRuntimeDatabase();
  const connection = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => calendar.getConnectionSummaryForUser(tx, current.session.userId)
  );

  return envelope(
    {
      configReady: Boolean(getGoogleCalendarConfig(new URL(request.url).origin)),
      connection
    },
    null,
    200
  );
}

export async function DELETE(request: Request) {
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
  if (connection) {
    const config = getGoogleCalendarConfig(new URL(request.url).origin);
    const events = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => calendar.listActiveGoogleEventsForConnection(tx, connection.id)
    );
    for (const event of events) {
      const cancelled = await withUserContext(
        db,
        {
          userId: current.session.userId,
          role: current.session.role,
          phiAccess: true
        },
        (tx) =>
          cancelGoogleCalendarEvent(tx, connection, config, event.providerEventId)
      ).catch(() => false);
      if (cancelled) {
        await withUserContext(
          db,
          {
            userId: current.session.userId,
            role: current.session.role,
            phiAccess: true
          },
          (tx) => calendar.markGoogleEventCancelled(tx, event)
        );
      }
    }
    await revokeGoogleCalendarConnection(connection).catch(() => false);
  }

  await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => calendar.disconnectGoogleConnection(tx, current.session.userId)
  );

  return envelope({ ok: true }, null, 200);
}
