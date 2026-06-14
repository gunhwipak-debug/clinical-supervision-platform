import Link from "next/link";
import { cn } from "../lib/ui/cn";
import { Button } from "./ui/button";

type HeaderLink = {
  href: string;
  label: string;
  description?: string;
};

const serviceLinks: HeaderLink[] = [
  {
    href: "/supervisors",
    label: "슈퍼바이저 찾기",
    description: "사진, 자격, 전문 분야를 비교합니다."
  },
  {
    href: "/guide",
    label: "진행 방식",
    description: "선택부터 피드백 확인까지 흐름을 봅니다."
  },
  {
    href: "/resources",
    label: "가이드·자료",
    description: "자료 작성 기준과 확인 목록을 봅니다."
  }
];

const userLinks: HeaderLink[] = [
  {
    href: "/requests",
    label: "내 의뢰",
    description: "진행 상태와 다음 행동을 확인합니다."
  },
  {
    href: "/requests/new",
    label: "새 의뢰",
    description: "선택한 슈퍼바이저와 세션으로 시작합니다."
  },
  {
    href: "/payments",
    label: "결제 내역",
    description: "결제, 환불, 영수증을 확인합니다."
  },
  {
    href: "/case-archive",
    label: "학습 기록",
    description: "완료된 피드백을 폴더처럼 정리합니다."
  }
];

const supervisorLinks: HeaderLink[] = [
  {
    href: "/supervisor",
    label: "업무 홈",
    description: "오늘 처리할 의뢰를 먼저 봅니다."
  },
  {
    href: "/supervisor/requests",
    label: "의뢰 큐",
    description: "수락, 보완 요청, 피드백 작성을 이어갑니다."
  },
  {
    href: "/supervisor/profile",
    label: "공개 프로필",
    description: "소개, 자격, 전문 분야를 관리합니다."
  },
  {
    href: "/supervisor/memory",
    label: "슈퍼비전 노트",
    description: "반복되는 슈퍼비전 맥락을 정리합니다."
  }
];

export function SiteHeader({
  active = "",
  actionHref = "/supervisors",
  actionLabel = "슈퍼바이저 찾기"
}: {
  active?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-surface-base/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <Link className="flex items-center gap-3 font-bold text-ink-900" href="/">
          <span className="grid size-8 place-items-center rounded-md bg-ink-900 text-xs font-bold text-white">
            CF
          </span>
          <span className="text-base">ClinicFlow</span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-1 text-sm font-semibold text-ink-700 lg:flex"
        >
          <HeaderMenu
            active={active}
            label="서비스"
            links={serviceLinks}
            match={["supervisors", "guide", "resources"]}
          />
          <HeaderMenu
            active={active}
            label="내 작업"
            links={userLinks}
            match={["requests", "payments", "case-archive"]}
          />
          <HeaderMenu
            active={active}
            label="슈퍼바이저"
            links={supervisorLinks}
            match={["supervisor"]}
          />
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={actionHref as never}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeaderMenu({
  active,
  label,
  links,
  match
}: {
  active: string;
  label: string;
  links: HeaderLink[];
  match: string[];
}) {
  const selected = match.some((key) => active === key);

  return (
    <div className="group relative">
      <button
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm transition hover:bg-surface-sunken",
          selected ? "text-brand-700" : "text-ink-700"
        )}
        type="button"
      >
        {label}
        <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </button>
      <div className="invisible absolute left-1/2 top-10 w-[340px] -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="grid gap-1 rounded-xl border border-line bg-surface-elevated p-2 shadow-card">
          {links.map((link) => (
            <Link
              className="grid gap-1 rounded-lg px-3 py-3 transition hover:bg-surface-sunken"
              href={link.href as never}
              key={link.href}
            >
              <span className="text-sm font-bold text-ink-900">{link.label}</span>
              {link.description ? (
                <span className="text-xs font-medium leading-relaxed text-ink-500">
                  {link.description}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
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
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-ink-900 md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base leading-relaxed text-ink-600">
            {subtitle}
          </p>
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
  steps: string[];
}) {
  const currentIndex = Math.max(steps.indexOf(current), 0);

  return (
    <nav
      aria-label="슈퍼비전 진행 단계"
      className="flex overflow-x-auto rounded-full border border-line bg-surface-elevated p-1 text-xs font-bold text-ink-500"
    >
      {steps.map((step, index) => (
        <span
          className={cn(
            "min-w-fit rounded-full px-4 py-2",
            index === currentIndex
              ? "bg-brand-600 text-white"
              : index < currentIndex
                ? "text-ink-900"
                : "text-ink-400"
          )}
          key={step}
        >
          {step}
        </span>
      ))}
    </nav>
  );
}

export function PrimaryActionPanel({
  action,
  children,
  eyebrow = "다음 행동",
  title
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-xl border border-line bg-ink-900 p-6 text-white shadow-card md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-xs font-bold text-brand-100">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{title}</h2>
        <div className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
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
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
