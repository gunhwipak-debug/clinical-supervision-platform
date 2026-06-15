import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { serverUnavailable } from "@/lib/api/errors";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { availabilitySchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  try {
    const db = createRuntimeDatabase();
    const availability = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listAvailability(tx, current.session.userId)
    );

    return envelope({ availability }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.availability.get]",
      error,
      "가능 시간을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}

export async function PUT(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = availabilitySchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "가능시간 형식이 올바르지 않습니다."),
      422
    );
  }

  try {
    const db = createRuntimeDatabase();
    const availability = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) =>
        profiles.replaceAvailability(tx, {
          userId: current.session.userId,
          slots: parsed.data.slots
        })
    );

    return envelope({ availability }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.availability.put]",
      error,
      "가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
