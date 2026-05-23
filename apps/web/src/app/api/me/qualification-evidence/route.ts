import {
  evaluateCaseFileUploadPolicy,
  getStorageAdapter,
  sanitizeFilename,
  scanStoredObject,
  unsupportedFileTypePendingScanCode
} from "@csp/shared/storage";
import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { qualificationEvidenceRegisterSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = qualificationEvidenceRegisterSchema.safeParse(
    await parseJson(request)
  );
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "증빙 파일 정보 형식이 올바르지 않습니다."),
      422
    );
  }

  const filePolicy = evaluateCaseFileUploadPolicy({
    filename: parsed.data.originalFilename,
    contentType: parsed.data.mimeType ?? null
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

  const storage = getStorageAdapter();
  const object = await storage.commitUpload(parsed.data.uploadKey);
  if (!object) {
    return envelope(
      null,
      apiError("upload_missing", "업로드된 증빙 파일을 찾을 수 없습니다."),
      422
    );
  }
  if (object.sizeBytes !== parsed.data.sizeBytes) {
    await storage.deleteObject(parsed.data.uploadKey);
    return envelope(
      null,
      apiError("size_mismatch", "파일 크기가 일치하지 않습니다."),
      422
    );
  }

  const scan = scanStoredObject({
    filename: parsed.data.originalFilename,
    contentType: filePolicy.contentType,
    bytes: object.bytes
  });
  if (scan.virusScanStatus === "infected") {
    await storage.deleteObject(parsed.data.uploadKey);
    return envelope(
      null,
      apiError("virus_detected", "악성 파일로 의심되어 등록할 수 없습니다."),
      422
    );
  }
  if (scan.virusScanStatus === "error") {
    await storage.deleteObject(parsed.data.uploadKey);
    return envelope(
      null,
      apiError("invalid_file", "파일 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const evidence = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.createQualificationEvidenceFile(tx, {
        userId: current.session.userId,
        originalFilename: sanitizeFilename(parsed.data.originalFilename),
        mimeType: filePolicy.contentType,
        sizeBytes: object.sizeBytes,
        storageKey: object.uploadKey,
        checksumSha256: object.checksumSha256,
        virusScanStatus: scan.virusScanStatus
      })
  );

  if (!evidence) {
    await storage.deleteObject(parsed.data.uploadKey);
    return envelope(
      null,
      apiError("profile_required", "먼저 슈퍼바이저 프로필을 등록해주세요."),
      422
    );
  }

  return envelope({ evidence }, null, 200);
}
