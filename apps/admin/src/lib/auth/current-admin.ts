import { auth, withUserContext } from "@csp/db";
import { createDatabase } from "@csp/db/client";
import { DEMO_AUTH_ACCOUNTS } from "@csp/db/demo-accounts";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession, type SessionPayload } from "./session";

export type CurrentAdmin = {
  session: SessionPayload;
  user: auth.TotpUser;
};

export function createRuntimeDatabase() {
  const runtimeUrl = process.env["DATABASE_URL"];

  if (!runtimeUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error("DATABASE_URL is required");
  }

  return createDatabase(runtimeUrl);
}

export function createServiceDatabase() {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];

  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error("SERVICE_DATABASE_URL is required");
  }

  return createDatabase(serviceUrl);
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await safeVerifySession(token);
  if (!session) return null;

  const demoUser = getSeededDemoAdminSessionUser(session.userId);
  if (demoUser) {
    return { session, user: demoUser };
  }

  const db = createRuntimeDatabase();
  const user = await withUserContext(
    db,
    { userId: session.userId, role: session.role },
    (tx) => auth.findTotpUserById(tx, session.userId)
  );

  if (!user || user.role !== "admin" || user.status !== "active" || !user.totpEnabled) {
    return null;
  }

  return { session, user };
}

function getSeededDemoAdminSessionUser(userId: string): auth.TotpUser | null {
  const account = DEMO_AUTH_ACCOUNTS.find(
    (candidate) => candidate.id === userId && candidate.role === "admin"
  );
  if (!account) return null;

  return {
    email: account.email,
    id: account.id,
    passwordChangedAt: null,
    role: "admin",
    status: "active",
    totpEnabled: account.totpEnabled,
    totpSecretEnc: null
  };
}

async function safeVerifySession(token: string): Promise<SessionPayload | null> {
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
