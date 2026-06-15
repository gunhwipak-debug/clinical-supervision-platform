import { cn } from "../lib/ui/cn";

export type AppRole = "admin" | "supervisee" | "supervisor";
export type NavKey = (typeof allNavKeys)[number];
export type AppShellUser = {
  readonly email: string;
  readonly role: AppRole;
};

type NavItem = {
  readonly href: string;
  readonly key: NavKey;
  readonly label: string;
  readonly note?: string;
};

type NavGroup = {
  readonly items: readonly NavItem[];
  readonly label: string;
};

export function RoleNavigation({
  active,
  groups,
  role
}: {
  readonly active?: string | undefined;
  readonly groups: readonly NavGroup[];
  readonly role: AppRole;
}) {
  return (
    <nav aria-label={`${roleDisplayLabel(role)} 메뉴`} className="grid gap-5">
      {groups.map((group) => (
        <div className="grid gap-1" key={group.label}>
          <p className="px-3 text-xs font-bold text-ink-400">{group.label}</p>
          {group.items.map((item) => (
            <a
              aria-current={active === item.key ? "page" : undefined}
              className={cn(
                "grid rounded-lg px-3 py-2 text-sm transition",
                active === item.key
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-surface-sunken hover:text-ink-900"
              )}
              href={item.href}
              key={item.key}
            >
              <span className="font-bold">{item.label}</span>
              {item.note ? (
                <span className="mt-0.5 text-xs font-semibold text-ink-400">
                  {item.note}
                </span>
              ) : null}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function MobileRoleNavigation({
  active,
  groups
}: {
  readonly active?: string | undefined;
  readonly groups: readonly NavGroup[];
}) {
  const items = groups.flatMap((group) => group.items);

  return (
    <nav
      aria-label="작업 메뉴"
      className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto border-b border-line px-5 pb-4 lg:hidden"
    >
      {items.map((item) => (
        <a
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "whitespace-nowrap rounded-md border px-3 py-2 text-sm font-bold",
            active === item.key
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-line bg-surface-elevated text-ink-700"
          )}
          href={item.href}
          key={item.key}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function navigationForRole(role: AppRole): readonly NavGroup[] {
  if (role === "supervisor") return supervisorNavigation;
  if (role === "admin") return adminNavigation;
  return superviseeNavigation;
}

export function homeForRole(role: AppRole): string {
  if (role === "supervisor") return "/supervisor";
  if (role === "admin") return "/admin";
  return "/requests";
}

export function roleDisplayLabel(role: AppRole): string {
  if (role === "supervisor") return "슈퍼바이저";
  if (role === "admin") return "관리자";
  return "신청자";
}

const superviseeNavigation = [
  {
    label: "내 슈퍼비전",
    items: [
      { href: "/requests", key: "requests", label: "내 의뢰" },
      { href: "/requests/new", key: "request-new", label: "새 의뢰" },
      { href: "/payments", key: "payments", label: "결제 내역" },
      { href: "/case-archive", key: "case-archive", label: "학습 기록" },
      { href: "/notifications", key: "notifications", label: "알림" }
    ]
  },
  {
    label: "안내",
    items: [
      { href: "/supervisors", key: "supervisors", label: "슈퍼바이저 찾기" },
      { href: "/guide", key: "guide", label: "이용 가이드" }
    ]
  },
  {
    label: "계정",
    items: [{ href: "/settings", key: "settings", label: "계정 설정" }]
  }
] as const satisfies readonly NavGroup[];

const supervisorNavigation = [
  {
    label: "슈퍼바이저 업무",
    items: [
      { href: "/supervisor", key: "supervisor", label: "업무 홈" },
      {
        href: "/supervisor/requests",
        key: "supervisor-requests",
        label: "검토할 의뢰"
      },
      {
        href: "/supervisor/memory",
        key: "supervisor-memory",
        label: "기록 폴더"
      }
    ]
  },
  {
    label: "운영 설정",
    items: [
      { href: "/supervisor/profile", key: "supervisor-profile", label: "프로필" },
      {
        href: "/supervisor/products",
        key: "supervisor-products",
        label: "슈퍼비전 방식"
      },
      {
        href: "/supervisor/availability",
        key: "supervisor-availability",
        label: "일정 관리"
      },
      { href: "/supervisor/payouts", key: "supervisor-payouts", label: "정산 내역" },
      {
        href: "/supervisor/qualifications",
        key: "supervisor-qualifications",
        label: "자격 심사"
      }
    ]
  }
] as const satisfies readonly NavGroup[];

const adminNavigation = [
  {
    label: "관리자",
    items: [
      { href: "/admin", key: "admin", label: "운영 콘솔" },
      { href: "/settings", key: "settings", label: "계정 설정" }
    ]
  }
] as const satisfies readonly NavGroup[];

const allNavKeys = [
  "admin",
  "case-archive",
  "guide",
  "notifications",
  "payments",
  "request-new",
  "requests",
  "settings",
  "supervisor",
  "supervisor-availability",
  "supervisor-memory",
  "supervisor-payouts",
  "supervisor-products",
  "supervisor-profile",
  "supervisor-qualifications",
  "supervisor-requests",
  "supervisors"
] as const;
