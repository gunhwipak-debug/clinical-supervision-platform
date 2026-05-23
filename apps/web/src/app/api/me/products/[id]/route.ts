import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { nullable, productSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = productSchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "상품 정보 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const product = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.updateProduct(tx, {
        userId: current.session.userId,
        productId: parsedParams.data.id,
        kind: parsedBody.data.kind,
        title: parsedBody.data.title,
        description: nullable(parsedBody.data.description),
        priceKrw: parsedBody.data.priceKrw,
        turnaroundHours: nullable(parsedBody.data.turnaroundHours)
      })
  );

  if (!product)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ product }, null, 200);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "상품 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const deleted = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.deactivateProduct(tx, {
        userId: current.session.userId,
        productId: parsed.data.id
      })
  );

  if (!deleted)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ ok: true }, null, 200);
}
