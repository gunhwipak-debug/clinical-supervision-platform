import { describe, expect, it } from "vitest";
import { requirePhiEncryptionKey } from "./phi";

describe("requirePhiEncryptionKey", () => {
  it("rejects missing or short keys", () => {
    expect(() => requirePhiEncryptionKey("short")).toThrow("PHI_ENCRYPTION_KEY");
  });

  it("accepts keys at least 32 characters long", () => {
    const key = "0123456789abcdef0123456789abcdef";

    expect(requirePhiEncryptionKey(key)).toBe(key);
  });
});
