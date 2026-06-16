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
import {
  getDemoSupervisionRequestDetails,
  listDemoCaseFilesForRequest
} from "@/lib/demo/supervision";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor, isRequestOwner } from "@/lib/supervision/authz";
import { RequestDetailClient } from "./request-detail-client";
import {
  flowStepForStatus,
  formatBookingSlot,
  nextActionForStatus,
  pageSubtitle,
  pageTitle,
  readCompletionRecord,
  readPhiDetail,
  requestFlowSteps,
  statusLabel
} from "./request-detail-view-model";

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

  if (current.user.role !== "supervisee") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="의뢰 상세"
        description="의뢰 상세는 신청자 계정에서 확인합니다. 슈퍼바이저는 사례 검토 화면에서 배정된 의뢰를 확인해주세요."
        actionHref="/supervisor/requests"
        actionLabel="검토할 의뢰 보기"
      />
    );
  }

  const db = createRuntimeDatabase();
  let basic: supervision.SupervisionRequestDetails | null;
  try {
    basic = await withUserContext(db, contextFor(current), (tx) =>
      supervision.getSupervisionRequestDetails(tx, id, { includeMeetingUrl: false })
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    basic = getDemoSupervisionRequestDetails(id);
  }
  if (!basic || !isRequestOwner(current, basic)) {
    return (
      <AppShell
        active="requests"
        currentUser={current.user}
        title="의뢰 상세"
        subtitle="접근 가능한 의뢰를 찾지 못했습니다."
      >
        <EmptyState
          title="의뢰가 없습니다"
          description="목록으로 돌아가 다시 선택해주세요."
        />
      </AppShell>
    );
  }

  const detail = (await readPhiDetail(db, current, id)) ?? basic;
  let caseFiles: Awaited<ReturnType<typeof files.listCaseFilesForRequest>>;
  try {
    caseFiles = await withUserContext(db, contextFor(current), (tx) =>
      files.listCaseFilesForRequest(tx, id)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    caseFiles = listDemoCaseFilesForRequest(id);
  }
  const completionRecord = await readCompletionRecord(db, current, id);
  const nextAction = nextActionForStatus(basic.status, id);
  const currentStep = flowStepForStatus(basic.status);
  const showCompletionRecord =
    basic.status === "completion_record_issued" || basic.status === "completed";

  return (
    <AppShell
      active="requests"
      currentUser={current.user}
      subtitle={pageSubtitle(basic)}
      title={pageTitle(basic.status)}
    >
      <FlowStepNav current={currentStep} steps={requestFlowSteps} />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <SectionBlock title="사례 자료">
            <div className="border-t border-line pt-5" id="case-info">
              <RequestDetailClient
                initialChiefComplaint={detail.chiefComplaint ?? ""}
                initialClientAgeBand={detail.clientAgeBand ?? null}
                initialClientGender={detail.clientGender ?? null}
                initialNeedsCompletionRecord={detail.needsCompletionRecord ?? null}
                initialPreferredMethod={detail.preferredMethod ?? null}
                initialPurpose={detail.purpose ?? null}
                initialReferralReason={detail.referralReason ?? ""}
                initialRequestItems={detail.requestItems ?? null}
                initialSetting={detail.setting ?? null}
                initialTestsUsed={detail.testsUsed ?? null}
                initialTitle={detail.title ?? ""}
                completionRecord={showCompletionRecord ? completionRecord : null}
                feedbackRecommendations={detail.feedbackRecommendations ?? null}
                feedbackSubmittedAt={detail.feedbackSubmittedAt ?? null}
                feedbackSummary={detail.feedbackSummary ?? null}
                bookingStatus={basic.bookingStatus}
                deidentificationComplete={basic.deidentificationComplete}
                initialMeetingUrl={detail.meetingUrl ?? basic.meetingUrl}
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

          <SectionBlock title={`첨부 자료 ${String(caseFiles.length)}개`}>
            <div className="border-t border-line pt-5" id="case-files">
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
          <p className="text-sm font-bold text-brand-700">현재 상태</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900">
            {statusLabel(basic.status)}
          </h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine
              label="슈퍼바이저"
              value={basic.supervisorDisplayName ?? "확인 중"}
            />
            <SummaryLine label="상품" value={basic.productTitle ?? "슈퍼비전 의뢰"} />
            <SummaryLine label="일정" value={formatBookingSlot(basic)} />
            <SummaryLine
              label="사례 자료"
              value={`${basic.packetComplete ? "정리 완료" : "정리 필요"} · ${String(caseFiles.length)}개`}
            />
            <SummaryLine label="자료 보관" value={`${String(basic.retentionDays)}일`} />
          </div>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <a href={nextAction.href}>{nextAction.actionLabel}</a>
          </Button>
        </aside>
      </section>
    </AppShell>
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
