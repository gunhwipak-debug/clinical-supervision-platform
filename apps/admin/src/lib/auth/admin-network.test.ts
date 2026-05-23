import { describe, expect, it } from "vitest";
import {
  checkAdminNetworkAccess,
  clientIpFromHeaders,
  parseAdminIpAllowlist
} from "./admin-network";

describe("admin network allowlist", () => {
  it("allows local development when no allowlist is configured", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });

    expect(
      checkAdminNetworkAccess(headers, {
        ADMIN_IP_ALLOWLIST: "",
        NODE_ENV: "development"
      })
    ).toMatchObject({ allowed: true, reason: "allowlist_not_required" });
  });

  it("fails closed in production when the allowlist is missing", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });

    expect(
      checkAdminNetworkAccess(headers, {
        ADMIN_IP_ALLOWLIST: "",
        NODE_ENV: "production"
      })
    ).toMatchObject({ allowed: false, reason: "missing_allowlist" });
  });

  it("matches exact IPv4, IPv4-mapped IPv6, and IPv4 CIDR entries", () => {
    const env = {
      ADMIN_IP_ALLOWLIST: "198.51.100.7, 203.0.113.0/24",
      NODE_ENV: "production"
    };

    expect(
      checkAdminNetworkAccess(new Headers({ "x-real-ip": "198.51.100.7" }), env)
    ).toMatchObject({ allowed: true, reason: "matched_allowlist" });
    expect(
      checkAdminNetworkAccess(
        new Headers({ "x-forwarded-for": "::ffff:203.0.113.25" }),
        env
      )
    ).toMatchObject({ allowed: true, reason: "matched_allowlist" });
    expect(
      checkAdminNetworkAccess(new Headers({ "x-forwarded-for": "192.0.2.5" }), env)
    ).toMatchObject({ allowed: false, reason: "not_in_allowlist" });
  });

  it("rejects invalid allowlist entries", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });

    expect(
      checkAdminNetworkAccess(headers, {
        ADMIN_IP_ALLOWLIST: "203.0.113.0/99",
        NODE_ENV: "production"
      })
    ).toMatchObject({ allowed: false, reason: "invalid_allowlist" });
  });

  it("uses the first forwarded IP and ignores empty entries", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1"
    });

    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
    expect(parseAdminIpAllowlist("203.0.113.10, , 198.51.100.0/24")).toEqual([
      "203.0.113.10",
      "198.51.100.0/24"
    ]);
  });
});
