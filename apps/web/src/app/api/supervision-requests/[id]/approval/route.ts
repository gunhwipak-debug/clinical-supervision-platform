import { files, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  note: z.string().max(1000).optional().nullable()
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paramsSchema.safeParse(await context.params);
  const body = bodySchema.safeParse(await parseJson(request));
  if (!parsed.success || !body.success) {
    return envelope(
      null,
      apiError("invalid_request", "승인 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(
    db,
    contextFor(current, request, { phiAccess: true }),
    async (tx) => {
      const target = await supervision.getSupervisionRequestDetails(tx, parsed.data.id);
      if (!target) return { kind: "not_found" as const };
      if (!isRequestOwner(current, target)) {
        return { kind: "forbidden" as const };
      }
      if (target.status !== "feedback_submitted") {
        return { kind: "invalid_state" as const };
      }
      const cycle = await files.createDocumentReviewCycle(tx, {
        supervisionRequestId: target.id,
        actorUserId: current.session.userId,
        status: "feedback_approved",
        note: body.data.note ?? null,
        completed: true
      });
      return {
        kind: cycle ? ("ok" as const) : ("invalid_state" as const),
        request: target,
        reviewCycle: cycle
      };
    }
  );

  if (result.kind === "not_found")
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (result.kind === "forbidden")
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  if (result.kind === "invalid_state")
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );

  if (result.request.supervisorId) {
    await sendUserNotification(db, {
      body: "슈퍼바이지가 지도 의견을 확인하고 승인했습니다. 완료 기록 발급이 필요한 의뢰라면 다음 단계를 진행해주세요.",
      href: `/supervisor/requests/${result.request.id}`,
      kind: "feedback_approved_supervisor",
      metadata: { requestId: result.request.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisor", userId: result.request.supervisorId },
      title: "지도 의견이 승인되었습니다"
    });
  }

  return envelope({ reviewCycle: result.reviewCycle }, null, 200);
}
