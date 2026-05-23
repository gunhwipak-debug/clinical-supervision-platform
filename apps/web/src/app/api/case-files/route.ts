import {
  evaluateCaseFileUploadPolicy,
  getStorageAdapter,
  sanitizeFilename,
  scanStoredObject,
  unsupportedFileTypePendingScanCode
} from "@csp/shared/storage";
import { files, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import {
  registerCaseFileSchema,
  requestIdQuerySchema
} from "@/lib/case-files/validation";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const uploadableStatuses = new Set([
  "draft",
  "submitted",
  "in_review",
  "additional_info_requested"
]);

export async function GET(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const parsed = requestIdQuerySchema.safeParse({
    requestId: request.nextUrl.searchParams.get("requestId")
  });
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "의뢰 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const caseFiles = await withUserContext(db, contextFor(current, request), (tx) =>
    files.listCaseFilesForRequest(tx, parsed.data.requestId)
  );

  return envelope({ files: caseFiles.map(publicFile) }, null, 200);
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsed = registerCaseFileSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "파일 정보 형식이 올바르지 않습니다."),
      422
    );
  }
  const filePolicy = evaluateCaseFileUploadPolicy({
    filename: parsed.data.originalFilename,
    contentType: parsed.data.mimeType
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
      apiError("invalid_state", "현재 상태에서는 파일을 등록할 수 없습니다."),
      409
    );
  }

  const storage = getStorageAdapter();
  const object = await storage.commitUpload(parsed.data.uploadKey);
  if (!object)
    return envelope(
      null,
      apiError("upload_missing", "업로드된 파일을 찾을 수 없습니다."),
      422
    );
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
  const created = await withUserContext(db, contextFor(current), async (tx) => {
    const file = await files.createCaseFile(tx, {
      requestId: parsed.data.requestId,
      uploadedBy: current.session.userId,
      kind: parsed.data.kind,
      originalFilename: sanitizeFilename(parsed.data.originalFilename),
      mimeType: filePolicy.contentType,
      sizeBytes: object.sizeBytes,
      storageKey: object.uploadKey,
      checksumSha256: object.checksumSha256,
      virusScanStatus: scan.virusScanStatus,
      phiScanStatus: scan.phiScanStatus,
      parentFileId: parsed.data.parentFileId ?? null
    });
    if (file) {
      await files.upsertCaseFilePreview(tx, previewMetadataFor(file, scan.warnings));
      await files.logFileAccess(tx, {
        userId: current.session.userId,
        fileId: file.id,
        action: "upload",
        ipAddress: clientIp(request)
      });
      if (source.status === "additional_info_requested") {
        await files.createDocumentReviewCycle(tx, {
          supervisionRequestId: parsed.data.requestId,
          actorUserId: current.session.userId,
          targetFileId: file.id,
          status: "revision_uploaded",
          note: "수정본이 업로드되었습니다.",
          completed: true
        });
        await supervision.updateSupervisionRequestStatus(
          tx,
          parsed.data.requestId,
          "in_review",
          "additional_info_requested"
        );
      }
    }
    return file;
  });

  if (!created)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope(
    { file: publicFile(created), scanWarnings: scan.warnings },
    null,
    200
  );
}

function publicFile(file: files.CaseFileRecord) {
  return {
    id: file.id,
    supervisionRequestId: file.supervisionRequestId,
    kind: file.kind,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    parentFileId: file.parentFileId,
    versionNo: file.versionNo,
    isFinalReturn: file.isFinalReturn,
    checksumSha256: file.checksumSha256,
    virusScanStatus: file.virusScanStatus,
    phiScanStatus: file.phiScanStatus,
    uploadedAt: file.uploadedAt,
    retentionExpiresAt: file.retentionExpiresAt
  };
}

function previewMetadataFor(
  file: files.CaseFileRecord,
  warnings: string[]
): Parameters<typeof files.upsertCaseFilePreview>[1] {
  if (
    file.mimeType === "application/pdf" ||
    file.mimeType.startsWith("image/") ||
    file.mimeType.startsWith("text/") ||
    file.mimeType === "application/json"
  ) {
    return {
      caseFileId: file.id,
      status: "ready",
      previewStorageKey: file.storageKey,
      previewMimeType: file.mimeType,
      pageCount: 1,
      errorCode: null
    };
  }
  return {
    caseFileId: file.id,
    status: "pending",
    previewStorageKey: null,
    previewMimeType: null,
    pageCount: null,
    errorCode: warnings.includes("content_phi_scan_not_performed")
      ? "converter_pending"
      : null
  };
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
