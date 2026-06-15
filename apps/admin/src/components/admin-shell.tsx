import { ArrowRight } from "lucide-react";

const navItems = [
  { href: "/admin", label: "운영 홈" },
  { href: "/admin/queue", label: "운영 대기열" },
  { href: "/admin/qualifications", label: "자격 심사" },
  { href: "/admin/refunds", label: "환불 심사" },
  { href: "/admin/payouts", label: "정산 확인" },
  { href: "/admin/audit", label: "처리 기록" }
] as const;

export function AdminShell({
  currentPath,
  eyebrow,
  primaryAction,
  title,
  subtitle,
  children
}: {
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
    <main className="min-h-screen bg-surface-base">
      <div className="bg-surface-base px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[18px] border border-line bg-surface-elevated px-5 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
          <a className="flex items-center gap-3 font-bold text-ink-900" href="/">
            <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
            <span>
              <span className="block text-base">ClinicFlow 운영</span>
            </span>
          </a>
          <nav
            className="flex flex-wrap gap-2 text-sm font-semibold text-ink-700"
            aria-label="운영 메뉴"
          >
            {navItems.map((item) => (
              <a
                aria-current={currentPath === item.href ? "page" : undefined}
                className={`rounded-md px-3 py-2 transition ${
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
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:gap-10 md:py-14">
        <header className="grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-5">
            {eyebrow ? (
              <span className="inline-flex w-fit rounded-full border border-[#f3cf85] px-4 py-2 text-sm font-semibold text-[#cb6f12]">
                {eyebrow}
              </span>
            ) : null}
            <div className="grid gap-3">
              <h1 className="break-keep text-5xl font-bold leading-none tracking-normal text-ink-900 md:text-[64px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-3xl break-keep text-lg leading-8 text-ink-500">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          {primaryAction ? (
            <a
              className="inline-flex w-fit items-center gap-2 rounded-md bg-brand-600 px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)] transition hover:bg-brand-700"
              href={primaryAction.href}
            >
              {primaryAction.label}
              <ArrowRight aria-hidden size={18} />
            </a>
          ) : null}
        </header>
        {children}
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
      className={`rounded-xl border border-line bg-surface-elevated p-6 ${className}`}
    >
      {children}
    </article>
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
    <aside className={`rounded-xl bg-ink-900 p-8 text-white ${className}`}>
      <h2 className="text-[32px] font-bold leading-tight">{title}</h2>
      <p className="mt-6 break-keep text-base leading-8 text-slate-200">
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
    process.env["NEXT_PUBLIC_WEB_APP_URL"] ?? "https://clinicflow-web-beta.vercel.app";
  const adminOrigin =
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ??
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
      <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-6 lg:sticky lg:top-8">
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
