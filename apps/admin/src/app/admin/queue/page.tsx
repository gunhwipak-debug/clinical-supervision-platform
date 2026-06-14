import Link from "next/link";
import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import {
  AdminLockedState,
  AdminShell
} from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";

export const dynamic = "force-dynamic";

type QueueDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

type QueueCounts = {
  pendingQualifications: number;
  requestedRefunds: number;
  openPayouts: number;
  reviewRequests: number;
};

type AdminQueueHref =
  | "/admin/qualifications"
  | "/admin/refunds"
  | "/admin/payouts"
  | "/admin/audit";

export default async function AdminQueuePage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="운영 대기열" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="운영 대기열은 로그인 후 열립니다"
          description="처리해야 할 자격 승인, 환불, 정산 항목을 한곳에서 확인하는 관리자 화면입니다."
          returnPath="/admin/queue"
          previewItems={[
            "자격 승인 대기 항목",
            "환불 검토 요청",
            "정산 확인과 처리 기록"
          ]}
        />
      </AdminShell>
    );
  }

  const counts = await withUserContext(
    createRuntimeDatabase(),
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 대기열 조회를 위한 관리자 사유입니다."
    },
    (tx) => loadCounts(tx)
  );

  const items: Array<{
    href: AdminQueueHref;
    label: string;
    count: number;
    body: string;
  }> = [
    {
      href: "/admin/qualifications",
      label: "자격 승인",
      count: counts.pendingQualifications,
      body: "새 슈퍼바이저가 공개 목록에 올라가기 전 확인합니다."
    },
    {
      href: "/admin/refunds",
      label: "환불 검토",
      count: counts.requestedRefunds,
      body: "요청 사유, 결제 상태, 진행 단계를 함께 확인합니다."
    },
    {
      href: "/admin/payouts",
      label: "정산 확인",
      count: counts.openPayouts,
      body: "지급 예정 금액과 보류 사유를 검토합니다."
    },
    {
      href: "/admin/audit",
      label: "처리 기록",
      count: counts.reviewRequests,
      body: "검토 대기 중인 의뢰와 운영 기록을 함께 추적합니다."
    }
  ];

  return (
    <AdminShell
      title="운영 대기열"
      subtitle="관리자가 오늘 확인해야 할 업무를 큐 형태로 모았습니다."
    >
      <section className="grid gap-4">
        {items.map((item) => (
          <Link
            className="grid gap-4 rounded-xl border border-line bg-surface-elevated p-5 shadow-card transition hover:border-brand-600 md:grid-cols-[1fr_auto] md:items-center"
            href={item.href}
            key={item.href}
          >
            <span>
              <span className="block text-xl font-bold text-ink-900">
                {item.label}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-500">
                {item.body}
              </span>
            </span>
            <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
              {item.count.toLocaleString("ko-KR")}건
            </span>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}

async function loadCounts(db: QueueDatabase): Promise<QueueCounts> {
  const result = await db.execute(sql`
    select
      (select count(*)::int from qualifications where status = 'pending') as "pendingQualifications",
      (select count(*)::int from refunds where status = 'requested') as "requestedRefunds",
      (select count(*)::int from payouts where status in ('scheduled', 'processing')) as "openPayouts",
      (select count(*)::int from supervision_requests where status in ('submitted', 'awaiting_supervisor_review')) as "reviewRequests"
  `);
  return (
    rowsOf<QueueCounts>(result)[0] ?? {
      openPayouts: 0,
      pendingQualifications: 0,
      requestedRefunds: 0,
      reviewRequests: 0
    }
  );
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
