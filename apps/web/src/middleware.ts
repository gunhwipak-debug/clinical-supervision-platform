import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "./lib/auth/session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(loginUrl(request));
  }

  const session = await safeVerifySession(token);
  if (!session) {
    return NextResponse.redirect(loginUrl(request));
  }

  if (session.role !== "admin") {
    return new NextResponse(
      `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>접근할 수 없는 화면</title></head><body style="font-family:system-ui,sans-serif;margin:48px;color:#081225"><h1>접근할 수 없는 화면입니다</h1><p>운영 콘솔은 관리자 계정에서만 열 수 있습니다.</p><p><a href="/requests">내 의뢰로 돌아가기</a></p></body></html>`,
      {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 403
      }
    );
  }

  return NextResponse.redirect(adminUrl(request));
}

export const config = {
  matcher: ["/admin/:path*"]
};

async function safeVerifySession(token: string) {
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

function loginUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?returnTo=${encodeURIComponent(request.nextUrl.pathname)}`;
  return url;
}

function adminUrl(request: NextRequest): URL {
  const configuredOrigin =
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ??
    process.env["NEXT_PUBLIC_ADMIN_URL"] ??
    "https://clinicflow-admin-six.vercel.app";
  const origin = safeOrigin(configuredOrigin);
  return new URL(request.nextUrl.pathname, origin);
}

function safeOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.origin;
    }
  } catch {
    return "https://clinicflow-admin-six.vercel.app";
  }
  return "https://clinicflow-admin-six.vercel.app";
}
