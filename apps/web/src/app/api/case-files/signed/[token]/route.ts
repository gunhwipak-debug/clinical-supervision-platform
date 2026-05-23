import { getStorageAdapter, withDownloadWatermark } from "@csp/shared/storage";
import { files, withUserContext, type UserContext, type UserRole } from "@csp/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRuntimeDatabase } from "@/lib/auth/database";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const resolved = await getStorageAdapter().readDownloadToken(token);
  if (!resolved || !resolved.payload.fileId || !resolved.payload.actorUserId) {
    return jsonError("invalid_or_expired_token", 404);
  }

  const role = normalizeRole(resolved.payload.actorRole);
  if (!role) return jsonError("invalid_or_expired_token", 404);

  const db = createRuntimeDatabase();
  const actorContext = await tokenContext(
    db,
    resolved.payload.actorUserId,
    role,
    resolved.payload.fileId,
    resolved.payload.signedUrlId
  );
  if (!actorContext) return jsonError("invalid_or_expired_token", 404);
  const file: files.CaseFileRecord | null = await withUserContext(
    db,
    actorContext,
    (tx) => files.getCaseFile(tx, resolved.payload.fileId ?? "")
  );
  if (!file || file.storageKey !== resolved.payload.uploadKey) {
    return jsonError("not_found", 404);
  }

  await withUserContext(db, actorContext, (tx) =>
    files.logFileAccess(tx, {
      userId: resolved.payload.actorUserId ?? "",
      fileId: file.id,
      action: "view",
      ipAddress: clientIp(request),
      signedUrlId: resolved.payload.signedUrlId
    })
  );

  const bytes = withDownloadWatermark(
    resolved.object.bytes,
    file.mimeType,
    resolved.payload.watermark ?? "ClinicFlow download"
  );

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalFilename)}"`,
      "Cache-Control": "private, max-age=0, no-store",
      "X-Robots-Tag": "noindex"
    }
  });
}

async function tokenContext(
  db: ReturnType<typeof createRuntimeDatabase>,
  userId: string,
  role: UserRole,
  fileId: string | undefined,
  signedUrlId: string
): Promise<UserContext | null> {
  if (role !== "admin") return { userId, role };
  if (!fileId) return null;

  const reason = await withUserContext(
    db,
    {
      userId,
      role,
      adminReason: "signed URL issue audit reason lookup for replay"
    },
    (tx) =>
      files.getSignedUrlIssueReason(tx, {
        actorUserId: userId,
        fileId,
        signedUrlId
      })
  );
  return reason ? { userId, role, adminReason: reason } : null;
}

function normalizeRole(role: string | undefined): UserRole | null {
  return role === "supervisee" || role === "supervisor" || role === "admin"
    ? role
    : null;
}

function jsonError(code: string, status: 404 | 401) {
  return NextResponse.json(
    { data: null, error: { code, message: code } },
    { status, headers: { "X-Robots-Tag": "noindex" } }
  );
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
