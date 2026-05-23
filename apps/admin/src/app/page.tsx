import type { ReactNode } from "react";
import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  ClipboardList,
  FileClock,
  Menu,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { AdminCard, AdminShell } from "../components/admin-shell";
import { createRuntimeDatabase, getCurrentAdmin } from "../lib/auth/current-admin";

export const dynamic = "force-dynamic";

type StatsDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export default async function AdminPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell
        title="운영 대시보드"
        subtitle="관리자 로그인과 2단계 인증이 필요합니다."
      >
        <AdminCard>관리자 계정으로 로그인해주세요.</AdminCard>
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const stats = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 대시보드 조회를 위한 관리자 사유입니다."
    },
    (tx) => dashboardStats(tx)
  );

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-6 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="inline-flex items-center gap-3">
            <Menu aria-hidden size={28} />
            <span className="text-3xl font-bold">ClinicFlow 운영</span>
          </span>
          <span className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            관리자 세션
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        <section>
          <h1 className="text-4xl font-bold">환영합니다, 관리자님</h1>
          <p className="mt-3 text-xl text-ink-700">
            오늘의 주요 플랫폼 지표를 확인하세요.
          </p>
        </section>

        <section
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          aria-label="운영 지표"
        >
          <MetricCard
            description="운영자 검증 필요"
            icon={<BadgeCheck aria-hidden size={22} />}
            label="대기 중인 자격 심사"
            value={stats.pendingQualifications}
          />
          <MetricCard
            description="실제 결제 완료 기준"
            icon={<Banknote aria-hidden size={22} />}
            label="이달 결제 완료액"
            valueLabel={formatKrw(stats.paidGrossThisMonth)}
          />
          <MetricCard
            description="환불 검토 필요"
            icon={<ReceiptText aria-hidden size={22} />}
            label="환불 요청"
            value={stats.requestedRefunds}
          />
          <MetricCard
            description="슈퍼바이저 검토 대기"
            icon={<ClipboardList aria-hidden size={22} />}
            label="열린 의뢰"
            value={stats.openRequests}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <AdminCard className="overflow-hidden rounded-3xl border-line bg-surface-elevated p-0 shadow-card">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-2xl font-bold">최근 자격 요청</h2>
              <a
                className="text-sm font-bold text-brand-600"
                href="/admin/qualifications"
              >
                전체 보기
              </a>
            </div>
            <div className="grid divide-y divide-line">
              <QueueLink
                description="자격 증빙과 프로필 공개 조건을 확인합니다."
                href="/admin/qualifications"
                icon={<BadgeCheck aria-hidden size={22} />}
                label="자격 승인"
                value={stats.pendingQualifications}
              />
              <QueueLink
                description="결제 금액과 요청 사유를 확인합니다."
                href="/admin/refunds"
                icon={<RotateCcw aria-hidden size={22} />}
                label="환불 검토"
                value={stats.requestedRefunds}
              />
              <QueueLink
                description="정산 산출 결과와 지급 예정액을 확인합니다."
                href="/admin/payouts"
                icon={<Banknote aria-hidden size={22} />}
                label="지급 관리"
                value={stats.scheduledPayouts}
              />
              <QueueLink
                description="관리자 조치와 자료 접근 이력을 확인합니다."
                href="/admin/audit"
                icon={<FileClock aria-hidden size={22} />}
                label="감사 로그"
                value={stats.auditLogCount}
              />
            </div>
          </AdminCard>

          <AdminCard className="h-fit rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldCheck aria-hidden size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold">운영 원칙</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  관리자 화면은 PHI 본문을 노출하지 않습니다. 상태 변경 작업은 항상 30자
                  이상의 사유와 2단계 인증 세션을 요구합니다.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 text-sm text-ink-700">
              <span className="rounded-2xl bg-brand-50 px-3 py-2">
                권한 정책을 우회하지 않고 운영 권한 컨텍스트로 조회
              </span>
              <span className="rounded-2xl bg-brand-50 px-3 py-2">
                승인·환불·정산 작업은 사유와 감사 로그 기준으로 추적
              </span>
            </div>
          </AdminCard>
        </section>
      </div>

      <AdminBottomNav active="대시보드" />
    </main>
  );
}

function MetricCard({
  description,
  icon,
  label,
  value,
  valueLabel
}: {
  description: string;
  icon: ReactNode;
  label: string;
  value?: number;
  valueLabel?: string;
}) {
  return (
    <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-ink-500">{label}</span>
          <strong className="mt-2 block text-4xl text-ink-900">
            {valueLabel ?? value?.toLocaleString("ko-KR") ?? "0"}
          </strong>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-500">{description}</p>
    </AdminCard>
  );
}

function QueueLink({
  description,
  href,
  icon,
  label,
  value
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <a
      className="group flex items-center justify-between gap-4 p-5 transition hover:bg-brand-50"
      href={href}
    >
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
        <span>
          <strong className="text-ink-900">{label}</strong>
          <span className="mt-1 block text-sm leading-relaxed text-ink-500">
            {description}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="rounded-pill bg-accent-100 px-3 py-1 text-xs font-semibold text-ink-900">
          {value.toLocaleString("ko-KR")}건
        </span>
        <ArrowRight
          aria-hidden
          className="text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-700"
          size={18}
        />
      </span>
    </a>
  );
}

function AdminBottomNav({ active }: { active: string }) {
  return (
    <nav className="border-t border-line bg-surface-elevated px-4 py-3">
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-2 text-center text-sm font-medium text-ink-700">
        {(
          [
            { href: "/admin", label: "대시보드", icon: UsersRound },
            { href: "/admin/qualifications", label: "자격", icon: BadgeCheck },
            { href: "/admin/payouts", label: "정산", icon: Banknote },
            { href: "/admin/refunds", label: "환불", icon: ReceiptText },
            { href: "/admin/audit", label: "감사", icon: FileClock }
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const selected = item.label === active;
          return (
            <a
              className={`grid place-items-center gap-1 rounded-full px-3 py-2 ${
                selected ? "bg-brand-500 text-white" : "text-ink-700"
              }`}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden size={24} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

async function dashboardStats(db: StatsDatabase) {
  const result = await db.execute(sql`
    select
      (select count(*)::int from qualifications where status = 'pending') as "pendingQualifications",
      (select count(*)::int from refunds where status = 'requested') as "requestedRefunds",
      (select count(*)::int from supervision_requests where status in ('submitted', 'awaiting_supervisor_review')) as "openRequests",
      (select count(*)::int from users where status = 'active') as "activeUsers",
      (select count(*)::int from payouts where status = 'scheduled') as "scheduledPayouts",
      (select count(*)::int from audit_logs) as "auditLogCount",
      (
        select coalesce(sum(amount_krw), 0)::int
        from payments
        where status in ('paid', 'partially_refunded')
          and paid_at >= date_trunc('month', now())
      ) as "paidGrossThisMonth"
  `);
  return (
    rowsOf<{
      pendingQualifications: number;
      requestedRefunds: number;
      openRequests: number;
      activeUsers: number;
      scheduledPayouts: number;
      auditLogCount: number;
      paidGrossThisMonth: number;
    }>(result)[0] ?? {
      pendingQualifications: 0,
      requestedRefunds: 0,
      openRequests: 0,
      activeUsers: 0,
      scheduledPayouts: 0,
      auditLogCount: 0,
      paidGrossThisMonth: 0
    }
  );
}

function formatKrw(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }
  return [];
}
