import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../components/locked-state";
import { Button } from "../../../components/ui/button";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { listDemoSuperviseeRequests } from "../../../lib/demo/supervision";
import { isSupervisee } from "../../../lib/auth/guards";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";
import { contextFor } from "../../../lib/supervision/authz";

export const dynamic = "force-dynamic";

type RequestSummary = supervision.SupervisionRequestSummary;
type RequestStatus = RequestSummary["status"];

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="내 슈퍼비전 의뢰" returnTo="/requests" />;
  }
  const currentShellUser = current.user;
  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="내 슈퍼비전 의뢰"
        description="개인 의뢰는 신청자 작업영역에서 확인합니다. 관리자 계정은 운영 콘솔에서 의뢰 상태를 확인해주세요."
        actionHref="/admin"
        actionLabel="운영 콘솔로 이동"
      />
    );
  }

  let requests: RequestSummary[];
  let requestsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    requests = await withUserContext(db, contextFor(current), (tx) =>
      supervision.listSupervisionRequests(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[supervisee.requests.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    requests = listDemoSuperviseeRequests(current.session.userId);
    requestsUnavailable = requests.length === 0;
  }
  const sent = requests.filter(
    (request) => request.superviseeId === current.session.userId
  );

  return (
    <AppShell
      action={
        <Button asChild>
          <Link href="/requests/new">새 의뢰 시작</Link>
        </Button>
      }
      active="requests"
      currentUser={currentShellUser}
      title="내 슈퍼비전 의뢰"
      subtitle="진행 중인 의뢰와 이어서 할 일을 한 줄씩 확인합니다."
    >
      <RequestWorkbench items={sent} unavailable={requestsUnavailable} />
    </AppShell>
  );
}

function RequestWorkbench({
  items,
  unavailable
}: {
  items: RequestSummary[];
  unavailable: boolean;
}) {
  const groups = requestStatusGroups.map((group) => ({
    ...group,
    count: items.filter((item) => includesStatus(group.statuses, item.status)).length
  }));

  return (
    <section className="grid gap-4">
      <div
        aria-label="의뢰 상태별 현황"
        className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-elevated p-2"
      >
        {groups.map((group) => (
          <div
            className="inline-flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2"
            key={group.label}
          >
            <p className="text-xs font-bold text-ink-500">{group.label}</p>
            <p className="text-sm font-bold text-ink-900">
              {group.count.toLocaleString("ko-KR")}건
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-2xl font-bold text-ink-900">의뢰 목록</h2>
          <span className="rounded-md bg-surface-sunken px-3 py-1 text-sm font-bold text-ink-500">
            {unavailable
              ? "데이터 연결 대기"
              : `${items.length.toLocaleString("ko-KR")}건`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-sunken text-xs font-bold text-ink-500">
              <tr>
                <th className="px-5 py-3">의뢰</th>
                <th className="px-5 py-3">제목</th>
                <th className="px-5 py-3">슈퍼바이저</th>
                <th className="px-5 py-3">상태</th>
                <th className="px-5 py-3">일정/결제</th>
                <th className="px-5 py-3 text-right">이어 할 일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.length === 0 ? (
                <tr>
                  <td className="px-5 py-5 font-semibold text-ink-500" colSpan={6}>
                    {unavailable
                      ? "의뢰 데이터를 표시할 수 없습니다."
                      : "아직 신청한 슈퍼비전이 없습니다."}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr className="align-middle" key={item.id}>
                    <td className="px-5 py-4 font-bold text-brand-700">
                      {shortRequestId(item.id)}
                    </td>
                    <td className="min-w-64 px-5 py-4">
                      <p className="font-bold text-ink-900">
                        {item.productTitle ?? "슈퍼비전 의뢰"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-ink-500">
                        최근 변경 · {formatDate(item.updatedAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink-700">
                      {item.supervisorDisplayName ?? "슈퍼바이저 미선택"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap rounded-md bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                        {statusLabel(item.status)}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-ink-500">
                        {statusGroupLabel(item.status)}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-ink-600">
                      {scheduleOrPaymentSignal(item)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        asChild
                        className="whitespace-nowrap"
                        size="sm"
                        variant="secondary"
                      >
                        <Link href={`/requests/${item.id}` as never}>
                          {actionLabel(item.status)}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const requestStatusGroups = [
  {
    label: "진행 중",
    statuses: ["draft", "submitted", "paid", "accepted", "meeting_scheduled"]
  },
  {
    label: "결제 필요",
    statuses: ["awaiting_payment"]
  },
  {
    label: "검토 중",
    statuses: ["awaiting_supervisor_review", "in_review", "meeting_completed"]
  },
  {
    label: "보완 요청",
    statuses: ["additional_info_requested"]
  },
  {
    label: "완료",
    statuses: [
      "feedback_submitted",
      "completion_record_issued",
      "completed",
      "rejected",
      "cancelled",
      "refunded",
      "expired",
      "deleted"
    ]
  }
] as const satisfies readonly {
  label: string;
  statuses: readonly RequestStatus[];
}[];

function actionLabel(status: RequestStatus): string {
  if (status === "awaiting_payment") return "결제하기";
  if (status === "additional_info_requested") return "자료 보완";
  if (status === "feedback_submitted" || status === "completion_record_issued") {
    return "피드백 확인";
  }
  if (status === "completed") return "기록 열기";
  if (status === "draft" || status === "submitted") return "자료 작성";
  return "진행 상황 확인";
}

function statusGroupLabel(status: RequestStatus): string {
  const group = requestStatusGroups.find((item) =>
    includesStatus(item.statuses, status)
  );
  return group?.label ?? "기타";
}

function includesStatus(
  statuses: readonly RequestStatus[],
  status: RequestStatus
): boolean {
  return statuses.includes(status);
}

function shortRequestId(id: string): string {
  return `REQ-${id.slice(-4).toUpperCase()}`;
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
    timeStyle: "short"
  }).format(new Date(value));
}

function scheduleOrPaymentSignal(item: RequestSummary): string {
  if (item.status === "awaiting_payment") return "결제 필요";
  if (item.status === "paid") return "결제 완료";
  if (item.scheduledStart && item.scheduledEnd) {
    return formatBookingSlot(item);
  }
  if (item.status === "draft" || item.status === "submitted") return "일정 미선택";
  return "일정 없음";
}

function formatBookingSlot(item: RequestSummary): string {
  if (!item.scheduledStart || !item.scheduledEnd) return "일정 미선택";
  const start = new Date(item.scheduledStart);
  const end = new Date(item.scheduledEnd);
  const date = new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
    weekday: "short"
  }).format(start);
  const time = new Intl.DateTimeFormat("ko-KR", {
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}

function statusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청",
    awaiting_payment: "결제 필요",
    awaiting_supervisor_review: "수락 대기",
    cancelled: "취소",
    completed: "완료",
    completion_record_issued: "학습 기록 발급",
    draft: "작성 중",
    expired: "만료",
    deleted: "삭제됨",
    feedback_submitted: "피드백 도착",
    in_review: "검토 중",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불",
    rejected: "수락되지 않음",
    submitted: "제출됨"
  };
  return labels[status];
}
