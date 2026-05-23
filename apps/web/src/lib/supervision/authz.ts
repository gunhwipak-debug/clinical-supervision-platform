import type { UserContext } from "@csp/db";
import type { CurrentUser } from "@/lib/auth/current-user";

export function isRequestParticipant(
  current: CurrentUser,
  request: {
    superviseeId: string;
    supervisorId: string | null;
  }
): boolean {
  return (
    request.superviseeId === current.session.userId ||
    request.supervisorId === current.session.userId ||
    current.session.role === "admin"
  );
}

export function isRequestOwner(
  current: CurrentUser,
  request: { superviseeId: string }
): boolean {
  return request.superviseeId === current.session.userId;
}

export function contextFor(
  current: CurrentUser,
  request?: Request,
  options: { phiAccess?: boolean } = {}
): UserContext {
  const context: UserContext = {
    userId: current.session.userId,
    role: current.session.role
  };

  if (current.session.role === "admin") {
    context.adminReason = request?.headers.get("x-admin-reason") ?? "";
  }
  if (options.phiAccess === true) {
    context.phiAccess = true;
  }

  return context;
}
