import { auth, notifications, withUserContext, type UserRole } from "@csp/db";
import { getMailer } from "@csp/shared";
import type { SQL } from "drizzle-orm";

type NotificationTransaction = {
  execute: (query: SQL) => Promise<unknown>;
};

type NotificationDatabase = {
  transaction: <TResult>(
    transaction: (tx: NotificationTransaction) => Promise<TResult>
  ) => Promise<TResult>;
};

export type AdminNotificationTarget = {
  userId: string;
  role: UserRole;
};

export type SendAdminNotificationInput = {
  target: AdminNotificationTarget;
  kind: string;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, string>;
  origin?: string;
};

export async function sendAdminUserNotification(
  db: NotificationDatabase,
  input: SendAdminNotificationInput
): Promise<void> {
  const user = await withUserContext(db, input.target, async (tx) => {
    const targetUser = await auth.findUserById(tx, input.target.userId);
    const payload = {
      body: input.body,
      ...(input.href ? { href: input.href } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      title: input.title
    };
    await notifications.createNotification(tx, {
      kind: input.kind,
      payload,
      userId: input.target.userId
    });
    return targetUser;
  });

  if (!user?.email) return;

  try {
    await getMailer().send({
      metadata: {
        kind: input.kind,
        userId: input.target.userId,
        ...(input.metadata ?? {})
      },
      subject: `ClinicFlow 알림: ${input.title}`,
      text: mailText(input, user.email),
      to: user.email
    });
  } catch (error) {
    console.warn("[notification-mailer]", error);
  }
}

export async function sendManyAdminNotifications(
  db: NotificationDatabase,
  items: SendAdminNotificationInput[]
): Promise<void> {
  for (const item of items) {
    await sendAdminUserNotification(db, item);
  }
}

function mailText(input: SendAdminNotificationInput, email: string): string {
  const lines = [
    input.body,
    "",
    input.href ? `바로가기: ${absoluteHref(input.href, input.origin)}` : "",
    "",
    `수신 계정: ${email}`,
    "환자 정보는 알림 메일에 포함하지 않습니다."
  ].filter(Boolean);

  return lines.join("\n");
}

function absoluteHref(href: string, origin: string | undefined): string {
  if (/^https?:\/\//u.test(href)) return href;
  const base = origin ?? process.env["NEXT_PUBLIC_WEB_URL"] ?? "http://localhost:3000";
  return new URL(href, base).toString();
}
