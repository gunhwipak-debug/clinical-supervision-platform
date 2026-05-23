import { auth, withUserContext } from "@csp/db";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import {
  buildOtpAuthUri,
  generateRecoveryCodes,
  generateTotpSecret
} from "@/lib/auth/totp";

export const runtime = "nodejs";

export async function POST() {
  const current = await getCurrentUser();

  if (!current) {
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  }

  const db = createRuntimeDatabase();
  const secret = generateTotpSecret();
  const recoveryCodes = await generateRecoveryCodes();

  await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role, phiAccess: true },
    async (tx) => {
      await auth.setTotpSecret(tx, current.session.userId, secret);
      await auth.insertRecoveryCodes(tx, {
        userId: current.session.userId,
        codeHashes: recoveryCodes.map((recoveryCode) => recoveryCode.codeHash)
      });
    }
  );

  return envelope(
    {
      otpauthUri: buildOtpAuthUri({
        email: current.user.email,
        secret
      }),
      recoveryCodes: recoveryCodes.map((recoveryCode) => recoveryCode.code)
    },
    null,
    200
  );
}
