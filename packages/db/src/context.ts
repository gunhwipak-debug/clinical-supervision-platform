import { resolvePhiEncryptionKey } from "@csp/shared/crypto/phi";
import { sql, type SQL } from "drizzle-orm";

export type UserRole = "supervisee" | "supervisor" | "admin";

export type UserContext = {
  userId: string;
  role: UserRole;
  adminReason?: string;
  phiAccess?: boolean;
  phiEncryptionKey?: string;
};

type ContextTransaction = {
  execute: (query: SQL) => Promise<unknown>;
};

type ContextDatabase<TTransaction extends ContextTransaction> = {
  transaction: <TResult>(
    transaction: (tx: TTransaction) => Promise<TResult>
  ) => Promise<TResult>;
};

export async function withUserContext<TTransaction extends ContextTransaction, TResult>(
  db: ContextDatabase<TTransaction>,
  context: UserContext,
  operation: (tx: TTransaction) => Promise<TResult>
): Promise<TResult> {
  return db.transaction(async (tx) => {
    await setLocal(tx, "app.current_user_id", context.userId);
    await setLocal(tx, "app.current_user_role", context.role);
    await setLocal(tx, "app.admin_reason", context.adminReason ?? "");

    const phiEncryptionKey = resolvePhiEncryptionKey(
      context.phiAccess === true,
      context.phiEncryptionKey
    );

    if (phiEncryptionKey) {
      await setLocal(tx, "app.phi_key", phiEncryptionKey);
    }

    return operation(tx);
  });
}

async function setLocal(
  tx: ContextTransaction,
  key: string,
  value: string
): Promise<void> {
  await tx.execute(sql`select set_config(${key}, ${value}, true)`);
}
