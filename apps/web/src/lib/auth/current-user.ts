import * as auth from "@csp/db/auth";
import { withUserContext } from "@csp/db/context";
import { cookies } from "next/headers";
import { createRuntimeDatabase } from "./database";
import { getSeededDemoSessionUser } from "./demo-auth";
import { SESSION_COOKIE_NAME, verifySession, type SessionPayload } from "./session";

export type CurrentUser = {
  session: SessionPayload;
  user: auth.TotpUser;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await safeVerifySession(token);
  if (!payload) {
    return null;
  }

  const demoUser = getSeededDemoSessionUser(payload.userId, payload.role);
  if (demoUser) {
    return { session: payload, user: demoUser };
  }

  const db = createRuntimeDatabase();
  const user = await withUserContext(
    db,
    { userId: payload.userId, role: payload.role },
    async (tx) => auth.findTotpUserById(tx, payload.userId)
  );

  if (!user) {
    return null;
  }

  if (user.status !== "active" || user.role !== payload.role) {
    return null;
  }

  const changedAt = user.passwordChangedAt
    ? new Date(user.passwordChangedAt).getTime()
    : null;
  if (changedAt !== null && payload.issuedAt < changedAt) {
    return null;
  }

  return { session: payload, user };
}

async function safeVerifySession(token: string): Promise<SessionPayload | null> {
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
