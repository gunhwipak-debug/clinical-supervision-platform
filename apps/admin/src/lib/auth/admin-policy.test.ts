import { describe, expect, it } from "vitest";
import {
  adminReasonFromHeaders,
  adminReasonMinLength,
  isAdminTotpReady,
  isValidAdminReason
} from "./admin-policy";
import type { CurrentAdmin } from "./current-admin";

describe("admin policy helpers", () => {
  it("requires a 30 character admin reason", () => {
    expect(adminReasonMinLength).toBe(30);
    expect(isValidAdminReason("x".repeat(29))).toBe(false);
    expect(isValidAdminReason("x".repeat(30))).toBe(true);
  });

  it("returns an empty reason when the header is missing", () => {
    const headers = new Headers();
    const reason = adminReasonFromHeaders(headers);
    expect(reason).toBe("");
    expect(isValidAdminReason(reason)).toBe(false);
  });

  it("requires active admin with TOTP", () => {
    const current = {
      session: {
        userId: "admin",
        role: "admin",
        issuedAt: 0,
        expiresAt: 1,
        sessionId: "session"
      },
      user: {
        id: "admin",
        email: "admin@example.com",
        role: "admin",
        status: "active",
        totpEnabled: true
      }
    } as CurrentAdmin;

    expect(isAdminTotpReady(current)).toBe(true);
    expect(
      isAdminTotpReady({
        ...current,
        user: { ...current.user, totpEnabled: false }
      })
    ).toBe(false);
  });
});
