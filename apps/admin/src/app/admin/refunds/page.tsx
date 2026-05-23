import { payments, withUserContext } from "@csp/db";
import { ArrowLeft, Clock3, ReceiptText, RotateCcw, ShieldCheck } from "lucide-react";
import { AdminActionPanel } from "../../../components/admin-action-panel";
import { AdminCard, AdminShell } from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="환불 큐" subtitle="관리자 로그인이 필요합니다.">
        <AdminCard>관리자 계정으로 로그인해주세요.</AdminCard>
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const refunds = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 환불 큐 조회를 위한 관리자 사유입니다."
    },
    (tx) => payments.listRefundRequests(tx, "requested")
  );

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a aria-label="관리자 대시보드" href="/admin">
            <ArrowLeft aria-hidden className="text-ink-700" size={30} />
          </a>
          <h1 className="text-2xl font-bold">환불 큐</h1>
          <span className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            검토 대기
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-7">
        <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <RotateCcw aria-hidden size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold">환불 요청 상태</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  실제 승인·반려는 API에서 30자 이상 관리자 사유를 요구합니다.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">
              요청됨 {String(refunds.length)}건
            </span>
          </div>
        </AdminCard>

        <section className="grid gap-4" aria-label="환불 요청">
          {refunds.length === 0 ? (
            <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ShieldCheck aria-hidden size={20} />
                </span>
                <div>
                  <strong className="text-xl text-ink-900">대기 중인 환불 없음</strong>
                  <p className="mt-1 text-sm text-ink-500">
                    환불 요청이 접수되면 이곳에 표시됩니다.
                  </p>
                </div>
              </div>
            </AdminCard>
          ) : (
            refunds.map((refund) => (
              <AdminCard
                key={refund.id}
                className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card"
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <ReceiptText aria-hidden size={22} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-2xl text-ink-900">
                          ₩{refund.amountKrw.toLocaleString("ko-KR")}
                        </strong>
                        <span className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                          {refundStatusLabel(refund.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">
                        {refund.reason ?? "사유 없음"}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                        <Clock3 aria-hidden size={14} />
                        요청 {formatDate(refund.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 rounded-2xl bg-brand-50 p-4 text-sm text-ink-700 md:min-w-[260px]">
                    <span className="flex justify-between gap-3">
                      <span>결제 상태</span>
                      <strong>{paymentStatusLabel(refund.paymentStatus)}</strong>
                    </span>
                    <span className="flex justify-between gap-3">
                      <span>의뢰 상태</span>
                      <strong>{requestStatusLabel(refund.requestStatus)}</strong>
                    </span>
                    <span className="flex justify-between gap-3">
                      <span>환불 ID</span>
                      <strong>{refund.id.slice(0, 8)}</strong>
                    </span>
                  </div>
                </div>
                <div className="mt-5">
                    <AdminActionPanel
                      actions={[
                      {
                        label: "환불 승인",
                        tone: "primary",
                        url: `/api/admin/refunds/${refund.id}/approve`
                      },
                      {
                        label: "환불 반려",
                        tone: "secondary",
                        url: `/api/admin/refunds/${refund.id}/reject`
                      }
                      ]}
                      reasonPlaceholder="예: 환불 요청 사유, 결제 상태, 환불 가능 금액을 확인했고 정책상 승인/거절합니다."
                    />
                </div>
              </AdminCard>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function refundStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    approved: "승인됨",
    completed: "환불 완료",
    rejected: "반려됨",
    requested: "요청됨"
  };
  return labels[status] ?? status;
}

function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    cancelled: "취소됨",
    failed: "결제 실패",
    paid: "결제 완료",
    partially_refunded: "부분 환불",
    pending: "결제 대기",
    refunded: "환불 완료"
  };
  return labels[status] ?? status;
}

function requestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: "수락됨",
    additional_info_requested: "보완 요청",
    awaiting_payment: "결제 대기",
    awaiting_supervisor_review: "검토 대기",
    cancelled: "취소됨",
    completed: "완료",
    completion_record_issued: "완료 기록 발급",
    draft: "작성 중",
    expired: "만료",
    feedback_submitted: "피드백 제출",
    in_review: "검토 중",
    meeting_completed: "세션 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불됨",
    rejected: "반려됨",
    submitted: "제출됨"
  };
  return labels[status] ?? status;
}
