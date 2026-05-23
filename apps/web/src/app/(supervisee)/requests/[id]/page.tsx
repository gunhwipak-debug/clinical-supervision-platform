import Link from "next/link";
import { ArrowLeft, ClipboardList, FolderOpen, ShieldCheck } from "lucide-react";
import { files, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { CaseFilesPanel } from "../../../../components/case-files-panel";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
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

  if (
    !current ||
    (current.user.role !== "supervisee" && current.user.role !== "supervisor")
  ) {
    return (
      <AppShell title="의뢰 상세" subtitle="슈퍼바이지 로그인이 필요합니다.">
        <EmptyState
          title="로그인이 필요합니다"
          description="의뢰 내용을 보려면 먼저 로그인하세요."
        />
      </AppShell>
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
    <main className="min-h-screen bg-surface-base pb-24 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link aria-label="의뢰 목록" href="/requests">
            <ArrowLeft aria-hidden className="text-ink-900" size={28} />
          </Link>
          <h1 className="text-2xl font-bold">의뢰 심사</h1>
          <span className="size-7" aria-hidden />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-5">
        <section className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-ink-800">
          <div className="flex gap-3">
            <ShieldCheck
              aria-hidden
              className="mt-1 shrink-0 text-brand-600"
              size={22}
            />
            <div>
              <h2 className="font-bold">보안 모드 활성화</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">
                민감 자료는 검토 목적 안에서만 열람합니다. 접근과 변경 이력은 안전하게
                기록됩니다.
              </p>
            </div>
          </div>
        </section>

        <Card className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
          <div className="mb-3 flex items-start justify-between gap-4">
            <Badge tone="brand">슈퍼비전 의뢰</Badge>
            <Badge tone="neutral">{statusLabel(basic.status)}</Badge>
          </div>
          <h2 className="text-2xl font-bold text-ink-900">
            {detail?.title || basic.productTitle || "케이스 패킷을 작성해주세요"}
          </h2>
          <p className="mt-3 text-sm text-ink-700">
            요청일 · 보관 {String(basic.retentionDays)}일 ·{" "}
            {basic.productTitle ?? "상품 확인 필요"}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-800">
            예약 일정 · {formatBookingSlot(basic)}
          </p>
        </Card>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-5">
            <Card className="overflow-hidden rounded-2xl border-line bg-surface-elevated p-0 shadow-card">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <ClipboardList aria-hidden className="text-ink-700" size={24} />
                  <h2 className="text-xl font-bold">사례 기본 정보</h2>
                </div>
              </div>
              <div className="p-5">
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
            </Card>

            <Card className="overflow-hidden rounded-2xl border-line bg-surface-elevated p-0 shadow-card">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <FolderOpen aria-hidden className="text-ink-700" size={24} />
                  <h2 className="text-xl font-bold">
                    첨부 문서 ({String(caseFiles.length)})
                  </h2>
                </div>
              </div>
              <div className="p-5">
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
            </Card>
          </div>

          <Card className="h-fit rounded-2xl border-line bg-surface-elevated p-5 shadow-card">
            <h2 className="mb-5 text-xl font-bold text-ink-900">진행 타임라인</h2>
            <div className="relative border-l border-outline-variant/60 ml-3.5 space-y-lg pb-1">
              {timelineSteps.map((stepItem, idx) => {
                const isFinished = checkFinished(stepItem.key, basic.status);
                const isActive = checkActive(stepItem.key, basic.status);
                
                return (
                  <div className="relative pl-6" key={stepItem.key}>
                    {/* 커스텀 타임라인 도트 */}
                    <div className={`absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[12px] transition-all duration-200 ${
                      isFinished 
                        ? "bg-primary border-primary text-on-primary"
                        : isActive
                          ? "bg-surface-elevated border-secondary text-secondary animate-pulse ring-4 ring-secondary/15"
                          : "bg-surface-elevated border-outline-variant text-on-surface-variant"
                    }`}>
                      {isFinished ? (
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-label-md text-sm font-bold ${
                        isActive ? "text-secondary" : isFinished ? "text-primary" : "text-on-surface-variant"
                      }`}>
                        {stepItem.label}
                      </h3>
                      <p className="mt-xs font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 상태별 상세 수치 요약 */}
            <div className="mt-md border-t border-outline-variant/40 pt-md grid gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">현재 상태</span>
                <Badge tone="accent">{statusLabel(basic.status)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">사례 완료여부</span>
                <Badge tone={basic.packetComplete ? "brand" : "danger"}>
                  {basic.packetComplete ? "완료" : "미완료"}
                </Badge>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

const timelineSteps = [
  { key: "draft", label: "작성 및 자료 점검", desc: "케이스 패킷 정보 입력 및 파일 비식별화" },
  { key: "payment", label: "결제 완료", desc: "Toss 결제 완료 후 매칭 성사" },
  { key: "supervision", label: "슈퍼비전 진행", desc: "전문가 검토 및 1:1 세션 진행" },
  { key: "completed", label: "최종 완료", desc: "완료 기록 및 피드백 발급 완료" }
] as const;

function checkFinished(stepKey: string, status: string): boolean {
  if (status === "rejected" || status === "cancelled" || status === "refunded") return false;
  
  if (stepKey === "draft") {
    return status !== "draft";
  }
  if (stepKey === "payment") {
    return status !== "draft" && status !== "awaiting_payment";
  }
  if (stepKey === "supervision") {
    return (
      status === "feedback_submitted" ||
      status === "completion_record_issued" ||
      status === "completed"
    );
  }
  if (stepKey === "completed") {
    return status === "completed" || status === "completion_record_issued";
  }
  return false;
}

function checkActive(stepKey: string, status: string): boolean {
  if (status === "rejected" || status === "cancelled" || status === "refunded") return false;
  
  if (stepKey === "draft") {
    return status === "draft";
  }
  if (stepKey === "payment") {
    return status === "awaiting_payment";
  }
  if (stepKey === "supervision") {
    return (
      status === "paid" ||
      status === "awaiting_supervisor_review" ||
      status === "accepted" ||
      status === "in_review"
    );
  }
  if (stepKey === "completed") {
    return status === "feedback_submitted";
  }
  return false;
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
    submitted: "제출됨",
    awaiting_payment: "결제 대기",
    paid: "결제 완료",
    awaiting_supervisor_review: "검토 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 제출",
    completion_record_issued: "완료기록 발급",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? status;
}
