import { payments, withUserContext } from "@csp/db";
import { AdminActionPanel } from "../../../components/admin-action-panel";
import {
  AdminListFrame,
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
      <AdminShell title="환불" subtitle="관리자 로그인이 필요합니다.">
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
      title="환불"
      subtitle="환불 요청의 금액, 상태, 사유를 확인합니다."
    >
      <section className="grid gap-5">
        <AdminListFrame>
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-2xl font-bold text-ink-900">환불 요청 목록</h2>
            <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
              {refundsUnavailable
                ? "데이터 준비 필요"
                : `${refunds.length.toLocaleString("ko-KR")}건`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-sunken text-xs font-bold text-ink-500">
                <tr>
                  <th className="px-5 py-3">접수일</th>
                  <th className="px-5 py-3">의뢰/결제</th>
                  <th className="px-5 py-3">신청자</th>
                  <th className="px-5 py-3 text-right">금액</th>
                  <th className="px-5 py-3">사유</th>
                  <th className="px-5 py-3">상태</th>
                  <th className="px-5 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {refunds.length === 0 ? (
                  <tr>
                    <td className="px-5 py-5 font-semibold text-ink-500" colSpan={7}>
                      환불 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr key={refund.id} className="align-top">
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {formatDate(refund.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-ink-900">
                          REQ-{refund.supervisionRequestId.slice(0, 4).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-ink-500">
                          {paymentStatusLabel(refund.paymentStatus)}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {refund.initiatedBy ?? "신청자 미기록"}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-ink-900">
                        ₩{refund.amountKrw.toLocaleString("ko-KR")}
                      </td>
                      <td className="max-w-[240px] px-5 py-4 text-ink-600">
                        {refund.reason ?? "사유 없음"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                          {refundStatusLabel(refund.status)}
                        </span>
                        <p className="mt-2 text-xs font-semibold text-ink-500">
                          {requestStatusLabel(refund.requestStatus)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <details className="inline-block text-left">
                          <summary className="cursor-pointer list-none rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-blue-sm">
                            검토
                          </summary>
                          <div className="mt-3 w-[min(560px,calc(100vw-3rem))] rounded-xl border border-line bg-surface-elevated p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                            <AdminActionPanel
                              actions={[
                                {
                                  label: "승인",
                                  tone: "primary",
                                  url: `/api/admin/refunds/${refund.id}/approve`
                                },
                                {
                                  label: "반려",
                                  tone: "secondary",
                                  url: `/api/admin/refunds/${refund.id}/reject`
                                }
                              ]}
                              reasonPlaceholder="예: 환불 사유와 진행 상태를 확인했습니다."
                            />
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminListFrame>
      </section>
    </AdminShell>
  );
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 미확인";
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
  return labels[status] ?? "상태 미분류";
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
  return labels[status] ?? "상태 미분류";
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
  return labels[status] ?? "상태 미분류";
}
