// Docker pgcrypto run: docker run --rm -d -e POSTGRES_PASSWORD=postgres -p 54322:5432 postgres:16 && DOCKER_PG=1 pnpm test
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { auth, createDatabase, withUserContext } from "@csp/db";
import { issueRandomToken, sha256Hex } from "@csp/shared/auth/tokens";
import { drizzle } from "drizzle-orm/pglite";
import { sql, type SQL } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signSession, verifySession } from "./session";
import {
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  verifyTotpCode
} from "./totp";

const migrations = [
  "packages/db/drizzle/0000_initial_schema.sql",
  "packages/db/drizzle/0001_rls_policies.sql",
  "packages/db/drizzle/0002_app_role_and_fixes.sql",
  "packages/db/drizzle/0003_default_privileges.sql",
  "packages/db/drizzle/0004_auth_columns.sql",
  "packages/db/drizzle/0005_auth_tokens.sql",
  "packages/db/drizzle/0006_totp_recovery_codes.sql",
  "packages/db/drizzle/0007_specialty_catalog_seed.sql",
  "packages/db/drizzle/0008_profile_constraints.sql",
  "packages/db/drizzle/0009_supervision_request_constraints.sql",
  "packages/db/drizzle/0010_payments_constraints.sql"
] as const;

const userId = "10000000-0000-0000-0000-000000000001";
const otherUserId = "10000000-0000-0000-0000-000000000002";
const email = "login@example.com";
const secret = "0123456789abcdef0123456789abcdef";
const dockerDatabaseUrl =
  process.env["DOCKER_DATABASE_URL"] ??
  "postgres://postgres:postgres@127.0.0.1:54322/postgres";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  await applyMigrations((statement) => pg.query(statement), {
    removePgcryptoExtension: true
  });
  process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
  await seedUsers(db);
});

afterEach(async () => {
  await pg.close();
});

