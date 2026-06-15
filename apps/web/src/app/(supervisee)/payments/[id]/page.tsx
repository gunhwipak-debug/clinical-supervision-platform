import Link from "next/link";
import type { ReactNode } from "react";
import { payments, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import {
  FlowStepNav,
  PrimaryActionPanel,
  SectionBlock
} from "../../../../components/clinicflow-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor } from "@/lib/supervision/authz";
import { RefundRequestForm } from "./refund-request-form";

export const dynamic = "force-dynamic";

export default async function PaymentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  const { id } = await params;
  if (!current) {
    return <LoginRequiredState title="결제 상세" returnTo={`/payments/${id}`} />;
  }
  const currentShellUser = current.user;
  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="결제 상세"
        description="결제 상세는 신청자 계정에서 확인합니다."
        actionHref="/supervisor"
        actionLabel="슈퍼바이저 업무 보기"
      />
    );
  }

  let payment: payments.PaymentRecord | null;
  try {
    payment = await withUserContext(
      createRuntimeDatabase(),
      contextFor(current),
      (tx) => payments.getPaymentById(tx, id)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[supervisee.payment-detail.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    payment = null;
  }
  if (!payment || payment.superviseeId !== current.session.userId) {
    return (
      <AppShell
        active="payments"
        currentUser={current.user}
        title="영수증 상세"
        subtitle="접근 가능한 결제를 찾지 못했습니다."
      >
        <EmptyState
          title="결제가 없습니다"
          description="결제 목록에서 다시 선택해주세요."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      active="payments"
      currentUser={current.user}
      action={
        <Button asChild variant="secondary">
          <Link href="/payments">결제 내역</Link>
        </Button>
      }
      subtitle={`${paymentLabel(payment.status)} · ${payment.productTitle ?? "슈퍼비전 결제"}`}
      title="결제 상세"
    >
      <FlowStepNav
        current="확인·결제"
        steps={[
          "슈퍼바이저 선택",
          "세션·일정",
          "사례자료 정리",
          "확인·결제",
          "학습 기록"
        ]}
      />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <PrimaryActionPanel
            action={
              payment.status === "pending" &&
              payment.requestStatus === "awaiting_payment" ? (
                <Button asChild variant="secondary">
                  <Link href={`/requests/${payment.supervisionRequestId}`}>
                    결제 이어가기
                  </Link>
                </Button>
              ) : undefined
            }
            title={paymentActionTitle(payment.status, payment.requestStatus)}
          >
            {paymentActionDescription(payment.status, payment.requestStatus)}
          </PrimaryActionPanel>

          <SectionBlock
            subtitle="무엇을 결제했는지, 현재 상태가 무엇인지 먼저 확인합니다."
            title="결제 정보"
          >
            <div className="grid divide-y divide-line rounded-2xl border border-line bg-surface-elevated text-sm">
              <SummaryLine
                label="상태"
                value={
                  <Badge tone={paymentTone(payment.status)}>
                    {paymentLabel(payment.status)}
                  </Badge>
                }
              />
              <SummaryLine
                label="금액"
                value={`₩${payment.amountKrw.toLocaleString("ko-KR")}`}
              />
              <SummaryLine
                label="세션"
                value={payment.productTitle ?? "슈퍼비전 결제"}
              />
              <SummaryLine label="접수일" value={formatDate(payment.createdAt)} />
              <SummaryLine
                label="의뢰 상태"
                value={requestStatusLabel(payment.requestStatus)}
              />
              <SummaryLine label="결제 접수번호" value={shortPaymentId(payment.id)} />
            </div>
          </SectionBlock>

          <SectionBlock
            subtitle="환불이나 정산 확인이 필요할 때만 펼쳐 보면 됩니다."
            title="금액 세부 내역"
          >
            <div className="grid divide-y divide-line rounded-2xl border border-line bg-surface-elevated text-sm">
              <SummaryLine
                label="결제 처리 상태"
                value={payment.pgPaymentKey ? "승인 완료" : "승인 대기"}
              />
              <SummaryLine
                label="플랫폼 수수료"
                value={`₩${payment.platformFeeKrw.toLocaleString("ko-KR")}`}
              />
              <SummaryLine
                label="슈퍼바이저 정산 예정"
                value={`₩${payment.supervisorNetKrw.toLocaleString("ko-KR")}`}
              />
            </div>
          </SectionBlock>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          {payment.status === "paid" || payment.status === "partially_refunded" ? (
            <RefundRequestForm maxAmount={payment.amountKrw} paymentId={payment.id} />
          ) : (
            <div className="grid gap-3">
              <h2 className="text-xl font-bold text-ink-900">환불 요청</h2>
              <p className="text-sm leading-relaxed text-ink-500">
                결제 완료 상태가 되면 이곳에서 환불 요청을 남길 수 있습니다.
              </p>
            </div>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="break-words font-semibold leading-relaxed text-ink-900">
        {value}
      </span>
    </div>
  );
}

function paymentActionTitle(status: string, requestStatus: string): string {
  if (status === "pending" && requestStatus === "awaiting_payment") {
    return "결제를 이어서 진행하세요";
  }
  if (status === "paid") return "결제가 완료되었습니다";
  if (status === "partially_refunded") return "일부 환불이 반영되었습니다";
  if (status === "refunded") return "환불이 완료되었습니다";
  if (status === "failed") return "결제를 완료하지 못했습니다";
  return "결제 상태를 확인하세요";
}

function paymentActionDescription(status: string, requestStatus: string): string {
  if (status === "pending" && requestStatus === "awaiting_payment") {
    return "결제가 끝나야 슈퍼바이저가 의뢰를 확인할 수 있습니다. 중단된 결제는 의뢰 상세에서 다시 이어갈 수 있습니다.";
  }
  if (status === "paid") {
    return "결제는 완료되었습니다. 이후 진행 상태는 의뢰 상세 화면에서 확인하세요.";
  }
  if (status === "partially_refunded") {
    return "일부 환불이 처리되었습니다. 남은 금액과 의뢰 상태를 함께 확인하세요.";
  }
  if (status === "refunded") {
    return "환불이 완료된 결제입니다. 필요한 경우 의뢰 기록에서 진행 상태를 확인하세요.";
  }
  if (status === "failed") {
    return "결제가 완료되지 않았습니다. 의뢰 상세에서 다시 시도하거나 다른 결제 수단을 사용하세요.";
  }
  return "결제 상태와 관련 의뢰를 한 화면에서 확인합니다.";
}

function paymentLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "결제 대기",
    paid: "결제 완료",
    failed: "실패",
    partially_refunded: "부분 환불",
    refunded: "환불 완료",
    cancelled: "취소"
  };
  return labels[status] ?? "결제 상태 확인 필요";
}

function paymentTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "paid" || status === "partially_refunded") return "brand";
  if (status === "pending") return "accent";
  if (status === "failed" || status === "cancelled") return "danger";
  return "neutral";
}

function requestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: "제출됨",
    awaiting_payment: "결제 대기",
    paid: "결제 완료",
    awaiting_supervisor_review: "수락 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 제출",
    completion_record_issued: "학습 기록 발급",
    completed: "완료",
    refunded: "환불됨"
  };
  return labels[status] ?? "의뢰 상태 확인 필요";
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Seoul",
    year: "numeric"
  }).format(date);
}

function shortPaymentId(id: string): string {
  return id.slice(-8).toUpperCase();
}
