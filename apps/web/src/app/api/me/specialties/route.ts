import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { specialtiesSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const db = createRuntimeDatabase();
  const specialties = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.listSelectedSpecialties(tx, current.session.userId)
  );

  return envelope({ specialties }, null, 200);
}

export async function PUT(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = specialtiesSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "전문분야 입력값이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const specialties = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.replaceSelectedSpecialties(tx, {
        userId: current.session.userId,
        codes: parsed.data.codes
      })
  );

  return envelope({ specialties }, null, 200);
}
