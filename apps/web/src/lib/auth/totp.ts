import { sha256Hex } from "@csp/shared/auth/tokens";
import { generateSecret, generateSync, generateURI, verifySync } from "otplib";

export const TOTP_SETUP_TTL_MS = 10 * 60 * 1000;
export const RECOVERY_CODE_COUNT = 8;

export function generateTotpSecret(): string {
  // otplib is pure JS for HOTP/TOTP and avoids native builds in Node 24/Vercel.
  return generateSecret();
}

export function buildOtpAuthUri(input: {
  email: string;
  secret: string;
  issuer?: string;
}): string {
  return generateURI({
    issuer: input.issuer ?? "ClinicFlow",
    label: input.email,
    secret: input.secret,
    period: 30
  });
}

export function verifyTotpCode(input: { secret: string; code: string }): boolean {
  return verifySync({
    secret: input.secret,
    token: input.code,
    period: 30,
    epochTolerance: 30
  }).valid;
}

export function generateTotpCode(input: { secret: string; epoch?: number }): string {
  const options: Parameters<typeof generateSync>[0] = {
    secret: input.secret,
    period: 30
  };

  if (input.epoch !== undefined) {
    options.epoch = input.epoch;
  }

  return generateSync(options);
}

export async function generateRecoveryCodes(): Promise<
  Array<{ code: string; codeHash: string }>
> {
  const codes: Array<{ code: string; codeHash: string }> = [];

  for (let index = 0; index < RECOVERY_CODE_COUNT; index += 1) {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .match(/.{1,6}/gu)
      ?.join("-")
      .toUpperCase();

    if (!code) {
      throw new Error("Failed to generate recovery code");
    }

    codes.push({ code, codeHash: await sha256Hex(code) });
  }

  return codes;
}
