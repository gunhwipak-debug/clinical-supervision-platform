import { calendar, profiles, withUserContext } from "@csp/db";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import {
  exchangeGoogleCalendarCode,
  getGoogleCalendarConfig,
  getGoogleCalendarEmail
} from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const current = await getCurrentUser();
  if (!current || !isSupervisor(current)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("csp_google_calendar_state")?.value;
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  cookieStore.delete("csp_google_calendar_state");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/supervisor/availability?calendar=invalid-state", request.url)
    );
  }

  const config = getGoogleCalendarConfig(url.origin);
  if (!config) {
    return NextResponse.redirect(
      new URL("/supervisor/availability?calendar=config-required", request.url)
    );
  }

  const db = createRuntimeDatabase();
  const profileId = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.getSupervisorProfileIdForUser(tx, current.session.userId)
  );

  if (!profileId) {
    return NextResponse.redirect(
      new URL("/supervisor/profile?calendar=profile-required", request.url)
    );
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(config, code);
    const email = await getGoogleCalendarEmail(tokens.accessToken);
    await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) =>
        calendar.upsertGoogleConnection(tx, {
          accessToken: tokens.accessToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          calendarId: "primary",
          providerAccountEmail: email,
          refreshToken: tokens.refreshToken,
          userId: current.session.userId
        })
    );
  } catch {
    return NextResponse.redirect(
      new URL("/supervisor/availability?calendar=connect-failed", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/supervisor/availability?calendar=connected", request.url)
  );
}
