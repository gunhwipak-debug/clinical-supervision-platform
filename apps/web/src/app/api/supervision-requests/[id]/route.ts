import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import {
  contextFor,
  isRequestOwner,
  isRequestParticipant
} from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "의뢰 ID가 올바르지 않습니다."),
      422
    );
  }

  if (
    current.session.role === "admin" &&
    (request.headers.get("x-admin-reason") ?? "").trim().length < 30
  ) {
    return envelope(
      null,
      apiError("admin_reason_required", "관리자 작업 사유를 30자 이상 입력해주세요."),
      403
    );
  }

  const db = createRuntimeDatabase();
  const basic = await withUserContext(db, contextFor(current, request), (tx) =>
    supervision.getSupervisionRequestDetails(tx, parsed.data.id)
  );

  if (!basic)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (!isRequestParticipant(current, basic)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const canReadPhi =
    isRequestOwner(current, basic) ||
    (current.session.role === "supervisor" &&
      basic.supervisorId === current.session.userId);

  const detail = canReadPhi
    ? await withUserContext(
        db,
        contextFor(current, request, { phiAccess: true }),
        (tx) =>
          supervision.getSupervisionRequestDetails(tx, parsed.data.id, {
            includePhi: true
          })
      )
    : basic;

  return envelope({ request: detail }, null, 200);
}

export async function DELETE(
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
      apiError("invalid_state", "초안 상태의 의뢰만 삭제할 수 있습니다."),
      409
    );
  }

  const deleted = await withUserContext(db, contextFor(current), (tx) =>
    supervision.deleteDraftSupervisionRequest(
      tx,
      current.session.userId,
      parsed.data.id
    )
  );

  if (!deleted)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ ok: true }, null, 200);
}
