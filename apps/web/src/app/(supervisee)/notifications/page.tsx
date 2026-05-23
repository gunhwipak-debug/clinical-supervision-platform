import { notifications, withUserContext } from "@csp/db";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const db = createRuntimeDatabase();
  const items = await withUserContext(db, contextFor(current), (tx) =>
    notifications.listNotifications(tx, current.session.userId)
  );

  return (
    <AppShell
      title="알림"
      subtitle="예약, 결제, 환불, 슈퍼비전 진행 상태를 한곳에서 확인합니다."
    >
      <section className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface-elevated p-6 text-sm text-ink-500">
            아직 표시할 알림이 없습니다.
          </div>
        ) : (
          items.map((item) => (
            <article
              className="rounded-2xl border border-line bg-surface-elevated p-5 shadow-soft"
              key={item.id}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="grid gap-2">
                  <p className="text-base font-bold text-ink-900">
                    {item.payload.title}
                  </p>
                  <p className="text-sm leading-6 text-ink-600">{item.payload.body}</p>
                  <p className="text-xs text-ink-400">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                {item.payload.href ? (
                  <a
                    className="inline-flex items-center justify-center rounded-xl border border-line px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                    href={item.payload.href}
                  >
                    바로가기
                  </a>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
