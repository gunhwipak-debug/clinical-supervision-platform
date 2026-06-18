import Link from "next/link";
import type { ReactNode } from "react";
import { files, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../../components/app-shell";
import { CaseFilesPanel } from "../../../../../components/case-files-panel";
import {
  FlowStepNav,
  SectionBlock,
  WorkbenchStatusBar
} from "../../../../../components/clinicflow-shell";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { EmptyState } from "../../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../../lib/auth/database";
import { getCurrentUser } from "../../../../../lib/auth/current-user";
import {
  getDemoSupervisionRequestDetails,
  isDemoUserId,
  listDemoCaseFilesForRequest
} from "../../../../../lib/demo/supervision";
import { isMissingDatabaseRelation } from "../../../../../lib/db/missing-relation";
import { RequestWorkflow } from "./request-workflow";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  const { id } = await params;

  if (!current) {
    return (
      <LoginRequiredState
        title="슈퍼바이저 검토"
        returnTo={`/supervisor/requests/${id}`}
      />
    );
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="슈퍼바이저 검토"
        description="이 검토 화면은 담당 슈퍼바이저 계정에서만 확인합니다."
      />
    );
  }

  const db = createRuntimeDatabase();
  let detail: supervision.SupervisionRequestDetails | null;
  let detailUnavailable = false;
  try {
    detail = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role, phiAccess: true },
      (tx) => supervision.getSupervisionRequestDetails(tx, id, { includePhi: true })
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error) && !isDemoUserId(current.session.userId)) {
      throw error;
    }

    detail = getDemoSupervisionRequestDetails(id);
    detailUnavailable = !detail;
  }
  detail ??= getDemoSupervisionRequestDetails(id);

  if (!detail || detail.supervisorId !== current.session.userId) {
    return (
      <AppShell
        active="supervisor-requests"
        currentUser={current.user}
        action={
          <Button asChild variant="secondary">
            <Link href="/supervisor/requests">검토할 의뢰</Link>
          </Button>
        }
        title={
          detailUnavailable
            ? "검토할 의뢰를 불러오지 못했습니다"
            : "의뢰를 찾지 못했습니다"
        }
      >
        <EmptyState
          title={
            detailUnavailable
              ? "현재 의뢰 정보를 확인할 수 없습니다"
              : "의뢰가 없습니다"
          }
          description={
            detailUnavailable
              ? "연결이 복구되면 사례 자료, 검토 작업, 피드백 작성 흐름이 다시 표시됩니다."
              : "검토할 의뢰 목록으로 돌아가 다시 선택해주세요."
          }
        />
      </AppShell>
    );
  }

  let caseFiles: Awaited<ReturnType<typeof files.listCaseFilesForRequest>>;
  try {
    caseFiles = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => files.listCaseFilesForRequest(tx, id)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    caseFiles = listDemoCaseFilesForRequest(id);
  }
  if (caseFiles.length === 0 && getDemoSupervisionRequestDetails(id)) {
    caseFiles = listDemoCaseFilesForRequest(id);
  }
  let latestReviewCycle: Awaited<ReturnType<typeof files.latestDocumentReviewCycle>>;
  try {
    latestReviewCycle = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => files.latestDocumentReviewCycle(tx, id)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    latestReviewCycle = null;
  }

  const primaryAction = primarySupervisorAction(detail.status);

  return (
    <AppShell
      active="supervisor-requests"
      currentUser={current.user}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge tone={statusBadgeTone(detail.status)}>
            {statusLabel(detail.status)}
          </Badge>
          <Button asChild>
            <a href={primaryAction.href}>{primaryAction.label}</a>
          </Button>
        </div>
      }
      contentWidth="wide"
      subtitle={`${detail.title ?? shortRequestId(detail.id)} · ${formatBookingSlot(detail)}`}
      title={workspaceTitle(detail.productTitle)}
    >
      <FlowStepNav current={flowStepForStatus(detail.status)} steps={supervisorSteps} />

      <WorkbenchStatusBar
        action={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <Button asChild size="sm" variant="secondary">
              <Link href="/supervisor/requests">검토 목록</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/supervisor/memory">학습 기록 보기</Link>
            </Button>
          </div>
        }
        items={[
          { label: "의뢰번호", value: shortRequestId(detail.id) },
          { label: "상태", value: statusLabel(detail.status) },
          { label: "자료 제출", value: `${String(caseFiles.length)}건` },
          { label: "세션", value: detail.productTitle ?? "슈퍼비전" },
          { label: "최근 변경", value: formatDate(detail.updatedAt) },
          { label: "의뢰 생성", value: formatDate(detail.createdAt) }
        ]}
      />

      <section className="grid gap-7">
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:items-start">
          <SectionBlock
            subtitle="보고서, 검사 결과, 면담 요약을 한 화면에서 확인하고 필요한 위치에 메모를 남깁니다."
            title={`첨부 자료 ${String(caseFiles.length)}개`}
          >
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
          </SectionBlock>

          <div className="grid gap-5 xl:sticky xl:top-24" id="supervisor-actions">
            <SectionBlock
              subtitle="문서 검토 결과를 바로 피드백과 결정으로 연결합니다."
              title="검토 메모와 피드백"
            >
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
            </SectionBlock>
          </div>
        </section>

        <section className="grid gap-3" aria-labelledby="review-context-title">
          <div>
            <h2 className="text-xl font-bold text-ink-900" id="review-context-title">
              검토 참고 정보
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              사례 배경과 진행 이력은 필요할 때 펼쳐 확인합니다.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <ContextDetails title="사례 요약">
              <SummaryLine
                label="주호소"
                value={detail.chiefComplaint ?? "저장된 주호소가 없습니다."}
              />
              <SummaryLine
                label="의뢰 사유"
                value={detail.referralReason ?? "저장된 의뢰 사유가 없습니다."}
              />
            </ContextDetails>

            <ContextDetails title="검토 초점">
              <SummaryLine
                label="다음 제출물"
                value={nextDeliverableLabel(detail.status)}
              />
              <SummaryLine
                label="자료 검토 상태"
                value={
                  caseFiles.length > 0
                    ? `${String(caseFiles.length)}개 확인 가능`
                    : "첨부 자료 없음"
                }
              />
            </ContextDetails>
          </div>
        </section>
      </section>
    </AppShell>
  );
}

