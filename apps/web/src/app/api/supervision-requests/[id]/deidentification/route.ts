import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";
import {
  deidentificationSchema,
  isDeidentificationComplete
} from "@/lib/supervision/validation";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = deidentificationSchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "비식별화 점검 항목이 올바르지 않습니다."),
      422
    );
  }
  if (!isDeidentificationComplete(parsedBody.data)) {
    return envelope(
      null,
      apiError("deid_incomplete", "비식별화 점검 항목을 모두 확인해주세요."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const basic = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, parsedParams.data.id)
  );
  if (!basic)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (!isRequestOwner(current, basic)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (basic.status !== "draft") {
    return envelope(
      null,
      apiError("invalid_state", "초안 상태에서만 수정할 수 있습니다."),
      409
    );
  }
  if (!basic.casePacketId) {
    return envelope(
      null,
      apiError("packet_incomplete", "사례 정보가 먼저 필요합니다."),
      422
    );
  }

  const saved = await withUserContext(db, contextFor(current), (tx) =>
    supervision.upsertDeidentificationChecklist(
      tx,
      current.session.userId,
      parsedParams.data.id,
      parsedBody.data
    )
  );

  if (!saved)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ ok: true }, null, 200);
}
