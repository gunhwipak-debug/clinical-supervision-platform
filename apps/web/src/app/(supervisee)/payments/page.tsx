import Link from "next/link";
import { payments, withUserContext } from "@csp/db";
import { ArrowRight } from "lucide-react";
import { AppShell } from "../../../components/app-shell";
import { FlowStepNav } from "../../../components/clinicflow-shell";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../components/locked-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor } from "@/lib/supervision/authz";

export const dynamic = "force-dynamic";

type PaymentRecord = payments.PaymentRecord;

export default async function PaymentsPage() {
  const current = await getCurrentUser();
  if (!current) {
    return <LoginRequiredState title="결제 내역" returnTo="/payments" />;
  }
  if (!isSupervisee(current)) {
    return (
      <RoleRequiredState
        title="결제 내역"
        description="결제 내역은 신청자 계정에서 확인합니다."
        actionHref="/supervisor"
        actionLabel="슈퍼바이저 업무 보기"
      />
    );
  }

  const db = createRuntimeDatabase();
  const allPayments = await withUserContext(db, contextFor(current), (tx) =>
    payments.listPayments(tx)
  );
  const ownPayments = allPayments.filter(
    (payment) => payment.superviseeId === current.session.userId
  );
  const pendingPayments = ownPayments.filter((payment) => payment.status === "pending");
  const latestPayment = [...ownPayments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return (
    <AppShell
      title="결제 내역"
      subtitle="내가 신청한 슈퍼비전 결제, 환불, 영수증 상태를 확인합니다."
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
      {ownPayments.length === 0 ? (
        <EmptyState
          title="아직 결제 내역이 없습니다"
          description="슈퍼바이저 프로필에서 일정과 슈퍼비전 방식을 선택해 의뢰를 만들면 결제 내역이 이곳에 표시됩니다."
          action={
            <Button asChild>
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5">
            <section className="rounded-2xl bg-ink-900 px-6 py-7 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">
                    최종 확인
                  </p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight">
                    {pendingPayments.length > 0
                      ? "선택 내용을 확인하고 결제합니다"
                      : "결제와 신청 완료 내역을 확인합니다"}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
                    {pendingPayments.length > 0
                      ? "중단된 결제가 있으면 같은 의뢰에서 바로 이어서 진행할 수 있습니다."
                      : "완료된 결제와 환불 상태를 한 줄씩 확인하고 필요한 영수증 화면으로 이동합니다."}
                  </p>
                </div>
                <Button
                  asChild
                  variant={pendingPayments.length > 0 ? "primary" : "secondary"}
                >
                  <Link
                    href={
                      pendingPayments[0]
                        ? (`/payments/${pendingPayments[0].id}` as never)
                        : "/supervisors"
                    }
                  >
                    {pendingPayments.length > 0 ? "결제 이어가기" : "슈퍼바이저 찾기"}
                  </Link>
                </Button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-surface-elevated">
              <div className="grid divide-y divide-line">
                {ownPayments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-ink-900">결제 요약</h2>
            <div className="mt-5 grid divide-y divide-line text-sm">
              <SummaryLine
                label="결제 대기"
                value={`${pendingPayments.length.toLocaleString("ko-KR")}건`}
              />
              <SummaryLine
                label="전체 내역"
                value={`${ownPayments.length.toLocaleString("ko-KR")}건`}
              />
              <SummaryLine
                label="최근 상태"
                value={latestPayment ? paymentLabel(latestPayment.status) : "내역 없음"}
              />
              <SummaryLine
                label="최근 금액"
                value={
                  latestPayment
                    ? `₩${latestPayment.amountKrw.toLocaleString("ko-KR")}`
                    : "내역 없음"
                }
              />
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  return (
    <Link
      className="grid gap-4 px-5 py-5 transition hover:bg-surface-sunken md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center"
      href={`/payments/${payment.id}`}
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={paymentTone(payment.status)}>
            {paymentLabel(payment.status)}
          </Badge>
          <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-semibold text-ink-700">
            {requestStatusLabel(payment.requestStatus)}
          </span>
        </div>
        <h2 className="truncate text-2xl font-bold tracking-tight text-ink-900">
          {payment.productTitle ?? "슈퍼비전 결제"}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          결제 접수번호 {shortPaymentId(payment.id)} · 접수일{" "}
          {formatDate(payment.createdAt)}
        </p>
      </div>
      <p className="text-left text-3xl font-bold tracking-tight text-ink-900 md:text-right">
        ₩{payment.amountKrw.toLocaleString("ko-KR")}
      </p>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <p className="text-xs font-semibold text-ink-500">
          {payment.paidAt ? `결제 ${formatDate(payment.paidAt)}` : "결제 대기"}
        </p>
        <ArrowRight aria-hidden className="text-brand-600" size={22} />
      </div>
    </Link>
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

function paymentLabel(status: string): string {
  const labels: Record<string, string> = {
    cancelled: "취소",
    failed: "실패",
    paid: "결제 완료",
    partially_refunded: "부분 환불",
    pending: "결제 대기",
    refunded: "환불 완료"
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
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청",
    awaiting_payment: "결제 대기",
    awaiting_supervisor_review: "수락 대기",
    cancelled: "취소",
    completed: "완료",
    completion_record_issued: "학습 기록 발급",
    draft: "작성 중",
    expired: "만료",
    feedback_submitted: "피드백 제출",
    in_review: "검토 중",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불됨",
    rejected: "수락되지 않음",
    submitted: "제출됨"
  };
  return labels[status] ?? "의뢰 상태 확인 필요";
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function shortPaymentId(id: string): string {
  return id.slice(-8).toUpperCase();
}
