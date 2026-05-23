import { randomBytes } from "node:crypto";
import { profiles, withUserContext } from "@csp/db";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import {
  buildGoogleCalendarAuthUrl,
  getGoogleCalendarConfig
} from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current || !isSupervisor(current)) {
    return NextResponse.redirect(new URL("/login", request.url));
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

  const config = getGoogleCalendarConfig(new URL(request.url).origin);
  if (!config) {
    return NextResponse.redirect(
      new URL("/supervisor/availability?calendar=config-required", request.url)
    );
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("csp_google_calendar_state", state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production"
  });

  return NextResponse.redirect(buildGoogleCalendarAuthUrl(config, state));
}
