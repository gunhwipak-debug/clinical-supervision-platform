"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";

const refundSchema = z.object({
  amount: z.coerce.number().int().positive().optional().or(z.literal("")),
  reason: z.string().min(10, "환불 사유를 10자 이상 입력해주세요.")
});

type RefundInput = z.input<typeof refundSchema>;
type RefundValues = z.output<typeof refundSchema>;

export function RefundRequestForm({
  paymentId,
  maxAmount
}: {
  paymentId: string;
  maxAmount: number;
}) {
  const [message, setMessage] = useState("");
  const form = useForm<RefundInput, unknown, RefundValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: "", reason: "" }
  });

  async function submit(values: RefundValues) {
    const response = await fetch(`/api/payments/${paymentId}/refund`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: typeof values.amount === "number" ? values.amount : undefined,
        reason: values.reason
      })
    });
    const body = (await response.json()) as { error?: { code: string } };
    const next = response.ok
      ? "환불 요청이 접수되었습니다."
      : refundErrorMessage(body.error?.code);
    setMessage(next);
    if (response.ok) {
      toast.success(next);
    } else {
      toast.error(next);
    }
  }

  return (
    <Card className="h-fit rounded-xl">
      <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
        <div>
          <h2 className="text-xl font-bold text-ink-900">환불 요청</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            요청은 관리자 큐로 접수됩니다. 실제 환불 처리는 운영자 승인 후 진행됩니다.
          </p>
        </div>
        <Field>
          <Label htmlFor="amount">금액</Label>
          <Input
            className="h-12 rounded-lg"
            id="amount"
            max={maxAmount}
            min={1}
            placeholder="비우면 전액"
            type="number"
            {...form.register("amount")}
          />
          {form.formState.errors.amount ? (
            <p className="text-sm text-danger">
              {form.formState.errors.amount.message}
            </p>
          ) : (
            <p className="text-xs text-ink-500">
              비워두면 결제 금액 전체를 요청합니다.
            </p>
          )}
        </Field>
        <Field>
          <Label htmlFor="reason">사유</Label>
          <Textarea
            className="rounded-lg"
            id="reason"
            placeholder="환불이 필요한 사유를 10자 이상 남겨주세요."
            {...form.register("reason")}
          />
          {form.formState.errors.reason ? (
            <p className="text-sm text-danger">
              {form.formState.errors.reason.message}
            </p>
          ) : null}
        </Field>
        <Button disabled={form.formState.isSubmitting} type="submit">
          <RotateCcw aria-hidden size={18} />
          환불 요청
        </Button>
        {message ? (
          <p className="rounded-lg bg-surface-sunken px-4 py-3 text-sm text-ink-700">
            {message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}

function refundErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    amount_mismatch: "요청 금액이 결제 금액 또는 기존 환불 요청과 맞지 않습니다.",
    forbidden: "이 결제에 환불을 요청할 권한이 없습니다.",
    invalid_request: "환불 금액과 사유를 다시 확인해주세요.",
    invalid_state: "현재 결제 상태에서는 환불을 요청할 수 없습니다.",
    not_found: "결제 내역을 찾지 못했습니다.",
    refund_cutoff:
      "세션 시작 24시간 전부터는 자동 환불 요청 대신 관리자 문의가 필요합니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return (
    labels[code ?? ""] ?? "환불 요청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요."
  );
}
