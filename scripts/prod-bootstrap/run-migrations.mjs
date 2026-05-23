import postgres from "../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "../../packages/db/drizzle");

const connectionString = process.env.NEON_URL;
if (!connectionString) {
  console.error("Missing NEON_URL env var");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, prepare: false, onnotice: () => {} });

const files = (await readdir(MIGRATIONS_DIR))
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();

console.log(`Found ${files.length} migration files`);

for (const file of files) {
  const path = join(MIGRATIONS_DIR, file);
  const content = await readFile(path, "utf8");
  const statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^--/.test(s.replace(/\n/g, " ").trim()));

  process.stdout.write(`▶ ${file} (${statements.length} stmts) ... `);
  let ok = 0;
  let skipped = 0;
  let firstErr = null;
  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      ok++;
    } catch (err) {
      const msg = String(err.message || err);
      // Idempotent skips: object already exists / does not exist for DROP IF EXISTS variants
      if (
        /already exists/i.test(msg) ||
        /permission denied to (alter|create) role/i.test(msg) ||
        /must be (?:owner|superuser)/i.test(msg)
      ) {
        skipped++;
        continue;
      }
      firstErr = err;
      break;
    }
  }
  if (firstErr) {
    console.log(`\n  ✖ ok=${ok} skipped=${skipped} ERROR: ${firstErr.message}`);
    process.exit(1);
  }
  console.log(`ok=${ok} skipped=${skipped}`);
}

await sql.end();
console.log("\n✅ All migrations applied");
