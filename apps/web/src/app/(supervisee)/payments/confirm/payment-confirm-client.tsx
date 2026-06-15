"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "../../../../components/app-shell";
import {
  FlowStepNav,
  PrimaryActionPanel,
  SectionBlock
} from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";

type ConfirmState = "checking" | "success" | "failed";

export function PaymentConfirmClient({
  amount,
  paymentId,
  paymentKey
}: {
  amount: string;
  paymentId: string;
  paymentKey: string;
}) {
  const [state, setState] = useState<ConfirmState>("checking");
  const [message, setMessage] = useState("결제 승인 결과를 확인하고 있습니다.");

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      const parsedAmount = Number(amount);
      if (!paymentId || !paymentKey || !Number.isFinite(parsedAmount)) {
        setState("failed");
        setMessage("결제 승인 정보가 올바르지 않습니다.");
        return;
      }

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          paymentId,
          pgPaymentKey: paymentKey
        })
      });

      if (cancelled) return;
      if (response.ok) {
        setState("success");
        setMessage("결제가 승인되었습니다. 결제 상세로 이동합니다.");
        toast.success("결제가 승인되었습니다.");
        window.setTimeout(() => {
          window.location.replace(`/payments/${paymentId}`);
        }, 800);
        return;
      }

      const body = (await response.json()) as { error?: { code?: string } };
      setState("failed");
      setMessage(paymentError(body.error?.code));
      toast.error(paymentError(body.error?.code));
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [amount, paymentId, paymentKey]);

  const action =
    state === "failed" ? (
      <Button asChild variant="secondary">
        <Link href="/payments">결제 내역으로 이동</Link>
      </Button>
    ) : undefined;

  return (
    <AppShell title="결제 결과 확인" subtitle="결제가 의뢰와 연결되는지 확인합니다.">
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

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <PrimaryActionPanel action={action} title={stateTitle(state)}>
            {message}
          </PrimaryActionPanel>

          <SectionBlock
            subtitle="결제 승인 요청이 어떤 의뢰와 연결되는지 한 줄씩 확인합니다."
            title="결제 처리 정보"
          >
            <div className="grid divide-y divide-line rounded-xl border border-line bg-surface-elevated text-sm">
              <SummaryLine label="처리 상태" value={stateLabel(state)} />
              <SummaryLine label="결제 금액" value={formatAmount(amount)} />
              <SummaryLine label="결제 접수번호" value={paymentId || "확인 중"} />
            </div>
          </SectionBlock>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-ink-900">다음 단계</h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine label="진행 위치" value="확인·결제" />
            <SummaryLine label="승인 상태" value={stateLabel(state)} />
            <SummaryLine
              label="이후 화면"
              value={
                state === "success"
                  ? "결제 상세로 자동 이동"
                  : state === "failed"
                    ? "결제 내역에서 다시 확인"
                    : "승인 결과 대기"
              }
            />
          </div>
          {state === "failed" ? (
            <div className="mt-5 grid gap-3">
              <Button asChild>
                <Link href="/payments">결제 내역으로 이동</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/requests">내 의뢰 확인</Link>
              </Button>
            </div>
          ) : null}
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="break-keep font-semibold leading-relaxed text-ink-900">
        {value}
      </span>
    </div>
  );
}

function stateTitle(state: ConfirmState): string {
  if (state === "checking") return "결제 승인을 확인하고 있습니다";
  if (state === "success") return "결제가 승인되었습니다";
  return "결제를 승인하지 못했습니다";
}

function stateLabel(state: ConfirmState): string {
  if (state === "checking") return "확인 중";
  if (state === "success") return "승인 완료";
  return "승인 실패";
}

function formatAmount(amount: string): string {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) return "확인 필요";
  return `₩${parsed.toLocaleString("ko-KR")}`;
}

function paymentError(code: string | undefined): string {
  const labels: Record<string, string> = {
    amount_mismatch: "결제 금액이 의뢰 금액과 일치하지 않습니다.",
    forbidden: "이 결제를 승인할 권한이 없습니다.",
    invalid_state: "이미 처리되었거나 승인할 수 없는 결제입니다.",
    invalid_request: "결제 승인 정보가 올바르지 않습니다.",
    not_found: "결제 내역을 찾지 못했습니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "결제 승인에 실패했습니다.";
}
