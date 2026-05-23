import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { findUserById } from "../packages/db/src/auth";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import { withUserContext, type UserRole } from "../packages/db/src/context";
import { listRetentionWarningTargets } from "../packages/db/src/files";
import {
  createNotification,
  hasNotificationWithMetadata
} from "../packages/db/src/notifications";
import { getMailer } from "../packages/shared/src/email/mailer";

type RetentionWarningDatabase = ReturnType<typeof createDatabase>;

type RetentionRecipient = {
  userId: string;
  role: UserRole;
  kind: "retention_warning_supervisee" | "retention_warning_supervisor";
  title: string;
  body: string;
  href: string;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const logPath = join(evidenceDir, "retention-warnings.log");
const dryRun = process.argv.includes("--dry-run");
const daysAhead = parseDaysAhead();
const workerUserId =
  process.env["NOTIFICATION_WORKER_USER_ID"] ?? "00000000-0000-4000-8000-000000000000";

async function main(): Promise<void> {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");

  const db = createSystemDatabase();
  const from = new Date();
  const to = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const targets = await withUserContext(
    db,
    {
      adminReason: "retention-warning-worker",
      role: "admin",
      userId: workerUserId
    },
    (tx) => listRetentionWarningTargets(tx, { from, to })
  );
  const summary = {
    daysAhead,
    dryRun,
    failed: 0,
    targetsScanned: targets.length,
    warningsCreated: 0,
    warningsSkipped: 0
  };

  log(`Retention warning scan started at ${from.toISOString()}`);
  log(`Window: ${from.toISOString()} - ${to.toISOString()}`);
  log(`Mode: ${dryRun ? "dry-run" : "send"}`);

  for (const target of targets) {
    const warningKey = `${target.requestId}:${new Date(
      target.retentionExpiresAt
    ).toISOString()}`;
    for (const recipient of recipientsFor(target)) {
      const exists = await withUserContext(
        db,
        {
          adminReason: "retention-warning-worker",
          role: "admin",
          userId: workerUserId
        },
        (tx) =>
          hasNotificationWithMetadata(tx, {
            kind: recipient.kind,
            metadataKey: "warningKey",
            metadataValue: warningKey,
            userId: recipient.userId
          })
      );
      if (exists) {
        summary.warningsSkipped += 1;
        log(`skip existing ${recipient.kind} ${target.requestId}`);
        continue;
      }

      if (dryRun) {
        summary.warningsSkipped += 1;
        log(`dry-run ${recipient.kind} ${target.requestId}`);
        continue;
      }

      try {
        await sendWarning(db, recipient, {
          fileCount: target.fileCount,
          requestId: target.requestId,
          retentionExpiresAt: new Date(target.retentionExpiresAt),
          warningKey
        });
        summary.warningsCreated += 1;
        log(`created ${recipient.kind} ${target.requestId}`);
      } catch (error) {
        summary.failed += 1;
        log(`failed ${recipient.kind} ${target.requestId}: ${formatError(error)}`);
      }
    }
  }

  await closeDevDatabase();
  log(`Summary: ${JSON.stringify(summary)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

function createSystemDatabase(): RetentionWarningDatabase {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error(
      "SERVICE_DATABASE_URL is required for retention warnings outside PGlite demo mode"
    );
  }
  return createDatabase(serviceUrl);
}

async function sendWarning(
  db: RetentionWarningDatabase,
  recipient: RetentionRecipient,
  metadata: {
    fileCount: number;
    requestId: string;
    retentionExpiresAt: Date;
    warningKey: string;
  }
): Promise<void> {
  const user = await withUserContext(
    db,
    {
      adminReason: "retention-warning-worker",
      role: "admin",
      userId: workerUserId
    },
    async (tx) => {
      const targetUser = await findUserById(tx, recipient.userId);
      await createNotification(tx, {
        kind: recipient.kind,
        payload: {
          body: recipient.body,
          href: recipient.href,
          metadata: {
            fileCount: String(metadata.fileCount),
            requestId: metadata.requestId,
            retentionExpiresAt: metadata.retentionExpiresAt.toISOString(),
            warningKey: metadata.warningKey
          },
          title: recipient.title
        },
        userId: recipient.userId
      });
      return targetUser;
    }
  );

  if (!user?.email) return;

  try {
    await getMailer().send({
      idempotencyKey: `retention-warning/${metadata.warningKey}/${recipient.userId}`,
      metadata: {
        kind: recipient.kind,
        requestId: metadata.requestId,
        userId: recipient.userId,
        warningKey: metadata.warningKey
      },
      subject: `ClinicFlow 알림: ${recipient.title}`,
      text: [
        recipient.body,
        "",
        `바로가기: ${absoluteHref(recipient.href)}`,
        "",
        `수신 계정: ${user.email}`,
        "환자 정보는 알림 메일에 포함하지 않습니다."
      ].join("\n"),
      to: user.email
    });
  } catch (error) {
    log(
      `mailer warning ${recipient.kind} ${metadata.requestId}: ${formatError(error)}`
    );
  }
}

function recipientsFor(target: {
  requestId: string;
  superviseeId: string;
  supervisorId: string | null;
  retentionExpiresAt: Date | string;
  fileCount: number;
}): RetentionRecipient[] {
  const expiresAt = formatKoreanDateTime(new Date(target.retentionExpiresAt));
  const sharedBody = `${expiresAt}에 의뢰 자료 ${String(
    target.fileCount
  )}개가 보존기간 만료로 삭제 대상이 됩니다. 필요한 기록은 앱 안에서 미리 확인해주세요.`;
  const recipients: RetentionRecipient[] = [
    {
      body: sharedBody,
      href: `/requests/${target.requestId}`,
      kind: "retention_warning_supervisee",
      role: "supervisee",
      title: "자료 보존기간 만료가 다가옵니다",
      userId: target.superviseeId
    }
  ];
  if (target.supervisorId) {
    recipients.push({
      body: sharedBody,
      href: `/supervisor/requests/${target.requestId}`,
      kind: "retention_warning_supervisor",
      role: "supervisor",
      title: "자료 보존기간 만료가 다가옵니다",
      userId: target.supervisorId
    });
  }
  return recipients;
}

function formatKoreanDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(date);
}

function absoluteHref(href: string): string {
  const base = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
  return new URL(href, base).toString();
}

function parseDaysAhead(): number {
  const raw = process.argv.find((arg) => arg.startsWith("--days="));
  if (!raw) return 3;
  const value = Number(raw.slice("--days=".length));
  if (!Number.isFinite(value) || value <= 0 || value > 30) {
    throw new Error("--days must be a number between 1 and 30");
  }
  return value;
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
