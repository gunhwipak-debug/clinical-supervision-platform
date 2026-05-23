import { describe, expect, it } from "vitest";
import { listAccessLogs, listAuditLogs } from "./audit";

describe("audit helpers", () => {
  it("queries recent audit logs with a bounded limit", async () => {
    const queries: string[] = [];
    const db = {
      execute: (query: unknown) => {
        queries.push(String(query));
        return Promise.resolve({
          rows: [
            {
              id: "audit_1",
              actorUserId: "user_1",
              actorRole: "admin",
              action: "admin.test",
              targetType: null,
              targetId: null,
              reason: "관리자 테스트 사유입니다.",
              ipAddress: null,
              userAgent: null,
              context: null,
              createdAt: new Date("2026-05-20T00:00:00.000Z")
            }
          ]
        });
      }
    };

    await expect(listAuditLogs(db, { limit: 999 })).resolves.toHaveLength(1);
    expect(queries).toHaveLength(1);
  });

  it("queries recent access logs", async () => {
    const db = {
      execute: () =>
        Promise.resolve({
          rows: [
            {
              id: "access_1",
              userId: "user_1",
              fileId: "file_1",
              action: "download",
              ipAddress: null,
              signedUrlId: "signed_1",
              createdAt: new Date("2026-05-20T00:00:00.000Z")
            }
          ]
        })
    };

    await expect(listAccessLogs(db, { limit: 1 })).resolves.toMatchObject([
      { signedUrlId: "signed_1" }
    ]);
  });
});
