import { auth, withUserContext } from "@csp/db";
import {
  DEMO_AUTH_ACCOUNTS,
  DEMO_PASSWORD,
  type DemoAuthAccount
} from "@csp/db/demo-accounts";
import { hashPassword } from "@csp/shared/auth/password";
import { sql, type SQL } from "drizzle-orm";
type DemoAuthTransaction = {
  execute: (query: SQL) => Promise<unknown>;
};

type DemoAuthDatabase = DemoAuthTransaction & {
  transaction: <TResult>(
    transaction: (tx: DemoAuthTransaction) => Promise<TResult>
  ) => Promise<TResult>;
};

const DEMO_AUTH_BY_EMAIL: ReadonlyMap<string, DemoAuthAccount> = new Map(
  DEMO_AUTH_ACCOUNTS.map((account): [string, DemoAuthAccount] => [
    account.email,
    account
  ])
);

export function isSeededDemoLogin(email: string, password: string): boolean {
  return DEMO_AUTH_BY_EMAIL.has(email) && password === DEMO_PASSWORD;
}

export async function ensureSeededDemoUser(
  db: DemoAuthDatabase,
  email: string
): Promise<auth.AuthUser | null> {
  const account = DEMO_AUTH_BY_EMAIL.get(email);
  if (!account) return null;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  return await withUserContext(
    db,
    { userId: account.id, role: account.role },
    async (tx) => {
      await tx.execute(sql`
        insert into users (
          id,
          email,
          password_hash,
          role,
          totp_enabled,
          email_verified_at,
          failed_login_count,
          locked_until,
          status
        ) values (
          ${account.id},
          ${account.email},
          ${passwordHash},
          ${account.role},
          ${account.totpEnabled},
          now(),
          0,
          null,
          'active'
        )
        on conflict (email) do update set
          password_hash = excluded.password_hash,
          role = excluded.role,
          totp_enabled = excluded.totp_enabled,
          email_verified_at = coalesce(users.email_verified_at, now()),
          failed_login_count = 0,
          locked_until = null,
          status = 'active',
          updated_at = now()
      `);

      return await auth.findUserByEmail(tx, account.email);
    }
  );
}
