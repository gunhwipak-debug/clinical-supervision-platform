import { notifications, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function POST() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const db = createRuntimeDatabase();
  const count = await withUserContext(db, contextFor(current), (tx) =>
    notifications.markAllNotificationsRead(tx, current.session.userId)
  );

  return envelope({ count }, null, 200);
}
