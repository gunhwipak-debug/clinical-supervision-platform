import { assertTransition } from "@csp/shared/supervision/status-machine";
import { files, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const score = z.number().int().min(1).max(5);
const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  expertise: score,
  specificity: score,
  helpfulness: score,
  ethics: score,
  responseSpeed: score,
  onTime: score,
  educational: score,
  reuseIntent: score,
  freeText: z.string().max(1000).nullable().optional()
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
      apiError("invalid_request", "리뷰 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(db, contextFor(current), async (tx) => {
    const target = await supervision.getSupervisionRequestDetails(tx, parsed.data.id);
    if (!target) return { kind: "not_found" as const };
    if (target.superviseeId !== current.session.userId) {
      return { kind: "forbidden" as const };
    }
    const expectedStatus =
      target.serviceProductSupervisionType === "counseling" ||
      target.needsCompletionRecord === false
        ? "feedback_submitted"
        : "completion_record_issued";
    if (target.status !== expectedStatus) {
      return { kind: "invalid_state" as const };
    }
    assertTransition(target.status, "completed", "supervisee");
    const created = await supervision.createReview(
      tx,
      current.session.userId,
      target.id,
      {
        ...body.data,
        freeText: body.data.freeText ?? null
      }
    );
    if (!created) return { kind: "invalid_state" as const };
    const updated = await supervision.updateSupervisionRequestStatus(
      tx,
      target.id,
      "completed",
      expectedStatus
    );
    if (updated) {
      await files.scheduleRawCaseFilesForCompletedPurge(tx, target.id);
    }
    return {
      kind: updated ? ("ok" as const) : ("invalid_state" as const),
      request: updated
    };
  });

  if (result.kind === "not_found")
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (result.kind === "forbidden")
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  return envelope({ request: result.request }, null, 200);
}
