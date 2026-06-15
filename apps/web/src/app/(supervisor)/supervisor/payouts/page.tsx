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
      active="supervisor-payouts"
      currentUser={current.user}
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">슈퍼바이저 업무로 돌아가기</Link>
        </Button>
      }
      title="정산 내역"
      subtitle="슈퍼비전 결제에서 플랫폼 수수료와 환불 반영 후 정산되는 금액을 확인합니다."
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>정산 기록</CardTitle>
            <CardDescription>
              예정, 완료, 보류된 정산을 한 표에서 확인합니다.
            </CardDescription>
          </CardHeader>
          {payouts.length === 0 ? (
            <p className="rounded-md border border-line bg-surface-sunken p-4 text-sm text-ink-600">
              {payoutsUnavailable
                ? "현재 정산 내역을 불러오지 못했습니다. 지급 예정과 완료 내역은 연결되면 이 표에 표시됩니다."
                : "아직 산정된 정산 기록이 없습니다. 결제 완료 후 운영자가 정산 기간을 산정하면 이곳에 표시됩니다."}
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

        <aside className="grid content-start gap-4">
          <Card className="grid gap-5 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-brand-700">정산 요약</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900">
                예정과 완료 내역만 먼저 확인하세요
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                환불 심사 중인 건은 보류될 수 있으며, 지급 처리는 운영자가 확인 후
                진행합니다.
              </p>
            </div>

            <div className="grid gap-3 border-y border-line py-4 text-sm">
              <SummaryLine
                label="이번 달 예정"
                value={
                  payoutsUnavailable
                    ? "확인 필요"
                    : `${payouts
                        .filter((payout) => payout.status === "scheduled")
                        .length.toLocaleString("ko-KR")}건`
                }
              />
              <SummaryLine
                label="완료 결제"
                value={
                  payoutsUnavailable
                    ? "확인 필요"
                    : `${paidPayments.length.toLocaleString("ko-KR")}건`
                }
              />
              <SummaryLine
                label="예정 금액"
                value={payoutsUnavailable ? "확인 필요" : formatKrw(scheduledNet)}
              />
              <SummaryLine
                label="누적 순정산"
                value={payoutsUnavailable ? "확인 필요" : formatKrw(totalNet)}
              />
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-ink-900">최근 결제</p>
              <p className="text-sm text-ink-500">
                내 슈퍼비전 방식으로 결제된 최신 내역입니다.
              </p>
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
            </div>

            <p className="rounded-md border border-line bg-surface-sunken p-3 text-sm text-ink-700">
              완료 결제만 정산 대상에 포함되며, 부분 환불은 실제 환불 금액만 차감합니다.
            </p>
          </Card>
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="font-semibold text-ink-500">{label}</p>
      <p className="text-base font-bold text-ink-900">{value}</p>
    </div>
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
