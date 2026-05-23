import { NextResponse, type NextRequest } from "next/server";
import {
  expiredSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySession
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token || !(await verifySession(token))) {
    return envelope(
      null,
      { code: "unauthorized", message: "로그인이 필요합니다." },
      401
    );
  }

  const response = envelope({ ok: true }, null, 200);
  response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());

  return response;
}

function envelope<TData>(
  data: TData,
  responseError: { code: string; message: string } | null,
  status: 200 | 401
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
