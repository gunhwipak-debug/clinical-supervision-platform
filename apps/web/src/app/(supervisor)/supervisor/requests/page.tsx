import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { listDemoSupervisorRequests } from "../../../../lib/demo/supervision";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="검토할 의뢰" returnTo="/supervisor/requests" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="검토할 의뢰"
        description="검토할 의뢰는 슈퍼바이저 계정에서만 확인합니다."
      />
    );
  }

  let requests: RequestItem[];
  let requestsUnavailable = false;
  try {
    requests = await withUserContext(
      createRuntimeDatabase(),
      { userId: current.session.userId, role: current.session.role },
      (tx) => supervision.listSupervisionRequests(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    requests = listDemoSupervisorRequests(current.session.userId);
    requestsUnavailable = requests.length === 0;
  }
  const assigned = requests.filter(
    (request) => request.supervisorId === current.session.userId
  );
  const actionable = assigned.filter((request) =>
    isSupervisorActionable(request.status)
  );
  const waiting = assigned.filter((request) => isSupervisorWaiting(request.status));
  const archived = assigned.filter((request) => isSupervisorArchive(request.status));
  const closed = assigned.filter((request) => isSupervisorClosed(request.status));
  const nextRequest = actionable[0] ?? archived[0] ?? waiting[0] ?? null;

  return (
    <AppShell
      active="supervisor-requests"
      currentUser={current.user}
      action={
        <Button asChild>
          <Link
            href={
              nextRequest
                ? (`/supervisor/requests/${nextRequest.id}` as never)
                : "/supervisor/memory"
            }
          >
            {nextRequest ? "첫 요청 열기" : "기록 폴더 보기"}
          </Link>
        </Button>
      }
      title="검토할 의뢰"
      subtitle="자료 확인, 수락, 피드백 작성이 필요한 의뢰를 확인합니다."
    >
      {assigned.length === 0 ? (
        <EmptyState
          title={
            requestsUnavailable
              ? "현재 검토할 의뢰를 불러오지 못했습니다"
              : "대기 중인 의뢰가 없습니다"
          }
          description={
            requestsUnavailable
              ? "연결이 복구되면 수락 대기, 추가 자료 도착, 피드백 작성 중인 의뢰가 이곳에 표시됩니다."
              : "신청자가 결제를 완료하면 검토 대기 의뢰가 이곳에 표시됩니다."
          }
        />
      ) : (
        <section className="grid gap-8">
          <RequestSection
            description={`${String(actionable.length)}건`}
            empty="현재 바로 처리할 의뢰가 없습니다."
            items={actionable}
            title="지금 이어갈 요청"
          />
          {waiting.length > 0 ? (
            <RequestSection
              description={`${String(waiting.length)}건`}
              empty=""
              items={waiting}
              title="예약·결제 대기"
            />
          ) : null}
          {archived.length > 0 ? (
            <RequestSection
              ctaLabel="기록 확인"
              description={`${String(archived.length)}건`}
              empty=""
              items={archived}
              title="완료·보관"
            />
          ) : null}
          {closed.length > 0 ? (
            <RequestSection
              ctaLabel="상태 확인"
              description={`${String(closed.length)}건`}
              empty=""
              items={closed}
              title="닫힌 요청"
            />
          ) : null}
        </section>
      )}
    </AppShell>
  );
}

type RequestItem = Awaited<
  ReturnType<typeof supervision.listSupervisionRequests>
>[number];

function RequestSection({
  ctaLabel = "상세 검토",
  description,
  empty,
  items,
  title
}: {
  ctaLabel?: string;
  description: string;
  empty: string;
  items: RequestItem[];
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm text-ink-500">{description}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-elevated px-5 py-6 text-sm text-ink-500">
          {empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
          {items.map((request) => (
            <article
              className="grid gap-4 border-b border-line px-5 py-5 last:border-b-0 lg:grid-cols-[140px_minmax(0,1fr)_112px] lg:items-center"
              key={request.id}
            >
              <div>
                <p className="text-xs font-bold text-brand-700">
                  {requestLineTitle(request.status)}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-700">
                  {statusLabel(request.status)}
                </p>
              </div>
              <div className="min-w-0">
                <h3 className="break-keep text-lg font-bold text-ink-900">
                  {shortRequestId(request.id)} ·{" "}
                  {request.productTitle ?? "슈퍼비전 의뢰"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {requestLineDescription(request.status)}
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-700">
                  <div className="flex gap-2">
                    <dt className="font-semibold text-ink-400">일정</dt>
                    <dd className="font-semibold">{formatBookingSlot(request)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold text-ink-400">보관</dt>
                    <dd className="font-semibold">{String(request.retentionDays)}일</dd>
                  </div>
                </dl>
              </div>
              <Button
                asChild
                className="lg:justify-self-end"
                size="sm"
                variant="secondary"
              >
                <Link href={`/supervisor/requests/${request.id}`}>
                  {requestActionLabel(request.status, ctaLabel)}
                </Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function isSupervisorActionable(status: string): boolean {
  return [
    "awaiting_supervisor_review",
    "accepted",
    "in_review",
    "feedback_submitted",
    "additional_info_requested"
  ].includes(status);
}

function isSupervisorWaiting(status: string): boolean {
  return ["draft", "submitted", "awaiting_payment", "paid"].includes(status);
}

function isSupervisorArchive(status: string): boolean {
  return ["completion_record_issued", "completed"].includes(status);
}

function isSupervisorClosed(status: string): boolean {
  return ["rejected", "cancelled", "refunded", "expired"].includes(status);
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "작성 중",
    submitted: "제출됨",
    awaiting_payment: "결제 대기",
    paid: "결제 완료",
    awaiting_supervisor_review: "검토 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 완료",
    completion_record_issued: "학습 기록 발급",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? "상태 미분류";
}

function requestLineTitle(status: string): string {
  if (status === "additional_info_requested") return "새 자료 도착";
  if (status === "awaiting_supervisor_review") return "수락 판단 필요";
  if (status === "accepted" || status === "in_review") return "피드백 작성 중";
  if (status === "feedback_submitted") return "피드백 제출 후 확인";
  if (status === "completion_record_issued" || status === "completed") {
    return "기록 보관";
  }
  if (status === "draft" || status === "submitted") return "작성 대기";
  if (status === "awaiting_payment" || status === "paid") return "결제 상태 확인";
  return "상태 확인";
}

function requestLineDescription(status: string): string {
  if (status === "additional_info_requested") {
    return "보완 자료가 도착했습니다. 새 자료를 확인한 뒤 피드백 초안을 이어갑니다.";
  }
  if (status === "awaiting_supervisor_review") {
    return "의뢰 범위와 자료 충분성을 보고 수락 여부를 결정합니다.";
  }
  if (status === "accepted" || status === "in_review") {
    return "식별정보 없이 사례 요약과 첨부 자료를 읽고 핵심 피드백을 정리합니다.";
  }
  if (status === "feedback_submitted") {
    return "제출한 피드백과 학습 기록 발급 필요 여부를 다시 확인합니다.";
  }
  if (status === "completion_record_issued" || status === "completed") {
    return "완료 기록과 보관 기간을 다시 확인할 수 있습니다.";
  }
  if (status === "draft" || status === "submitted") {
    return "신청자가 세션과 자료를 정리하는 중입니다.";
  }
  if (status === "awaiting_payment" || status === "paid") {
    return "결제 완료와 수락 대기 전환을 확인합니다.";
  }
  return "요청 상태를 확인하세요.";
}

function requestActionLabel(status: string, fallback: string): string {
  if (status === "awaiting_supervisor_review") return "수락 판단";
  if (status === "accepted" || status === "in_review") return "피드백 작성";
  if (status === "feedback_submitted") return "기록 확인";
  if (status === "completion_record_issued" || status === "completed") {
    return "기록 확인";
  }
  if (status === "draft" || status === "submitted") return "상세 검토";
  if (status === "awaiting_payment" || status === "paid") return "상태 확인";
  return fallback;
}

function shortRequestId(id: string): string {
  return `REQ-${id.slice(0, 4).toUpperCase()}`;
}

function formatBookingSlot(request: RequestItem): string {
  if (!request.scheduledStart || !request.scheduledEnd) return "선택된 일정 없음";
  const start = new Date(request.scheduledStart);
  const end = new Date(request.scheduledEnd);
  const date = new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
    weekday: "short",
    year: "numeric"
  }).format(start);
  const time = new Intl.DateTimeFormat("ko-KR", {
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}
