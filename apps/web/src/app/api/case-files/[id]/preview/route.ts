import { files, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "파일 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const result = await withUserContext(
    db,
    contextFor(current, request, { phiAccess: true }),
    async (tx) => {
      const file = await files.getCaseFile(tx, parsed.data.id);
      if (!file) return { kind: "not_found" as const };
      if (!canAccessFile(current.session.userId, file)) {
        return { kind: "forbidden" as const };
      }
      const preview = await files.getCaseFilePreview(tx, file.id);
      return { kind: "ok" as const, file, preview };
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

  return envelope(
    {
      file: {
        id: result.file.id,
        originalFilename: result.file.originalFilename,
        mimeType: result.file.mimeType,
        sizeBytes: result.file.sizeBytes,
        versionNo: result.file.versionNo,
        isFinalReturn: result.file.isFinalReturn
      },
      preview: result.preview ?? {
        caseFileId: result.file.id,
        status: "pending",
        previewStorageKey: null,
        previewMimeType: null,
        pageCount: null,
        errorCode: null,
        generatedAt: null
      }
    },
    null,
    200
  );
}

function canAccessFile(userId: string, file: files.CaseFileRecord): boolean {
  return file.superviseeId === userId || file.supervisorId === userId;
}
