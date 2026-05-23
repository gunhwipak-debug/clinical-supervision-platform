import {
  evaluateCaseFileUploadPolicy,
  getStorageAdapter,
  unsupportedFileTypePendingScanCode
} from "@csp/shared/storage";
import { files, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { uploadUrlSchema } from "@/lib/case-files/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const uploadableStatuses = new Set([
  "draft",
  "submitted",
  "in_review",
  "additional_info_requested"
]);

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = uploadUrlSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "업로드 요청 형식이 올바르지 않습니다."),
      422
    );
  }
  const filePolicy = evaluateCaseFileUploadPolicy({
    filename: parsed.data.filename,
    contentType: parsed.data.contentType
  });
  if (!filePolicy.allowed) {
    return envelope(
      null,
      apiError(
        unsupportedFileTypePendingScanCode,
        "PDF, 이미지, HWP/HWPX, DOCX, XLSX, 텍스트 파일만 지원합니다."
      ),
      422
    );
  }

  const db = createRuntimeDatabase();
  const source = await withUserContext(db, contextFor(current), (tx) =>
    files.getUploadSource(tx, parsed.data.requestId)
  );
  if (!source)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (source.superviseeId !== current.session.userId) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (!source.casePacketId) {
    return envelope(
      null,
      apiError("packet_required", "사례 정보가 먼저 필요합니다."),
      422
    );
  }
  if (!uploadableStatuses.has(source.status)) {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 파일을 업로드할 수 없습니다."),
      409
    );
  }

  const prepared = await getStorageAdapter().prepareUpload({
    purpose: "case_file",
    filename: parsed.data.filename,
    contentType: filePolicy.contentType,
    maxBytes: parsed.data.sizeBytes
  });

  return envelope(
    {
      ...prepared,
      sanitizedFilename: filePolicy.filename,
      contentType: filePolicy.contentType,
      kind: parsed.data.kind
    },
    null,
    200
  );
}
