export const SESSION_COOKIE_NAME = "csp_session";
export const SESSION_TTL_MS = 30 * 60 * 1000;
export const SESSION_ROTATE_AFTER_MS = 15 * 60 * 1000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionPayload = {
  userId: string;
  role: "supervisee" | "supervisor" | "admin";
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
};

export type SignSessionInput = {
  userId: string;
  role: SessionPayload["role"];
  sessionId?: string;
};

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export type VerifySessionOptions = {
  now?: Date;
  passwordChangedAt?: Date | string | number | null;
  secret?: string;
};

export type SignSessionOptions = {
  now?: Date;
  secret?: string;
};

export type RotateSessionResult = {
  token: string;
  payload: SessionPayload;
  rotated: boolean;
};

export async function signSession(
  input: SignSessionInput,
  options: SignSessionOptions = {}
): Promise<{ token: string; payload: SessionPayload }> {
  const now = options.now?.getTime() ?? Date.now();
  const payload: SessionPayload = {
    userId: input.userId,
    role: input.role,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    sessionId: input.sessionId ?? crypto.randomUUID()
  };

  return {
    payload,
    token: await signPayload(payload, options.secret)
  };
}

export async function verifySession(
  token: string,
  options: VerifySessionOptions = {}
): Promise<SessionPayload | null> {
  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = await signData(encodedPayload, options.secret);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = parsePayload(encodedPayload);
  const now = options.now?.getTime() ?? Date.now();

  if (!payload || payload.expiresAt <= now) {
    return null;
  }

  const passwordChangedAt = toTime(options.passwordChangedAt);
  if (passwordChangedAt !== null && payload.issuedAt < passwordChangedAt) {
    return null;
  }

  return payload;
}

export async function rotateSession(
  token: string,
  options: VerifySessionOptions = {}
): Promise<RotateSessionResult | null> {
  const payload = await verifySession(token, options);

  if (!payload) {
    return null;
  }

  const now = options.now?.getTime() ?? Date.now();

  if (now - payload.issuedAt < SESSION_ROTATE_AFTER_MS) {
    return { token, payload, rotated: false };
  }

  const signOptions: SignSessionOptions = {};
  if (options.now) {
    signOptions.now = options.now;
  }
  if (options.secret) {
    signOptions.secret = options.secret;
  }

  const rotated = await signSession(
    { userId: payload.userId, role: payload.role },
    signOptions
  );

  return { ...rotated, rotated: true };
}

export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  };
}

export function expiredSessionCookieOptions(): SessionCookieOptions {
  return {
    ...sessionCookieOptions(),
    maxAge: 0
  };
}

async function signPayload(payload: SessionPayload, secret?: string): Promise<string> {
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signData(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

async function signData(data: string, secret = getSessionSecret()): Promise<string> {
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

function getSessionSecret(): string {
  const secret = process.env["BETTER_AUTH_SECRET"];

  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  return secret;
}

function parsePayload(encodedPayload: string): SessionPayload | null {
  try {
    const raw = decoder.decode(base64UrlDecode(encodedPayload));
    const parsed = JSON.parse(raw) as Partial<SessionPayload>;

    if (
      typeof parsed.userId !== "string" ||
      !isSessionRole(parsed.role) ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.sessionId !== "string"
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function isSessionRole(value: unknown): value is SessionPayload["role"] {
  return value === "supervisee" || value === "supervisor" || value === "admin";
}

function toTime(value: Date | string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value instanceof Date ? value.getTime() : new Date(value).getTime();
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

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}
