import { auth, withUserContext } from "@csp/db";
import { sha256Hex } from "@csp/shared/auth/tokens";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { verifyTotpCode } from "@/lib/auth/totp";

export const runtime = "nodejs";

const disableSchema = z.object({
  code: z.string().trim().min(6).max(32)
});

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();

  if (!current) {
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  }

  const body = await parseJson(request);
  const parsed = disableSchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "인증 코드가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const normalizedCode = parsed.data.code.toUpperCase();
  const recoveryCodeHash = await sha256Hex(normalizedCode);
  const disabled = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role, phiAccess: true },
    async (tx) => {
      const secret = await auth.getTotpSecret(tx, current.session.userId);
      let verified =
        /^\d{6}$/u.test(normalizedCode) &&
        !!secret &&
        verifyTotpCode({ secret, code: normalizedCode });

      if (!verified) {
        verified = await auth.consumeRecoveryCode(tx, {
          userId: current.session.userId,
          codeHash: recoveryCodeHash
        });
      }

      if (!verified) {
        return false;
      }

      await auth.clearTotpSecret(tx, current.session.userId);
      await auth.consumeAllRecoveryCodes(tx, current.session.userId);
      return true;
    }
  );

  if (!disabled) {
    return envelope(
      null,
      apiError("invalid_code", "인증 코드가 올바르지 않습니다."),
      422
    );
  }

  return envelope({ totpEnabled: false }, null, 200);
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
