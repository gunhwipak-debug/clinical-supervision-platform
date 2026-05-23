import { payments, withUserContext } from "@csp/db";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { AdminCard, AdminShell } from "../../../components/admin-shell";
import {
  createRuntimeDatabase,
  getCurrentAdmin
} from "../../../lib/auth/current-admin";
import { PayoutComputeForm } from "../../../components/payout-compute-form";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="정산 요약" subtitle="관리자 로그인이 필요합니다.">
        <AdminCard>관리자 계정으로 로그인해주세요.</AdminCard>
      </AdminShell>
    );
  }

  const db = createRuntimeDatabase();
  const payouts = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: "admin",
      adminReason: "운영 정산 요약 조회를 위한 관리자 사유입니다."
    },
    (tx) => payments.listPayouts(tx)
  );

  const totalNet = payouts.reduce((sum, payout) => sum + payout.netKrw, 0);

  return (
    <main className="min-h-screen bg-surface-base pb-10 text-ink-900">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 px-5 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a aria-label="관리자 대시보드" href="/admin">
            <ArrowLeft aria-hidden className="text-ink-700" size={30} />
          </a>
          <h1 className="text-2xl font-bold">지급 관리</h1>
          <span className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            정산 산출
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-7">
        <div className="rounded-2xl border border-line bg-surface-elevated px-5 py-4 text-center text-base font-semibold text-ink-700 shadow-card">
          {payoutPeriodLabel(payouts)}
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
            <p className="text-lg font-bold text-ink-700">총 지급 예정 금액</p>
            <p className="mt-4 text-4xl font-bold">
              ₩{totalNet.toLocaleString("ko-KR")}
            </p>
          </AdminCard>
          <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
            <p className="text-lg font-bold text-ink-700">총 건수</p>
            <p className="mt-4 text-4xl font-bold">{String(payouts.length)}건</p>
          </AdminCard>
        </section>

        <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Banknote aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold">정산 산출 상태</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                기간을 지정해 정산을 산출하고, 산출된 결과를 슈퍼바이저별 지급 예정
                목록으로 갱신합니다. 실제 송금, 세금계산서, 지급 실패 재처리는 후속 운영
                절차에서 다룹니다.
              </p>
            </div>
          </div>
          <PayoutComputeForm />
        </AdminCard>

        <section className="grid gap-4" aria-label="정산 항목">
          {payouts.length === 0 ? (
            <AdminCard className="rounded-3xl border-line bg-surface-elevated p-6 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ShieldCheck aria-hidden size={20} />
                </span>
                <div>
                  <strong className="text-xl text-ink-900">
                    아직 산출된 정산이 없습니다
                  </strong>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    기간을 지정해 정산 산출을 실행하면 슈퍼바이저별 정산이 표시됩니다.
                  </p>
                </div>
              </div>
            </AdminCard>
          ) : (
            payouts.map((payout) => (
              <AdminCard
                className="grid gap-4 rounded-3xl border-line bg-surface-elevated p-6 shadow-card"
                key={payout.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-ink-500">
                      지급 예정액
                    </span>
                    <strong className="mt-1 block text-3xl text-ink-900">
                      ₩{payout.netKrw.toLocaleString("ko-KR")}
                    </strong>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <WalletCards aria-hidden size={20} />
                  </span>
                </div>
                <div className="grid gap-2 rounded-2xl bg-brand-50 p-4 text-sm text-ink-700">
                  <span className="flex justify-between gap-3">
                    <span>총액</span>
                    <strong>₩{payout.grossKrw.toLocaleString("ko-KR")}</strong>
                  </span>
                  <span className="flex justify-between gap-3">
                    <span>플랫폼 수수료</span>
                    <strong>₩{payout.platformFeeKrw.toLocaleString("ko-KR")}</strong>
                  </span>
                  <span className="flex justify-between gap-3">
                    <span>상태</span>
                    <strong>{payoutStatusLabel(payout.status)}</strong>
                  </span>
                </div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-500">
                  <CalendarDays aria-hidden size={15} />
                  {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                </p>
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
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function payoutStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    failed: "지급 실패",
    held: "보류",
    paid: "지급 완료",
    scheduled: "지급 예정"
  };
  return labels[status] ?? status;
}

function payoutPeriodLabel(
  payouts: Array<{ periodStart: Date | string; periodEnd: Date | string }>
): string {
  if (payouts.length === 0) {
    return "아직 산출된 정산 기간이 없습니다";
  }
  const starts = payouts.map((payout) => new Date(payout.periodStart).getTime());
  const ends = payouts.map((payout) => new Date(payout.periodEnd).getTime());
  return `정산 기간 ${formatDate(new Date(Math.min(...starts)))} - ${formatDate(
    new Date(Math.max(...ends))
  )}`;
}
