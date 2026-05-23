import Link from "next/link";
import { calendar, profiles, withUserContext } from "@csp/db";
import {
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  CreditCard,
  LayoutDashboard
} from "lucide-react";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { AvailabilityForm } from "./availability-form";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/supervisor", icon: LayoutDashboard, label: "대시보드" },
  { href: "/supervisor/requests", icon: ClipboardList, label: "의뢰 검토" },
  { href: "/supervisor/profile", icon: BadgeCheck, label: "프로필" },
  { href: "/supervisor/products", icon: CreditCard, label: "서비스 상품" },
  { href: "/supervisor/availability", icon: CalendarClock, label: "일정" }
] as const;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const current = await getCurrentUser();
  const params = await searchParams;

  if (!current || current.user.role !== "supervisor") {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="가능시간은 슈퍼바이저만 관리할 수 있습니다."
        />
      </main>
    );
  }

  const db = createRuntimeDatabase();
  const availability = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => profiles.listAvailability(tx, current.session.userId)
  );
  const calendarConnection = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => calendar.getConnectionSummaryForUser(tx, current.session.userId)
  );
  const calendarConfigReady = Boolean(
    process.env["GOOGLE_CALENDAR_CLIENT_ID"] &&
    process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background font-body-md antialiased">
      <header className="fixed top-0 z-50 mx-auto flex h-16 w-full max-w-container-max items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-lg">
        <Link
          className="font-headline-md text-headline-md font-bold text-primary"
          href="/supervisor"
        >
          ClinicFlow
        </Link>
        <div className="flex items-center gap-md">
          <Link
            className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-dim"
            href="/supervisor/profile"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              person
            </span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 pt-16">
        <aside className="fixed left-0 z-40 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-outline-variant bg-surface p-md md:flex">
          <nav className="flex-1 space-y-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className={`flex items-center gap-sm rounded-lg px-sm py-sm transition-all ${
                    item.href === "/supervisor/availability"
                      ? "bg-secondary-container font-bold text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden size={22} />
                  <span className="font-label-md text-label-md">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="mx-auto w-full max-w-container-max flex-1 p-margin-mobile pb-24 md:ml-64 md:p-gutter">
          <div className="mb-xl flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-background md:font-display-lg md:text-display-lg">
                일정 및 예약 관리
              </h1>
              <p className="mt-base font-body-md text-body-md text-on-surface-variant">
                슈퍼비전 세션이 가능한 요일과 시간을 설정하세요.
              </p>
            </div>
          </div>
          <AvailabilityForm
            availability={availability}
            calendarConfigReady={calendarConfigReady}
            calendarConnection={calendarConnection}
            calendarMessage={params.calendar ?? ""}
          />
        </main>
      </div>
    </div>
  );
}
