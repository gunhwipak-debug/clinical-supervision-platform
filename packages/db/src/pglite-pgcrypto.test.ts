import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { describe, expect, it } from "vitest";

describe("PGlite pgcrypto support", () => {
  it("round-trips encrypted PHI text without a Docker Postgres dependency", async () => {
    const pg = new PGlite("memory://csp-pgcrypto-test", { extensions: { pgcrypto } });
    await pg.query("create extension if not exists pgcrypto");
    const result = await pg.query<{ plain: string }>(
      "select pgp_sym_decrypt(pgp_sym_encrypt('심리평가 보고서'::text, 'demo-secret'), 'demo-secret') as plain"
    );
    expect(result.rows[0]?.plain).toBe("심리평가 보고서");
    await pg.close();
  });
});
