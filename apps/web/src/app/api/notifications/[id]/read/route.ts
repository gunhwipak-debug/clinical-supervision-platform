import { notifications, withUserContext } from "@csp/db";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "알림 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const notification = await withUserContext(db, contextFor(current), (tx) =>
    notifications.markNotificationRead(tx, {
      notificationId: parsed.data.id,
      userId: current.session.userId
    })
  );

  if (!notification) {
    return envelope(
      null,
      apiError("not_found", "요청한 알림을 찾을 수 없습니다."),
      404
    );
  }

  return envelope({ notification }, null, 200);
}
