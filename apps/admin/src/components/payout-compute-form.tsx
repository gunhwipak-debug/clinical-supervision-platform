"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ComputeResponse = {
  data?: { payouts?: unknown[] } | null;
  error?: { code?: string; message?: string } | null;
};

export function PayoutComputeForm() {
  const router = useRouter();
  const defaults = useMemo(() => defaultPeriod(), []);
  const [periodStart, setPeriodStart] = useState(defaults.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaults.periodEnd);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payouts/compute", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-reason": reason
        },
        body: JSON.stringify({ periodEnd, periodStart })
      });
      const body = (await response.json().catch(() => null)) as ComputeResponse | null;

      if (!response.ok) {
        setMessage(body?.error?.message ?? body?.error?.code ?? "정산 산출 실패");
        return;
      }

      const count = body?.data?.payouts?.length ?? 0;
      setMessage(`정산 산출 완료: ${count.toLocaleString("ko-KR")}건`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || reason.trim().length < 30 || periodStart > periodEnd;

  return (
    <div className="mt-5 grid gap-3 rounded-2xl bg-brand-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-ink-700">
          <span>시작일</span>
          <input
            className="rounded-2xl border border-line bg-surface-elevated px-3 py-2"
            onChange={(event) => setPeriodStart(event.target.value)}
            type="date"
            value={periodStart}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink-700">
          <span>종료일</span>
          <input
            className="rounded-2xl border border-line bg-surface-elevated px-3 py-2"
            onChange={(event) => setPeriodEnd(event.target.value)}
            type="date"
            value={periodEnd}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-ink-700">
        <span>관리자 사유</span>
        <textarea
          className="min-h-20 rounded-2xl border border-line bg-surface-elevated px-3 py-2"
          minLength={30}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 이번 정산 기간의 결제 완료·환불 완료 내역을 확인하고 정산 산출을 실행합니다."
          value={reason}
        />
        <span className="text-xs font-semibold text-ink-500">
          정산 산출 근거를 30자 이상 직접 입력해야 실행할 수 있습니다.
        </span>
      </label>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold text-ink-500">
          결제 완료액에서 완료 환불액을 차감해 슈퍼바이저별 예정 정산을 갱신합니다.
        </p>
        <button
          className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={() => void submit()}
          type="button"
        >
          {busy ? "산출 중" : "정산 산출 실행"}
        </button>
      </div>
      {message ? <p className="text-xs font-semibold text-ink-700">{message}</p> : null}
    </div>
  );
}

function defaultPeriod(): { periodEnd: string; periodStart: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    periodEnd: formatDateInput(now),
    periodStart: formatDateInput(start)
  };
}

function formatDateInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
