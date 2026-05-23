import { auth } from "@csp/db";
import { hashPassword } from "@csp/shared/auth/password";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createAuthDatabase } from "@/lib/auth/database";
import { createAndSendEmailVerification } from "@/lib/auth/token-flows";

export const runtime = "nodejs";

const requiredTerms = ["tos", "privacy", "sensitive"] as const;

const signupSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .email()
      .max(320)
      .transform((value) => value.toLowerCase())
  ),
  password: z
    .string()
    .min(10)
    .max(256)
    .regex(/\d/u)
    .regex(/[^A-Za-z0-9]/u),
  consent: z.object({
    tos: z.literal(true),
    privacy: z.literal(true),
    sensitive: z.literal(true)
  })
});

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "가입 입력값을 확인해주세요."),
      422
    );
  }

  try {
    const db = createAuthDatabase();
    const termsVersions = await auth.getActiveTermsVersions(db, [...requiredTerms]);
    const foundKinds = new Set(termsVersions.map((terms) => terms.kind));

    if (requiredTerms.some((kind) => !foundKinds.has(kind))) {
      return envelope(
        null,
        apiError("terms_missing", "필수 약관에 모두 동의해주세요."),
        422
      );
    }

    const existing = await auth.findUserByEmail(db, parsed.data.email);

    if (existing?.status === "active") {
      await hashPassword(parsed.data.password);
      return envelope({ ok: true }, null, 200);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await auth.createUserWithPassword(db, {
      email: parsed.data.email,
      passwordHash,
      role: "supervisee"
    });

    await auth.insertConsentRecords(db, {
      userId: user.id,
      termsVersions,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined
    });
    await createAndSendEmailVerification(db, {
      userId: user.id,
      email: user.email,
      ip: request.headers.get("x-forwarded-for") ?? undefined
    });

    return envelope({ ok: true }, null, 200);
  } catch (error) {
    console.error("[auth.signup]", error);
    return envelope(
      null,
      apiError("server_unavailable", "가입 서버 설정을 확인해주세요."),
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
