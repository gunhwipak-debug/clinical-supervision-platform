import type { CurrentUser } from "./current-user";

export function requiresTotp(user: CurrentUser["user"]): boolean {
  return user.role === "admin" && !user.totpEnabled;
}

export function isSupervisor(user: CurrentUser | null): user is CurrentUser {
  return user?.user.role === "supervisor";
}

export function isSupervisee(user: CurrentUser | null): user is CurrentUser {
  return user?.user.role === "supervisee" || user?.user.role === "supervisor";
}

export function isAdminWithTotp(user: CurrentUser | null): user is CurrentUser {
  return user?.user.role === "admin" && user.user.totpEnabled;
}
