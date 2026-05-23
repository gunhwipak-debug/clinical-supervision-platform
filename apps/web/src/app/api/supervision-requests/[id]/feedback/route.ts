import { assertNoPhi } from "@csp/shared/supervision/phi-regex";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  summary: z.string().min(10).max(4000),
  recommendations: z.string().min(10).max(6000)
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
      apiError("invalid_request", "피드백 형식이 올바르지 않습니다."),
      422
    );
  }

  try {
    assertNoPhi(body.data.summary, "summary");
    assertNoPhi(body.data.recommendations, "recommendations");
  } catch {
    return envelope(
      null,
      apiError("phi_detected", "식별정보로 보일 수 있는 문구가 포함되어 있습니다."),
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
      if (target.status !== "accepted" && target.status !== "in_review") {
        return { kind: "invalid_state" as const };
      }
      assertTransition(target.status, "feedback_submitted", "supervisor");
      const created = await supervision.createFeedback(
        tx,
        current.session.userId,
        target.id,
        body.data
      );
      if (!created) return { kind: "invalid_state" as const };
      const updated = await supervision.updateSupervisionRequestStatus(
        tx,
        target.id,
        "feedback_submitted",
        ["accepted", "in_review"]
      );
      return {
        kind: updated ? ("ok" as const) : ("invalid_state" as const),
        request: updated
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
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  const updatedRequest = result.request;
  if (!updatedRequest) {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  await sendUserNotification(db, {
    body: "슈퍼바이저가 지도 의견을 제출했습니다. 내용을 확인하고 필요한 경우 승인 또는 보완 요청을 진행해주세요.",
    href: `/requests/${updatedRequest.id}`,
    kind: "feedback_submitted_supervisee",
    metadata: { requestId: updatedRequest.id },
    origin: new URL(request.url).origin,
    target: { role: "supervisee", userId: updatedRequest.superviseeId },
    title: "지도 의견이 도착했습니다"
  });

  return envelope({ request: updatedRequest }, null, 200);
}
