import { getStorageAdapter, withDownloadWatermark } from "@csp/shared/storage";
import { profiles, withUserContext } from "@csp/db";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createRuntimeDatabase, getCurrentAdmin } from "@/lib/auth/current-admin";
import { adminReasonFromHeaders, isValidAdminReason } from "@/lib/auth/admin-policy";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: { code: "invalid_request", message: "증빙 파일 ID가 올바르지 않습니다." }
      },
      { status: 422 }
    );
  }

  const current = await getCurrentAdmin();
  if (!current) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "권한이 없습니다." } },
      { status: 403 }
    );
  }

  const adminReason = adminReasonFromHeaders(request.headers);
  if (!isValidAdminReason(adminReason)) {
    return NextResponse.json(
      {
        error: {
          code: "admin_reason_required",
          message: "증빙 다운로드에는 30자 이상의 관리자 사유가 필요합니다."
        }
      },
      { status: 403 }
    );
  }

  const db = createRuntimeDatabase();
  const evidence = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason
    },
    (tx) => profiles.getQualificationEvidenceFile(tx, parsedParams.data.id)
  );

  if (!evidence) {
    return NextResponse.json(
      { error: { code: "not_found", message: "증빙 파일을 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason
    },
    (tx) =>
      profiles.tryInsertAuditLog(tx, {
        actorUserId: current.session.userId,
        actorRole: "admin",
        action: "qualification_evidence.download",
        targetType: "qualification_evidence",
        targetId: evidence.id,
        reason: adminReason
      })
  );

  const object = await getStorageAdapter().commitUpload(evidence.storageKey);
  if (!object) {
    return NextResponse.json(
      { error: { code: "not_found", message: "증빙 파일 원본을 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  const bytes = withDownloadWatermark(
    object.bytes,
    evidence.mimeType,
    `admin:${current.session.userId}:qualification:${evidence.id}`
  );

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        evidence.originalFilename
      )}`,
      "content-type": evidence.mimeType,
      "x-robots-tag": "noindex"
    }
  });
}
