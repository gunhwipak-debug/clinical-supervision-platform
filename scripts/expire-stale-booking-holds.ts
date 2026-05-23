import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { findUserById } from "../packages/db/src/auth";
import {
  calendar,
  closeDevDatabase,
  createDatabase,
  supervision
} from "../packages/db/src";
import { withUserContext, type UserRole } from "../packages/db/src/context";
import { createNotification } from "../packages/db/src/notifications";
import { getMailer } from "../packages/shared/src/email/mailer";
import {
  cancelGoogleCalendarEvent,
  getGoogleCalendarConfig
} from "../apps/web/src/lib/google-calendar";

type ExpireDatabase = ReturnType<typeof createDatabase>;

type NotificationTarget = {
  userId: string;
  role: UserRole;
  kind: "booking_hold_expired_supervisee" | "booking_hold_expired_supervisor";
  href: string;
  title: string;
  body: string;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const logPath = join(evidenceDir, "expire-stale-booking-holds.log");
const dryRun = process.argv.includes("--dry-run");
const holdHours = parseHoldHours();
const workerUserId =
  process.env["NOTIFICATION_WORKER_USER_ID"] ?? "00000000-0000-4000-8000-000000000000";

async function main(): Promise<void> {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(logPath, "");

  const db = createSystemDatabase();
  const now = new Date();
  const cutoff = new Date(now.getTime() - holdHours * 60 * 60 * 1000);
  const targets = await withUserContext(
    db,
    {
      adminReason: "expire-stale-booking-holds",
      role: "admin",
      userId: workerUserId
    },
    (tx) => supervision.listStaleBookingHoldTargets(tx, { cutoff })
  );
  const summary = {
    calendarCancelled: 0,
    calendarFailed: 0,
    dryRun,
    expired: 0,
    holdHours,
    notificationsSent: 0,
    targetsScanned: targets.length
  };

  log(`Booking hold expiry started at ${now.toISOString()}`);
  log(`Cutoff: ${cutoff.toISOString()}`);
  log(`Mode: ${dryRun ? "dry-run" : "expire"}`);

  for (const target of targets) {
    if (dryRun) {
      log(`dry-run ${target.requestId} ${target.status}`);
      continue;
    }

    const calendarResult = await cancelCalendarForRequest(db, target.requestId);
    if (calendarResult === "cancelled" || calendarResult === "no_event") {
      if (calendarResult === "cancelled") summary.calendarCancelled += 1;
    } else {
      summary.calendarFailed += 1;
    }

    const expired = await withUserContext(
      db,
      {
        adminReason: "expire-stale-booking-holds",
        role: "admin",
        userId: workerUserId
      },
      async (tx) => {
        await supervision.updateBookingsStatusForRequest(tx, {
          requestId: target.requestId,
          status: "cancelled"
        });
        return supervision.updateSupervisionRequestStatus(
          tx,
          target.requestId,
          "expired",
          ["draft", "submitted", "awaiting_payment"]
        );
      }
    );

    if (!expired) {
      log(`skip state changed ${target.requestId}`);
      continue;
    }

    summary.expired += 1;
    for (const item of notificationTargets(target)) {
      await sendNotification(db, item, target.requestId);
      summary.notificationsSent += 1;
    }
    log(`expired ${target.requestId} calendar=${calendarResult}`);
  }

  await closeDevDatabase();
  log(`Summary: ${JSON.stringify(summary)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (summary.calendarFailed > 0) {
    process.exitCode = 1;
  }
}

function createSystemDatabase(): ExpireDatabase {
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!serviceUrl && process.env["DEV_DB"] !== "pglite") {
    throw new Error(
      "SERVICE_DATABASE_URL is required for booking hold expiry outside PGlite demo mode"
    );
  }
  return createDatabase(serviceUrl);
}

async function cancelCalendarForRequest(
  db: ExpireDatabase,
  requestId: string
): Promise<"no_event" | "cancelled" | "failed"> {
  const event = await withUserContext(
    db,
    {
      adminReason: "expire-stale-booking-holds",
      phiAccess: true,
      role: "admin",
      userId: workerUserId
    },
    (tx) => calendar.getActiveGoogleEventForRequest(tx, requestId)
  );
  if (!event) return "no_event";

  try {
    const ok = await withUserContext(
      db,
      {
        adminReason: "expire-stale-booking-holds",
        phiAccess: true,
        role: "admin",
        userId: workerUserId
      },
      (tx) =>
        cancelGoogleCalendarEvent(
          tx,
          event.connection,
          getGoogleCalendarConfig(
            process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000"
          ),
          event.providerEventId
        )
    );
    if (ok) {
      await withUserContext(
        db,
        {
          adminReason: "expire-stale-booking-holds",
          role: "admin",
          userId: workerUserId
        },
        (tx) =>
          calendar.markGoogleEventCancelled(tx, {
            bookingId: event.bookingId,
            providerEventId: event.providerEventId
          })
      );
      return "cancelled";
    }
  } catch (error) {
    log(`calendar cancel failed ${requestId}: ${formatError(error)}`);
  }

  return "failed";
}

async function sendNotification(
  db: ExpireDatabase,
  target: NotificationTarget,
  requestId: string
): Promise<void> {
  const user = await withUserContext(
    db,
    {
      adminReason: "expire-stale-booking-holds",
      role: "admin",
      userId: workerUserId
    },
    async (tx) => {
      const targetUser = await findUserById(tx, target.userId);
      await createNotification(tx, {
        kind: target.kind,
        payload: {
          body: target.body,
          href: target.href,
          metadata: { requestId },
          title: target.title
        },
        userId: target.userId
      });
      return targetUser;
    }
  );

  if (!user?.email) return;

  try {
    await getMailer().send({
      idempotencyKey: `booking-hold-expired/${requestId}/${target.userId}`,
      metadata: { kind: target.kind, requestId, userId: target.userId },
      subject: `ClinicFlow 알림: ${target.title}`,
      text: [
        target.body,
        "",
        `바로가기: ${absoluteHref(target.href)}`,
        "",
        `수신 계정: ${user.email}`,
        "환자 정보는 알림 메일에 포함하지 않습니다."
      ].join("\n"),
      to: user.email
    });
  } catch (error) {
    log(`mailer warning ${target.kind} ${requestId}: ${formatError(error)}`);
  }
}

function notificationTargets(target: {
  requestId: string;
  superviseeId: string;
  supervisorId: string | null;
  scheduledStart: Date | string;
}): NotificationTarget[] {
  const when = formatKoreanDateTime(new Date(target.scheduledStart));
  const body = `${when} 예약 초안이 결제 또는 제출 없이 오래 유지되어 자동 만료되었습니다. 필요한 경우 같은 슈퍼바이저의 공개 일정에서 새로 의뢰해주세요.`;
  const items: NotificationTarget[] = [
    {
      body,
      href: `/requests/${target.requestId}`,
      kind: "booking_hold_expired_supervisee",
      role: "supervisee",
      title: "예약 초안이 만료되었습니다",
      userId: target.superviseeId
    }
  ];
  if (target.supervisorId) {
    items.push({
      body,
      href: `/supervisor/requests/${target.requestId}`,
      kind: "booking_hold_expired_supervisor",
      role: "supervisor",
      title: "예약 초안이 만료되었습니다",
      userId: target.supervisorId
    });
  }
  return items;
}

function parseHoldHours(): number {
  const raw = process.argv.find((arg) => arg.startsWith("--hours="));
  if (!raw) return 24;
  const value = Number(raw.slice("--hours=".length));
  if (!Number.isFinite(value) || value <= 0 || value > 168) {
    throw new Error("--hours must be a number between 1 and 168");
  }
  return value;
}

function absoluteHref(href: string): string {
  const base = process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
  return new URL(href, base).toString();
}

function formatKoreanDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(date);
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
