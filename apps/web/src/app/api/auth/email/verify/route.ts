import { auth } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
import { hashToken } from "@/lib/auth/token-flows";

export const runtime = "nodejs";

const verifySchema = z.object({
  token: z.string().min(20).max(256)
});

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "인증 토큰이 올바르지 않습니다."),
      422
    );
  }

  const db = createAuthDatabase();
  const token = await auth.consumeAuthToken(db, {
    kind: "email_verify",
    tokenHash: await hashToken(parsed.data.token)
  });

  if (!token) {
    return envelope(
      null,
      apiError("invalid_token", "인증 토큰이 올바르지 않습니다."),
      422
    );
  }

  await auth.markEmailVerified(db, token.userId);

  return envelope({ ok: true }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
