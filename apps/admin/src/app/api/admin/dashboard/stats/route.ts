import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "../../../../../lib/api/envelope";
import {
  adminReasonFromHeaders,
  isValidAdminReason
} from "../../../../../lib/auth/admin-policy";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../../../lib/auth/current-admin";

export const runtime = "nodejs";

type StatsDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function GET(request: NextRequest) {
  const current = await getCurrentAdmin();
  if (!current) return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  const adminReason = adminReasonFromHeaders(request.headers);
  if (!isValidAdminReason(adminReason)) {
    return envelope(
      null,
      apiError("admin_reason_required", "관리자 작업 사유를 30자 이상 입력해주세요."),
      403
    );
  }

  const db = createRuntimeDatabase();
  const stats = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason
    },
    (tx) => dashboardStats(tx)
  );

  return envelope({ stats }, null, 200);
}

async function dashboardStats(db: StatsDatabase) {
  const result = await db.execute(sql`
    select
      (select count(*)::int from qualifications where status = 'pending') as "pendingQualifications",
      (select count(*)::int from refunds where status = 'requested') as "requestedRefunds",
      (select count(*)::int from supervision_requests where status in ('submitted', 'awaiting_supervisor_review')) as "openRequests",
      (select count(*)::int from users where status = 'active') as "activeUsers"
  `);
  return rowsOf<{
    pendingQualifications: number;
    requestedRefunds: number;
    openRequests: number;
    activeUsers: number;
  }>(result)[0];
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }
  return [];
}
