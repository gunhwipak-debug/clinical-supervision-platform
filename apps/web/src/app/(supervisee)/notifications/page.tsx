import { notifications, withUserContext } from "@csp/db";
import { AppShell } from "@/components/app-shell";
import { LoginRequiredState } from "@/components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) {
    return <LoginRequiredState title="알림" returnTo="/notifications" />;
  }

  const db = createRuntimeDatabase();
  const items = await withUserContext(db, contextFor(current), (tx) =>
    notifications.listNotifications(tx, current.session.userId)
  );
  const actionableItems = items.filter((item) => item.payload.href);
  const passiveItems = items.filter((item) => !item.payload.href);
  const primaryItem = actionableItems[0];
  const historyItems = [...actionableItems.slice(1), ...passiveItems];

  return (
    <AppShell
      title="알림"
      subtitle="먼저 확인할 알림만 위에 두고, 나머지는 기록으로 남깁니다."
    >
      <section className="grid gap-5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface-elevated p-6 text-sm text-ink-500">
            아직 표시할 알림이 없습니다.
          </div>
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
