import Link from "next/link";
import { files, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../../components/app-shell";
import { CaseFilesPanel } from "../../../../../components/case-files-panel";
import {
  FlowStepNav,
  PrimaryActionPanel,
  SectionBlock
} from "../../../../../components/clinicflow-shell";
import { Button } from "../../../../../components/ui/button";
import { EmptyState } from "../../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../../lib/auth/database";
import { getCurrentUser } from "../../../../../lib/auth/current-user";
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
        title="슈퍼바이저 검토"
        description="이 검토 화면은 담당 슈퍼바이저 계정에서만 확인합니다."
      />
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
      <AppShell
        action={
          <Button asChild variant="secondary">
            <Link href="/supervisor/requests">검토할 의뢰</Link>
          </Button>
        }
        title="의뢰를 찾지 못했습니다"
      >
        <EmptyState
          title="의뢰가 없습니다"
          description="검토할 의뢰 목록으로 돌아가 다시 선택해주세요."
        />
      </AppShell>
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

  const nextAction = nextSupervisorAction(detail.status);

  return (
    <AppShell
      action={
        <Button asChild>
          <a href="#supervisor-actions">{nextAction.label}</a>
        </Button>
      }
      subtitle={`${statusLabel(detail.status)} · ${formatBookingSlot(detail)}`}
      title={detail.title ?? shortRequestId(detail.id)}
    >
      <FlowStepNav current={flowStepForStatus(detail.status)} steps={supervisorSteps} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <PrimaryActionPanel title={nextAction.title}>
            {nextAction.description}
          </PrimaryActionPanel>

          <section className="grid gap-6 md:grid-cols-2">
            <SectionBlock
              subtitle="검토에 필요한 핵심만 한 줄씩 확인합니다."
              title="사례 요약"
            >
              <div className="rounded-xl border border-line bg-surface-elevated p-5">
                <div className="grid divide-y divide-line text-sm">
                  <SummaryLine label="의뢰 번호" value={shortRequestId(detail.id)} />
                  <SummaryLine
                    label="세션"
                    value={detail.productTitle ?? "슈퍼비전 의뢰"}
                  />
                  <SummaryLine label="예약 일정" value={formatBookingSlot(detail)} />
                  <SummaryLine
                    label="예약 상태"
                    value={bookingStatusLabel(detail.bookingStatus)}
                  />
                  <SummaryLine
                    label="주호소"
                    value={detail.chiefComplaint ?? "저장된 주호소가 없습니다."}
                  />
                  <SummaryLine
                    label="의뢰 사유"
                    value={detail.referralReason ?? "저장된 의뢰 사유가 없습니다."}
                  />
                </div>
              </div>
            </SectionBlock>

            <SectionBlock
              subtitle="현재 상태에서 작성하거나 확인해야 할 산출물을 바로 붙여 봅니다."
              title="검토 초점"
            >
              <div className="rounded-xl border border-line bg-surface-elevated p-5">
                <div className="grid divide-y divide-line text-sm">
                  <SummaryLine label="진행 상태" value={statusLabel(detail.status)} />
                  <SummaryLine
                    label="다음 제출물"
                    value={nextDeliverableLabel(detail.status)}
                  />
                  <SummaryLine
                    label="화상 세션"
                    value={detail.meetingUrl ? "입장 링크 준비됨" : "링크 대기"}
                  />
                  <SummaryLine
                    label="자료 검토 상태"
                    value={
                      caseFiles.length > 0
                        ? `${String(caseFiles.length)}개 확인 가능`
                        : "첨부 자료 없음"
                    }
                  />
                </div>
              </div>
            </SectionBlock>
          </section>

          <SectionBlock
            subtitle="수락, 피드백 작성, 추가 자료 요청, 학습 기록 발급을 이 영역에서 이어갑니다."
            title="검토 작업"
          >
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
          </SectionBlock>

          <SectionBlock
            subtitle="보고서, 검사 결과, 면담 요약을 한 화면에서 확인하고 필요한 위치에 메모를 남깁니다."
            title={`첨부 자료 ${String(caseFiles.length)}개`}
          >
            <div className="rounded-xl border border-line bg-surface-elevated p-5">
              <CaseFilesPanel
                canAnnotate={
                  detail.status === "accepted" || detail.status === "in_review"
                }
                canDelete={false}
                canRequestRevision={
                  detail.status === "in_review" ||
                  detail.status === "feedback_submitted"
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
            </div>
          </SectionBlock>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-brand-700">검토 요약</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900">지금 열어둔 의뢰</h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine label="의뢰" value={shortRequestId(detail.id)} />
            <SummaryLine label="상태" value={statusLabel(detail.status)} />
            <SummaryLine label="자료" value={`${String(caseFiles.length)}건 제출`} />
            <SummaryLine label="최근 변경" value={formatDate(detail.updatedAt)} />
            <SummaryLine label="의뢰 생성" value={formatDate(detail.createdAt)} />
          </div>
          <div className="mt-5 grid gap-3">
            <Button asChild variant="secondary">
              <Link href="/supervisor/requests">검토할 의뢰</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/supervisor/memory">학습 기록 보기</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            식별정보는 검토 목적 안에서만 확인하고, 제출할 피드백은 한 번 더 읽은 뒤
            저장하세요.
          </p>
        </aside>
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

function nextSupervisorAction(status: string): {
  description: string;
  label: string;
  title: string;
} {
  if (status === "awaiting_supervisor_review") {
    return {
      description:
        "사례 요약과 첨부 자료를 확인한 뒤 수락 여부를 결정합니다. 판단에 필요한 내용만 먼저 확인하세요.",
      label: "수락 여부 결정",
      title: "의뢰를 수락할지 결정하세요"
    };
  }
  if (status === "accepted" || status === "in_review") {
    return {
      description: "첨부 자료를 읽고 필요한 위치에 메모를 남긴 뒤 피드백을 작성합니다.",
      label: "피드백 작성",
      title: "자료를 검토하고 피드백을 작성하세요"
    };
  }
  if (status === "additional_info_requested") {
    return {
      description:
        "신청자가 추가 자료를 올리면 다시 검토를 이어갑니다. 요청 사유는 처리 기록에 남습니다.",
      label: "추가 자료 확인",
      title: "추가 자료를 기다리는 상태입니다"
    };
  }
  if (status === "feedback_submitted") {
    return {
      description:
        "피드백 제출은 끝났습니다. 이수 기록이 필요한 의뢰라면 발급 범위를 확인하세요.",
      label: "학습 기록 준비",
      title: "학습 기록 발급을 확인하세요"
    };
  }
  if (status === "completion_record_issued" || status === "completed") {
    return {
      description:
        "이번 슈퍼비전은 마무리되었습니다. 처리 기록과 자료 보관 상태만 확인합니다.",
      label: "처리 기록 확인",
      title: "마무리된 의뢰입니다"
    };
  }
  return {
    description: "현재 상태에 맞는 처리 작업을 확인합니다.",
    label: "작업 확인",
    title: "처리 작업을 확인하세요"
  };
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
  return labels[status] ?? status;
}

function bookingStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    cancelled: "취소됨",
    completed: "세션 완료",
    no_show_supervisee: "신청자 불참",
    no_show_supervisor: "슈퍼바이저 불참",
    rescheduled: "일정 변경됨",
    scheduled: "예약됨"
  };
  return labels[status ?? ""] ?? "예약 상태 확인 필요";
}
