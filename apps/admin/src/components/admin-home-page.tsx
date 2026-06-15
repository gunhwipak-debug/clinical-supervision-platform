import { sql, type SQL } from "drizzle-orm";
import { withUserContext } from "@csp/db";
import { AdminCard, AdminDarkPanel, AdminLockedState, AdminShell } from "./admin-shell";
import { createRuntimeDatabase, getCurrentAdmin } from "../lib/auth/current-admin";

export const dynamic = "force-dynamic";

type StatsDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function AdminHomePage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="운영 홈" subtitle="관리자 로그인과 2단계 인증이 필요합니다.">
        <AdminLockedState
          title="운영 업무는 관리자 계정에서 이어집니다"
          description="자격 승인, 환불, 정산, 처리 기록은 관리자 권한이 확인된 뒤 열립니다."
          returnPath="/admin"
          previewItems={[
            "오늘 먼저 확인할 운영 대기열",
            "자격 승인, 환불, 정산 상태",
            "처리 기록과 운영 조치 내역"
          ]}
        />
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const stats = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 홈 조회를 위한 처리 사유입니다."
    },
    (tx) => operationalCounts(tx)
  );
  const items = buildHomeItems(stats);

  return (
    <AdminShell
      currentPath="/admin"
      eyebrow="운영 대기"
      primaryAction={{
        href: prioritizedAction(items).href,
        label: "긴급 건 처리"
      }}
      title="운영 처리 목록"
      subtitle="운영자가 개입해야 하는 요청을 한 화면에 모았습니다."
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard className="overflow-hidden p-0">
          <div className="grid divide-y divide-line">
            {items.map((item) => (
              <HomeQueueRow item={item} key={item.href} />
            ))}
          </div>
        </AdminCard>

        <AdminDarkPanel
          title="운영 확인"
          description="승인, 환불, 정산처럼 사용자 진행을 멈추는 항목을 먼저 확인하고 처리 사유를 남깁니다."
          className="h-fit lg:sticky lg:top-8"
        >
          <dl className="grid gap-4 border-t border-white/10 pt-6 text-sm leading-7 text-slate-200">
            <div>
              <dt className="font-semibold text-white">우선순위</dt>
              <dd className="mt-1 break-keep">
                자격 심사, 환불, 정산 순서로 운영자가 개입할 화면을 먼저 엽니다.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">처리 방식</dt>
              <dd className="mt-1 break-keep">
                상태 변경은 각 대기열의 상세 화면에서 기록합니다.
              </dd>
            </div>
          </dl>
        </AdminDarkPanel>
      </section>
    </AdminShell>
  );
}

type HomeQueueItem = {
  href: "/admin/qualifications" | "/admin/refunds" | "/admin/payouts";
  label: string;
  title: string;
  description: string;
  owner: string;
  statusLabel: string;
  active: boolean;
};

function HomeQueueRow({ item }: { item: HomeQueueItem }) {
  return (
    <a
      className="group grid gap-4 px-6 py-6 transition hover:bg-surface-sunken md:grid-cols-[minmax(0,1fr)_88px_auto] md:items-start"
      href={item.href}
    >
      <span className="min-w-0">
        <span className="text-sm font-semibold text-ink-400">{item.label}</span>
        <strong className="mt-3 block break-keep text-[32px] font-bold leading-tight text-ink-900">
          {item.title}
        </strong>
        <span className="mt-4 block break-keep text-base leading-8 text-ink-700">
          {item.description}
        </span>
      </span>
      <span className="pt-1 text-base font-bold text-ink-900">{item.owner}</span>
      <span
        className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
          item.active ? "border-[#f3cf85] text-[#cb6f12]" : "border-line text-ink-500"
        }`}
      >
        {item.statusLabel}
      </span>
    </a>
  );
}

function prioritizedAction(items: [HomeQueueItem, ...HomeQueueItem[]]): HomeQueueItem {
  return items.find((item) => item.active) ?? items[0];
}

function buildHomeItems(stats: {
  pendingQualifications: number;
  requestedRefunds: number;
  scheduledPayouts: number;
}): [HomeQueueItem, HomeQueueItem, HomeQueueItem] {
  return [
    {
      href: "/admin/qualifications",
      label: "자격 심사",
      title:
        stats.pendingQualifications > 0
          ? `${stats.pendingQualifications.toLocaleString("ko-KR")}건 자격 심사 대기`
          : "새 자격 심사 없음",
      description:
        stats.pendingQualifications > 0
          ? "임상심리전문가 증빙과 공개 프로필 확인 필요"
          : "지금은 새 슈퍼바이저 자격 요청이 없습니다.",
      owner: "운영자",
      statusLabel: stats.pendingQualifications > 0 ? "심사 필요" : "대기 없음",
      active: stats.pendingQualifications > 0
    },
    {
      href: "/admin/refunds",
      label: "환불",
      title:
        stats.requestedRefunds > 0
          ? `${stats.requestedRefunds.toLocaleString("ko-KR")}건 환불 요청 검토`
          : "새 환불 요청 없음",
      description:
        stats.requestedRefunds > 0
          ? "세션 취소 사유와 결제 시간을 함께 확인"
          : "검토 중인 환불 요청이 없어 다음 대기열로 넘어갈 수 있습니다.",
      owner: "결제",
      statusLabel: stats.requestedRefunds > 0 ? "검토 필요" : "대기 없음",
      active: stats.requestedRefunds > 0
    },
    {
      href: "/admin/payouts",
      label: "정산",
      title:
        stats.scheduledPayouts > 0
          ? `${stats.scheduledPayouts.toLocaleString("ko-KR")}건 지급 확인 대기`
          : "새 지급 확인 없음",
      description:
        stats.scheduledPayouts > 0
          ? "지급 예정 금액과 보류 사유 산출 완료"
          : "이번 배치에서 추가 지급 확인이 필요한 항목이 없습니다.",
      owner: "정산",
      statusLabel: stats.scheduledPayouts > 0 ? "확인 필요" : "대기 없음",
      active: stats.scheduledPayouts > 0
    }
  ];
}

async function operationalCounts(db: StatsDatabase) {
  const result = await db.execute(sql`
    select
      (select count(*)::int from qualifications where status = 'pending') as "pendingQualifications",
      (select count(*)::int from refunds where status = 'requested') as "requestedRefunds",
      (select count(*)::int from payouts where status = 'scheduled') as "scheduledPayouts",
  `);
  return (
    rowsOf<{
      pendingQualifications: number;
      requestedRefunds: number;
      scheduledPayouts: number;
    }>(result)[0] ?? {
      pendingQualifications: 0,
      requestedRefunds: 0,
      scheduledPayouts: 0
    }
  );
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: TRow[] }).rows;
  }
  return [];
}
