import { payments, withUserContext } from "@csp/db";
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

  const supervisorId = request.nextUrl.searchParams.get("supervisor");
  const db = createRuntimeDatabase();
  const payouts = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason
    },
    (tx) => payments.listPayouts(tx, supervisorId)
  );

  return envelope({ payouts }, null, 200);
}
