import { files, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });
const annotationSchema = z.object({
  pageNumber: z.number().int().min(1).default(1),
  xPct: z.number().min(0).max(100).default(8),
  yPct: z.number().min(0).max(100).default(8),
  widthPct: z.number().min(1).max(100).default(24),
  heightPct: z.number().min(1).max(100).default(12),
  body: z.string().min(1).max(2000)
});

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
      const annotations = await files.listCaseFileAnnotations(tx, file.id);
      return { kind: "ok" as const, annotations };
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

  return envelope({ annotations: result.annotations }, null, 200);
}

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
  const body = annotationSchema.safeParse(await parseJson(request));
  if (!parsed.success || !body.success) {
    return envelope(
      null,
      apiError("invalid_request", "주석 형식이 올바르지 않습니다."),
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
      if (file.supervisorId !== current.session.userId) {
        return { kind: "forbidden" as const };
      }
      const annotation = await files.createCaseFileAnnotation(tx, {
        caseFileId: file.id,
        authorUserId: current.session.userId,
        ...body.data
      });
      return annotation
        ? { kind: "ok" as const, annotation }
        : { kind: "invalid_state" as const };
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
  if (result.kind === "invalid_state")
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 처리할 수 없습니다."),
      409
    );

  return envelope({ annotation: result.annotation }, null, 200);
}

function canAccessFile(userId: string, file: files.CaseFileRecord): boolean {
  return file.superviseeId === userId || file.supervisorId === userId;
}
