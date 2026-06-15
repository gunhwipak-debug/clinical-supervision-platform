import Link from "next/link";
import { files, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { CaseFilesPanel } from "../../../../components/case-files-panel";
import { FlowStepNav, SectionBlock } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";
import { RequestDetailClient } from "./request-detail-client";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  const { id } = await params;

  if (!current) {
    return <LoginRequiredState title="의뢰 상세" returnTo={`/requests/${id}`} />;
  }

  if (current.user.role !== "supervisee" && current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        title="의뢰 상세"
        description="의뢰 상세는 신청자와 담당 슈퍼바이저만 확인할 수 있습니다."
      />
    );
  }

  const db = createRuntimeDatabase();
  const basic = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, id)
  );
  if (!basic || !isRequestOwner(current, basic)) {
    return (
      <AppShell title="의뢰 상세" subtitle="접근 가능한 의뢰를 찾지 못했습니다.">
        <EmptyState
          title="의뢰가 없습니다"
          description="목록으로 돌아가 다시 선택해주세요."
        />
      </AppShell>
    );
  }

  const detail = await withUserContext(
    db,
    contextFor(current, undefined, { phiAccess: true }),
    (tx) => supervision.getSupervisionRequestDetails(tx, id, { includePhi: true })
  );
  const caseFiles = await withUserContext(db, contextFor(current), (tx) =>
    files.listCaseFilesForRequest(tx, id)
  );
  const completionRecord = await withUserContext(
    db,
    contextFor(current, undefined, { phiAccess: true }),
    (tx) => supervision.getCompletionRecordForRequest(tx, id)
  );

  return (
    <AppShell
      action={
        <Button asChild variant="secondary">
          <Link href="/requests">의뢰 목록</Link>
        </Button>
      }
      subtitle={pageSubtitle(basic)}
      title={pageTitle(basic.status)}
    >
      <FlowStepNav current={flowStepForStatus(basic.status)} steps={requestFlowSteps} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <SectionBlock
            subtitle="주호소, 의뢰 사유, 검사명처럼 슈퍼바이저가 먼저 볼 내용을 한 줄씩 정리합니다."
            title="사례 자료"
          >
            <div
              className="rounded-xl border border-line bg-surface-elevated p-5"
              id="case-info"
            >
              <RequestDetailClient
                initialChiefComplaint={detail?.chiefComplaint ?? ""}
                initialClientAgeBand={detail?.clientAgeBand ?? null}
                initialClientGender={detail?.clientGender ?? null}
                initialNeedsCompletionRecord={detail?.needsCompletionRecord ?? null}
                initialPreferredMethod={detail?.preferredMethod ?? null}
                initialPurpose={detail?.purpose ?? null}
                initialReferralReason={detail?.referralReason ?? ""}
                initialRequestItems={detail?.requestItems ?? null}
                initialSetting={detail?.setting ?? null}
                initialTestsUsed={detail?.testsUsed ?? null}
                initialTitle={detail?.title ?? ""}
                completionRecord={completionRecord}
                feedbackRecommendations={detail?.feedbackRecommendations ?? null}
                feedbackSubmittedAt={detail?.feedbackSubmittedAt ?? null}
                feedbackSummary={detail?.feedbackSummary ?? null}
                bookingStatus={basic.bookingStatus}
                deidentificationComplete={basic.deidentificationComplete}
                initialMeetingUrl={basic.meetingUrl}
                initialScheduledEnd={basic.scheduledEnd}
                initialScheduledStart={basic.scheduledStart}
                packetComplete={basic.packetComplete}
                phiDisabled={false}
                requestId={id}
                serviceProductSupervisionType={basic.serviceProductSupervisionType}
                status={basic.status}
              />
            </div>
          </SectionBlock>

          <SectionBlock
            subtitle="보고서, 검사 결과, 면담 요약처럼 슈퍼비전에 필요한 파일만 보관합니다."
            title={`첨부 자료 ${String(caseFiles.length)}개`}
          >
            <div
              className="rounded-xl border border-line bg-surface-elevated p-5"
              id="case-files"
            >
              <CaseFilesPanel
                canDelete={basic.status === "draft" || basic.status === "in_review"}
                canUpload={
                  basic.status === "draft" ||
                  basic.status === "submitted" ||
                  basic.status === "in_review" ||
                  basic.status === "additional_info_requested"
                }
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
          <h2 className="text-xl font-bold text-ink-900">
            {summaryHeading(basic.status)}
          </h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine label="현재 상태" value={statusLabel(basic.status)} />
            <SummaryLine
              label="슈퍼바이저"
              value={basic.supervisorDisplayName ?? "확인 중"}
            />
            <SummaryLine label="일정" value={formatBookingSlot(basic)} />
            <SummaryLine
              label="사례 자료"
              value={basic.packetComplete ? "정리 완료" : "정리 필요"}
            />
            <SummaryLine label="자료 보관" value={`${String(basic.retentionDays)}일`} />
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

const requestFlowSteps = [
  "슈퍼바이저 선택",
  "세션·일정",
  "사례자료 정리",
  "확인·결제",
  "학습 기록"
] as const;

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
  );
}

