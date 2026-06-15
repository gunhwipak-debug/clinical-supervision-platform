import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import { PrimaryActionPanel, SectionBlock } from "../../../components/clinicflow-shell";
import { LoginRequiredState } from "../../../components/locked-state";
import { Button } from "../../../components/ui/button";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { contextFor } from "../../../lib/supervision/authz";

export const dynamic = "force-dynamic";

type RequestSummary = supervision.SupervisionRequestSummary;

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="내 슈퍼비전 의뢰" returnTo="/requests" />;
  }

  const db = createRuntimeDatabase();
  const requests = await withUserContext(db, contextFor(current), (tx) =>
    supervision.listSupervisionRequests(tx)
  );
  const sent = requests.filter(
    (request) => request.superviseeId === current.session.userId
  );
  const received = requests.filter(
    (request) => request.supervisorId === current.session.userId
  );
  const firstSentRequest = sent[0];

  return (
    <AppShell
      active="requests"
      title="내 슈퍼비전 의뢰"
      subtitle="진행 중인 의뢰와 다음 행동을 한 줄씩 확인합니다."
    >
      <PrimaryActionPanel
        action={
          firstSentRequest ? (
            <Button asChild variant="secondary">
              <Link href={targetHref(firstSentRequest, "sent") as never}>
                첫 의뢰 열기
              </Link>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
          )
        }
        title={
          sent.length > 0
            ? "지금 이어볼 의뢰를 먼저 확인합니다"
            : "첫 의뢰를 시작합니다"
        }
      >
        {sent.length > 0
          ? "추가 자료 요청, 결제, 피드백 도착처럼 지금 해야 할 일이 있는 의뢰를 위에서부터 확인하세요."
          : "슈퍼바이저를 선택하면 세션, 일정, 사례 자료 정리 흐름으로 이어집니다."}
      </PrimaryActionPanel>

      <div className="grid gap-8">
        <RequestSection
          description="내가 신청한 슈퍼비전의 진행 상태입니다."
          empty="아직 신청한 슈퍼비전이 없습니다."
          items={sent}
          mode="sent"
          title="신청한 의뢰"
        />

        {current.user.role === "supervisor" ? (
          <RequestSection
            description="슈퍼바이저로 배정되어 확인해야 하는 의뢰입니다."
            empty="아직 배정받은 의뢰가 없습니다."
            items={received}
            mode="received"
            title="검토할 의뢰"
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function RequestSection({
  description,
  empty,
  items,
  mode,
  title
}: {
  description: string;
  empty: string;
  items: RequestSummary[];
  mode: "received" | "sent";
  title: string;
}) {
  return (
    <SectionBlock
      subtitle={`${description} ${items.length.toLocaleString("ko-KR")}건`}
      title={title}
    >
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface-elevated p-5 text-sm leading-relaxed text-ink-500">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={`${mode}-${item.id}`}>
              <Link
                className="grid gap-4 rounded-xl border border-line bg-surface-elevated p-5 transition-colors hover:border-brand-600 md:grid-cols-[1fr_auto] md:items-center"
                href={targetHref(item, mode) as never}
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">
                      {shortRequestId(item.id)}
                    </span>
                    <span className="rounded-md border border-line px-2 py-1 text-ink-500">
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold text-ink-900">
                    {item.productTitle ?? "슈퍼비전 의뢰"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {mode === "received"
                      ? "사례 자료를 확인하고 수락, 추가 자료 요청, 피드백 정리로 이어갑니다."
                      : "사례 자료, 결제 상태, 피드백과 학습 기록을 이어서 확인합니다."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-ink-500">
                    예약 일정 · {formatBookingSlot(item)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink-500">
                    최근 변경 · {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className="text-sm font-bold text-brand-700">
                    {actionLabel(item.status, mode)}
                  </span>
                  <span className="material-symbols-outlined text-ink-400">
                    chevron_right
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionBlock>
  );
}

function targetHref(item: RequestSummary, mode: "received" | "sent"): string {
  return mode === "received"
    ? `/supervisor/requests/${item.id}`
    : `/requests/${item.id}`;
}

function actionLabel(status: string, mode: "received" | "sent"): string {
  if (mode === "received") {
    if (status === "awaiting_supervisor_review") return "수락 여부 검토";
    if (status === "feedback_submitted") return "서명 및 반환";
    return "의뢰 확인";
  }

  if (status === "feedback_submitted" || status === "completion_record_issued") {
    return "피드백 확인";
  }
  if (status === "draft") return "작성 계속";
  return "진행 상황 확인";
}

function shortRequestId(id: string): string {
  return `의뢰-${id.slice(0, 8)}`;
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBookingSlot(item: RequestSummary): string {
  if (!item.scheduledStart || !item.scheduledEnd) return "선택된 일정 없음";
  const start = new Date(item.scheduledStart);
  const end = new Date(item.scheduledEnd);
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

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청",
    awaiting_payment: "결제 필요",
    awaiting_supervisor_review: "수락 대기",
    cancelled: "취소",
    completed: "완료",
    completion_record_issued: "학습 기록 발급",
    draft: "작성 중",
    expired: "만료",
    feedback_submitted: "피드백 도착",
    in_review: "검토 중",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불",
    rejected: "수락되지 않음",
    submitted: "제출됨"
  };
  return labels[status] ?? status;
}
