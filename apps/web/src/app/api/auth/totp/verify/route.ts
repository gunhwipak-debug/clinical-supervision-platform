import { auth, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { verifyTotpCode } from "@/lib/auth/totp";

export const runtime = "nodejs";

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/u)
});

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();

  if (!current) {
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  }

  const body = await parseJson(request);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "인증 코드가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const verified = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role, phiAccess: true },
    async (tx) => {
      const secret = await auth.getTotpSecret(tx, current.session.userId);

      if (!secret || !verifyTotpCode({ secret, code: parsed.data.code })) {
        return false;
      }

      await auth.setTotpEnabled(tx, current.session.userId, true);
      return true;
    }
  );

  if (!verified) {
    return envelope(
      null,
      apiError("invalid_code", "인증 코드가 올바르지 않습니다."),
      422
    );
  }

  return envelope({ totpEnabled: true }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
