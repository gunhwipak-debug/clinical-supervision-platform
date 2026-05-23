import Link from "next/link";
import { payments, withUserContext } from "@csp/db";
import { ArrowRight, CreditCard, ReceiptText, WalletCards } from "lucide-react";
import { AppShell } from "../../../components/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import { contextFor } from "@/lib/supervision/authz";

export const dynamic = "force-dynamic";

type PaymentRecord = payments.PaymentRecord;

export default async function PaymentsPage() {
  const current = await getCurrentUser();
  if (!current || !isSupervisee(current)) {
    return (
      <AppShell title="결제 내역" subtitle="결제 내역을 보려면 로그인이 필요합니다.">
        <EmptyState
          title="로그인이 필요합니다"
          description="슈퍼비전 의뢰 결제와 환불 상태는 로그인 후 확인할 수 있습니다."
          action={
            <Button asChild>
              <Link href="/login">로그인</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const db = createRuntimeDatabase();
  const allPayments = await withUserContext(db, contextFor(current), (tx) =>
    payments.listPayments(tx)
  );
  const ownPayments = allPayments.filter(
    (payment) => payment.superviseeId === current.session.userId
  );
  const paidTotal = ownPayments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amountKrw, 0);
  const pendingCount = ownPayments.filter(
    (payment) => payment.status === "pending"
  ).length;

  return (
    <AppShell
      title="결제 내역"
      subtitle="내가 슈퍼바이지로 신청한 슈퍼비전 결제, 환불, 영수증 상태를 확인합니다."
      action={
        <Button asChild>
          <Link href="/supervisors">새 의뢰 찾기</Link>
        </Button>
      }
    >
      {ownPayments.length === 0 ? (
        <EmptyState
          title="아직 결제 내역이 없습니다"
          description="슈퍼바이저 프로필에서 일정과 상품을 선택해 의뢰를 만들면 결제 내역이 이곳에 표시됩니다."
          action={
            <Button asChild>
              <Link href="/supervisors">슈퍼바이저 찾기</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<WalletCards aria-hidden size={22} />}
              label="결제 건수"
              value={`${ownPayments.length.toLocaleString("ko-KR")}건`}
            />
            <SummaryCard
              icon={<CreditCard aria-hidden size={22} />}
              label="결제 완료 금액"
              value={`₩${paidTotal.toLocaleString("ko-KR")}`}
            />
            <SummaryCard
              icon={<ReceiptText aria-hidden size={22} />}
              label="결제 대기"
              value={`${pendingCount.toLocaleString("ko-KR")}건`}
            />
          </section>

          <section className="grid gap-3">
            {ownPayments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-ink-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
      </div>
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
    </Card>
  );
}

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  return (
    <Link
      className="grid gap-4 rounded-2xl border border-line bg-surface-elevated p-5 shadow-card transition hover:border-brand-600 md:grid-cols-[1fr_auto]"
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
        <h2 className="truncate text-lg font-bold text-ink-900">
          {payment.productTitle ?? "슈퍼비전 결제"}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          결제번호 {shortPaymentId(payment.id)} · 생성 {formatDate(payment.createdAt)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:min-w-48 md:justify-end">
        <div className="text-left md:text-right">
          <p className="text-2xl font-bold text-ink-900">
            ₩{payment.amountKrw.toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-500">
            {payment.paidAt ? `결제 ${formatDate(payment.paidAt)}` : "결제 대기"}
          </p>
        </div>
        <ArrowRight aria-hidden className="text-brand-600" size={22} />
      </div>
    </Link>
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
  return labels[status] ?? status;
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
    additional_info_requested: "보완 요청",
    awaiting_payment: "결제 대기",
    awaiting_supervisor_review: "검토 대기",
    cancelled: "취소",
    completed: "완료",
    completion_record_issued: "완료기록 발급",
    draft: "작성 중",
    expired: "만료",
    feedback_submitted: "피드백 제출",
    in_review: "검토 중",
    meeting_completed: "상담 완료",
    meeting_scheduled: "일정 확정",
    paid: "결제 완료",
    refunded: "환불됨",
    rejected: "반려",
    submitted: "제출됨"
  };
  return labels[status] ?? status;
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
