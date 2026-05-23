import { auth } from "@csp/db";
import { getMailer } from "@csp/shared";
import { issueRandomToken, sha256Hex } from "@csp/shared/auth/tokens";

export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

type TokenDatabase = Parameters<typeof auth.createAuthToken>[0];

export async function createAndSendEmailVerification(
  db: TokenDatabase,
  input: { userId: string; email: string; ip?: string | undefined }
): Promise<void> {
  const issued = await issueRandomToken();
  await auth.createAuthToken(db, {
    userId: input.userId,
    kind: "email_verify",
    tokenHash: issued.tokenHash,
    expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    ip: input.ip
  });
  await getMailer().send({
    to: input.email,
    subject: "ClinicFlow 이메일 인증",
    text: `이메일 인증 토큰: ${issued.token}`,
    metadata: { kind: "email_verify", userId: input.userId }
  });
}

export async function createAndSendPasswordReset(
  db: TokenDatabase,
  input: { userId: string; email: string; ip?: string | undefined }
): Promise<void> {
  const issued = await issueRandomToken();
  await auth.createAuthToken(db, {
    userId: input.userId,
    kind: "password_reset",
    tokenHash: issued.tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    ip: input.ip
  });
  await getMailer().send({
    to: input.email,
    subject: "ClinicFlow 비밀번호 재설정",
    text: `비밀번호 재설정 토큰: ${issued.token}`,
    metadata: { kind: "password_reset", userId: input.userId }
  });
}

export async function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}
