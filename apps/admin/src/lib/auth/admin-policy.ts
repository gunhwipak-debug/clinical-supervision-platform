import type { CurrentAdmin } from "./current-admin";

export const adminReasonMinLength = 30;

export function isAdminTotpReady(
  current: CurrentAdmin | null
): current is CurrentAdmin {
  return (
    current !== null &&
    current.user.role === "admin" &&
    current.user.status === "active" &&
    current.user.totpEnabled
  );
}

export function normalizeAdminReason(reason: string | null | undefined): string {
  return (reason ?? "").trim();
}

export function isValidAdminReason(reason: string | null | undefined): boolean {
  return normalizeAdminReason(reason).length >= adminReasonMinLength;
}

export function adminReasonFromHeaders(headers: Pick<Headers, "get">): string {
  return normalizeAdminReason(headers.get("x-admin-reason"));
}
