import { notifications, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.user.role === "admin") {
    return envelope({ count: 0 }, null, 200);
  }

  try {
    const db = createRuntimeDatabase();
    const count = await withUserContext(db, contextFor(current), (tx) =>
      notifications.countUnreadNotifications(tx, current.session.userId)
    );

    return envelope({ count }, null, 200);
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }
    return envelope({ count: 0 }, null, 200);
  }
}
