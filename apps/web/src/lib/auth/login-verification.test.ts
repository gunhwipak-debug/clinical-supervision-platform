import { describe, expect, it } from "vitest";
import { verifyLoginPassword } from "./login-verification";

describe("login password verification", () => {
  it("calls the verifier exactly once for unknown and known wrong-password paths", async () => {
    const calls: Array<{ plaintext: string; hash: string }> = [];
    const verifier = (plaintext: string, hash: string) => {
      calls.push({ plaintext, hash });
      return Promise.resolve(false);
    };

    await verifyLoginPassword({
      user: null,
      password: "wrong-password",
      dummyHash: "dummy-hash",
      verifyPassword: verifier
    });
    await verifyLoginPassword({
      user: {
        passwordHash: "real-hash",
        status: "active"
      },
      password: "wrong-password",
      dummyHash: "dummy-hash",
      verifyPassword: verifier
    });

    expect(calls).toEqual([
      { plaintext: "wrong-password", hash: "dummy-hash" },
      { plaintext: "wrong-password", hash: "real-hash" }
    ]);
  });
});