const supervisorSteps = ["자료 확인", "검토 진행", "피드백 작성", "학습 기록"] as const;

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="whitespace-pre-wrap font-semibold leading-relaxed text-ink-900">
        {value}
      </span>
    </div>
  );
}

function ContextDetails({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="rounded-xl border border-line bg-surface-elevated px-4 py-3">
      <summary className="cursor-pointer list-none text-sm font-bold text-ink-900 marker:hidden">
        {title}
      </summary>
      <div className="mt-3 grid divide-y divide-line text-sm">{children}</div>
    </details>
  );
}

function flowStepForStatus(status: string): (typeof supervisorSteps)[number] {
  if (
    status === "awaiting_supervisor_review" ||
    status === "accepted" ||
    status === "additional_info_requested"
  ) {
    return "자료 확인";
  }
  if (status === "in_review") return "검토 진행";
  if (status === "feedback_submitted") return "피드백 작성";
  if (status === "completion_record_issued" || status === "completed") {
    return "학습 기록";
  }
  return "자료 확인";
}

function nextDeliverableLabel(status: string): string {
  if (status === "awaiting_supervisor_review") return "수락 여부 결정";
  if (status === "accepted" || status === "in_review") return "요약 피드백과 권고";
  if (status === "additional_info_requested") return "보완 자료 재검토";
  if (status === "feedback_submitted") return "학습 기록 발급 확인";
  if (status === "completion_record_issued" || status === "completed") {
    return "완료 기록 확인";
  }
  return "현재 상태 확인";
}

function workspaceTitle(productTitle: string | null): string {
  if (!productTitle) return "슈퍼비전 검토";
  return `${productTitle} 검토`;
}

function primarySupervisorAction(status: string): { href: string; label: string } {
  if (status === "awaiting_supervisor_review") {
    return { href: "#supervisor-actions", label: "수락 여부 결정" };
  }
  if (status === "accepted" || status === "in_review") {
    return { href: "#supervisor-actions", label: "피드백 제출" };
  }
  if (status === "additional_info_requested") {
    return { href: "#supervisor-actions", label: "추가 자료 확인" };
  }
  if (status === "feedback_submitted") {
    return { href: "#supervisor-actions", label: "학습 기록 발급" };
  }
  if (status === "completion_record_issued" || status === "completed") {
    return { href: "/supervisor/memory", label: "학습 기록 보기" };
  }
  return { href: "#supervisor-actions", label: "작업 확인" };
}

function statusBadgeTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "rejected" || status === "cancelled") return "danger";
  if (status === "awaiting_supervisor_review" || status === "feedback_submitted") {
    return "accent";
  }
  if (status === "completion_record_issued" || status === "completed") {
    return "brand";
  }
  return "neutral";
}

function shortRequestId(id: string): string {
  return `의뢰-${id.slice(0, 8)}`;
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
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    awaiting_supervisor_review: "수락 대기",
    accepted: "수락됨",
    awaiting_payment: "결제 필요",
    in_review: "검토 진행 중",
    paid: "결제 완료",
    feedback_submitted: "피드백 도착",
    additional_info_requested: "추가 자료 요청",
    completion_record_issued: "학습 기록 발급",
    completed: "완료",
    draft: "작성 중",
    expired: "만료",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    rejected: "수락되지 않음",
    refunded: "환불",
    submitted: "제출됨",
    cancelled: "취소"
  };
  return labels[status] ?? "상태 미정";
}
