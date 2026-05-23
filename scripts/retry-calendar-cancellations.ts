import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  calendar,
  closeDevDatabase,
  createDatabase,
  withUserContext
} from "../packages/db/src";
import {
  cancelGoogleCalendarEvent,
  getGoogleCalendarConfig
} from "../apps/web/src/lib/google-calendar";

type RetryDatabase = ReturnType<typeof createDatabase>;

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const logPath = join(evidenceDir, "retry-calendar-cancellations.log");
const dryRun = process.argv.includes("--dry-run");
const limit = parseLimit();
const workerUserId =
  process.env["CALENDAR_WORKER_USER_ID"] ?? "00000000-0000-4000-8000-000000000000";

async function main(): Promise<void> {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");

  const db = createSystemDatabase();
  const origin = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
  const targets = await withUserContext(
    db,
    {
      adminReason: "retry-calendar-cancellations",
      phiAccess: true,
      role: "admin",
      userId: workerUserId
    },
    (tx) => calendar.listGoogleEventsPendingCancellation(tx, { limit })
  );

  const summary = {
    cancelled: 0,
    dryRun,
    failed: 0,
    limit,
    scanned: targets.length
  };

  log(`Calendar cancellation retry started at ${new Date().toISOString()}`);
  log(`Mode: ${dryRun ? "dry-run" : "retry"}`);

  for (const target of targets) {
    if (dryRun) {
      log(`dry-run ${target.requestId} ${target.providerEventId}`);
      continue;
    }

    try {
      const ok = await withUserContext(
        db,
        {
          adminReason: "retry-calendar-cancellations",
          phiAccess: true,
          role: "admin",
          userId: workerUserId
        },
        (tx) =>
          cancelGoogleCalendarEvent(
            tx,
            target.connection,
            getGoogleCalendarConfig(origin),
            target.providerEventId
          )
      );
      if (!ok) {
        summary.failed += 1;
        log(`failed ${target.requestId} ${target.providerEventId}`);
        continue;
      }

      await withUserContext(
        db,
        {
          adminReason: "retry-calendar-cancellations",
          role: "admin",
          userId: workerUserId
        },
        (tx) =>
          calendar.markGoogleEventCancelled(tx, {
            bookingId: target.bookingId,
            providerEventId: target.providerEventId
          })
      );
      summary.cancelled += 1;
      log(`cancelled ${target.requestId} ${target.providerEventId}`);
    } catch (error) {
      summary.failed += 1;
      log(
        `failed ${target.requestId} ${target.providerEventId}: ${formatError(error)}`
      );
    }
  }

  await closeDevDatabase();
  log(`Summary: ${JSON.stringify(summary)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

function createSystemDatabase(): RetryDatabase {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error(
      "SERVICE_DATABASE_URL is required for calendar cancellation retry outside PGlite demo mode"
    );
  }
  return createDatabase(serviceUrl);
}

function parseLimit(): number {
  const arg = process.argv.find((item) => item.startsWith("--limit="));
  const value = Number(arg?.split("=")[1] ?? "50");
  return Number.isFinite(value) && value > 0 ? Math.min(Math.trunc(value), 500) : 50;
}

function log(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  writeFileSync(logPath, line, { flag: "a" });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error: unknown) => {
  mkdirSync(evidenceDir, { recursive: true });
  log(`fatal: ${formatError(error)}`);
  console.error(error);
  process.exitCode = 1;
});
