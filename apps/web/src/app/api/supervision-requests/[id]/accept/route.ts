import { assertTransition } from "@csp/shared/supervision/status-machine";
import { supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.session.role !== "supervisor") {
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
  const result = await withUserContext(db, contextFor(current), async (tx) => {
    const request = await supervision.getSupervisionRequestDetails(tx, parsed.data.id);
    if (!request) return { kind: "not_found" as const };
    if (request.supervisorId !== current.session.userId) {
      return { kind: "forbidden" as const };
    }
    if (request.status !== "awaiting_supervisor_review") {
      return { kind: "invalid_state" as const };
    }
    assertTransition("awaiting_supervisor_review", "accepted", "supervisor");
    assertTransition("accepted", "in_review", "supervisor");
    const accepted = await supervision.updateSupervisionRequestStatus(
      tx,
      request.id,
      "accepted",
      "awaiting_supervisor_review"
    );
    if (!accepted) return { kind: "invalid_state" as const };
    const inReview = await supervision.updateSupervisionRequestStatus(
      tx,
      request.id,
      "in_review",
      "accepted"
    );
    return {
      kind: inReview ? ("ok" as const) : ("invalid_state" as const),
      request: inReview
    };
  });

  if (result.kind === "not_found") {
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  }
  if (result.kind === "forbidden") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (result.kind === "invalid_state") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );
  }

  if (result.request?.superviseeId) {
    await sendUserNotification(db, {
      body: "슈퍼바이저가 의뢰를 수락했습니다. 이제 검토가 진행됩니다.",
      href: `/requests/${parsed.data.id}`,
      kind: "supervision_request_accepted_supervisee",
      metadata: { requestId: parsed.data.id },
      origin: new URL(_request.url).origin,
      target: { role: "supervisee", userId: result.request.superviseeId },
      title: "의뢰가 수락되었습니다"
    });
  }

  return envelope({ request: result.request }, null, 200);
}
