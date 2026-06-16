import Link from "next/link";
import { payments, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardHeader, CardTitle } from "../../../../components/ui/card";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { isSupervisor } from "../../../../lib/auth/guards";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";

export const dynamic = "force-dynamic";

type Payout = payments.PayoutRecord;
type Payment = payments.PaymentRecord;

export default async function SupervisorPayoutsPage() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="정산 내역" returnTo="/supervisor/payouts" />;
  }
  const currentShellUser = current.user;
  if (!isSupervisor(current)) {
    return (
      <RoleRequiredState
        currentUser={currentShellUser}
        title="정산 내역"
        description="정산 내역은 슈퍼바이저 계정에서만 확인합니다."
      />
    );
  }

  let payouts: Payout[];
  let allPayments: Payment[];
  let payoutsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    [payouts, allPayments] = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) =>
        Promise.all([
          payments.listPayouts(tx, current.session.userId),
          payments.listPayments(tx)
        ])
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    payouts = [];
    allPayments = [];
    payoutsUnavailable = true;
  }
  const supervisorPayments = allPayments.filter(
    (payment) => payment.supervisorId === current.session.userId
  );

  return (
    <AppShell
      active="supervisor-payouts"
      currentUser={current.user}
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">슈퍼바이저 업무로 돌아가기</Link>
        </Button>
      }
      title="정산 내역"
      subtitle="결제 완료 건과 정산 예정 금액을 확인합니다."
    >
      <section className="grid gap-6">
        <Card className="rounded-xl">
          <CardHeader className="border-b border-line">
            <div className="flex items-center justify-between gap-4">
              <CardTitle>정산 기록</CardTitle>
              <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
                {payoutsUnavailable
                  ? "데이터 준비 필요"
                  : `${payouts.length.toLocaleString("ko-KR")}건`}
              </span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-sunken text-xs font-bold text-ink-500">
                <tr>
                  <th className="px-5 py-3">기간</th>
                  <th className="px-5 py-3 text-right">완료 결제</th>
                  <th className="px-5 py-3 text-right">수수료</th>
                  <th className="px-5 py-3 text-right">환불 반영</th>
                  <th className="px-5 py-3 text-right">지급 예정액</th>
                  <th className="px-5 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payouts.length === 0 ? (
                  <tr>
                    <td className="px-5 py-5 font-semibold text-ink-500" colSpan={6}>
                      정산 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => <PayoutRow key={payout.id} payout={payout} />)
                )}
              </tbody>
            </table>
          </div>

          {supervisorPayments.length > 0 ? (
            <div className="border-t border-line px-5 py-4">
              <p className="text-sm font-bold text-ink-900">최근 결제</p>
              <div className="mt-3 grid gap-2">
                {supervisorPayments.slice(0, 3).map((payment) => (
                  <PaymentPreview key={payment.id} payment={payment} />
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </AppShell>
  );
}

function PayoutRow({ payout }: { payout: Payout }) {
  return (
    <tr>
      <td className="px-5 py-4 font-semibold text-ink-900">
        {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
      </td>
      <td className="px-5 py-4 text-right text-ink-700">
        {formatKrw(payout.grossKrw)}
      </td>
      <td className="px-5 py-4 text-right text-ink-700">
        {formatKrw(payout.platformFeeKrw)}
      </td>
      <td className="px-5 py-4 text-right text-ink-700">{formatKrw(0)}</td>
      <td className="px-5 py-4 text-right font-bold text-ink-900">
        {formatKrw(payout.netKrw)}
      </td>
      <td className="px-5 py-4">
        <Badge tone={payoutTone(payout.status)}>
          {payoutStatusLabel(payout.status)}
        </Badge>
      </td>
    </tr>
  );
}

function PaymentPreview({ payment }: { payment: Payment }) {
  return (
    <Link
      className="rounded-md border border-line bg-surface-sunken p-3 text-sm transition hover:bg-surface-elevated"
      href={`/supervisor/requests/${payment.supervisionRequestId}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ink-900">
          {payment.productTitle ?? "슈퍼비전 결제"}
        </span>
        <Badge tone={payment.status === "paid" ? "brand" : "neutral"}>
          {paymentStatusLabel(payment.status)}
        </Badge>
      </div>
      <p className="mt-1 text-ink-600">{formatKrw(payment.supervisorNetKrw)}</p>
    </Link>
  );
}

function payoutStatusLabel(status: payments.PayoutStatus): string {
  const labels = {
    failed: "지급 실패",
    held: "보류",
    paid: "지급 완료",
    scheduled: "지급 예정"
  } satisfies Record<payments.PayoutStatus, string>;
  return labels[status];
}

function payoutTone(
  status: payments.PayoutStatus
): "brand" | "accent" | "neutral" | "danger" {
  if (status === "paid") return "brand";
  if (status === "scheduled") return "accent";
  if (status === "failed") return "danger";
  return "neutral";
}

function paymentStatusLabel(status: payments.PaymentStatus): string {
  const labels = {
    cancelled: "취소",
    failed: "실패",
    paid: "결제 완료",
    partially_refunded: "부분 환불",
    pending: "결제 대기",
    refunded: "환불 완료"
  } satisfies Record<payments.PaymentStatus, string>;
  return labels[status];
}

function formatKrw(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
