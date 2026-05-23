import { decryptPhi, encryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL } from "drizzle-orm";
import type { UserRole } from "./context";

export type AuthUserStatus = "active" | "suspended" | "withdrawn";

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  passwordChangedAt: Date | string | null;
  role: UserRole;
  failedLoginCount: number;
  lockedUntil: Date | string | null;
  status: AuthUserStatus;
};

export type FailedLoginResult = {
  failedLoginCount: number;
  lockedUntil: Date | string | null;
};

export type SessionInvalidationResult = {
  passwordChangedAt: Date | string;
};

export type AuthTokenKind = "email_verify" | "password_reset";

export type AuthTokenRecord = {
  id: string;
  userId: string;
  kind: AuthTokenKind;
  expiresAt: Date | string;
};

export type TermsVersion = {
  id: string;
  kind: "tos" | "privacy" | "sensitive" | "marketing";
};

export type TotpUser = {
  id: string;
  email: string;
  role: UserRole;
  status: AuthUserStatus;
  totpSecretEnc: Buffer | Uint8Array | null;
  totpEnabled: boolean;
  passwordChangedAt: Date | string | null;
};

type AuthDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function findUserByEmail(
  db: AuthDatabase,
  email: string
): Promise<AuthUser | null> {
  const result = await db.execute(sql`
    select
      id,
      email,
      password_hash as "passwordHash",
      password_changed_at as "passwordChangedAt",
      role,
      failed_login_count as "failedLoginCount",
      locked_until as "lockedUntil",
      status
    from users
    where lower(email) = lower(${email})
    limit 1
  `);

  return rowsOf<AuthUserRow>(result)[0] ?? null;
}

export async function findUserById(
  db: AuthDatabase,
  userId: string
): Promise<AuthUser | null> {
  const result = await db.execute(sql`
    select
      id,
      email,
      password_hash as "passwordHash",
      password_changed_at as "passwordChangedAt",
      role,
      failed_login_count as "failedLoginCount",
      locked_until as "lockedUntil",
      status
    from users
    where id = ${userId}
    limit 1
  `);

  return rowsOf<AuthUserRow>(result)[0] ?? null;
}

export async function recordFailedLogin(
  db: AuthDatabase,
  userId: string
): Promise<FailedLoginResult | null> {
  const result = await db.execute(sql`
    with current_user_state as (
      select
        case
          when locked_until is not null and locked_until <= now() then 1
          else failed_login_count + 1
        end as next_failed_login_count
      from users
      where id = ${userId}
    )
    update users
    set
      failed_login_count = current_user_state.next_failed_login_count,
      locked_until = case
        when current_user_state.next_failed_login_count >= 5 then now() + interval '30 minutes'
        else null
      end,
      updated_at = now()
    from current_user_state
    where id = ${userId}
    returning
      failed_login_count as "failedLoginCount",
      locked_until as "lockedUntil"
  `);

  return rowsOf<FailedLoginRow>(result)[0] ?? null;
}

export async function clearLoginFailures(
  db: AuthDatabase,
  userId: string
): Promise<void> {
  await db.execute(sql`
    update users
    set
      failed_login_count = 0,
      locked_until = null,
      updated_at = now()
    where id = ${userId}
  `);
}

export async function touchLastLogin(db: AuthDatabase, userId: string): Promise<void> {
  await db.execute(sql`
    update users
    set
      last_login_at = now(),
      updated_at = now()
    where id = ${userId}
  `);
}

export async function invalidateAllSessions(
  db: AuthDatabase,
  userId: string
): Promise<SessionInvalidationResult | null> {
  const result = await db.execute(sql`
    update users
    set
      password_changed_at = now(),
      updated_at = now()
    where id = ${userId}
    returning password_changed_at as "passwordChangedAt"
  `);

  return rowsOf<SessionInvalidationRow>(result)[0] ?? null;
}

