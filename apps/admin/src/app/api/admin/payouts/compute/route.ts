import { payments } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "../../../../../lib/api/envelope";
import {
  adminReasonFromHeaders,
  isValidAdminReason
} from "../../../../../lib/auth/admin-policy";
import {
  createServiceDatabase,
  getCurrentAdmin
} from "../../../../../lib/auth/current-admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  periodStart: z.iso.date(),
  periodEnd: z.iso.date()
});

export async function POST(request: NextRequest) {
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

  const parsed = bodySchema.safeParse(await parseJson(request));
  if (!parsed.success || parsed.data.periodStart > parsed.data.periodEnd) {
    return envelope(
      null,
      apiError("invalid_request", "정산 기간이 올바르지 않습니다."),
      422
    );
  }

  const db = createServiceDatabase();
  const payouts = await payments.computePayouts(db, parsed.data);

  return envelope({ payouts }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
