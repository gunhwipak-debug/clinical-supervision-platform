import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
  verifySession
} from "../../../lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const returnTo = request.nextUrl.searchParams.get("returnTo");

  if (!token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const handoff = await safeVerifySession(token);
  if (!handoff || handoff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const session = await signSession({
    role: "admin",
    userId: handoff.userId
  });
  const response = NextResponse.redirect(
    new URL(safeAdminReturnPath(returnTo), request.url)
  );
  response.cookies.set(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());

  return response;
}

async function safeVerifySession(token: string) {
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

function safeAdminReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin";
  }
  return value;
}
