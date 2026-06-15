import { notifications, withUserContext } from "@csp/db";
import { AppShell } from "@/components/app-shell";
import { LoginRequiredState, RoleRequiredState } from "@/components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor } from "@/lib/supervision/authz";

type NotificationItem = Awaited<
  ReturnType<typeof notifications.listNotifications>
>[number];

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) {
    return <LoginRequiredState title="알림" returnTo="/notifications" />;
  }
  const currentShellUser = current.user;
  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="알림"
        description="개인 알림은 신청자 또는 슈퍼바이저 작업영역에서 확인합니다. 관리자 계정은 운영 콘솔을 사용해주세요."
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
      "[supervisee.notifications.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    items = [];
    notificationsUnavailable = true;
  }
  const actionableItems = items.filter((item) => item.payload.href);
  const passiveItems = items.filter((item) => !item.payload.href);
  const primaryItem = actionableItems[0];
  const historyItems = [...actionableItems.slice(1), ...passiveItems];

  return (
    <AppShell
      active="notifications"
      currentUser={currentShellUser}
      title="알림"
      subtitle="먼저 확인할 알림만 위에 두고, 나머지는 기록으로 남깁니다."
    >
      <section className="grid gap-5">
        {items.length === 0 ? (
          <>
            <section className="rounded-xl border border-line bg-surface-elevated p-5">
              <p className="text-sm font-bold text-brand-700">지금 확인할 알림</p>
              <p className="mt-3 text-base font-bold text-ink-900">
                {notificationsUnavailable
                  ? "현재 알림을 불러오지 못했습니다"
                  : "지금 확인할 알림은 없습니다"}
              </p>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                {notificationsUnavailable
                  ? "연결이 복구되면 추가 자료 요청, 결제, 피드백 도착 알림이 이곳에 표시됩니다."
                  : "의뢰 상태가 바뀌거나 추가 자료 요청이 오면 이 목록에 한 줄씩 표시됩니다."}
              </p>
            </section>
            <section className="rounded-xl border border-line bg-surface-elevated">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-lg font-bold text-ink-900">알림 기록</h2>
              </div>
              <p className="px-5 py-4 text-sm leading-relaxed text-ink-500">
                아직 기록으로 남길 알림이 없습니다.
              </p>
            </section>
          </>
        ) : (
          <>
            {primaryItem ? (
              <section className="rounded-xl border border-line bg-surface-elevated p-5">
                <p className="text-sm font-bold text-brand-700">지금 확인할 알림</p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <NotificationText item={primaryItem} />
                  <a
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
                    href={primaryItem.payload.href}
                  >
                    확인하기
                  </a>
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-line bg-surface-elevated">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-lg font-bold text-ink-900">알림 기록</h2>
              </div>
              {historyItems.length === 0 ? (
                <p className="px-5 py-4 text-sm text-ink-500">
                  확인만 필요한 알림은 아직 없습니다.
                </p>
              ) : (
                <div className="grid divide-y divide-line">
                  {historyItems.map((item) => (
                    <article
                      className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between"
                      key={item.id}
                    >
                      <NotificationText item={item} />
                      {item.payload.href ? (
                        <a
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                          href={item.payload.href}
                        >
                          열기
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </AppShell>
  );
}

function NotificationText({
  item
}: {
  item: {
    createdAt: Date | string;
    payload: { body: string; href?: string; title: string };
  };
}) {
  return (
    <div className="grid gap-2">
      <p className="text-base font-bold text-ink-900">{item.payload.title}</p>
      <p className="text-sm leading-6 text-ink-600">{item.payload.body}</p>
      <p className="text-xs text-ink-400">{formatDateTime(item.createdAt)}</p>
    </div>
  );
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