describe("auth database integration", () => {
  it("locks after the fifth failed login and resets the next post-expiry failure to one", async () => {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const result = await auth.recordFailedLogin(db, userId);
      expect(result?.failedLoginCount).toBe(attempt);
      expect(result?.lockedUntil).toBeNull();
    }

    const locked = await auth.recordFailedLogin(db, userId);
    expect(locked?.failedLoginCount).toBe(5);
    expect(auth.isLoginLocked({ lockedUntil: locked?.lockedUntil ?? null })).toBe(true);

    await pg.query(`
      update users
      set locked_until = now() - interval '1 minute'
      where id = '${userId}'
    `);

    const afterExpiry = await auth.recordFailedLogin(db, userId);
    expect(afterExpiry?.failedLoginCount).toBe(1);
    expect(afterExpiry?.lockedUntil).toBeNull();
  });

  it("lets csp_app select/update only the authenticated user's own row via RLS", async () => {
    await pg.query("set role csp_app");
    await pg.query(`select set_config('app.current_user_id', '${userId}', false)`);
    await pg.query("select set_config('app.current_user_role', 'supervisee', false)");

    const selected = await db.execute<{ id: string }>(sql`
      select id from users where id = ${userId}
    `);
    expect(rowsOf(selected)).toHaveLength(1);

    const otherSelected = await db.execute<{ id: string }>(sql`
      select id from users where id = ${otherUserId}
    `);
    expect(rowsOf(otherSelected)).toHaveLength(0);

    await db.execute(sql`
      update users
      set failed_login_count = 1
      where id = ${userId}
    `);
    await pg.query("reset role");
  });

  it("rejects tokens issued before password invalidation", async () => {
    const { token } = await signSession(
      { userId, role: "supervisee" },
      { now: new Date("2020-01-01T00:00:00.000Z"), secret }
    );
    const invalidation = await auth.invalidateAllSessions(db, userId);

    await expect(
      verifySession(token, {
        now: new Date(),
        secret,
        passwordChangedAt: invalidation?.passwordChangedAt ?? null
      })
    ).resolves.toBeNull();
  });

  it("rejects malformed session signatures", async () => {
    const { token } = await signSession({ userId, role: "supervisee" }, { secret });

    await expect(verifySession(`${token}x`, { secret })).resolves.toBeNull();
  });

  it("creates a signup-style user, records consent, and verifies email once", async () => {
    await seedTermsVersions(pg);
    const termsVersions = await auth.getActiveTermsVersions(db, [
      "tos",
      "privacy",
      "sensitive"
    ]);
    expect(termsVersions).toHaveLength(3);

    const signupUser = await auth.createUserWithPassword(db, {
      email: "signup@example.com",
      passwordHash: "signup-hash",
      role: "supervisee"
    });
    await auth.insertConsentRecords(db, {
      userId: signupUser.id,
      termsVersions,
      ip: "127.0.0.1",
      userAgent: "vitest"
    });

    const issued = await issueRandomToken();
    await auth.createAuthToken(db, {
      userId: signupUser.id,
      kind: "email_verify",
      tokenHash: issued.tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    const consumed = await auth.consumeAuthToken(db, {
      kind: "email_verify",
      tokenHash: await sha256Hex(issued.token)
    });
    expect(consumed?.userId).toBe(signupUser.id);

    await auth.markEmailVerified(db, signupUser.id);
    const rows = rowsOf<{ emailVerifiedAt: string | null }>(
      await db.execute(sql`
        select email_verified_at as "emailVerifiedAt"
        from users
        where id = ${signupUser.id}
      `)
    );
    const consentRows = rowsOf<{ count: number }>(
      await db.execute(sql`
        select count(*)::int as count
        from consent_records
        where user_id = ${signupUser.id}
      `)
    );

    expect(rows[0]?.emailVerifiedAt).not.toBeNull();
    expect(consentRows[0]?.count).toBe(3);
  });

  it("rejects reused and expired auth tokens", async () => {
    const reusable = await issueRandomToken();
    await auth.createAuthToken(db, {
      userId,
      kind: "email_verify",
      tokenHash: reusable.tokenHash,
      expiresAt: new Date(Date.now() + 60_000)
    });

    await expect(
      auth.consumeAuthToken(db, {
        kind: "email_verify",
        tokenHash: reusable.tokenHash
      })
    ).resolves.not.toBeNull();
    await expect(
      auth.consumeAuthToken(db, {
        kind: "email_verify",
        tokenHash: reusable.tokenHash
      })
    ).resolves.toBeNull();

    const expired = await issueRandomToken();
    await auth.createAuthToken(db, {
      userId,
      kind: "password_reset",
      tokenHash: expired.tokenHash,
      expiresAt: new Date(Date.now() - 1_000)
    });

    await expect(
      auth.consumeAuthToken(db, {
        kind: "password_reset",
        tokenHash: expired.tokenHash
      })
    ).resolves.toBeNull();
  });

  it("resets a password and rejects sessions issued before the change", async () => {
    const { token } = await signSession(
      { userId, role: "supervisee" },
      { now: new Date("2026-05-18T00:00:00.000Z"), secret }
    );
    const issued = await issueRandomToken();
    await auth.createAuthToken(db, {
      userId,
      kind: "password_reset",
      tokenHash: issued.tokenHash,
      expiresAt: new Date(Date.now() + 60_000)
    });
    const consumed = await auth.consumeAuthToken(db, {
      kind: "password_reset",
      tokenHash: issued.tokenHash
    });
    expect(consumed?.userId).toBe(userId);

    const updated = await auth.updatePassword(db, {
      userId,
      passwordHash: "new-hash"
    });

    expect(updated?.passwordChangedAt).toBeTruthy();
    await expect(
      verifySession(token, {
        now: new Date(),
        secret,
        passwordChangedAt: updated?.passwordChangedAt ?? null
      })
    ).resolves.toBeNull();
  });
});

describe.skipIf(!process.env["DOCKER_PG"])("auth TOTP postgres integration", () => {
  let dockerDb: ReturnType<typeof createDatabase>;

  beforeEach(async () => {
    dockerDb = createDatabase(dockerDatabaseUrl);
    await resetDockerDatabase(dockerDb);
    await applyMigrations((statement) => dockerDb.execute(sql.raw(statement)));
    process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
    await seedUsers(dockerDb);
  });

  afterEach(async () => {
    await closeDockerDatabase(dockerDb);
  });

  it("enrolls TOTP, accepts the current six digit code, and rejects a wrong code", async () => {
    const totpSecret = generateTotpSecret();
    const currentCode = generateTotpCode({
      secret: totpSecret,
      epoch: Math.floor(Date.now() / 1000)
    });

    await withUserContext(
      dockerDb,
      { userId, role: "supervisee", phiAccess: true },
      async (tx) => {
        await auth.setTotpSecret(tx, userId, totpSecret);
        const storedSecret = await auth.getTotpSecret(tx, userId);

        expect(storedSecret).toBe(totpSecret);
        expect(verifyTotpCode({ secret: totpSecret, code: currentCode })).toBe(true);
        expect(verifyTotpCode({ secret: totpSecret, code: "000000" })).toBe(false);

        await auth.setTotpEnabled(tx, userId, true);
      }
    );

    const enabled = await auth.findTotpUserById(dockerDb, userId);
    expect(enabled?.totpEnabled).toBe(true);
  });

  it("consumes TOTP recovery codes once", async () => {
    const recoveryCodes = await generateRecoveryCodes();
    const firstCode = recoveryCodes[0];
    expect(firstCode).toBeDefined();

    await withUserContext(
      dockerDb,
      { userId, role: "supervisee", phiAccess: true },
      async (tx) => {
        await auth.insertRecoveryCodes(tx, {
          userId,
          codeHashes: recoveryCodes.map((recoveryCode) => recoveryCode.codeHash)
        });

        await expect(
          auth.consumeRecoveryCode(tx, {
            userId,
            codeHash: firstCode?.codeHash ?? ""
          })
        ).resolves.toBe(true);
        await expect(
          auth.consumeRecoveryCode(tx, {
            userId,
            codeHash: firstCode?.codeHash ?? ""
          })
        ).resolves.toBe(false);
      }
    );
  });
});

async function applyMigrations(
  execute: (statement: string) => Promise<unknown>,
  options: { removePgcryptoExtension?: boolean } = {}
): Promise<void> {
  for (const migration of migrations) {
    const source = readFileSync(migration, "utf8");
    const migrationSql =
      options.removePgcryptoExtension === true
        ? source.replace(
            /CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint\n?/u,
            ""
          )
        : source;
    const statements = migrationSql
      .split(/--> statement-breakpoint/g)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await execute(statement);
    }
  }
}

