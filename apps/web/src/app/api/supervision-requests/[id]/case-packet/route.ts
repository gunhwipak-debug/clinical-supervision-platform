import { assertNoPhi, PhiDetectedError } from "@csp/shared/supervision/phi-regex";
import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";
import { casePacketSchema, nullable } from "@/lib/supervision/validation";

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
  const parsedBody = casePacketSchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "사례 정보 형식이 올바르지 않습니다."),
      422
    );
  }

  try {
    assertNoPhi(parsedBody.data.title, "title");
    assertNoPhi(parsedBody.data.chiefComplaint, "chiefComplaint");
    assertNoPhi(parsedBody.data.referralReason, "referralReason");
  } catch (error) {
    if (error instanceof PhiDetectedError) {
      return envelope(
        null,
        apiError("phi_detected", "식별정보로 보일 수 있는 문구가 감지되었습니다."),
        422
      );
    }
    throw error;
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

  const packet = await withUserContext(
    db,
    contextFor(current, request, { phiAccess: true }),
    (tx) =>
      supervision.upsertCasePacket(tx, current.session.userId, parsedParams.data.id, {
        title: parsedBody.data.title,
        purpose: parsedBody.data.purpose,
        clientAgeBand: nullable(parsedBody.data.clientAgeBand),
        clientGender: nullable(parsedBody.data.clientGender),
        setting: nullable(parsedBody.data.setting),
        chiefComplaint: parsedBody.data.chiefComplaint,
        referralReason: parsedBody.data.referralReason,
        testsUsed: parsedBody.data.testsUsed,
        requestItems: parsedBody.data.requestItems,
        preferredMethod: nullable(parsedBody.data.preferredMethod),
        needsCompletionRecord: parsedBody.data.needsCompletionRecord
      })
  );

  if (!packet)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ request: packet }, null, 200);
}
