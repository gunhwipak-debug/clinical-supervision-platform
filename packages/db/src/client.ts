import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolve } from "node:path";
import * as schema from "./schema";

type AppDatabase = ReturnType<typeof drizzlePostgres<typeof schema>>;

let pgliteDatabase: AppDatabase | null = null;
let pgliteClient: PGlite | null = null;

export function createDatabase(connectionString = process.env["DATABASE_URL"]) {
  if (process.env["DEV_DB"] === "pglite") {
    if (!pgliteDatabase) {
      const dataDir = resolve(process.env["DEV_DB_PATH"] ?? "dev-data/pglite");
      pgliteClient = new PGlite(dataDir, { extensions: { pgcrypto } });
      pgliteDatabase = drizzlePglite(pgliteClient, {
        schema
      }) as unknown as AppDatabase;
    }

    return pgliteDatabase;
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the database client");
  }

  const client = postgres(connectionString, {
    max: 10,
    prepare: false
  });

  return drizzlePostgres(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

export async function closeDevDatabase(): Promise<void> {
  if (pgliteClient) {
    await pgliteClient.close();
    pgliteClient = null;
    pgliteDatabase = null;
  }
}
