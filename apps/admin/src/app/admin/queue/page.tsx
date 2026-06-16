import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import {
  AdminCard,
  AdminLockedState,
  AdminShell
} from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";

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
      <AdminShell title="대기열" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="대기열은 로그인 후 열립니다"
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

  let counts: QueueCounts;
  let countsUnavailable = false;
  try {
    counts = await withUserContext(
      createRuntimeDatabase(),
      {
        userId: current.session.userId,
        role: "admin",
        adminReason: "운영 업무 목록 조회를 위한 처리 사유입니다."
      },
      (tx) => loadCounts(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[admin.queue.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    counts = {
      openPayouts: 0,
      pendingQualifications: 0,
      requestedRefunds: 0,
      reviewRequests: 0
    };
    countsUnavailable = true;
  }

  const items: Array<{
    href: AdminQueueHref;
    detail: string;
    label: string;
    count: number;
    body: string;
  }> = [
    {
      detail: "운영자",
      href: "/admin/qualifications",
      label: "자격 승인",
      count: counts.pendingQualifications,
      body: "새 슈퍼바이저가 공개 목록에 올라가기 전 확인합니다."
    },
    {
      detail: "결제",
      href: "/admin/refunds",
      label: "환불 검토",
      count: counts.requestedRefunds,
      body: "요청 사유, 결제 상태, 진행 단계를 함께 확인합니다."
    },
    {
      detail: "정산",
      href: "/admin/payouts",
      label: "정산 확인",
      count: counts.openPayouts,
      body: "지급 예정 금액과 보류 사유를 검토합니다."
    },
    {
      detail: "기록",
      href: "/admin/audit",
      label: "처리 기록",
      count: counts.reviewRequests,
      body: "검토 대기 중인 의뢰와 운영 기록을 함께 추적합니다."
    }
  ];
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/queue"
      title="대기열"
      subtitle="승인, 환불, 정산처럼 사용자 진행을 멈추는 항목을 먼저 확인합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">
                처리가 필요한 운영 항목
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {countsUnavailable
                  ? "현재 처리 항목을 불러오지 못했습니다. 연결되면 이 목록에 순서대로 표시됩니다."
                  : "오늘 확인해야 할 요청만 남겼습니다."}
              </p>
            </div>
            <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
              {countsUnavailable
                ? "확인 필요"
                : `${totalCount.toLocaleString("ko-KR")}건`}
            </span>
          </div>
          <div className="grid divide-y divide-line">
            {items.map((item) => (
              <Link
                className="group flex items-center justify-between gap-4 p-5 transition hover:bg-brand-50"
                href={item.href}
                key={item.href}
              >
                <span>
                  <span className="text-sm font-semibold text-ink-500">
                    {item.detail}
                  </span>
                  <span className="mt-1 block text-xl font-bold text-ink-900">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-500">
                    {item.body}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
                    {countsUnavailable
                      ? "확인 필요"
                      : `${item.count.toLocaleString("ko-KR")}건`}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-700"
                    size={18}
                  />
                </span>
              </Link>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="h-fit">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">운영 확인</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                자격 심사, 환불, 정산처럼 이용자 진행을 멈추는 항목을 먼저 확인하고 처리
                사유를 남깁니다.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed">
            <div>
              <dt className="font-bold text-ink-500">우선순위</dt>
              <dd className="mt-1 break-keep text-ink-900">
                자격 승인, 환불, 정산, 기록 확인 순서로 운영자가 개입할 화면을
                분리했습니다.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">처리 방식</dt>
              <dd className="mt-1 break-keep text-ink-900">
                실제 승인과 반려, 계산 실행은 각 하위 페이지에서 그대로 이어집니다.
              </dd>
            </div>
          </dl>
        </AdminCard>
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
