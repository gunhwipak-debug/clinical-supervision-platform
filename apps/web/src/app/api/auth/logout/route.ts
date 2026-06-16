import { NextResponse } from "next/server";
import { expiredSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

export function POST() {
  const response = envelope({ ok: true }, null, 200);
  response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());

  return response;
}

function envelope<TData>(
  data: TData,
  responseError: { code: string; message: string } | null,
  status: 200
) {
  return NextResponse.json(
    { data, error: responseError },
    {
      status,
      headers: {
        "X-Robots-Tag": "noindex"
      }
    }
  );
}
