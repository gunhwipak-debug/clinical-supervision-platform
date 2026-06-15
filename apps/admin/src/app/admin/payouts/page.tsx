import { payments, withUserContext } from "@csp/db";
import { Banknote, CalendarDays, ShieldCheck, WalletCards } from "lucide-react";
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
import { PayoutComputeForm } from "../../../components/payout-compute-form";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const current = await getCurrentAdmin();

  if (!current) {
    return (
      <AdminShell title="정산 요약" subtitle="관리자 로그인이 필요합니다.">
        <AdminLockedState
          title="정산 관리는 관리자 권한이 필요합니다"
          description="완료된 슈퍼비전의 지급 예정액과 보류 사유를 확인하는 운영 화면입니다."
          returnPath="/admin/payouts"
          previewItems={[
            "정산 예정 금액과 지급 상태",
            "슈퍼바이저별 지급 내역",
            "정산 계산과 보류 사유"
          ]}
        />
      </AdminShell>
    );
  }

  let payouts: payments.PayoutRecord[];
  let payoutsUnavailable = false;
  try {
    const db = createRuntimeDatabase();
    payouts = await withUserContext(
      db,
      {
        userId: current.session.userId,
        role: "admin",
        adminReason: "운영 정산 요약 조회를 위한 처리 사유입니다."
      },
      (tx) => payments.listPayouts(tx)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[admin.payouts.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    payouts = [];
    payoutsUnavailable = true;
  }

  const totalNet = payouts.reduce((sum, payout) => sum + payout.netKrw, 0);

  return (
    <AdminShell
      currentAdmin={{ email: current.user.email }}
      currentPath="/admin/payouts"
      title="지급 관리"
      subtitle="완료된 슈퍼비전의 지급 예정액과 보류 사유를 같은 흐름에서 확인합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminCard>
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Banknote aria-hidden size={22} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">정산 기간과 요약</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                {payoutPeriodLabel(payouts)}
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
            <div>
              <dt className="font-bold text-ink-500">총 지급 예정 금액</dt>
              <dd className="mt-1 text-2xl font-bold text-ink-900">
                {payoutsUnavailable
                  ? "확인 필요"
                  : `₩${totalNet.toLocaleString("ko-KR")}`}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink-500">총 건수</dt>
              <dd className="mt-1 text-2xl font-bold text-ink-900">
                {payoutsUnavailable
                  ? "확인 필요"
                  : `${payouts.length.toLocaleString("ko-KR")}건`}
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
              <h2 className="text-xl font-bold text-ink-900">정산 계산</h2>
              <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
                산출된 결과를 슈퍼바이저별 지급 예정 목록으로 갱신합니다. 실제 송금과
                재처리는 후속 운영 절차에서 다룹니다.
              </p>
            </div>
          </div>
          <PayoutComputeForm />
        </AdminCard>
      </section>

      <AdminCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">정산 항목</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              지급 예정액, 기간, 수수료를 한 행에서 확인합니다.
            </p>
          </div>
          <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
            {payoutsUnavailable
              ? "확인 필요"
              : `${payouts.length.toLocaleString("ko-KR")}건`}
          </span>
        </div>

        {payouts.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-ink-500">
            {payoutsUnavailable
              ? "현재 정산 항목을 불러오지 못했습니다. 지급 예정액, 기간, 수수료는 연결되면 이 목록에 표시됩니다."
              : "기간을 지정해 정산 계산을 실행하면 슈퍼바이저별 정산이 표시됩니다."}
          </p>
        ) : (
          <div className="grid divide-y divide-line" aria-label="정산 항목">
            {payouts.map((payout) => (
              <article className="grid gap-5 p-5" key={payout.id}>
                <div className="grid gap-4 md:grid-cols-[1fr_260px] md:items-start">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <WalletCards aria-hidden size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-500">지급 예정액</p>
                      <strong className="mt-1 block text-3xl text-ink-900">
                        ₩{payout.netKrw.toLocaleString("ko-KR")}
                      </strong>
                      <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-ink-500">
                        <CalendarDays aria-hidden size={15} />
                        {formatDate(payout.periodStart)} -{" "}
                        {formatDate(payout.periodEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-xl bg-surface-sunken p-4 text-sm text-ink-700">
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
                </div>
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
  return labels[status] ?? "상태 확인 필요";
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
