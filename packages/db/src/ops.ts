import { sql, type SQL } from "drizzle-orm";

type Queryable = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function pgcryptoRoundtrip(db: Queryable): Promise<string | null> {
  const result = await db.execute(sql`
    select pgp_sym_decrypt(pgp_sym_encrypt('ops-smoke', 'ops-key'), 'ops-key') as value
  `);
  return rowsOf<{ value: string }>(result)[0]?.value ?? null;
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
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
