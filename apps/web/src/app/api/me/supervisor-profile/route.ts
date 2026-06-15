import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { serverUnavailable } from "@/lib/api/errors";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { nullable, supervisorProfileSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  try {
    const db = createRuntimeDatabase();
    const profile = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.getSupervisorProfileByUserId(tx, current.session.userId)
    );

    return envelope({ profile }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.supervisor-profile.get]",
      error,
      "프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}

export async function PUT(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = supervisorProfileSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "프로필 입력값을 확인해주세요."),
      422
    );
  }

  try {
    const db = createRuntimeDatabase();
    const profile = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) =>
        profiles.upsertSupervisorProfile(tx, current.session.userId, {
          displayName: parsed.data.displayName,
          photoUrl: nullable(parsed.data.photoUrl),
          headline: nullable(parsed.data.headline),
          bio: nullable(parsed.data.bio),
          yearsOfExperience: nullable(parsed.data.yearsOfExperience),
          zoomMeetingUrl: nullable(parsed.data.zoomMeetingUrl)
        })
    );

    return envelope({ profile }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.supervisor-profile.put]",
      error,
      "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
