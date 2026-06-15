import * as auth from "@csp/db/auth";
import { verifyPassword } from "@csp/shared/auth/password";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
import { getSeededDemoLoginUser, isSeededDemoLogin } from "@/lib/auth/demo-auth";
import { dummyHash } from "@/lib/auth/dummy-hash";
import { verifyLoginPassword } from "@/lib/auth/login-verification";
import {
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSession
} from "@/lib/auth/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .email()
      .max(320)
      .transform((value) => value.toLowerCase())
  ),
  password: z.string().min(1).max(1024),
  returnTo: z.string().max(2048).optional()
});

type LoginUser = Pick<auth.AuthUser, "id" | "email" | "role">;

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "로그인 입력값을 확인해주세요."),
      422
    );
  }

  try {
    if (isSeededDemoLogin(parsed.data.email, parsed.data.password)) {
      const demoUser = getSeededDemoLoginUser(parsed.data.email);
      if (demoUser) {
        return await createLoginResponse(demoUser, parsed.data.returnTo);
      }
    }

    const db = createAuthDatabase();
    let user = await auth.findUserByEmail(db, parsed.data.email);

    if (
      user &&
      user.passwordHash &&
      user.status === "active" &&
      auth.isLoginLocked(user)
    ) {
      return envelope(
        null,
        apiError("locked", "로그인 시도가 많아 잠시 후 다시 시도해주세요."),
        423
      );
    }

    const passwordCheck = await verifyLoginPassword({
      user,
      password: parsed.data.password,
      dummyHash,
      verifyPassword
    });

    if (!user || !passwordCheck.userCanAuthenticate) {
      return envelope(
        null,
        apiError("invalid_credentials", "이메일 또는 비밀번호를 확인해주세요."),
        401
      );
    }

    if (!passwordCheck.passwordMatches) {
      await auth.recordFailedLogin(db, user.id);
      return envelope(
        null,
        apiError("invalid_credentials", "이메일 또는 비밀번호를 확인해주세요."),
        401
      );
    }

    await auth.clearLoginFailures(db, user.id);
    await auth.touchLastLogin(db, user.id);

    return await createLoginResponse(user, parsed.data.returnTo);
  } catch (error) {
    console.error("[auth.login]", describeError(error));
    return envelope(
      null,
      apiError("server_unavailable", "로그인 서버 설정을 확인해주세요."),
      503
    );
  }
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function createLoginResponse(user: LoginUser, returnTo?: string) {
  const { token, payload } = await signSession({
    userId: user.id,
    role: user.role
  });
  const adminHandoffUrl =
    user.role === "admin" ? await createAdminHandoffUrl(user, returnTo) : undefined;
  const response = envelope(
    {
      ...(adminHandoffUrl ? { adminHandoffUrl } : {}),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      session: {
        expiresAt: payload.expiresAt
      }
    },
    null,
    200
  );

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

  return response;
}

async function createAdminHandoffUrl(
  user: LoginUser,
  returnTo: string | undefined
): Promise<string> {
  const { token } = await signSession(
    {
      userId: user.id,
      role: "admin"
    },
    { ttlMs: 60 * 1000 }
  );
  const handoffUrl = new URL("/auth/handoff", adminAppOrigin());
  handoffUrl.searchParams.set("token", token);
  handoffUrl.searchParams.set("returnTo", adminReturnPath(returnTo));
  return handoffUrl.toString();
}

function adminReturnPath(returnTo: string | undefined): string {
  if (!returnTo) return "/admin";

  try {
    if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      return returnTo.startsWith("/admin") ? returnTo : "/admin";
    }

    const url = new URL(returnTo);
    if (url.origin === adminAppOrigin() && url.pathname.startsWith("/admin")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/admin";
  }

  return "/admin";
}

function adminAppOrigin(): string {
  const configured =
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ??
    process.env["NEXT_PUBLIC_ADMIN_URL"] ??
    "https://clinicflow-admin-six.vercel.app";

  try {
    const url = new URL(configured);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.origin;
    }
  } catch {
    return "https://clinicflow-admin-six.vercel.app";
  }

  return "https://clinicflow-admin-six.vercel.app";
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
