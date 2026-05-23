import { getStorageAdapter } from "@csp/shared/storage";
import { files, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { fileIdParamsSchema } from "@/lib/case-files/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const parsed = fileIdParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "파일 ID가 올바르지 않습니다."),
      422
    );
  }

  const adminReason = request.headers.get("x-admin-reason")?.trim() ?? "";
  if (current.session.role === "admin" && adminReason.length < 30) {
    return envelope(
      null,
      apiError("admin_reason_required", "관리자 작업 사유를 30자 이상 입력해주세요."),
      403
    );
  }

  const db = createRuntimeDatabase();
  const file = await withUserContext(db, contextFor(current, request), (tx) =>
    files.getCaseFile(tx, parsed.data.id)
  );
  if (!file)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (file.virusScanStatus !== "clean") {
    return envelope(
      null,
      apiError("file_not_cleared", "안전 점검이 완료된 파일만 다운로드할 수 있습니다."),
      409
    );
  }

  const prepared = await getStorageAdapter().prepareDownload({
    fileId: file.id,
    uploadKey: file.storageKey,
    filename: file.originalFilename,
    contentType: file.mimeType,
    actorUserId: current.session.userId,
    actorRole: current.session.role,
    watermark: `${current.user.email} · ${new Date().toISOString()} · ${file.supervisionRequestId}`
  });

  await withUserContext(db, contextFor(current, request), (tx) =>
    Promise.all([
      files.logSignedUrlIssue(tx, {
        actorUserId: current.session.userId,
        actorRole: current.session.role,
        fileId: file.id,
        signedUrlId: prepared.signedUrlId,
        reason: current.session.role === "admin" ? adminReason : null,
        ipAddress: clientIp(request)
      }),
      files.logFileAccess(tx, {
        userId: current.session.userId,
        fileId: file.id,
        action: "download",
        ipAddress: clientIp(request),
        signedUrlId: prepared.signedUrlId
      })
    ])
  );

  return envelope({ download: prepared }, null, 200);
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
