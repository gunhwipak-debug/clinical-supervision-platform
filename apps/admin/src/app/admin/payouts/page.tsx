import { payments, withUserContext } from "@csp/db";
import {
  AdminCard,
  AdminListFrame,
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
      <AdminShell title="정산" subtitle="관리자 로그인이 필요합니다.">
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
      title="정산"
      subtitle="정산 기간, 금액, 지급 상태를 확인합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AdminListFrame>
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">정산 항목</h2>
            </div>
            <span className="rounded-md bg-accent-100 px-3 py-1 text-sm font-bold text-ink-900">
              {payoutsUnavailable
                ? "데이터 준비 필요"
                : `${payouts.length.toLocaleString("ko-KR")}건`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-sunken text-xs font-bold text-ink-500">
                <tr>
                  <th className="px-5 py-3">기간</th>
                  <th className="px-5 py-3">슈퍼바이저</th>
                  <th className="px-5 py-3 text-right">완료 결제</th>
                  <th className="px-5 py-3 text-right">환불 반영</th>
                  <th className="px-5 py-3 text-right">지급 예정액</th>
                  <th className="px-5 py-3">상태</th>
                  <th className="px-5 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payouts.length === 0 ? (
                  <tr>
                    <td className="px-5 py-5 font-semibold text-ink-500" colSpan={7}>
                      정산 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-5 py-4 font-semibold text-ink-900">
                        {formatDate(payout.periodStart)} -{" "}
                        {formatDate(payout.periodEnd)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-700">
                        {payout.supervisorId.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink-700">
                        ₩{payout.grossKrw.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink-700">
                        ₩0
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-ink-900">
                        ₩{payout.netKrw.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                          {payoutStatusLabel(payout.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <details className="inline-block text-left">
                          <summary className="cursor-pointer list-none rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink-800">
                            정산 확인
                          </summary>
                          <dl className="mt-3 grid w-72 gap-2 rounded-xl border border-line bg-surface-elevated p-4 text-sm shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                            <RowMeta
                              label="수수료"
                              value={`₩${payout.platformFeeKrw.toLocaleString("ko-KR")}`}
                            />
                            <RowMeta
                              label="지급 예정"
                              value={
                                payout.scheduledAt
                                  ? formatDate(payout.scheduledAt)
                                  : "예정일 미정"
                              }
                            />
                            <RowMeta
                              label="지급 완료"
                              value={
                                payout.paidAt ? formatDate(payout.paidAt) : "미지급"
                              }
                            />
                          </dl>
                        </details>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminListFrame>

        <AdminCard className="h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-ink-900">정산 계산</h2>
          <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
            {payoutsUnavailable
              ? "지급 계산 준비 필요"
              : `정산 합계 ${totalNet.toLocaleString("ko-KR")}원 · ${payouts.length.toLocaleString("ko-KR")}건`}
          </p>
          <div className="mt-5 border-t border-line pt-5">
            <PayoutComputeForm />
          </div>
        </AdminCard>
      </section>
    </AdminShell>
  );
}

function RowMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-semibold text-ink-400">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
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
  return labels[status] ?? "상태 미분류";
}
