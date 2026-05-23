import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  Gauge,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "대시보드", icon: Gauge },
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
              <ShieldCheck aria-hidden size={17} />
              2단계 인증 관리자 세션
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              관리자 콘솔은 허용된 네트워크, 2단계 인증, 30자 이상의 처리 사유를 모두
              요구합니다.
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
