import { assertTransition } from "@csp/shared/supervision/status-machine";
import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "의뢰 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const basic = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, parsed.data.id)
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
      apiError("invalid_state", "초안 상태의 의뢰만 제출할 수 있습니다."),
      409
    );
  }
  if (!basic.packetComplete) {
    return envelope(
      null,
      apiError("packet_incomplete", "사례 정보 입력이 아직 완료되지 않았습니다."),
      422
    );
  }

  assertTransition("draft", "submitted", "supervisee");

  const updated = await withUserContext(db, contextFor(current), (tx) =>
    supervision.updateSupervisionRequestStatus(tx, parsed.data.id, "submitted")
  );

  return envelope({ request: updated }, null, 200);
}
