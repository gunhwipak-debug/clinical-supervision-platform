export const SESSION_COOKIE_NAME = "csp_session";
export const SESSION_TTL_MS = 30 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionPayload = {
  userId: string;
  role: "supervisee" | "supervisor" | "admin";
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
};

export type SessionCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "lax";
  secure: boolean;
};

export async function signSession(input: {
  role: "admin";
  userId: string;
}): Promise<{ payload: SessionPayload; token: string }> {
  const now = Date.now();
  const payload: SessionPayload = {
    userId: input.userId,
    role: input.role,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    sessionId: crypto.randomUUID()
  };
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signData(encodedPayload);

  return { payload, token: `${encodedPayload}.${signature}` };
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = await signData(encodedPayload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decoder.decode(base64UrlDecode(encodedPayload))
    ) as Partial<SessionPayload>;

    if (
      typeof payload.userId !== "string" ||
      payload.role !== "admin" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.sessionId !== "string" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production"
  };
}

async function signData(data: string): Promise<string> {
  const secret = process.env["BETTER_AUTH_SECRET"];
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return base64UrlEncode(new Uint8Array(signature));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
