import {
  evaluateCaseFileUploadPolicy,
  getStorageAdapter,
  unsupportedFileTypePendingScanCode
} from "@csp/shared/storage";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isSupervisor } from "@/lib/auth/guards";
import { qualificationEvidenceUploadUrlSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = qualificationEvidenceUploadUrlSchema.safeParse(
    await parseJson(request)
  );
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "증빙 업로드 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const filePolicy = evaluateCaseFileUploadPolicy({
    filename: parsed.data.filename,
    contentType: parsed.data.contentType ?? null
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

  const prepared = await getStorageAdapter().prepareUpload({
    purpose: "qualification_evidence",
    filename: parsed.data.filename,
    contentType: filePolicy.contentType,
    maxBytes: parsed.data.sizeBytes
  });

  return envelope(
    {
      ...prepared,
      sanitizedFilename: filePolicy.filename,
      contentType: filePolicy.contentType
    },
    null,
    200
  );
}
