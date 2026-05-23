import { auth } from "@csp/db";
import { hashPassword } from "@csp/shared/auth/password";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
import { hashToken } from "@/lib/auth/token-flows";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(20).max(256),
  password: z
    .string()
    .min(10)
    .max(256)
    .regex(/\d/u)
    .regex(/[^A-Za-z0-9]/u)
});

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "비밀번호 재설정 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createAuthDatabase();
  const token = await auth.consumeAuthToken(db, {
    kind: "password_reset",
    tokenHash: await hashToken(parsed.data.token)
  });

  if (!token) {
    return envelope(
      null,
      apiError("invalid_token", "인증 토큰이 올바르지 않습니다."),
      422
    );
  }

  await auth.updatePassword(db, {
    userId: token.userId,
    passwordHash: await hashPassword(parsed.data.password)
  });

  return envelope({ ok: true }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