async function seedUsers(database: {
  execute: (query: SQL) => Promise<unknown>;
}): Promise<void> {
  await database.execute(sql`
    insert into users (id, email, role, password_hash)
    values
      (${userId}, ${email}, 'supervisee', 'hash-placeholder'),
      (${otherUserId}, 'other@example.com', 'supervisee', 'hash-placeholder')
  `);
}

async function resetDockerDatabase(
  database: ReturnType<typeof createDatabase>
): Promise<void> {
  await database.execute(sql`drop schema if exists public cascade`);
  await database.execute(sql`drop schema if exists app cascade`);
  await database.execute(sql`create schema public`);
  await database.execute(sql`grant all on schema public to postgres`);
  await database.execute(sql`grant all on schema public to public`);
}

async function closeDockerDatabase(
  database: ReturnType<typeof createDatabase>
): Promise<void> {
  await (
    database as unknown as { $client: { end: () => Promise<void> } }
  ).$client.end();
}

async function seedTermsVersions(database: PGlite): Promise<void> {
  await database.query(`
    insert into terms_versions (kind, version, content_md, is_active)
    values
      ('tos', 'test', 'tos', true),
      ('privacy', 'test', 'privacy', true),
      ('sensitive', 'test', 'sensitive', true)
  `);
}

function rowsOf<TRow>(result: TRow[] | { rows: TRow[] }): TRow[] {
  return Array.isArray(result) ? result : result.rows;
}