function flowStepForStatus(status: string): (typeof requestFlowSteps)[number] {
  if (
    status === "draft" ||
    status === "submitted" ||
    status === "in_review" ||
    status === "additional_info_requested"
  ) {
    return "사례자료 정리";
  }
  if (status === "awaiting_payment" || status === "paid") return "확인·결제";
  if (status === "completion_record_issued" || status === "completed") {
    return "학습 기록";
  }
  if (status === "feedback_submitted") return "학습 기록";
  return "확인·결제";
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
    draft: "작성 중",
    submitted: "제출 완료",
    awaiting_payment: "결제 필요",
    paid: "결제 완료",
    awaiting_supervisor_review: "수락 대기",
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청됨",
    in_review: "검토 진행 중",
    feedback_submitted: "피드백 도착",
    completion_record_issued: "이수 기록 발급됨",
    completed: "완료",
    rejected: "수락되지 않음",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? status;
}

function pageTitle(status: string): string {
  if (status === "awaiting_supervisor_review" || status === "accepted") {
    return "슈퍼바이저 확인을 기다립니다";
  }
  if (status === "awaiting_payment" || status === "paid") {
    return "선택 내용을 확인하고 결제합니다";
  }
  if (
    status === "feedback_submitted" ||
    status === "completion_record_issued" ||
    status === "completed"
  ) {
    return "학습 기록";
  }
  return "의뢰 상세";
}

function pageSubtitle(request: supervision.SupervisionRequestDetails): string {
  if (
    request.status === "awaiting_supervisor_review" ||
    request.status === "accepted"
  ) {
    return "결제와 사례자료 정리가 끝났습니다. 슈퍼바이저가 일정과 자료를 확인하면 슈퍼비전이 시작됩니다.";
  }
  if (request.status === "additional_info_requested") {
    return `${request.id.slice(0, 8).toUpperCase()} · 필요한 자료를 먼저 보완하세요.`;
  }
  if (request.status === "awaiting_payment" || request.status === "paid") {
    return "슈퍼바이저, 세션, 일정, 자료를 한 번 더 확인한 뒤 신청을 확정합니다.";
  }
  if (
    request.status === "feedback_submitted" ||
    request.status === "completion_record_issued" ||
    request.status === "completed"
  ) {
    return "피드백과 완료 기록을 한 화면에서 다시 확인합니다.";
  }
  return `${statusLabel(request.status)} · ${formatBookingSlot(request)}`;
}

function summaryHeading(status: string): string {
  if (status === "awaiting_supervisor_review" || status === "accepted") {
    return "신청 요약";
  }
  if (
    status === "feedback_submitted" ||
    status === "completion_record_issued" ||
    status === "completed"
  ) {
    return "기록 요약";
  }
  return "의뢰 요약";
}
