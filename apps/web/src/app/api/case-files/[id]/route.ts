import { getStorageAdapter } from "@csp/shared/storage";
import { files, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { fileIdParamsSchema } from "@/lib/case-files/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = fileIdParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "파일 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const target = await withUserContext(db, contextFor(current), (tx) =>
    files.getCaseFile(tx, parsed.data.id)
  );
  if (!target)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (target.superviseeId !== current.session.userId) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (target.requestStatus !== "draft" && target.requestStatus !== "in_review") {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 파일을 삭제할 수 없습니다."),
      409
    );
  }

  const deleted = await withUserContext(db, contextFor(current), async (tx) => {
    await files.logFileAccess(tx, {
      userId: current.session.userId,
      fileId: parsed.data.id,
      action: "delete",
      ipAddress: clientIp(request)
    });
    const file = await files.markCaseFileDeleted(
      tx,
      parsed.data.id,
      current.session.userId
    );
    return file;
  });
  if (!deleted) {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 파일을 삭제할 수 없습니다."),
      409
    );
  }

  await getStorageAdapter().deleteObject(deleted.storageKey);

  return envelope({ ok: true }, null, 200);
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
