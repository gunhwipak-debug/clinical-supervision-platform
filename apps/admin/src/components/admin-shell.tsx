import { ArrowRight } from "lucide-react";
import { AdminAccountMenu } from "./admin-account-menu";

const adminShellLinks = [
  { href: "/admin", label: "관리자 홈" },
  { href: "/admin/queue", label: "대기열" },
  { href: "/admin/qualifications", label: "자격 심사" },
  { href: "/admin/refunds", label: "환불" },
  { href: "/admin/payouts", label: "정산" },
  { href: "/admin/audit", label: "감사 로그" }
] as const;

export function AdminShell({
  currentAdmin,
  currentPath,
  eyebrow,
  primaryAction,
  title,
  subtitle,
  children
}: {
  currentAdmin?: {
    email: string;
  };
  currentPath?: string;
  eyebrow?: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface-elevated px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
        <div className="flex items-center justify-between gap-4 lg:grid lg:h-full lg:grid-rows-[auto_1fr_auto]">
          <a className="flex items-center gap-3 font-bold text-ink-900" href="/admin">
            <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
            <span className="block text-base">ClinicFlow 운영</span>
          </a>

          {currentAdmin ? (
            <nav
              aria-label="관리자 메뉴"
              className="hide-scrollbar hidden gap-1 overflow-x-auto text-sm font-bold lg:mt-8 lg:grid lg:content-start lg:overflow-visible"
            >
              {adminShellLinks.map((item) => (
                <a
                  aria-current={currentPath === item.href ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-2 transition ${
                    currentPath === item.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-surface-sunken hover:text-ink-900"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : (
            <span className="hidden rounded-md bg-surface-sunken px-3 py-2 text-sm font-bold text-ink-500 lg:mt-8 lg:inline-flex lg:w-fit">
              관리자 화면
            </span>
          )}

          {currentAdmin ? (
            <div className="hidden lg:block">
              <AdminAccountMenu currentPath={currentPath} email={currentAdmin.email} />
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="border-b border-line bg-surface-base px-5 py-3 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            {currentAdmin ? (
              <nav
                aria-label="관리자 메뉴"
                className="hide-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 text-sm font-bold lg:hidden"
              >
                {adminShellLinks.map((item) => (
                  <a
                    aria-current={currentPath === item.href ? "page" : undefined}
                    className={`whitespace-nowrap rounded-md px-3 py-2 transition ${
                      currentPath === item.href
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-surface-sunken hover:text-ink-900"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : (
              <span className="rounded-md bg-surface-sunken px-3 py-2 text-sm font-bold text-ink-500">
                관리자 화면
              </span>
            )}
            {currentAdmin ? (
              <div className="lg:hidden">
                <AdminAccountMenu currentPath={currentPath} email={currentAdmin.email} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-5 md:gap-6 md:py-6 lg:px-7">
          <header className="grid gap-4 border-b border-line pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3">
              {eyebrow ? (
                <span className="inline-flex w-fit rounded-md border border-warn/40 bg-surface-elevated px-3 py-1.5 text-xs font-bold uppercase tracking-[0.05em] text-warn">
                  {eyebrow}
                </span>
              ) : null}
              <div className="grid gap-2">
                <h1 className="break-keep text-2xl font-bold leading-tight tracking-normal text-ink-900">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="max-w-3xl break-keep text-sm leading-relaxed text-ink-500">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
            {primaryAction ? (
              <a
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                href={primaryAction.href}
              >
                {primaryAction.label}
                <ArrowRight aria-hidden size={18} />
              </a>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}

export function AdminCard({
  children,
  id,
  className = ""
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <article
      id={id}
      className={`rounded-lg border border-line bg-surface-elevated p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </article>
  );
}

export function AdminListFrame({
  children,
  id,
  className = ""
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`overflow-hidden rounded-lg border border-line bg-surface-elevated ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminDarkPanel({
  title,
  description,
  children,
  className = ""
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`rounded-lg border border-line bg-surface-elevated p-5 text-ink-900 ${className}`}>
      <h2 className="text-xl font-bold leading-tight">{title}</h2>
      <p className="mt-3 break-keep text-sm leading-relaxed text-ink-600">
        {description}
      </p>
      {children ? <div className="mt-8">{children}</div> : null}
    </aside>
  );
}

export function AdminLockedState({
  description,
  previewItems,
  returnPath,
  title
}: {
  description: string;
  previewItems: string[];
  returnPath: string;
  title: string;
}) {
  const webOrigin =
    process.env["NEXT_PUBLIC_WEB_APP_URL"] ??
    process.env["NEXT_PUBLIC_WEB_URL"] ??
    "https://clinicflow-web-beta.vercel.app";
  const adminOrigin =
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ??
    process.env["NEXT_PUBLIC_ADMIN_URL"] ??
    "https://clinicflow-admin-six.vercel.app";
  const loginHref = `${webOrigin}/login?returnTo=${encodeURIComponent(
    `${adminOrigin}${returnPath}`
  )}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <AdminDarkPanel title={title} description={description} className="grid gap-6">
        <a
          className="inline-flex w-fit items-center gap-2 rounded-md bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          href={loginHref}
        >
          관리자 로그인
          <ArrowRight aria-hidden size={16} />
        </a>
      </AdminDarkPanel>
      <aside className="h-fit rounded-lg border border-line bg-surface-elevated p-5 lg:sticky lg:top-8">
        <h3 className="text-xl font-bold text-ink-900">로그인 후 확인</h3>
        <div className="mt-5 grid gap-3" aria-label="로그인 후 확인할 항목">
          {previewItems.map((item) => (
            <div className="border-b border-line pb-3 last:border-b-0" key={item}>
              <span className="text-sm font-semibold text-ink-700">{item}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
