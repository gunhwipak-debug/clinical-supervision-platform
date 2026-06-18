import type { ReactNode } from "react";
import { AccountMenu } from "./account-menu";
import {
  type AppShellUser,
  MobileRoleNavigation,
  type NavKey,
  RoleNavigation,
  homeForRole,
  navigationForRole,
  roleDisplayLabel
} from "./app-navigation";
import { PageIntro, SiteHeader } from "./clinicflow-shell";

export function AppShell({
  active,
  title,
  subtitle,
  action,
  children,
  currentUser
}: {
  active?: NavKey;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  currentUser?: AppShellUser | undefined;
}) {
  const introProps = {
    ...(action ? { action } : {}),
    ...(subtitle ? { subtitle } : {}),
    title
  };

  if (currentUser) {
    const roleLabel = roleDisplayLabel(currentUser.role);
    const navigation = navigationForRole(currentUser.role);
    const settingsHref = "/settings";

    return (
      <main className="min-h-screen bg-surface-base">
        <div className="grid min-h-screen lg:grid-cols-[244px_minmax(0,1fr)]">
          <aside className="hidden border-r border-line bg-surface-elevated lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
            <div className="border-b border-line px-5 py-5">
              <a
                className="flex min-w-0 items-center gap-3 font-bold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
                href={homeForRole(currentUser.role)}
              >
                <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
                <span className="text-base">ClinicFlow</span>
              </a>
              <div className="mt-5 rounded-md border border-line bg-surface-base px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.05em] text-ink-500">{roleLabel}</p>
                <p className="mt-1 truncate text-xs font-semibold text-ink-500">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <RoleNavigation
                active={active}
                groups={navigation}
                role={currentUser.role}
              />
            </div>
            <div className="border-t border-line px-4 py-4">
              <a
                className="block rounded-md px-3 py-2 text-sm font-bold text-ink-600 hover:bg-surface-sunken hover:text-ink-900"
                href={settingsHref}
              >
                계정 설정
              </a>
            </div>
          </aside>

          <section className="min-w-0">
            <header className="sticky top-0 z-40 border-b border-line/80 bg-surface-base/95 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
                <a
                  className="flex min-w-0 items-center gap-3 font-bold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 lg:hidden"
                  href={homeForRole(currentUser.role)}
                >
                  <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
                  <span className="text-base">ClinicFlow</span>
                </a>
                <div className="hidden min-w-0 lg:block">
                  <p className="text-xs font-bold text-ink-400">{roleLabel}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-700">
                    데스크톱 작업영역
                  </p>
                </div>
                <AccountMenu
                  active={active}
                  email={currentUser.email}
                  navigation={navigation}
                  roleLabel={roleLabel}
                  settingsHref={settingsHref}
                />
              </div>
            </header>

            <div className="mx-auto grid max-w-6xl gap-5 px-5 py-5 lg:gap-6 lg:py-6">
              <MobileRoleNavigation active={active} groups={navigation} />
              <PageIntro {...introProps} />
              {children}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <SiteHeader
        {...(active ? { active } : {})}
        showAction={false}
        showLogin={false}
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8">
        <PageIntro {...introProps} />
        {children}
      </div>
    </main>
  );
}
