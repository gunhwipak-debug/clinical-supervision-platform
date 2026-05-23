"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "../../../../components/app-shell";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";

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

  return (
    <AppShell title="결제 승인 확인" subtitle="토스페이먼츠 승인 결과를 확인합니다.">
      <Card className="mx-auto grid max-w-xl gap-5 rounded-3xl p-8 text-center">
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${
            state === "failed"
              ? "bg-danger/10 text-danger"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          <span className="material-symbols-outlined">
            {state === "checking"
              ? "hourglass_empty"
              : state === "success"
                ? "check_circle"
                : "error"}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {state === "checking"
              ? "승인 확인 중"
              : state === "success"
                ? "결제 승인 완료"
                : "결제 승인 실패"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{message}</p>
        </div>
        {state === "failed" ? (
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/payments">결제 내역으로 이동</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/requests">내 의뢰 확인</Link>
            </Button>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
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
