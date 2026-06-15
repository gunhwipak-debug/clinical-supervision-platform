import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import { PrimaryActionPanel, SectionBlock } from "../../../components/clinicflow-shell";
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
  const firstSentRequest = sent[0];

  return (
    <AppShell
      active="requests"
      currentUser={currentShellUser}
      title="내 슈퍼비전 의뢰"
      subtitle="진행 중인 의뢰와 다음 행동을 한 줄씩 확인합니다."
    >
      <PrimaryActionPanel
        action={
          requestsUnavailable ? undefined : firstSentRequest ? (
            <Button asChild variant="secondary">
              <Link href={`/requests/${firstSentRequest.id}` as never}>
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
          requestsUnavailable
            ? "현재 의뢰 목록을 불러오지 못했습니다"
            : sent.length > 0
              ? "지금 이어볼 의뢰를 먼저 확인합니다"
              : "첫 의뢰를 시작합니다"
        }
      >
        {requestsUnavailable
          ? "연결이 복구되면 진행 중인 의뢰, 추가 자료 요청, 결제 상태가 이 목록에 다시 표시됩니다."
          : sent.length > 0
            ? "추가 자료 요청, 결제, 피드백 도착처럼 지금 해야 할 일이 있는 의뢰를 위에서부터 확인하세요."
            : "슈퍼바이저를 선택하면 세션, 일정, 사례 자료 정리 흐름으로 이어집니다."}
      </PrimaryActionPanel>

      <RequestSection
        description="내가 신청한 슈퍼비전의 진행 상태입니다."
        empty={
          requestsUnavailable
            ? "현재 의뢰 목록을 불러오지 못했습니다. 신청이 연결되면 진행 상태와 다음 행동이 이곳에 표시됩니다."
            : "아직 신청한 슈퍼비전이 없습니다."
        }
        unavailable={requestsUnavailable}
        items={sent}
        title="신청한 의뢰"
      />
    </AppShell>
  );
}

function RequestSection({
  description,
  empty,
  items,
  title,
  unavailable = false
}: {
  description: string;
  empty: string;
  items: RequestSummary[];
  title: string;
  unavailable?: boolean;
}) {
  return (
    <SectionBlock
      subtitle={
        unavailable
          ? `${description} 현재 목록 확인 필요`
          : `${description} ${items.length.toLocaleString("ko-KR")}건`
      }
      title={title}
    >
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface-elevated p-5 text-sm leading-relaxed text-ink-500">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                className="grid gap-4 rounded-xl border border-line bg-surface-elevated p-5 transition-colors hover:border-brand-600 md:grid-cols-[1fr_auto] md:items-center"
                href={`/requests/${item.id}` as never}
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
                    사례 자료, 결제 상태, 피드백과 학습 기록을 이어서 확인합니다.
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
                    {actionLabel(item.status)}
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

function actionLabel(status: string): string {
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
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
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
    hourCycle: "h23",
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
  return labels[status] ?? "상태 확인 필요";
}
