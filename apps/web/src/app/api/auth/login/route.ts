import { auth } from "@csp/db";
import { hashPassword, verifyPassword } from "@csp/shared/auth/password";
import { sql, type SQL } from "drizzle-orm";
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

type DemoRole = "supervisee" | "supervisor" | "admin";
type DemoAuthAccount = {
  id: string;
  role: DemoRole;
  totpEnabled: boolean;
};
type DemoAuthDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

const DEMO_PASSWORD = "DemoPass!23";
const DEMO_AUTH_ACCOUNTS: Record<string, DemoAuthAccount> = {
  "supervisee@demo.local": {
    id: "10000000-0000-4000-8000-000000000001",
    role: "supervisee",
    totpEnabled: false
  },
  "draft-author@demo.local": {
    id: "10000000-0000-4000-8000-000000000002",
    role: "supervisee",
    totpEnabled: false
  },
  "approved-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000003",
    role: "supervisor",
    totpEnabled: true
  },
  "hidden-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000004",
    role: "supervisor",
    totpEnabled: true
  },
  "admin@demo.local": {
    id: "10000000-0000-4000-8000-000000000005",
    role: "admin",
    totpEnabled: true
  },
  "trauma-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000006",
    role: "supervisor",
    totpEnabled: true
  },
  "child-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000007",
    role: "supervisor",
    totpEnabled: true
  },
  "neuro-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000008",
    role: "supervisor",
    totpEnabled: true
  },
  "forensic-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000009",
    role: "supervisor",
    totpEnabled: true
  },
  "geriatric-sup@demo.local": {
    id: "10000000-0000-4000-8000-000000000010",
    role: "supervisor",
    totpEnabled: true
  },
  "case-owner@demo.local": {
    id: "10000000-0000-4000-8000-000000000011",
    role: "supervisee",
    totpEnabled: false
  },
  "reviewer@demo.local": {
    id: "10000000-0000-4000-8000-000000000012",
    role: "supervisee",
    totpEnabled: false
  }
};

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
    const db = createAuthDatabase();
    let user = await auth.findUserByEmail(db, parsed.data.email);

    if (isSeededDemoLogin(parsed.data.email, parsed.data.password)) {
      user = await ensureSeededDemoUser(db, parsed.data.email);
    }

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
  } catch (error) {
    console.error("[auth.login]", error);
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

function isSeededDemoLogin(email: string, password: string): boolean {
  return email in DEMO_AUTH_ACCOUNTS && password === DEMO_PASSWORD;
}

async function ensureSeededDemoUser(db: DemoAuthDatabase, email: string) {
  const account = DEMO_AUTH_ACCOUNTS[email];
  if (!account) return null;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db.execute(sql`
    insert into users (
      id,
      email,
      password_hash,
      role,
      totp_enabled,
      email_verified_at,
      failed_login_count,
      locked_until,
      status
    ) values (
      ${account.id},
      ${email},
      ${passwordHash},
      ${account.role},
      ${account.totpEnabled},
      now(),
      0,
      null,
      'active'
    )
    on conflict (email) do update set
      password_hash = excluded.password_hash,
      role = excluded.role,
      totp_enabled = excluded.totp_enabled,
      email_verified_at = coalesce(users.email_verified_at, now()),
      failed_login_count = 0,
      locked_until = null,
      status = 'active',
      updated_at = now()
  `);

  return auth.findUserByEmail(db, email);
}
