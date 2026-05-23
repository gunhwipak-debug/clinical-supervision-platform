import { files, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  targetFileId: z.uuid().optional().nullable(),
  note: z.string().max(1000).optional().nullable()
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.session.role !== "supervisor") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paramsSchema.safeParse(await context.params);
  const body = bodySchema.safeParse(await parseJson(request));
  if (!parsed.success || !body.success) {
    return envelope(
      null,
      apiError("invalid_request", "서명 요청 형식이 올바르지 않습니다."),
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
      if (target.supervisorId !== current.session.userId) {
        return { kind: "forbidden" as const };
      }
      if (target.status !== "completion_record_issued") {
        return { kind: "invalid_state" as const };
      }
      if (body.data.targetFileId) {
        const file = await files.getCaseFile(tx, body.data.targetFileId);
        if (!file || file.supervisionRequestId !== target.id) {
          return { kind: "invalid_file" as const };
        }
      }
      const cycle = await files.createDocumentReviewCycle(tx, {
        supervisionRequestId: target.id,
        actorUserId: current.session.userId,
        targetFileId: body.data.targetFileId ?? null,
        status: "stamped_returned",
        note: body.data.note ?? null,
        completed: true
      });
      return cycle
        ? { kind: "ok" as const, cycle }
        : { kind: "invalid_state" as const };
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
  if (result.kind === "invalid_file")
    return envelope(
      null,
      apiError("invalid_file", "선택한 파일이 이 의뢰에 포함되어 있지 않습니다."),
      422
    );
  if (result.kind === "invalid_state")
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );

  return envelope({ reviewCycle: result.cycle }, null, 200);
}
