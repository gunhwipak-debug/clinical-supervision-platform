import { assertNoPhi } from "@csp/shared/supervision/phi-regex";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { files, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { sendUserNotification } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";
import { appendMandatoryResponsibilityNotice } from "@/lib/supervision/completion-record";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  reviewedMaterials: z.array(z.string().min(1)).min(1),
  scope: z.array(z.string().min(1)).min(1),
  limitations: z.string().min(5).max(2000),
  responsibilityNotice: z.string().min(10).max(2000)
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
      apiError("invalid_request", "완료 기록 형식이 올바르지 않습니다."),
      422
    );
  }

  const completionInput = {
    ...body.data,
    responsibilityNotice: appendMandatoryResponsibilityNotice(
      body.data.responsibilityNotice
    )
  };

  try {
    assertCompletionRecordHasNoPhi(completionInput);
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
      if (target.serviceProductSupervisionType !== "assessment") {
        return { kind: "stamp_not_required" as const };
      }
      if (target.needsCompletionRecord === false) {
        return { kind: "stamp_not_required" as const };
      }
      if (target.status !== "feedback_submitted") {
        return { kind: "invalid_state" as const };
      }
      const latest = await files.latestDocumentReviewCycle(tx, target.id);
      if (latest?.status !== "feedback_approved") {
        return { kind: "approval_required" as const };
      }
      assertTransition("feedback_submitted", "completion_record_issued", "supervisor");
      const issued = await supervision.issueCompletionRecord(
        tx,
        current.session.userId,
        target.id,
        completionInput
      );
      if (!issued) return { kind: "invalid_state" as const };
      await files.createDocumentReviewCycle(tx, {
        supervisionRequestId: target.id,
        actorUserId: current.session.userId,
        status: "stamped_returned",
        note: "슈퍼비전 확인 표시가 발급되었습니다.",
        completed: true
      });
      const updated = await supervision.updateSupervisionRequestStatus(
        tx,
        target.id,
        "completion_record_issued",
        "feedback_submitted"
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
  if (result.kind === "stamp_not_required")
    return envelope(
      null,
      apiError(
        "stamp_not_required",
        "서명 완료 기록은 심리평가 의뢰에서만 사용할 수 있습니다."
      ),
      422
    );
  if (result.kind === "approval_required")
    return envelope(
      null,
      apiError(
        "feedback_approval_required",
        "피드백 승인 후 완료 기록을 발급할 수 있습니다."
      ),
      422
    );
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
    body: "슈퍼바이저가 완료 기록을 발급했습니다. 의뢰 상세 화면에서 확인하고 최종 리뷰를 진행할 수 있습니다.",
    href: `/requests/${updatedRequest.id}`,
    kind: "completion_record_issued_supervisee",
    metadata: { requestId: updatedRequest.id },
    origin: new URL(request.url).origin,
    target: { role: "supervisee", userId: updatedRequest.superviseeId },
    title: "완료 기록이 발급되었습니다"
  });

  return envelope({ request: updatedRequest }, null, 200);
}

function assertCompletionRecordHasNoPhi(input: z.infer<typeof bodySchema>): void {
  for (const [index, value] of input.reviewedMaterials.entries()) {
    assertNoPhi(value, `reviewedMaterials.${String(index)}`);
  }
  for (const [index, value] of input.scope.entries()) {
    assertNoPhi(value, `scope.${String(index)}`);
  }
  assertNoPhi(input.limitations, "limitations");
  assertNoPhi(input.responsibilityNotice, "responsibilityNotice");
}
