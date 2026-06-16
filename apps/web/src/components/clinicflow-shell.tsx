import Link from "next/link";
import { cn } from "../lib/ui/cn";
import { Button } from "./ui/button";

const publicLinks = [
  { href: "/supervisors", key: "supervisors", label: "슈퍼바이저 찾기" },
  { href: "/guide", key: "guide", label: "이용 가이드" }
] as const;

export function SiteHeader({
  active = "",
  actionHref = "/requests/new",
  actionLabel = "슈퍼비전 신청하기",
  showAction = true,
  showLogin = true
}: {
  active?: string;
  actionHref?: string;
  actionLabel?: string;
  showAction?: boolean;
  showLogin?: boolean;
}) {
  return (
    <header className="sticky top-3 z-50 px-4 py-3">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line/90 bg-surface-base/90 px-5 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-8">
        <Link
          className="flex items-center gap-3 font-bold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          href="/"
        >
          <span className="size-4 rounded-full bg-ink-900" aria-hidden="true" />
          <span className="text-base">ClinicFlow</span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="order-3 flex w-full items-center gap-5 overflow-x-auto text-sm font-semibold text-ink-600 sm:order-none sm:w-auto sm:gap-8"
        >
          {publicLinks.map((link) => (
            <Link
              aria-current={active === link.key ? "page" : undefined}
              className={cn(
                "whitespace-nowrap transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600",
                active === link.key ? "text-brand-700" : "text-ink-600"
              )}
              href={link.href as never}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {showLogin ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">로그인</Link>
            </Button>
          ) : null}
          {showAction ? (
            <Button asChild size="sm">
              <Link href={actionHref as never}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function PageIntro({
  action,
  eyebrow,
  subtitle,
  title
}: {
  action?: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-2">
        {eyebrow ? (
          <p className="text-sm font-bold tracking-normal text-brand-700">{eyebrow}</p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-ink-900 md:text-[42px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base leading-relaxed text-ink-600">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </section>
  );
}

export function FlowStepNav({
  current,
  steps
}: {
  current: string;
  steps: readonly string[];
}) {
  const currentIndex = Math.max(steps.indexOf(current), 0);
  const stepNumber = currentIndex + 1;

  return (
    <nav aria-label="슈퍼비전 진행 단계" className="grid gap-3">
      <p className="text-sm font-bold text-ink-500">
        진행 위치 {String(stepNumber)} / {String(steps.length)} ·{" "}
        <span className="text-ink-900">{current}</span>
      </p>
      <ol className="grid overflow-hidden rounded-xl border border-line bg-surface-elevated text-sm font-bold text-ink-500 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        {steps.map((step, index) => (
          <li
            aria-current={index === currentIndex ? "step" : undefined}
            className={cn(
              "border-b border-line px-3 py-3 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0",
              index === currentIndex
                ? "bg-brand-600 text-white"
                : index < currentIndex
                  ? "bg-surface-base text-ink-900"
                  : "text-ink-400"
            )}
            key={step}
          >
            {step}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PrimaryActionPanel({
  action,
  children,
  eyebrow,
  title,
  variant = "compact",
  theme = "dark"
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  variant?: "compact" | "prominent";
  theme?: "dark" | "light";
}) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-xl border md:grid-cols-[1fr_auto] md:items-center",
        theme === "dark"
          ? "border-line bg-ink-900 text-white"
          : "border-line bg-surface-elevated text-ink-900",
        variant === "prominent" ? "p-6" : "p-5"
      )}
    >
      <div>
        {eyebrow ? (
          <p
            className={cn(
              "text-sm font-bold",
              theme === "dark" ? "text-brand-100" : "text-brand-700"
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-bold leading-tight",
            eyebrow ? "mt-2" : "",
            variant === "prominent" ? "text-2xl" : "text-xl"
          )}
        >
          {title}
        </h2>
        <div
          className={cn(
            "mt-3 max-w-2xl text-sm leading-relaxed",
            theme === "dark" ? "text-slate-200" : "text-ink-600"
          )}
        >
          {children}
        </div>
      </div>
      {action}
    </section>
  );
}

export function SectionBlock({
  children,
  subtitle,
  title
}: {
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-base leading-relaxed text-ink-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
