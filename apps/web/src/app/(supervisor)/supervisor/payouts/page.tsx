import Link from "next/link";
import { payments, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { isSupervisor } from "../../../../lib/auth/guards";

export const dynamic = "force-dynamic";

type Payout = payments.PayoutRecord;
type Payment = payments.PaymentRecord;

export default async function SupervisorPayoutsPage() {
  const current = await getCurrentUser();

  if (!isSupervisor(current)) {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="정산 내역은 슈퍼바이저 계정으로 로그인해야 확인할 수 있습니다."
        />
      </main>
    );
  }

  const db = createRuntimeDatabase();
  const [payouts, allPayments] = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    (tx) =>
      Promise.all([
        payments.listPayouts(tx, current.session.userId),
        payments.listPayments(tx)
      ])
  );
  const supervisorPayments = allPayments.filter(
    (payment) => payment.supervisorId === current.session.userId
  );
  const paidPayments = supervisorPayments.filter((payment) =>
    ["paid", "partially_refunded"].includes(payment.status)
  );
  const totalNet = paidPayments.reduce(
    (sum, payment) => sum + payment.supervisorNetKrw,
    0
  );
  const scheduledNet = payouts
    .filter((payout) => payout.status === "scheduled")
    .reduce((sum, payout) => sum + payout.netKrw, 0);

  return (
    <AppShell
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">슈퍼바이저 업무로 돌아가기</Link>
        </Button>
      }
      title="정산 내역"
      subtitle="슈퍼비전 결제에서 플랫폼 수수료와 환불 반영 후 정산되는 금액을 확인합니다."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="결제 완료 건"
          value={`${paidPayments.length.toLocaleString("ko-KR")}건`}
        />
        <SummaryCard label="정산 예정액" value={formatKrw(scheduledNet)} />
        <SummaryCard label="누적 순정산 기준" value={formatKrw(totalNet)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>정산 기록</CardTitle>
            <CardDescription>
              관리자 정산 산정이 완료된 기간별 정산 기록입니다.
            </CardDescription>
          </CardHeader>
          {payouts.length === 0 ? (
            <p className="rounded-md border border-line bg-surface-sunken p-4 text-sm text-ink-600">
              아직 산정된 정산 기록이 없습니다. 결제 완료 후 운영자가 정산 기간을
              산정하면 이곳에 표시됩니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line text-xs font-semibold text-ink-500">
                  <tr>
                    <th className="py-3 pr-4">기간</th>
                    <th className="py-3 pr-4">상태</th>
                    <th className="py-3 pr-4 text-right">총 결제</th>
                    <th className="py-3 pr-4 text-right">수수료</th>
                    <th className="py-3 text-right">정산액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.map((payout) => (
                    <PayoutRow key={payout.id} payout={payout} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>정산 기준</CardTitle>
              <CardDescription>
                환불이 완료된 금액은 정산 가능 금액에서 차감됩니다.
              </CardDescription>
            </CardHeader>
            <ul className="grid gap-3 text-sm text-ink-700">
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                결제 상태가 완료된 의뢰만 정산 대상에 포함됩니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                부분 환불은 실제 완료된 환불 금액만 차감합니다.
              </li>
              <li className="rounded-md border border-line bg-surface-sunken p-3">
                지급 처리는 운영자가 관리자 콘솔에서 확인 후 진행합니다.
              </li>
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 결제</CardTitle>
              <CardDescription>
                내 슈퍼비전 상품에 결제된 최근 항목입니다.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-2">
              {supervisorPayments.slice(0, 5).map((payment) => (
                <PaymentPreview key={payment.id} payment={payment} />
              ))}
              {supervisorPayments.length === 0 ? (
                <p className="rounded-md border border-line bg-surface-sunken p-3 text-sm text-ink-600">
                  아직 결제된 의뢰가 없습니다.
                </p>
              ) : null}
            </div>
          </Card>
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="grid gap-1">
      <p className="text-sm font-semibold text-ink-500">{label}</p>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
    </Card>
  );
}

function PayoutRow({ payout }: { payout: Payout }) {
  return (
    <tr>
      <td className="py-4 pr-4 font-semibold text-ink-900">
        {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
      </td>
      <td className="py-4 pr-4">
        <Badge tone={payoutTone(payout.status)}>
          {payoutStatusLabel(payout.status)}
        </Badge>
      </td>
      <td className="py-4 pr-4 text-right text-ink-700">
        {formatKrw(payout.grossKrw)}
      </td>
      <td className="py-4 pr-4 text-right text-ink-700">
        {formatKrw(payout.platformFeeKrw)}
      </td>
      <td className="py-4 text-right font-bold text-ink-900">
        {formatKrw(payout.netKrw)}
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
