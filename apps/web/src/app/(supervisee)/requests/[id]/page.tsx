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
  const locked = basic.status !== "draft";

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

          <Card className="h-fit rounded-2xl border-line bg-surface-elevated shadow-card">
            <h2 className="mb-4 text-xl font-bold">진행 요약</h2>
            <div className="grid gap-3 text-sm">
              <ProgressRow
                label="상태"
                value={statusLabel(basic.status)}
                tone="accent"
              />
              <ProgressRow
                label="케이스 패킷"
                value={basic.packetComplete ? "완료" : locked ? "잠김" : "미완료"}
                tone={basic.packetComplete ? "brand" : locked ? "neutral" : "danger"}
              />
              <ProgressRow
                label="자료 점검"
                value={
                  basic.deidentificationComplete ? "기록됨" : locked ? "잠김" : "선택"
                }
                tone={
                  basic.deidentificationComplete
                    ? "brand"
                    : locked
                      ? "neutral"
                      : "danger"
                }
              />
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ProgressRow({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "brand" | "accent" | "neutral" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-700">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
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
