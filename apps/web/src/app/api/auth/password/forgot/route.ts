import { auth } from "@csp/db";
import { verifyPassword } from "@csp/shared/auth/password";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
import { dummyHash } from "@/lib/auth/dummy-hash";
import { createAndSendPasswordReset } from "@/lib/auth/token-flows";

export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .email()
      .max(320)
      .transform((value) => value.toLowerCase())
  )
});

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  const parsed = forgotSchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createAuthDatabase();
  const user = await auth.findUserByEmail(db, parsed.data.email);

  if (user?.status === "active") {
    await createAndSendPasswordReset(db, {
      userId: user.id,
      email: user.email,
      ip: request.headers.get("x-forwarded-for") ?? undefined
    });
  } else {
    await verifyPassword("dummy forgot password", dummyHash);
  }

  return envelope({ ok: true }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
