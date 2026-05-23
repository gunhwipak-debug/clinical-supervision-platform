import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import {
  listExpiredCaseFiles,
  markExpiredCaseFileDeleted
} from "../packages/db/src/files";
import { getStorageAdapter } from "../packages/shared/src/storage";

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const logPath = join(evidenceDir, "purge-expired-case-files.log");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");

  const db = createSystemDatabase();
  const storage = getStorageAdapter();
  const now = new Date();
  const expired = await listExpiredCaseFiles(db, now);
  const purged: string[] = [];
  const failed: Array<{ fileId: string; error: string }> = [];

  log(`Purge started at ${now.toISOString()}`);
  log(`Mode: ${dryRun ? "dry-run" : "delete"}`);
  log(`Expired files found: ${String(expired.length)}`);

  for (const file of expired) {
    if (dryRun) {
      log(`dry-run ${file.id} ${file.storageKey}`);
      continue;
    }

    try {
      await storage.deleteObject(file.storageKey);
      const marked = await markExpiredCaseFileDeleted(db, file.id, now);
      if (marked) {
        purged.push(file.id);
        log(`purged ${file.id} ${file.storageKey}`);
      }
    } catch (error) {
      failed.push({ fileId: file.id, error: formatError(error) });
      log(`failed ${file.id}: ${formatError(error)}`);
    }
  }

  await closeDevDatabase();

  const summary = {
    dryRun,
    scanned: expired.length,
    purged: purged.length,
    failed: failed.length,
    failedFiles: failed
  };
  log(`Summary: ${JSON.stringify(summary)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function createSystemDatabase() {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error(
      "SERVICE_DATABASE_URL is required for expired case file purge outside PGlite demo mode"
    );
  }
  return createDatabase(serviceUrl);
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  writeFileSync(logPath, `${line}\n`, { flag: "a" });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main().catch(async (error: unknown) => {
  log(`fatal: ${formatError(error)}`);
  await closeDevDatabase();
  process.exitCode = 1;
});
