import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { ArrowRight, ClipboardList } from "lucide-react";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <AppShell title="의뢰 큐" subtitle="슈퍼바이저 계정으로 로그인해주세요.">
        <EmptyState
          title="로그인이 필요합니다"
          description="의뢰 큐는 슈퍼바이저만 확인할 수 있습니다."
        />
      </AppShell>
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

  return (
    <AppShell
      title="의뢰 큐"
      subtitle="새 의뢰를 열어 자료를 확인하고 수락, 피드백, 완료기록 발급까지 이어갑니다."
    >
      {assigned.length === 0 ? (
        <EmptyState
          title="대기 중인 의뢰가 없습니다"
          description="슈퍼바이지가 결제를 완료하면 검토 대기 의뢰가 이곳에 표시됩니다."
        />
      ) : (
        <div className="grid gap-8">
          <RequestSection
            description="수락, 피드백, 보완 요청, 완료 기록 발급이 가능한 의뢰입니다."
            empty="현재 바로 처리할 의뢰가 없습니다."
            items={actionable}
            title="지금 처리할 의뢰"
          />
          {waiting.length > 0 ? (
            <RequestSection
              description="결제 전이거나 시스템 전환을 기다리는 의뢰입니다. 작업 화면으로 보내지 않습니다."
              empty=""
              items={waiting}
              lockedLabel="작업 전 상태"
              title="예약·결제 대기"
            />
          ) : null}
          {archived.length > 0 ? (
            <RequestSection
              ctaLabel="기록 확인"
              description="완료 기록, 리뷰, 정산 또는 분쟁 대응을 위해 다시 확인할 수 있는 의뢰입니다."
              empty=""
              items={archived}
              title="완료·보관"
            />
          ) : null}
          {closed.length > 0 ? (
            <RequestSection
              ctaLabel="상태 확인"
              description="반려, 취소, 환불, 만료로 닫힌 의뢰입니다."
              empty=""
              items={closed}
              title="닫힌 의뢰"
            />
          ) : null}
        </div>
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
        <Card className="rounded-2xl text-sm text-ink-500">{empty}</Card>
      ) : (
        items.map((request) => (
          <Card className="rounded-2xl" key={request.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <ClipboardList aria-hidden size={22} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(request.status)}>
                      {statusLabel(request.status)}
                    </Badge>
                    <Badge tone="neutral">보관 {String(request.retentionDays)}일</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-bold">
                    {request.productTitle ?? "슈퍼비전 의뢰"}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">
                    식별정보는 표시하지 않습니다. 상세 화면에서 검토 목적 안에서만
                    자료를 열람하세요.
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-700">
                    예약 일정 · {formatBookingSlot(request)}
                  </p>
                </div>
              </div>
              {lockedLabel ? (
                <span className="rounded-xl bg-surface-sunken px-4 py-3 text-sm font-semibold text-ink-500">
                  {lockedLabel}
                </span>
              ) : (
                <Button asChild>
                  <Link href={`/supervisor/requests/${request.id}`}>
                    {ctaLabel}
                    <ArrowRight aria-hidden size={16} />
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        ))
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
    completion_record_issued: "완료기록 발급",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? status;
}

function statusTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "rejected" || status === "cancelled") return "danger";
  if (status === "awaiting_supervisor_review") return "accent";
  if (status === "completed" || status === "completion_record_issued") return "brand";
  return "neutral";
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
