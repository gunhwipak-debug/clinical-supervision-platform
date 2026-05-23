import Link from "next/link";
import { payments, withUserContext } from "@csp/db";
import { ArrowLeft, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
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
  if (!current || !isSupervisee(current)) {
    return (
      <AppShell title="영수증 상세" subtitle="슈퍼바이지 로그인이 필요합니다.">
        <EmptyState
          title="로그인이 필요합니다"
          description="영수증은 로그인 후 확인할 수 있습니다."
        />
      </AppShell>
    );
  }

  const payment = await withUserContext(
    createRuntimeDatabase(),
    contextFor(current),
    (tx) => payments.getPaymentById(tx, id)
  );
  if (!payment || payment.superviseeId !== current.session.userId) {
    return (
      <AppShell title="영수증 상세" subtitle="접근 가능한 결제를 찾지 못했습니다.">
        <EmptyState
          title="결제가 없습니다"
          description="결제 목록에서 다시 선택해주세요."
        />
      </AppShell>
    );
  }

  return (
    <main className="min-h-screen bg-surface-base pb-24 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link aria-label="결제 내역" href="/payments">
            <ArrowLeft aria-hidden className="text-ink-700" size={30} />
          </Link>
          <h1 className="text-2xl font-bold">영수증 상세</h1>
          <span className="size-8" />
        </div>
      </header>

      <div className="mx-auto grid max-w-4xl gap-5 px-5 py-7">
        <Card className="relative overflow-hidden rounded-3xl border border-outline-variant/80 bg-surface-container-lowest p-7 shadow-xl shadow-secondary/5 dark:bg-inverse-surface/10">
          {/* 장식용 프리미엄 탑 그라데이션 라인 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <div className="mb-5 flex items-start justify-between gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <ReceiptText aria-hidden size={24} />
            </span>
            <Badge tone={paymentTone(payment.status)}>
              {paymentLabel(payment.status)}
            </Badge>
          </div>
          <p className="text-sm font-semibold tracking-wide text-on-surface-variant/80 uppercase">
            {payment.productTitle ?? "임상 슈퍼비전 결제 서비스"}
          </p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-primary dark:text-inverse-primary">
            ₩{payment.amountKrw.toLocaleString("ko-KR")}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-xs border-t border-dashed border-outline-variant/60 pt-4 text-xs text-on-surface-variant">
            <span>결제번호</span>
            <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] font-bold text-secondary">
              {shortPaymentId(payment.id)}
            </code>
            <span className="text-outline-variant/60">|</span>
            <span>의뢰 상태</span>
            <Badge tone="neutral" className="text-[10px] py-0 px-1.5">
              {requestStatusLabel(payment.requestStatus)}
            </Badge>
          </div>
        </Card>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-3xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-lg shadow-outline-variant/5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink-900">금액 상세</h2>
                <p className="mt-1 text-sm text-ink-500">
                  플랫폼 수수료와 정산 예정액을 분리해 표시합니다.
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <WalletCards aria-hidden size={20} />
              </span>
            </div>
            <dl className="grid gap-4 text-sm">
              {[
                ["결제일", formatDate(payment.createdAt)],
                ["결제 대행사", paymentProviderLabel(payment.pgProvider)],
                ["승인 상태", payment.pgPaymentKey ? "승인 완료" : "승인 대기"],
                ["금액", `₩${payment.amountKrw.toLocaleString("ko-KR")}`],
                ["플랫폼 수수료", `₩${payment.platformFeeKrw.toLocaleString("ko-KR")}`],
                [
                  "슈퍼바이저 정산 예정",
                  `₩${payment.supervisorNetKrw.toLocaleString("ko-KR")}`
                ]
              ].map(([label, value]) => (
                <div
                  className="flex justify-between gap-4 border-b border-line pb-3 last:border-b-0"
                  key={label}
                >
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="break-all text-right font-semibold text-ink-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 inline-flex items-start gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
              <ShieldCheck aria-hidden className="mt-0.5 text-brand-600" size={17} />
              환불 요청은 접수만 생성하며, 실제 처리와 정산 반영은 관리자 검토 후
              진행됩니다.
            </p>
          </Card>
          {payment.status === "paid" || payment.status === "partially_refunded" ? (
            <RefundRequestForm maxAmount={payment.amountKrw} paymentId={payment.id} />
          ) : payment.status === "pending" &&
            payment.requestStatus === "awaiting_payment" ? (
            <Card className="h-fit rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <h2 className="text-xl font-bold text-ink-900">결제 다시 시도</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                결제창이 닫혔거나 중단된 경우 의뢰 상세에서 같은 결제를 다시 이어갈 수
                있습니다.
              </p>
              <Link
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-ink-900 px-4 py-3 text-sm font-bold text-surface-elevated transition hover:bg-ink-700"
                href={`/requests/${payment.supervisionRequestId}`}
              >
                의뢰에서 결제 다시 시도
              </Link>
            </Card>
          ) : (
            <Card className="h-fit rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <h2 className="text-xl font-bold text-ink-900">환불 요청</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                결제 완료 상태가 되면 환불 요청을 만들 수 있습니다.
              </p>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
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
    submitted: "제출됨",
    awaiting_payment: "결제 대기",
    paid: "결제 완료",
    awaiting_supervisor_review: "검토 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 제출",
    completion_record_issued: "완료기록 발급",
    completed: "완료",
    refunded: "환불됨"
  };
  return labels[status] ?? status;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function paymentProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    toss: "토스페이먼츠"
  };
  return labels[provider] ?? "결제 대행사 확인 필요";
}

function shortPaymentId(id: string): string {
  return id.slice(-8).toUpperCase();
}
