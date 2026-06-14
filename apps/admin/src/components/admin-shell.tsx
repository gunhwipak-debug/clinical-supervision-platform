import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  ClipboardList,
  Gauge,
  ListChecks,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "운영 홈", icon: Gauge },
  { href: "/admin/queue", label: "대기열", icon: ListChecks },
  { href: "/admin/qualifications", label: "자격 승인", icon: BadgeCheck },
  { href: "/admin/refunds", label: "환불 큐", icon: RotateCcw },
  { href: "/admin/payouts", label: "정산", icon: Banknote }
] as const;

export function AdminShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 shadow-card lg:sticky lg:top-6">
          <a className="flex items-center gap-3 font-bold text-ink-900" href="/">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-600 text-sm text-surface-elevated">
              운영
            </span>
            <span>
              <span className="block text-lg">ClinicFlow 운영</span>
              <span className="block text-xs font-semibold text-ink-500">
                운영 콘솔
              </span>
            </span>
          </a>
          <div className="mt-5 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
            <div className="flex items-center gap-2 font-semibold">
              <ClipboardList aria-hidden size={17} />
              처리할 업무부터 확인
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              자격 승인, 환불, 정산, 처리 기록을 대기열 기준으로 확인합니다.
            </p>
          </div>
          <nav
            className="mt-5 grid gap-2 text-sm font-semibold text-ink-700"
            aria-label="운영 메뉴"
          >
            {navItems.map((item) => (
              <a
                className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-surface-sunken"
                href={item.href}
                key={item.href}
              >
                <item.icon aria-hidden size={18} />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <section className="grid gap-6">
          <header className="grid gap-3 rounded-xl border border-line bg-surface-elevated p-5 shadow-card">
            <p className="inline-flex w-fit items-center gap-2 rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              <ClipboardList aria-hidden size={16} />
              운영 콘솔
            </p>
            <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="max-w-2xl text-ink-500">{subtitle}</p> : null}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

export function AdminCard({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-line bg-surface-elevated p-5 shadow-card ${className}`}
    >
      {children}
    </article>
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
    process.env["NEXT_PUBLIC_ADMIN_APP_URL"] ?? "https://clinicflow-admin-six.vercel.app";
  const loginHref = `${webOrigin}/login?returnTo=${encodeURIComponent(
    `${adminOrigin}${returnPath}`
  )}`;

  return (
    <AdminCard className="grid gap-5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <LockKeyhole aria-hidden size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="break-keep text-2xl font-bold leading-tight text-ink-900">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl break-keep text-sm leading-relaxed text-ink-600">
              {description}
            </p>
          </div>
        </div>
        <a
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-surface-elevated transition hover:bg-brand-700"
          href={loginHref}
        >
          관리자 로그인
          <ArrowRight aria-hidden size={16} />
        </a>
      </div>
      <div className="grid gap-3 rounded-lg bg-surface-sunken/60 p-4 md:grid-cols-3">
        {previewItems.map((item) => (
          <div
            className="rounded-lg border border-line bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink-700"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
