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
    const result = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      async (tx) => {
        const availability = await profiles.listAvailability(
          tx,
          current.session.userId
        );
        const exceptions = await profiles.listAvailabilityExceptions(
          tx,
          current.session.userId
        );
        return { availability, exceptions };
      }
    );

    return envelope(result, null, 200);
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
      async (tx) => {
        const supervisorProfileId = await profiles.getSupervisorProfileIdForUser(
          tx,
          current.session.userId
        );

        if (!supervisorProfileId) return null;

        return profiles.replaceAvailability(tx, {
          exceptions: parsed.data.exceptions.map((exception) => ({
            ...exception,
            note: exception.note ?? null
          })),
          userId: current.session.userId,
          slots: parsed.data.slots
        });
      }
    );

    if (!availability) {
      return envelope(
        null,
        apiError("profile_required", "먼저 슈퍼바이저 프로필을 저장해주세요."),
        422
      );
    }

    const exceptions = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listAvailabilityExceptions(tx, current.session.userId)
    );

    return envelope({ availability, exceptions }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.availability.put]",
      error,
      "가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
