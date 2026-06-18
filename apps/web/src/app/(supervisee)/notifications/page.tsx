import { notifications, withUserContext } from "@csp/db";
import { AppShell } from "@/components/app-shell";
import { LoginRequiredState, RoleRequiredState } from "@/components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor } from "@/lib/supervision/authz";
import { MarkAllNotificationsRead, NotificationAction } from "./notification-actions";

type NotificationItem = Awaited<
  ReturnType<typeof notifications.listNotifications>
>[number];

type NotificationFilter = "all" | "unread";

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const current = await getCurrentUser();
  const params = await searchParams;
  const filter: NotificationFilter = params.filter === "unread" ? "unread" : "all";

  if (!current) {
    return <LoginRequiredState title="알림" returnTo="/notifications" />;
  }
  const currentShellUser = current.user;
  if (current.user.role === "admin") {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="알림"
        description="관리자 계정은 운영 콘솔에서 심사, 환불, 정산 상태를 확인합니다."
        actionHref="/admin"
        actionLabel="운영 콘솔로 이동"
      />
    );
  }

  let items: NotificationItem[];
  let notificationsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    items = await withUserContext(db, contextFor(current), (tx) =>
      notifications.listNotifications(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[notifications.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    items = [];
    notificationsUnavailable = true;
  }

  const normalizedItems = items.map(normalizeNotification).sort(notificationSort);
  const unreadCount = normalizedItems.filter((item) => !item.read).length;
  const visibleItems =
    filter === "unread"
      ? normalizedItems.filter((item) => !item.read)
      : normalizedItems;

  return (
    <AppShell
      active="notifications"
      currentUser={currentShellUser}
      title="알림"
      subtitle="읽지 않은 알림을 먼저 확인하고, 관련 업무 화면으로 바로 이동합니다."
    >
      <section className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-elevated px-5 py-4">
          <div>
            <p className="text-sm font-bold text-brand-700">
              읽지 않은 알림 {String(unreadCount)}개
            </p>
            <p className="mt-1 text-sm text-ink-500">
              알림을 열면 읽음으로 처리됩니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className={`rounded-md px-3 py-2 text-sm font-bold ${
                filter === "all"
                  ? "bg-brand-600 text-white"
                  : "border border-line text-ink-700"
              }`}
              href="/notifications"
            >
              전체
            </a>
            <a
              className={`rounded-md px-3 py-2 text-sm font-bold ${
                filter === "unread"
                  ? "bg-brand-600 text-white"
                  : "border border-line text-ink-700"
              }`}
              href="/notifications?filter=unread"
            >
              읽지 않음
            </a>
            <MarkAllNotificationsRead disabled={unreadCount === 0} />
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <section className="rounded-lg border border-line bg-surface-elevated p-5">
            <p className="text-base font-bold text-ink-900">
              {notificationsUnavailable
                ? "현재 알림을 불러오지 못했습니다"
                : "새 알림이 없습니다."}
            </p>
            <p className="mt-2 break-keep text-sm leading-6 text-ink-500">
              {notificationsUnavailable
                ? "연결이 복구되면 의뢰, 결제, 피드백, 정산 관련 알림이 이곳에 표시됩니다."
                : "상태가 바뀌면 이 화면과 왼쪽 메뉴의 알림 숫자에 표시됩니다."}
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-line bg-surface-elevated">
            <div className="grid divide-y divide-line">
              {visibleItems.map((item) => (
                <article
                  className={`grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start ${
                    item.read ? "bg-surface-elevated" : "bg-brand-50/40"
                  }`}
                  key={item.id}
                >
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.read ? (
                        <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                          읽지 않음
                        </span>
                      ) : null}
                      <p className="text-base font-bold text-ink-900">
                        {item.title}
                      </p>
                    </div>
                    <p className="break-keep text-sm leading-6 text-ink-600">
                      {item.body}
                    </p>
                    <p className="text-xs text-ink-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <NotificationAction
                    href={item.href}
                    id={item.id}
                    read={item.read}
                  />
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </AppShell>
  );
}

function normalizeNotification(item: NotificationItem) {
  const payload: Partial<NotificationItem["payload"]> = item.payload;
  return {
    body: safeText(payload.body, "알림 내용을 확인해주세요."),
    createdAt: item.createdAt,
    href: internalHref(payload.href),
    id: item.id,
    read: Boolean(item.readAt),
    title: safeText(payload.title, "알림")
  };
}

function notificationSort(
  a: ReturnType<typeof normalizeNotification>,
  b: ReturnType<typeof normalizeNotification>
): number {
  if (a.read !== b.read) return a.read ? 1 : -1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function internalHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
