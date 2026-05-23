import { Button } from "./ui/button";

export function AppShell({
  title,
  subtitle,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-base/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <a className="flex items-center gap-3 font-bold text-ink-900" href="/">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-sm text-surface-elevated">
              CF
            </span>
            ClinicFlow
          </a>
          <nav className="hidden items-center gap-4 text-sm font-medium text-ink-700 md:flex">
            <a href="/supervisors">검색</a>
            <a href="/requests">의뢰</a>
            <a href="/payments">결제</a>
            <a href="/notifications">알림</a>
            <a href="/supervisor">슈퍼바이저</a>
            <a href="/resources">자료실</a>
            <Button asChild size="sm" variant="secondary">
              <a href="/settings">설정</a>
            </Button>
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="max-w-2xl text-ink-500">{subtitle}</p> : null}
          </div>
          {action}
        </section>
        {children}
      </div>
    </main>
  );
}
