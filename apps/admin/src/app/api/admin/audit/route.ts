import { audit, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "../../../../lib/api/envelope";
import {
  adminReasonFromHeaders,
  isValidAdminReason
} from "../../../../lib/auth/admin-policy";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../../lib/auth/current-admin";

export const runtime = "nodejs";

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

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const db = createRuntimeDatabase();
  const logs = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason
    },
    async (tx) => ({
      auditLogs: await audit.listAuditLogs(tx, { limit }),
      accessLogs: await audit.listAccessLogs(tx, { limit })
    })
  );

  return envelope({ logs }, null, 200);
}
