import { auth } from "@csp/db";
import { verifyPassword } from "@csp/shared/auth/password";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
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
  password: z.string().min(1).max(1024)
});

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

  const db = createAuthDatabase();
  const user = await auth.findUserByEmail(db, parsed.data.email);

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

  const { token, payload } = await signSession({
    userId: user.id,
    role: user.role
  });
  const response = envelope(
    {
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

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