export async function createUserWithPassword(
  db: AuthDatabase,
  input: {
    email: string;
    passwordHash: string;
    role: Exclude<UserRole, "admin">;
  }
): Promise<AuthUser> {
  const result = await db.execute(sql`
    insert into users (email, password_hash, role, status)
    values (${input.email}, ${input.passwordHash}, ${input.role}, 'active')
    returning
      id,
      email,
      password_hash as "passwordHash",
      password_changed_at as "passwordChangedAt",
      role,
      failed_login_count as "failedLoginCount",
      locked_until as "lockedUntil",
      status
  `);
  const user = rowsOf<AuthUserRow>(result)[0];

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function getActiveTermsVersions(
  db: AuthDatabase,
  kinds: Array<TermsVersion["kind"]>
): Promise<TermsVersion[]> {
  if (kinds.length === 0) {
    return [];
  }

  const kindValues = sql.join(
    kinds.map((kind) => sql`${kind}`),
    sql`, `
  );
  const result = await db.execute(sql`
    select id, kind
    from terms_versions
    where kind in (${kindValues})
      and is_active = true
  `);

  return rowsOf<TermsVersion>(result);
}

export async function insertConsentRecords(
  db: AuthDatabase,
  input: {
    userId: string;
    termsVersions: TermsVersion[];
    ip?: string | undefined;
    userAgent?: string | undefined;
  }
): Promise<void> {
  for (const termsVersion of input.termsVersions) {
    await db.execute(sql`
      insert into consent_records (
        user_id,
        terms_version_id,
        consent_type,
        consented,
        ip_address,
        user_agent
      ) values (
        ${input.userId},
        ${termsVersion.id},
        ${termsVersion.kind},
        true,
        ${input.ip ?? null},
        ${input.userAgent ?? null}
      )
    `);
  }
}

export async function createAuthToken(
  db: AuthDatabase,
  input: {
    userId: string;
    kind: AuthTokenKind;
    tokenHash: string;
    expiresAt: Date;
    ip?: string | undefined;
  }
): Promise<AuthTokenRecord> {
  const result = await db.execute(sql`
    insert into auth_tokens (user_id, kind, token_hash, expires_at, ip)
    values (
      ${input.userId},
      ${input.kind},
      ${input.tokenHash},
      ${input.expiresAt.toISOString()},
      ${input.ip ?? null}
    )
    returning
      id,
      user_id as "userId",
      kind,
      expires_at as "expiresAt"
  `);
  const token = rowsOf<AuthTokenRecord>(result)[0];

  if (!token) {
    throw new Error("Failed to create auth token");
  }

  return token;
}

export async function consumeAuthToken(
  db: AuthDatabase,
  input: { kind: AuthTokenKind; tokenHash: string }
): Promise<AuthTokenRecord | null> {
  const result = await db.execute(sql`
    update auth_tokens
    set consumed_at = now()
    where id = (
      select id
      from auth_tokens
      where kind = ${input.kind}
        and token_hash = ${input.tokenHash}
        and consumed_at is null
        and expires_at > now()
      limit 1
    )
    returning
      id,
      user_id as "userId",
      kind,
      expires_at as "expiresAt"
  `);

  return rowsOf<AuthTokenRecord>(result)[0] ?? null;
}

export async function markEmailVerified(
  db: AuthDatabase,
  userId: string
): Promise<void> {
  await db.execute(sql`
    update users
    set
      email_verified_at = now(),
      updated_at = now()
    where id = ${userId}
  `);
}

export async function updatePassword(
  db: AuthDatabase,
  input: { userId: string; passwordHash: string }
): Promise<SessionInvalidationResult | null> {
  const result = await db.execute(sql`
    update users
    set
      password_hash = ${input.passwordHash},
      password_changed_at = now(),
      failed_login_count = 0,
      locked_until = null,
      updated_at = now()
    where id = ${input.userId}
    returning password_changed_at as "passwordChangedAt"
  `);

  return rowsOf<SessionInvalidationRow>(result)[0] ?? null;
}

export async function findTotpUserById(
  db: AuthDatabase,
  userId: string
): Promise<TotpUser | null> {
  const result = await db.execute(sql`
    select
      id,
      email,
      role,
      status,
      totp_secret_enc as "totpSecretEnc",
      totp_enabled as "totpEnabled",
      password_changed_at as "passwordChangedAt"
    from users
    where id = ${userId}
    limit 1
  `);

  return rowsOf<TotpUser>(result)[0] ?? null;
}

export async function setTotpSecret(
  db: AuthDatabase,
  userId: string,
  secret: string
): Promise<void> {
  await db.execute(sql`
    update users
    set
      totp_secret_enc = ${encryptPhi(secret)},
      totp_enabled = false,
      updated_at = now()
    where id = ${userId}
  `);
}

export async function getTotpSecret(
  db: AuthDatabase,
  userId: string
): Promise<string | null> {
  const result = await db.execute(sql`
    select ${decryptPhi(sql`totp_secret_enc`)} as secret
    from users
    where id = ${userId}
      and totp_secret_enc is not null
    limit 1
  `);

  return rowsOf<{ secret: string | null }>(result)[0]?.secret ?? null;
}

export async function setTotpEnabled(
  db: AuthDatabase,
  userId: string,
  enabled: boolean
): Promise<void> {
  await db.execute(sql`
    update users
    set
      totp_enabled = ${enabled},
      updated_at = now()
    where id = ${userId}
  `);
}

export async function clearTotpSecret(db: AuthDatabase, userId: string): Promise<void> {
  await db.execute(sql`
    update users
    set
      totp_secret_enc = null,
      totp_enabled = false,
      updated_at = now()
    where id = ${userId}
  `);
}

export async function insertRecoveryCodes(
  db: AuthDatabase,
  input: { userId: string; codeHashes: string[] }
): Promise<void> {
  await db.execute(sql`
    update totp_recovery_codes
    set consumed_at = now()
    where user_id = ${input.userId}
      and consumed_at is null
  `);

  for (const codeHash of input.codeHashes) {
    await db.execute(sql`
      insert into totp_recovery_codes (user_id, code_hash)
      values (${input.userId}, ${codeHash})
    `);
  }
}

export async function consumeRecoveryCode(
  db: AuthDatabase,
  input: { userId: string; codeHash: string }
): Promise<boolean> {
  const result = await db.execute(sql`
    update totp_recovery_codes
    set consumed_at = now()
    where id = (
      select id
      from totp_recovery_codes
      where user_id = ${input.userId}
        and code_hash = ${input.codeHash}
        and consumed_at is null
      limit 1
    )
    returning id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function consumeAllRecoveryCodes(
  db: AuthDatabase,
  userId: string
): Promise<void> {
  await db.execute(sql`
    update totp_recovery_codes
    set consumed_at = now()
    where user_id = ${userId}
      and consumed_at is null
  `);
}

export function isLoginLocked(
  user: Pick<AuthUser, "lockedUntil">,
  now = new Date()
): boolean {
  return toTime(user.lockedUntil) > now.getTime();
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) {
    return result as TRow[];
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }

  return [];
}

function toTime(value: Date | string | null): number {
  if (!value) {
    return 0;
  }

  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

type AuthUserRow = {
  id: string;
  email: string;
  passwordHash: string | null;
  passwordChangedAt: Date | string | null;
  role: UserRole;
  failedLoginCount: number;
  lockedUntil: Date | string | null;
  status: AuthUserStatus;
};

type FailedLoginRow = {
  failedLoginCount: number;
  lockedUntil: Date | string | null;
};

type SessionInvalidationRow = {
  passwordChangedAt: Date | string;
};
