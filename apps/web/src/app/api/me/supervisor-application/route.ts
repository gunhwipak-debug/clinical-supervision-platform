import { profiles, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import {
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSession
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.user.role === "admin") {
    return envelope(
      null,
      apiError("forbidden", "관리자 계정은 슈퍼바이저 신청 대상이 아닙니다."),
      403
    );
  }

  const db = createRuntimeDatabase();
  const profile = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      profiles.startSupervisorApplication(tx, {
        displayName: displayNameFromEmail(current.user.email),
        userId: current.session.userId
      })
  );

  const { token, payload } = await signSession({
    role: "supervisor",
    sessionId: current.session.sessionId,
    userId: current.session.userId
  });

  const response = envelope(
    {
      profile,
      session: { expiresAt: payload.expiresAt },
      user: {
        email: current.user.email,
        id: current.user.id,
        role: "supervisor"
      }
    },
    null,
    200
  );

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim() ?? "";
  const normalized = localPart.replace(/[._-]+/gu, " ").trim();
  return normalized.length > 0 ? normalized : "슈퍼바이저 신청자";
}
