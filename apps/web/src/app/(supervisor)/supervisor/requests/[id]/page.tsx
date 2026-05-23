import Link from "next/link";
import { files, supervision, withUserContext } from "@csp/db";
import { History } from "lucide-react";
import { CaseFilesPanel } from "../../../../../components/case-files-panel";
import { EmptyState } from "../../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../../lib/auth/database";
import { getCurrentUser } from "../../../../../lib/auth/current-user";
import { RequestWorkflow } from "./request-workflow";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  const { id } = await params;

  if (!current || current.user.role !== "supervisor") {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="의뢰 검토는 배정된 슈퍼바이저만 사용할 수 있습니다."
        />
      </main>
    );
  }

  const db = createRuntimeDatabase();
  const detail = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role, phiAccess: true },
    (tx) => supervision.getSupervisionRequestDetails(tx, id, { includePhi: true })
  );

  if (!detail || detail.supervisorId !== current.session.userId) {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="의뢰가 없습니다"
          description="의뢰 큐로 돌아가 다시 선택해주세요."
        />
      </main>
    );
  }

  const caseFiles = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) => files.listCaseFilesForRequest(tx, id)
  );
  const latestReviewCycle = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role, phiAccess: true },
    (tx) => files.latestDocumentReviewCycle(tx, id)
  );

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest dark:border-outline dark:bg-primary-container">
        <div className="mx-auto flex h-16 w-full max-w-container-max items-center justify-between px-lg">
          <div className="flex items-center gap-md">
            <Link
              className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed"
              href="/supervisor"
            >
              ClinicFlow
            </Link>
          </div>
          <div className="flex items-center gap-md text-on-surface-variant dark:text-surface-variant">
            <Link
              className="ml-2 grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-high"
              href="/supervisor/profile"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                person
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-40 border-b border-outline-variant bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-container-max flex-col items-start justify-between gap-sm px-gutter py-sm sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-sm">
            <Link
              className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface"
              href="/supervisor/requests"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              목록으로
            </Link>
            <div className="mx-2 h-4 w-px bg-outline-variant" />
            <h1 className="m-0 font-headline-md text-headline-md text-on-surface">
              {shortRequestId(detail.id)}
            </h1>
            <span className="ml-2 rounded-full border border-outline-variant bg-surface-container-high px-2 py-1 font-label-sm text-label-sm text-on-surface">
              {statusLabel(detail.status)}
            </span>
          </div>
          <RequestWorkflow
            compact
            latestReviewStatus={latestReviewCycle?.status ?? null}
            bookingStatus={detail.bookingStatus}
            meetingUrl={detail.meetingUrl}
            needsCompletionRecord={detail.needsCompletionRecord}
            requestId={id}
            scheduledEnd={detail.scheduledEnd}
            scheduledStart={detail.scheduledStart}
            serviceProductSupervisionType={detail.serviceProductSupervisionType}
            status={detail.status}
          />
        </div>
      </div>

      <main className="mx-auto grid max-w-container-max grid-cols-1 items-start gap-gutter px-gutter py-lg lg:grid-cols-12">
        <aside className="col-span-1 flex flex-col gap-gutter lg:col-span-3">
          <div className="relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="relative z-10 flex items-center gap-xs border-b border-outline-variant bg-surface-container px-md py-sm">
              <span className="material-symbols-outlined icon-filled text-[18px] text-secondary">
                shield_locked
              </span>
              <span className="font-label-md text-label-md text-secondary">
                보안 영역: 검토 목적 내 조회
              </span>
            </div>
            <div className="pattern-bg relative z-0 flex flex-col gap-md p-md">
              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest/90 p-sm backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-sm">
                  <Info label="의뢰 번호" value={shortRequestId(detail.id)} />
                  <Info label="상태" value={statusLabel(detail.status)} />
                  <Info
                    label="상품"
                    value={detail.productTitle ?? "슈퍼비전 의뢰"}
                    wide
                  />
                  <Info label="예약 일정" value={formatBookingSlot(detail)} wide />
                  <Info
                    label="예약 상태"
                    value={bookingStatusLabel(detail.bookingStatus)}
                    wide
                  />
                  <Info
                    label="화상 세션"
                    value={detail.meetingUrl ? "입장 링크 동기화됨" : "링크 대기"}
                    wide
                  />
                  <Info
                    label="의뢰 제목"
                    value={detail.title ?? "저장된 제목이 없습니다."}
                    wide
                  />
                  <Info
                    label="주호소"
                    value={detail.chiefComplaint ?? "저장된 주호소가 없습니다."}
                    wide
                  />
                  <Info
                    label="의뢰 사유"
                    value={detail.referralReason ?? "저장된 의뢰 사유가 없습니다."}
                    wide
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm">
            <h3 className="mb-md flex items-center gap-xs font-label-md text-label-md text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                folder_open
              </span>
              사례 패킷 (첨부파일)
            </h3>
            <ul className="flex flex-col gap-sm">
              {caseFiles.length === 0 ? (
                <li className="rounded-lg border border-outline-variant p-sm font-label-sm text-label-sm text-on-surface-variant">
                  첨부파일이 없습니다.
                </li>
              ) : (
                caseFiles.map((file) => (
                  <li
                    className="flex items-center justify-between rounded-lg border border-outline-variant p-sm"
                    key={file.id}
                  >
                    <div className="flex min-w-0 items-center gap-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-high text-on-surface">
                        <span className="material-symbols-outlined text-[16px]">
                          {file.mimeType.includes("pdf")
                            ? "picture_as_pdf"
                            : "description"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-label-sm text-label-sm text-on-surface">
                          {file.originalFilename}
                        </span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>

        <section className="col-span-1 flex min-h-[600px] flex-col lg:col-span-6">
          <CaseFilesPanel
            canAnnotate={detail.status === "accepted" || detail.status === "in_review"}
            canDelete={false}
            canRequestRevision={
              detail.status === "in_review" || detail.status === "feedback_submitted"
            }
            canStampReturn={detail.status === "completion_record_issued"}
            canUpload={false}
            initialFiles={caseFiles.map((file) => ({
              id: file.id,
              kind: file.kind,
              originalFilename: file.originalFilename,
              mimeType: file.mimeType,
              sizeBytes: file.sizeBytes,
              virusScanStatus: file.virusScanStatus,
              phiScanStatus: file.phiScanStatus,
              uploadedAt: file.uploadedAt
            }))}
            requestId={id}
          />
        </section>

        <aside className="col-span-1 space-y-gutter lg:col-span-3">
          <div id="supervisor-actions">
            <RequestWorkflow
              latestReviewStatus={latestReviewCycle?.status ?? null}
              bookingStatus={detail.bookingStatus}
              meetingUrl={detail.meetingUrl}
              needsCompletionRecord={detail.needsCompletionRecord}
              requestId={id}
              scheduledEnd={detail.scheduledEnd}
              scheduledStart={detail.scheduledStart}
              serviceProductSupervisionType={detail.serviceProductSupervisionType}
              status={detail.status}
            />
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm">
            <h3 className="mb-md flex items-center gap-xs font-label-md text-label-md text-on-surface">
              <History aria-hidden className="text-on-surface-variant" size={18} />
              검토 이력
            </h3>
            <div className="relative ml-2 space-y-lg border-l border-outline-variant pl-4">
              <HistoryItem
                label="현재 상태"
                primary={statusLabel(detail.status)}
                secondary={`${formatDate(detail.updatedAt)} - 시스템`}
              />
              <HistoryItem
                label="이전 상태"
                primary="의뢰 생성"
                secondary={`${formatDate(detail.createdAt)} - 시스템`}
                muted
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Info({
  label,
  value,
  wide = false
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col ${wide ? "col-span-2" : ""}`}>
      <span className="mb-xs font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>
      <span className="whitespace-pre-wrap font-body-sm text-body-sm font-medium text-on-surface">
        {value}
      </span>
    </div>
  );
}

function HistoryItem({
  label,
  muted = false,
  primary,
  secondary
}: {
  label: string;
  muted?: boolean;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface-container-lowest ${
          muted
            ? "border border-outline-variant bg-surface-container-high"
            : "bg-secondary"
        }`}
      />
      <div className="flex flex-col gap-xs">
        <span
          className={`font-label-sm text-label-sm ${
            muted ? "text-on-surface-variant" : "text-secondary"
          }`}
        >
          {label}
        </span>
        <span className="font-body-sm text-body-sm font-medium text-on-surface">
          {primary}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {secondary}
        </span>
      </div>
    </div>
  );
}

function shortRequestId(id: string): string {
  return `의뢰-${id.slice(0, 8)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)}B`;
  if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(value: Date | string | null): string {
  if (!value) return "일시 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBookingSlot(request: supervision.SupervisionRequestDetails): string {
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

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    awaiting_supervisor_review: "검토 대기",
    accepted: "수락됨",
    awaiting_payment: "결제 대기",
    in_review: "검토 중",
    paid: "결제 완료",
    feedback_submitted: "피드백 완료",
    additional_info_requested: "보완 요청",
    completion_record_issued: "완료기록 발급",
    completed: "완료",
    draft: "작성 중",
    expired: "만료",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    rejected: "반려",
    refunded: "환불",
    submitted: "제출됨",
    cancelled: "취소"
  };
  return labels[status] ?? status;
}

function bookingStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    cancelled: "취소됨",
    completed: "세션 완료",
    no_show_supervisee: "슈퍼바이지 불참",
    no_show_supervisor: "슈퍼바이저 불참",
    rescheduled: "일정 변경됨",
    scheduled: "예약됨"
  };
  return labels[status ?? ""] ?? "예약 상태 확인 필요";
}
