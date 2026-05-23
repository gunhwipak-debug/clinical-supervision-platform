import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createRuntimeDatabase, getCurrentAdmin } from "@/lib/auth/current-admin";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ reason: z.string().trim().min(30).max(1000) });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  const rawBody = await parseJson(request);
  const parsedBody = bodySchema.safeParse(rawBody);

  if (!parsedParams.success) {
    return envelope(
      null,
      apiError("invalid_request", "자격 항목 ID가 올바르지 않습니다."),
      422
    );
  }

  const current = await getCurrentAdmin();
  if (!current) return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const db = createRuntimeDatabase();
  if (!parsedBody.success) {
    await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: "admin",
        adminReason:
          typeof rawBody === "object" && rawBody !== null && "reason" in rawBody
            ? String(rawBody.reason)
            : ""
      },
      (tx) =>
        profiles.tryInsertAuditLog(tx, {
          actorUserId: current.session.userId,
          actorRole: "admin",
          action: "qualification.approve.rejected_short_reason",
          targetType: "qualification",
          targetId: parsedParams.data.id,
          reason:
            typeof rawBody === "object" && rawBody !== null && "reason" in rawBody
              ? String(rawBody.reason)
              : null
        })
    );
    return envelope(
      null,
      apiError("invalid_reason", "처리 사유를 30자 이상 입력해주세요."),
      422
    );
  }

  const readiness = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: parsedBody.data.reason
    },
    (tx) => profiles.getQualificationReviewReadiness(tx, parsedParams.data.id)
  );
  if (readiness === "not_found") {
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  }
  if (readiness === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "대기 중인 자격만 승인할 수 있습니다."),
      409
    );
  }
  if (readiness === "missing_evidence") {
    return envelope(
      null,
      apiError(
        "evidence_required",
        "검토 가능한 자격 증빙 파일이 있어야 승인할 수 있습니다."
      ),
      422
    );
  }

  const approved = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: parsedBody.data.reason
    },
    (tx) =>
      profiles.approveQualification(tx, {
        qualificationId: parsedParams.data.id,
        reason: parsedBody.data.reason
      })
  );

  if (!approved)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ ok: true }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
