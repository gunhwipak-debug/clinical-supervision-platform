import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { visibilitySchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = visibilitySchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "공개 상태 값이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const profile = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.getSupervisorProfileByUserId(tx, current.session.userId)
  );

  if (!profile)
    return envelope(null, apiError("not_found", "프로필을 찾을 수 없습니다."), 404);

  if (parsed.data.visibility === "public") {
    if (!current.user.totpEnabled) {
      return envelope(
        null,
        apiError("2fa_required", "2단계 인증을 먼저 설정해주세요."),
        422
      );
    }
    if (profile.verificationStatus !== "approved") {
      return envelope(
        null,
        apiError("verification_required", "승인된 자격 정보가 필요합니다."),
        422
      );
    }
  }

  const updated = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.setSupervisorVisibility(
        tx,
        current.session.userId,
        parsed.data.visibility
      )
  );

  return envelope({ profile: updated }, null, 200);
}
