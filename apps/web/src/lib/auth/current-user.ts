import { auth, withUserContext } from "@csp/db";
import { cookies } from "next/headers";
import { createRuntimeDatabase } from "./database";
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

  const payload = await verifySession(token);
  if (!payload) {
    return null;
  }

  const db = createRuntimeDatabase();
  const user = await withUserContext(
    db,
    { userId: payload.userId, role: payload.role },
    async (tx) => auth.findTotpUserById(tx, payload.userId)
  );

  if (!user || user.status !== "active" || user.role !== payload.role) {
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
