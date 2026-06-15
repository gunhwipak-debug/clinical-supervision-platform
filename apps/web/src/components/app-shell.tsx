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
        <header className="sticky top-0 z-40 border-b border-line/80 bg-surface-base/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
            <a
              className="flex min-w-0 items-center gap-3 font-bold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              href={homeForRole(currentUser.role)}
            >
              <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
              <span className="text-base">ClinicFlow</span>
              <span className="hidden rounded-md bg-surface-sunken px-2 py-1 text-xs font-bold text-ink-500 sm:inline-flex">
                {roleLabel}
              </span>
            </a>

            <div className="flex items-center gap-2">
              <AccountMenu
                active={active}
                email={currentUser.email}
                navigation={navigation}
                roleLabel={roleLabel}
                settingsHref={settingsHref}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:py-8">
          <aside className="hidden h-fit rounded-xl border border-line bg-surface-elevated p-4 lg:sticky lg:top-24 lg:block">
            <div className="border-b border-line px-3 pb-4">
              <p className="text-sm font-bold text-ink-900">{roleLabel}</p>
              <p className="mt-1 truncate text-xs font-semibold text-ink-500">
                {currentUser.email}
              </p>
            </div>
            <div className="mt-4">
              <RoleNavigation
                active={active}
                groups={navigation}
                role={currentUser.role}
              />
            </div>
          </aside>

          <section className="grid min-w-0 gap-8">
            <MobileRoleNavigation active={active} groups={navigation} />
            <PageIntro {...introProps} />
            {children}
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
