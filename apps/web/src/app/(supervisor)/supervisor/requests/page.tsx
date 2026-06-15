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

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="검토할 의뢰" returnTo="/supervisor/requests" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        title="검토할 의뢰"
        description="검토할 의뢰는 슈퍼바이저 계정에서만 확인합니다."
      />
    );
  }

  const requests = await withUserContext(
    createRuntimeDatabase(),
    { userId: current.session.userId, role: current.session.role },
    (tx) => supervision.listSupervisionRequests(tx)
  );
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
      subtitle="새 의뢰를 열어 자료를 확인하고 수락, 피드백, 학습 기록 발급까지 이어갑니다."
    >
      {assigned.length === 0 ? (
        <EmptyState
          title="대기 중인 의뢰가 없습니다"
          description="신청자가 결제를 완료하면 검토 대기 의뢰가 이곳에 표시됩니다."
        />
      ) : (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-8">
            <RequestSection
              description="수락, 피드백, 추가 자료 요청, 학습 기록 발급처럼 지금 바로 이어갈 요청입니다."
              empty="현재 바로 처리할 의뢰가 없습니다."
              items={actionable}
              title="지금 이어갈 요청"
            />
            {waiting.length > 0 ? (
              <RequestSection
                description="결제 전이거나 시스템 전환을 기다리는 요청입니다. 검토 작업 화면으로 바로 보내지 않습니다."
                empty=""
                items={waiting}
                lockedLabel="작업 전 상태"
                title="예약·결제 대기"
              />
            ) : null}
            {archived.length > 0 ? (
              <RequestSection
                ctaLabel="기록 확인"
                description="완료 기록, 학습 기록, 보관 일정을 다시 확인할 때 여는 요청입니다."
                empty=""
                items={archived}
                title="완료·보관"
              />
            ) : null}
            {closed.length > 0 ? (
              <RequestSection
                ctaLabel="상태 확인"
                description="반려, 취소, 환불, 만료로 닫힌 요청입니다."
                empty=""
                items={closed}
                title="닫힌 요청"
              />
            ) : null}
          </div>

          <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
            <p className="text-sm font-bold text-brand-700">검토 요약</p>
            <h2 className="mt-2 text-xl font-bold text-ink-900">
              한 번에 한 요청씩 처리합니다
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              먼저 이어갈 요청을 열고, 나머지는 상태별로만 분리해 보관합니다.
            </p>
            <div className="mt-5 grid divide-y divide-line text-sm">
              <SummaryLine
                label="지금 이어갈 요청"
                value={`${String(actionable.length)}건`}
              />
              <SummaryLine
                label="예약·결제 대기"
                value={`${String(waiting.length)}건`}
              />
              <SummaryLine label="완료·보관" value={`${String(archived.length)}건`} />
              <SummaryLine label="닫힌 요청" value={`${String(closed.length)}건`} />
            </div>
            <div className="mt-5 grid gap-3">
              <Button asChild variant="secondary">
                <Link href="/supervisor/memory">학습 기록 보기</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/supervisor">업무 홈으로 돌아가기</Link>
              </Button>
            </div>
          </aside>
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
  lockedLabel = null,
  title
}: {
  ctaLabel?: string;
  description: string;
  empty: string;
  items: RequestItem[];
  lockedLabel?: string | null;
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
              className="grid gap-4 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={request.id}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-700">
                  {requestLineTitle(request.status)}
                </p>
                <h3 className="mt-2 text-xl font-bold text-ink-900">
                  {shortRequestId(request.id)} ·{" "}
                  {request.productTitle ?? "슈퍼비전 의뢰"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {requestLineDescription(request.status)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-ink-500">
                  <span className="rounded-full bg-surface-sunken px-3 py-2">
                    {statusLabel(request.status)}
                  </span>
                  <span className="rounded-full bg-surface-sunken px-3 py-2">
                    보관 {String(request.retentionDays)}일
                  </span>
                  <span className="rounded-full bg-surface-sunken px-3 py-2">
                    {formatBookingSlot(request)}
                  </span>
                </div>
              </div>
              {lockedLabel ? (
                <span className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-500">
                  {lockedLabel}
                </span>
              ) : (
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/supervisor/requests/${request.id}`}>{ctaLabel}</Link>
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
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
  return labels[status] ?? status;
}

function requestLineTitle(status: string): string {
  if (status === "additional_info_requested") return "새 자료 도착";
  if (status === "awaiting_supervisor_review") return "수락 판단 필요";
  if (status === "accepted" || status === "in_review") return "피드백 작성 중";
  if (status === "feedback_submitted") return "피드백 제출 후 확인";
  if (status === "completion_record_issued" || status === "completed") {
    return "기록 보관";
  }
  if (status === "draft" || status === "submitted") return "작업 전 상태";
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
    return "아직 검토 작업을 시작하지 않는 상태입니다.";
  }
  if (status === "awaiting_payment" || status === "paid") {
    return "결제와 시스템 전환 상태를 기다리는 중입니다.";
  }
  return "요청 상태를 확인하세요.";
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
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}
