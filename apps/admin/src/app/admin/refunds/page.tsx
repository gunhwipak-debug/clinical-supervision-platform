import { payments, withUserContext } from "@csp/db";
import { Clock3, ReceiptText, RotateCcw, ShieldCheck } from "lucide-react";
import { AdminActionPanel } from "../../../components/admin-action-panel";
import {
  AdminCard,
  AdminLockedState,
  AdminShell
} from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="환불 검토" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="환불 검토는 관리자 계정에서 진행합니다"
          description="요청 사유, 결제 상태, 슈퍼비전 진행 단계를 함께 보고 승인 여부를 결정합니다."
          returnPath="/admin/refunds"
          previewItems={[
            "환불 요청 사유와 연결 의뢰",
            "결제 금액과 진행 상태",
            "승인 또는 반려 처리"
          ]}
        />
      </AdminShell>
    );
  }

  let refunds: payments.RefundRecord[];
  let refundsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    refunds = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: "admin",
        adminReason: "운영 환불 검토 조회를 위한 처리 사유입니다."
      },
      (tx) => payments.listRefundRequests(tx, "requested")
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[admin.refunds.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    refunds = [];
    refundsUnavailable = true;
  }

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/refunds"
      title="환불 검토"
      subtitle="요청 사유, 결제 상태, 진행 단계를 함께 보고 승인 여부를 결정합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminCard>
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <RotateCcw aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">환불 요청 상태</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                실제 승인과 반려는 처리 사유를 30자 이상 남겨야 진행됩니다.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
            <div>
              <dt className="font-bold text-ink-500">검토 대기</dt>
              <dd className="mt-1 text-ink-900">
                {refundsUnavailable
                  ? "확인 필요"
                  : `${refunds.length.toLocaleString("ko-KR")}건`}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">처리 기준</dt>
              <dd className="mt-1 break-keep text-ink-900">
                결제 상태와 의뢰 진행 단계를 함께 확인한 뒤 처리합니다.
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard className="h-fit">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <ShieldCheck aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">운영 메모</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                환불 사유, 결제 완료 여부, 현재 의뢰 상태가 서로 맞는지 먼저 확인합니다.
              </p>
            </div>
          </div>
        </AdminCard>
      </section>

      <AdminCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">환불 요청 목록</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              요청 사유와 연결된 결제 상태를 같은 행에서 확인합니다.
            </p>
          </div>
          <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
            {refundsUnavailable
              ? "확인 필요"
              : `${refunds.length.toLocaleString("ko-KR")}건`}
          </span>
        </div>

        {refunds.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-ink-500">
            {refundsUnavailable
              ? "현재 환불 요청을 불러오지 못했습니다. 요청 사유와 연결된 결제 상태는 연결되면 이 목록에 표시됩니다."
              : "환불 요청이 접수되면 이곳에 표시됩니다."}
          </p>
        ) : (
          <div className="grid divide-y divide-line" aria-label="환불 요청">
            {refunds.map((refund) => (
              <article className="grid gap-5 p-5" key={refund.id}>
                <div className="grid gap-4 md:grid-cols-[1fr_260px] md:items-start">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <ReceiptText aria-hidden size={22} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-2xl text-ink-900">
                          ₩{refund.amountKrw.toLocaleString("ko-KR")}
                        </strong>
                        <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                          {refundStatusLabel(refund.status)}
                        </span>
                      </div>
                      <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                        {refund.reason ?? "사유 없음"}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                        <Clock3 aria-hidden size={14} />
                        요청 {formatDate(refund.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-xl bg-surface-sunken p-4 text-sm text-ink-700">
                    <span className="flex justify-between gap-3">
                      <span>결제 상태</span>
                      <strong>{paymentStatusLabel(refund.paymentStatus)}</strong>
                    </span>
                    <span className="flex justify-between gap-3">
                      <span>의뢰 상태</span>
                      <strong>{requestStatusLabel(refund.requestStatus)}</strong>
                    </span>
                    <span className="flex justify-between gap-3">
                      <span>환불 접수번호</span>
                      <strong>{refund.id.slice(0, 8)}</strong>
                    </span>
                  </div>
                </div>

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
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminShell>
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
  return labels[status] ?? "상태 확인 필요";
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
  return labels[status] ?? "상태 확인 필요";
}

function requestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청",
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
  return labels[status] ?? "상태 확인 필요";
}
