import Link from "next/link";
import { supervision, withUserContext } from "@csp/db";
import { EmptyState } from "../../../components/ui/state";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { contextFor } from "../../../lib/supervision/authz";

export const dynamic = "force-dynamic";

type RequestSummary = supervision.SupervisionRequestSummary;

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="의뢰와 받은 자료를 보려면 먼저 로그인하세요."
          action={
            <Link
              className="rounded-lg bg-primary px-md py-2 font-label-md text-label-md text-on-primary"
              href="/login"
            >
              로그인하기
            </Link>
          }
        />
      </main>
    );
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-gutter">
          <Link
            className="font-headline-md text-headline-md font-bold text-primary"
            href="/"
          >
            ClinicFlow
          </Link>
          <nav className="hidden items-center gap-md md:flex">
            <Link
              className="font-label-md text-label-md text-on-surface-variant hover:text-secondary"
              href="/supervisors"
            >
              슈퍼바이저 찾기
            </Link>
            <Link
              className="border-b-2 border-secondary pb-1 font-label-md text-label-md text-secondary"
              href="/requests"
            >
              내 의뢰
            </Link>
            {current.user.role === "supervisor" ? (
              <Link
                className="font-label-md text-label-md text-on-surface-variant hover:text-secondary"
                href="/supervisor"
              >
                슈퍼바이저 업무
              </Link>
            ) : null}
          </nav>
          <Link
            className="rounded-lg bg-primary px-md py-2 font-label-md text-label-md text-on-primary"
            href="/supervisors"
          >
            새 의뢰
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-container-max flex-1 px-margin-mobile py-xl md:px-gutter">
        <section className="mb-xl">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            내 의뢰와 받은 자료
          </h1>
          <p className="mt-base max-w-3xl font-body-md text-body-md text-on-surface-variant">
            내가 슈퍼바이지로 제출한 자료와, 슈퍼바이저로 배정받아 검토해야 할 자료를
            분리해서 확인합니다.
          </p>
        </section>

        <div className="grid gap-lg">
          <RequestSection
            description="내가 슈퍼바이지로서 슈퍼바이저에게 전달한 문서입니다."
            empty="아직 전달한 의뢰가 없습니다."
            items={sent}
            mode="sent"
            title="내가 슈퍼바이지로서 보낸 자료"
          />

          {current.user.role === "supervisor" ? (
            <RequestSection
              description="내가 슈퍼바이저로서 슈퍼바이지로부터 받은 자료입니다."
              empty="아직 배정받은 자료가 없습니다."
              items={received}
              mode="received"
              title="내가 슈퍼바이저로서 받은 자료"
            />
          ) : null}
        </div>
      </main>
    </div>
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
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
      <div className="mb-md flex flex-col gap-xs md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            {description}
          </p>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {items.length.toLocaleString("ko-KR")}건
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface p-md font-body-sm text-body-sm text-on-surface-variant">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-sm">
          {items.map((item) => (
            <li key={`${mode}-${item.id}`}>
              <Link
                className="grid gap-md rounded-lg border border-outline-variant bg-surface p-md transition-colors hover:border-secondary hover:bg-surface-bright md:grid-cols-[1fr_auto]"
                href={targetHref(item, mode) as never}
              >
                <div className="min-w-0">
                  <div className="mb-xs flex flex-wrap items-center gap-sm">
                    <span className="rounded-full bg-surface-container px-2 py-1 font-label-sm text-label-sm text-secondary">
                      {shortRequestId(item.id)}
                    </span>
                    <span className="rounded-full border border-outline-variant px-2 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <h3 className="truncate font-label-md text-label-md text-on-surface">
                    {item.productTitle ?? "슈퍼비전 의뢰"}
                  </h3>
                  <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                    {mode === "received"
                      ? "슈퍼바이지가 제출한 자료를 미리보기에서 확인하고 주석, 피드백, 서명 작업을 진행합니다."
                      : "내가 제출한 자료, 피드백, 최종 확인 문서를 이어서 확인합니다."}
                  </p>
                  <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">
                    예약 일정 · {formatBookingSlot(item)}
                  </p>
                  <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">
                    최근 변경 · {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-sm md:justify-end">
                  <span className="font-label-md text-label-md text-secondary">
                    {actionLabel(item.status, mode)}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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
    return "자료 미리보기";
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
    additional_info_requested: "보완 요청",
    awaiting_payment: "결제 대기",
    awaiting_supervisor_review: "검토 대기",
    cancelled: "취소",
    completed: "완료",
    completion_record_issued: "완료 기록 발급",
    draft: "작성 중",
    expired: "만료",
    feedback_submitted: "피드백 제출",
    in_review: "검토 중",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불",
    rejected: "반려",
    submitted: "제출됨"
  };
  return labels[status] ?? status;
}
