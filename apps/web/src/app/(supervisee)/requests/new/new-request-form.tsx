"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FlowStepNav } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";

const requestSchema = z.object({
  serviceProductId: z.uuid("세션 선택이 필요합니다."),
  retentionDays: z.coerce
    .number()
    .refine((value) => value === 7 || value === 30 || value === 90, {
      message: "보관 기간은 7, 30, 90일 중 하나여야 합니다."
    }),
  urgency: z.enum(["normal", "urgent_24h"]),
  desiredDeadline: z.string().optional(),
  selectedSlotEnd: z.string().optional(),
  selectedSlotStart: z.string().optional()
});

type RequestInput = z.input<typeof requestSchema>;
type RequestValues = z.output<typeof requestSchema>;

export function NewRequestForm({
  selectedSlot,
  selectedSlotEnd,
  selectedSlotStart,
  selection,
  serviceProductId
}: {
  selection: {
    productDescription: string | null;
    productKind: string | null;
    productPriceKrw: number | null;
    productTitle: string | null;
    supervisorName: string | null;
  };
  selectedSlot?: string;
  selectedSlotEnd?: string;
  selectedSlotStart?: string;
  serviceProductId: string;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const hasSelectedProduct = serviceProductId.length > 0;
  const requiresSelectedSlot = isTimedBookingProduct(selection.productKind);
  const hasSelectedSlot = Boolean(selectedSlotStart && selectedSlotEnd);
  const canSubmit = hasSelectedProduct && (!requiresSelectedSlot || hasSelectedSlot);
  const form = useForm<RequestInput, unknown, RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      serviceProductId,
      retentionDays: 30,
      urgency: "normal",
      desiredDeadline: "",
      selectedSlotEnd: selectedSlotEnd ?? "",
      selectedSlotStart: selectedSlotStart ?? ""
    }
  });
  const retentionDaysField = form.register("retentionDays", { valueAsNumber: true });
  const selectedRetentionDays = form.watch("retentionDays");
  const currentActionLabel = "신청 초안 저장";
  const blockingMessage = !hasSelectedProduct
    ? "슈퍼바이저 프로필에서 세션을 먼저 선택해야 초안을 저장할 수 있습니다."
    : requiresSelectedSlot && !hasSelectedSlot
      ? "화상 세션은 가능한 일정을 먼저 선택해야 초안을 저장할 수 있습니다."
      : "";
  const timingValue = requiresSelectedSlot
    ? selectedSlot || "시간 선택 필요"
    : "일정 예약 없음";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function submit(values: RequestValues) {
    setMessage("저장 중입니다.");
    const response = await fetch("/api/supervision-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        desiredDeadline: values.desiredDeadline || null,
        selectedSlotEnd: values.selectedSlotEnd || null,
        selectedSlotStart: values.selectedSlotStart || null
      })
    });
    const body = (await response.json()) as {
      data?: { request?: { id: string } };
      error?: { code: string };
    };
    if (response.ok && body.data?.request?.id) {
      toast.success("초안을 저장했습니다. 이어서 사례 자료를 정리해주세요.");
      window.location.href = `/requests/${body.data.request.id}#case-files`;
      return;
    }
    const nextMessage = requestErrorMessage(body.error?.code);
    setMessage(nextMessage);
    toast.error(nextMessage);
  }

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(submit)}>
      <FlowStepNav
        current="세션·일정"
        steps={[
          "슈퍼바이저 선택",
          "세션·일정",
          "사례자료 정리",
          "확인·결제",
          "학습 기록"
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <section className="grid gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="grid gap-2">
                <p className="text-sm font-bold text-brand-700">세션·일정</p>
                <h2 className="text-3xl font-bold tracking-tight text-ink-900">
                  초안에 필요한 선택만 확인합니다
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-ink-500">
                  저장이 끝나면 의뢰 상세 화면에서 사례 자료와 질문을 정리합니다.
                </p>
                {blockingMessage ? (
                  <p aria-live="polite" className="text-sm font-semibold text-ink-700">
                    {blockingMessage}
                  </p>
                ) : null}
              </div>
              {hasSelectedProduct ? (
                <Button
                  disabled={!isHydrated || !canSubmit || form.formState.isSubmitting}
                  type="submit"
                >
                  {currentActionLabel}
                </Button>
              ) : (
                <Button asChild>
                  <a href="/supervisors">슈퍼바이저 찾기</a>
                </Button>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
              <RequestRow
                description={
                  selection.supervisorName
                    ? "선택한 슈퍼바이저가 맞는지 확인합니다."
                    : "슈퍼바이저 프로필에서 먼저 선택합니다."
                }
                label="1. 슈퍼바이저"
                status={selection.supervisorName ? "완료" : "선택 필요"}
                value={selection.supervisorName ?? "아직 선택되지 않았습니다"}
              />
              <RequestRow
                description={
                  selection.productDescription ??
                  "세션 종류와 금액은 슈퍼바이저 프로필에서 고른 내용을 그대로 가져옵니다."
                }
                label="2. 세션"
                status={hasSelectedProduct ? "완료" : "선택 필요"}
                value={selection.productTitle ?? "선택된 세션이 없습니다"}
              />
              <RequestRow
                description={
                  requiresSelectedSlot
                    ? "가능 일정에서 고른 시간이 맞는지 확인합니다."
                    : "이 세션은 자료를 올리면 일정 예약 없이 검토가 시작됩니다."
                }
                label="3. 일정"
                status={!requiresSelectedSlot || hasSelectedSlot ? "완료" : "선택 필요"}
                value={timingValue}
              />
              <RequestRow
                description="신청 초안 저장 후 의뢰 상세 화면에서 사례 요약, 검사 결과, 질문을 정리합니다."
                label="4. 사례자료 정리"
                status={canSubmit ? "다음" : "준비 중"}
                value={currentActionLabel}
              />

              <input type="hidden" {...form.register("serviceProductId")} />
              <input type="hidden" {...form.register("selectedSlotStart")} />
              <input type="hidden" {...form.register("selectedSlotEnd")} />

              <details className="border-t border-line px-5 py-4">
                <summary className="cursor-pointer text-sm font-bold text-ink-900">
                  기본 설정 조정
                </summary>
                <div className="mt-4 grid gap-4">
                  <div className="grid divide-y divide-line rounded-xl border border-line">
                    {[7, 30, 90].map((days) => (
                      <label
                        className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3"
                        key={days}
                      >
                        <span>
                          <span className="text-base font-bold text-ink-900">
                            {days}일
                          </span>
                          <span className="ml-3 text-sm text-ink-500">
                            완료 후 선택한 기간에 맞춰 원자료를 관리합니다.
                          </span>
                        </span>
                        <input
                          checked={Number(selectedRetentionDays) === days}
                          name={retentionDaysField.name}
                          onBlur={retentionDaysField.onBlur}
                          onChange={retentionDaysField.onChange}
                          ref={retentionDaysField.ref}
                          type="radio"
                          value={days}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-ink-900">검토 속도</span>
                    <select
                      className="h-11 rounded-lg border border-line bg-surface-elevated px-3 text-sm text-ink-900"
                      {...form.register("urgency")}
                    >
                      <option value="normal">일반</option>
                      <option value="urgent_24h">24시간 긴급</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-ink-900">희망 마감일</span>
                    <input
                      className="h-11 rounded-lg border border-line bg-surface-elevated px-3 text-sm text-ink-900"
                      type="date"
                      {...form.register("desiredDeadline")}
                    />
                  </label>
                </div>
              </details>

              {message ? (
                <p
                  aria-live="polite"
                  className="border-t border-line px-5 py-4 text-sm text-ink-500"
                >
                  {message}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-ink-900">선택 요약</h2>
          <div className="mt-4 grid divide-y divide-line">
            <SummaryLine
              label="슈퍼바이저"
              value={selection.supervisorName ?? "미선택"}
            />
            <SummaryLine label="세션" value={selection.productTitle ?? "미선택"} />
            <SummaryLine label="일정" value={timingValue} />
            <SummaryLine
              label="금액"
              value={formatCurrency(selection.productPriceKrw)}
            />
            <SummaryLine label="다음" value="사례 자료 정리" />
          </div>
        </aside>
      </div>
    </form>
  );
}

function RequestRow({
  description,
  label,
  status,
  value
}: {
  description: string;
  label: string;
  status: string;
  value: string;
}) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-ink-900">{label}</p>
        <p className="mt-2 break-keep text-base font-semibold text-ink-700">{value}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
      </div>
      <p className="text-base font-bold text-ink-900">{status}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="grid gap-1 py-3 text-sm">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-800">{value}</span>
    </p>
  );
}

function requestErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    calendar_config_required:
      "일정 연동 설정이 완료되지 않아 예약을 진행할 수 없습니다.",
    calendar_not_connected:
      "슈퍼바이저의 일정 연동이 아직 완료되지 않아 이 시간대는 예약할 수 없습니다.",
    calendar_reauth_required:
      "슈퍼바이저의 일정 연동을 다시 확인해야 합니다. 확인 전까지 이 시간대는 예약할 수 없습니다.",
    calendar_sync_failed:
      "예약 시간을 일정표에 반영하지 못했습니다. 확인 전까지 이 시간대는 예약할 수 없습니다.",
    invalid_request: "요청 형식이 올바르지 않습니다.",
    invalid_slot: "선택한 일정이 올바르지 않습니다.",
    product_unavailable: "선택한 세션을 이용할 수 없습니다.",
    slot_required: "희망 일정을 먼저 선택해주세요.",
    slot_unavailable: "이미 예약되었거나 선택할 수 없는 시간입니다."
  };
  return labels[code ?? ""] ?? "요청서를 저장하지 못했습니다.";
}

function isTimedBookingProduct(kind: string | null | undefined): boolean {
  return kind === "zoom_60" || kind === "zoom_90";
}

function formatCurrency(value: number | null): string {
  return value !== null
    ? `₩ ${value.toLocaleString("ko-KR")}`
    : "세션 선택 후 표시됩니다";
}
