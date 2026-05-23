import { payments, profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "../../../../../../lib/api/envelope";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../../../../lib/auth/current-admin";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ reason: z.string().trim().min(30).max(1000) });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentAdmin();
  if (!current) return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "환불 반려 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const refund = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: parsedBody.data.reason
    },
    async (tx) => {
      const res = await payments.rejectRefund(tx, parsedParams.data.id, parsedBody.data.reason);
      if (res) {
        await profiles.tryInsertAuditLog(tx, {
          actorUserId: current.session.userId,
          actorRole: "admin",
          action: "refund.reject",
          targetType: "refund",
          targetId: res.id,
          reason: parsedBody.data.reason
        });
      }
      return res;
    }
  );

  if (!refund)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ refund }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
