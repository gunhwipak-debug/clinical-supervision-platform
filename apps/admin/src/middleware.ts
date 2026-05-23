import { NextResponse, type NextRequest } from "next/server";
import { checkAdminNetworkAccess } from "./lib/auth/admin-network";

export function middleware(request: NextRequest) {
  const decision = checkAdminNetworkAccess(request.headers);

  if (decision.allowed) return NextResponse.next();

  return NextResponse.json(
    {
      error: {
        code: "admin_network_blocked",
        message: "허용된 관리자 네트워크에서만 운영 콘솔에 접근할 수 있습니다.",
        reason: decision.reason
      }
    },
    { status: 403 }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
