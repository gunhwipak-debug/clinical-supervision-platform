import { describe, expect, it, vi } from "vitest";
import type { UserContext } from "@csp/db";
import { NextRequest } from "next/server";
import type { CurrentAdmin } from "./current-admin";

const adminId = "60000000-0000-4000-8000-000000000001";
const longReason = "Administrative audit reason with at least thirty chars";

describe("admin route reason policy", () => {
  it("rejects refund queue requests without an admin reason", async () => {
    const response = await callRefundsRoute();
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(403);
    expect(body.error?.code).toBe("admin_reason_required");
  });

  it("rejects dashboard stats requests with a short admin reason", async () => {
    const response = await callDashboardRoute("short reason");
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(403);
    expect(body.error?.code).toBe("admin_reason_required");
  });

  it("passes the exact admin reason into refunds route user context", async () => {
    const captured: UserContext[] = [];
    const response = await callRefundsRoute(longReason, captured);

    expect(response.status).toBe(200);
    expect(captured[0]?.adminReason).toBe(longReason);
  });

  it("passes the exact admin reason into dashboard route user context", async () => {
    const captured: UserContext[] = [];
    const response = await callDashboardRoute(longReason, captured);

    expect(response.status).toBe(200);
    expect(captured[0]?.adminReason).toBe(longReason);
  });
});

async function callRefundsRoute(
  reason?: string,
  captured: UserContext[] = []
): Promise<Response> {
  mockAdminRuntime(captured);
  const { GET } = await import("../../app/api/admin/refunds/route");
  return GET(adminRequest("http://localhost/api/admin/refunds", reason));
}

async function callDashboardRoute(
  reason?: string,
  captured: UserContext[] = []
): Promise<Response> {
  mockAdminRuntime(captured);
  const { GET } = await import("../../app/api/admin/dashboard/stats/route");
  return GET(adminRequest("http://localhost/api/admin/dashboard/stats", reason));
}

function mockAdminRuntime(captured: UserContext[]): void {
  vi.resetModules();
  vi.doMock("@csp/db", () => ({
    payments: { listRefundRequests: () => [] },
    withUserContext: (
      _db: unknown,
      context: UserContext,
      callback: (tx: { execute: () => Promise<{ rows: unknown[] }> }) => unknown
    ) => {
      captured.push(context);
      return Promise.resolve(
        callback({
          execute: () =>
            Promise.resolve({
              rows: [
                {
                  pendingQualifications: 0,
                  requestedRefunds: 0,
                  openRequests: 0,
                  activeUsers: 1
                }
              ]
            })
        })
      );
    }
  }));
  vi.doMock("./current-admin", () => ({
    createRuntimeDatabase: () => ({}),
    getCurrentAdmin: () => Promise.resolve(currentAdmin())
  }));
}

function adminRequest(url: string, reason?: string): NextRequest {
  const headers = new Headers();
  if (reason) headers.set("x-admin-reason", reason);
  return new NextRequest(url, { headers });
}

function currentAdmin(): CurrentAdmin {
  return {
    session: {
      userId: adminId,
      role: "admin",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
      sessionId: "admin-session"
    },
    user: {
      id: adminId,
      email: "admin@example.com",
      role: "admin",
      status: "active",
      totpEnabled: true,
      totpSecretEnc: null,
      passwordChangedAt: null
    }
  };
}

type ApiEnvelope = {
  error: { code: string } | null;
};
