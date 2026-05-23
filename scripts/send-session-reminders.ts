import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import { withUserContext, type UserRole } from "../packages/db/src/context";
import { findUserById } from "../packages/db/src/auth";
import {
  createNotification,
  hasNotificationWithMetadata
} from "../packages/db/src/notifications";
import {
  listUpcomingSessionReminderTargets,
  type SessionReminderTarget
} from "../packages/db/src/supervision";
import { getMailer } from "../packages/shared/src/email/mailer";

type ReminderDatabase = ReturnType<typeof createDatabase>;

type ReminderRecipient = {
  userId: string;
  role: UserRole;
  kind: "session_reminder_supervisee" | "session_reminder_supervisor";
  title: string;
  body: string;
  href: string;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const logPath = join(evidenceDir, "session-reminders.log");
const dryRun = process.argv.includes("--dry-run");
const hoursAhead = parseHoursAhead();
const workerUserId =
  process.env["NOTIFICATION_WORKER_USER_ID"] ?? "00000000-0000-4000-8000-000000000000";

async function main(): Promise<void> {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");

  const db = createSystemDatabase();
  const from = new Date();
  const to = new Date(from.getTime() + hoursAhead * 60 * 60 * 1000);
  const targets = await withUserContext(
    db,
    {
      adminReason: "session-reminder-worker",
      role: "admin",
      userId: workerUserId
    },
    (tx) => listUpcomingSessionReminderTargets(tx, { from, to })
  );
  const summary = {
    dryRun,
    failed: 0,
    hoursAhead,
    remindersCreated: 0,
    remindersSkipped: 0,
    targetsScanned: targets.length
  };

  log(`Session reminder scan started at ${from.toISOString()}`);
  log(`Window: ${from.toISOString()} - ${to.toISOString()}`);
  log(`Mode: ${dryRun ? "dry-run" : "send"}`);

  for (const target of targets) {
    for (const recipient of reminderRecipients(target)) {
      const reminderKey = reminderKeyFor(target);
      const exists = await withUserContext(
        db,
        {
          adminReason: "session-reminder-worker",
          role: "admin",
          userId: workerUserId
        },
        (tx) =>
          hasNotificationWithMetadata(tx, {
            kind: recipient.kind,
            metadataKey: "reminderKey",
            metadataValue: reminderKey,
            userId: recipient.userId
          })
      );
      if (exists) {
        summary.remindersSkipped += 1;
        log(`skip existing ${recipient.kind} ${target.requestId}`);
        continue;
      }

      if (dryRun) {
        summary.remindersSkipped += 1;
        log(`dry-run ${recipient.kind} ${target.requestId}`);
        continue;
      }

      try {
        await sendReminder(db, recipient, target, reminderKey);
        summary.remindersCreated += 1;
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

function createSystemDatabase(): ReminderDatabase {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error(
      "SERVICE_DATABASE_URL is required for session reminders outside PGlite demo mode"
    );
  }
  return createDatabase(serviceUrl);
}

async function sendReminder(
  db: ReminderDatabase,
  recipient: ReminderRecipient,
  target: SessionReminderTarget,
  reminderKey: string
): Promise<void> {
  const user = await withUserContext(
    db,
    {
      adminReason: "session-reminder-worker",
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
            reminderKey,
            requestId: target.requestId,
            scheduledStart: new Date(target.scheduledStart).toISOString()
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
      metadata: {
        kind: recipient.kind,
        reminderKey,
        requestId: target.requestId,
        userId: recipient.userId
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
    log(`mailer warning ${recipient.kind} ${target.requestId}: ${formatError(error)}`);
  }
}

function reminderRecipients(target: SessionReminderTarget): ReminderRecipient[] {
  const when = formatKoreanDateTime(new Date(target.scheduledStart));
  const product = target.productTitle ?? "슈퍼비전";
  const supervisorName = target.supervisorDisplayName ?? "담당 슈퍼바이저";
  return [
    {
      body: `${when}에 ${supervisorName}와의 ${product} 일정이 있습니다. 자료와 접속 준비를 확인해주세요.`,
      href: `/requests/${target.requestId}`,
      kind: "session_reminder_supervisee",
      role: "supervisee",
      title: "슈퍼비전 일정이 다가옵니다",
      userId: target.superviseeId
    },
    {
      body: `${when}에 ${product} 일정이 있습니다. 의뢰 자료와 지도 의견 준비 상태를 확인해주세요.`,
      href: `/supervisor/requests/${target.requestId}`,
      kind: "session_reminder_supervisor",
      role: "supervisor",
      title: "슈퍼비전 일정이 다가옵니다",
      userId: target.supervisorId
    }
  ];
}

function reminderKeyFor(target: SessionReminderTarget): string {
  return `${target.requestId}:${new Date(target.scheduledStart).toISOString()}`;
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

function parseHoursAhead(): number {
  const raw = process.argv.find((arg) => arg.startsWith("--hours="));
  if (!raw) return 24;
  const value = Number(raw.slice("--hours=".length));
  if (!Number.isFinite(value) || value <= 0 || value > 168) {
    throw new Error("--hours must be a number between 1 and 168");
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
