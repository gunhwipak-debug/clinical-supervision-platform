import { describe, expect, it } from "vitest";
import { rotateSession, signSession, verifySession } from "./session";

const secret = "0123456789abcdef0123456789abcdef";
const now = new Date("2026-05-18T00:00:00.000Z");

describe("signed sessions", () => {
  it("rejects tampered signatures", async () => {
    const { token } = await signSession(
      { userId: "user-1", role: "supervisee" },
      { now, secret }
    );

    await expect(verifySession(`${token}x`, { now, secret })).resolves.toBeNull();
  });

  it("rejects tokens issued before password change", async () => {
    const { token } = await signSession(
      { userId: "user-1", role: "supervisee" },
      { now, secret }
    );

    await expect(
      verifySession(token, {
        now,
        secret,
        passwordChangedAt: new Date(now.getTime() + 1)
      })
    ).resolves.toBeNull();
  });

  it("rotates only after the fifteen minute boundary", async () => {
    const { token } = await signSession(
      { userId: "user-1", role: "supervisee" },
      { now, secret }
    );
    const beforeBoundary = await rotateSession(token, {
      now: new Date(now.getTime() + 14 * 60 * 1000),
      secret
    });
    const afterBoundary = await rotateSession(token, {
      now: new Date(now.getTime() + 16 * 60 * 1000),
      secret
    });

    expect(beforeBoundary?.rotated).toBe(false);
    expect(beforeBoundary?.token).toBe(token);
    expect(afterBoundary?.rotated).toBe(true);
    expect(afterBoundary?.token).not.toBe(token);
    expect(afterBoundary?.payload.issuedAt).toBe(now.getTime() + 16 * 60 * 1000);
  });
});
