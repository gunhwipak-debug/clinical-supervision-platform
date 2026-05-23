import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import { seedDemoData } from "../packages/db/src/dev-seed";

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const dataDir = join(root, "dev-data/pglite");
const storageDir = join(root, "dev-data/storage");
const setupLogPath = join(evidenceDir, "setup.log");
const seedLogPath = join(evidenceDir, "seed.log");

const migrationFiles = [
  "0000_initial_schema.sql",
  "0001_rls_policies.sql",
  "0002_app_role_and_fixes.sql",
  "0003_default_privileges.sql",
  "0004_auth_columns.sql",
  "0005_auth_tokens.sql",
  "0006_totp_recovery_codes.sql",
  "0007_specialty_catalog_seed.sql",
  "0008_profile_constraints.sql",
  "0009_supervision_request_constraints.sql",
  "0010_payments_constraints.sql",
  "0011_critical_path.sql",
  "0012_case_files_security.sql",
  "0013_document_workspace.sql",
  "0014_google_calendar.sql",
  "0015_qualification_evidence.sql"
] as const;

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  mkdirSync(dirname(dataDir), { recursive: true });
  mkdirSync(storageDir, { recursive: true });
  writeFileSync(setupLogPath, "");
  writeFileSync(seedLogPath, "");

  const log = createLogger(setupLogPath);
  const seedLog = createLogger(seedLogPath);

  log(`Demo setup started at ${new Date().toISOString()}`);
  log(`PGlite data directory: ${dataDir}`);

  const pg = new PGlite(dataDir, { extensions: { pgcrypto } });
  await pg.waitReady;
  await ensurePgcrypto(pg, log);
  await ensurePgcryptoCompatibility(pg, log);

  await ensureMigrationTable(pg, log);
  await applyMigrations(pg, log);
  await pg.close();

  process.env["DEV_DB"] = "pglite";
  process.env["DEV_DB_PATH"] = dataDir;
  await seedDemoData(createDatabase(), seedLog);
  await closeDevDatabase();
  log("Demo setup completed successfully");
}

async function ensureMigrationTable(pg: PGlite, log: Log): Promise<void> {
  log("Ensuring demo migration tracking table");
  await pg.query(`
    create table if not exists demo_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function ensurePgcrypto(pg: PGlite, log: Log): Promise<void> {
  try {
    await pg.query("create extension if not exists pgcrypto");
    log("pgcrypto extension ready");
  } catch (error) {
    log(`warn pgcrypto extension unavailable: ${formatError(error)}`);
  }
}

async function ensurePgcryptoCompatibility(pg: PGlite, log: Log): Promise<void> {
  try {
    await pg.query(`
      create or replace function pgp_sym_encrypt(data text, key text, options text)
      returns bytea
      language sql
      stable
      as $$ select pgp_sym_encrypt(data, key) $$;
    `);
    await pg.query(`
      create or replace function pgp_sym_decrypt(data bytea, key text, options text)
      returns text
      language sql
      stable
      as $$ select pgp_sym_decrypt(data, key) $$;
    `);
    log("pgcrypto three-argument compatibility ready");
  } catch (error) {
    log(`warn pgcrypto compatibility unavailable: ${formatError(error)}`);
  }
}

async function applyMigrations(pg: PGlite, log: Log): Promise<void> {
  for (const file of migrationFiles) {
    if (await isMigrationApplied(pg, file)) {
      log(`skip ${file}: already applied`);
      continue;
    }

    log(`apply ${file}`);
    const statements = readMigrationStatements(file);
    for (const statement of statements) {
      try {
        await pg.query(statement);
      } catch (error) {
        if (canSkipDevInfraStatement(statement)) {
          log(`warn ${file}: skipped dev-infra statement: ${formatError(error)}`);
          continue;
        }

        log(`fail ${file}: ${statement.slice(0, 300)}`);
        throw error;
      }
    }

    await pg.query("insert into demo_migrations (name) values ($1)", [file]);
    log(`done ${file}`);
  }
}

async function isMigrationApplied(pg: PGlite, name: string): Promise<boolean> {
  const result = await pg.query<{ name: string }>(
    "select name from demo_migrations where name = $1 limit 1",
    [name]
  );
  return result.rows.length === 1;
}

function readMigrationStatements(file: string): string[] {
  const path = join(root, "packages/db/drizzle", file);
  return readFileSync(path, "utf8")
    .split(/--> statement-breakpoint/g)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function canSkipDevInfraStatement(statement: string): boolean {
  return /^(create role|grant|alter default privileges|alter role)/iu.test(
    statement.trim()
  );
}

function createLogger(path: string): Log {
  return (message) => {
    const line = `[${new Date().toISOString()}] ${message}`;
    console.log(line);
    writeFileSync(path, `${line}\n`, { flag: "a" });
  };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type Log = (message: string) => void;

main().catch((error: unknown) => {
  mkdirSync(evidenceDir, { recursive: true });
  const line = `[${new Date().toISOString()}] setup failed: ${formatError(error)}`;
  console.error(line);
  writeFileSync(setupLogPath, `${line}\n`, { flag: "a" });
  process.exitCode = 1;
});
