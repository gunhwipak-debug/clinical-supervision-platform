"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FlowStepNav } from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import {
  AVAILABILITY_TIMEZONE_LABEL,
  generateBookableStartSlots,
  type AvailabilityException,
  type BookableStartSlot,
  type WeeklyAvailabilitySlot
} from "../../../../lib/availability-calendar";
import {
  durationMinutesForProduct,
  displaySupervisionMethodDescription,
  displaySupervisionMethodName,
  feedbackDeadlineLabel,
  isTimedBookingKind
} from "../../../../lib/supervision-method-catalog";

const requestSchema = z.object({
  serviceProductId: z.uuid("슈퍼비전 방식 선택이 필요합니다."),
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
type StepState = "completed" | "current" | "locked";
type RequestStepRow = {
  action?: {
    href: string;
    label: string;
  };
  description: string;
  label: string;
  state: StepState;
  value: string;
};

type SelectionSummary = {
  availability: WeeklyAvailabilitySlot[];
  availabilityExceptions: AvailabilityException[];
  productDescription: string | null;
  productKind: string | null;
  productPriceKrw: number | null;
  productTitle: string | null;
  productTurnaroundHours: number | null;
  supervisorName: string | null;
};

const asyncRequestFlowSteps = [
  "슈퍼바이저 선택",
  "슈퍼비전 방식",
  "사례자료 정리",
  "답변 확인",
  "결제",
  "수락 대기",
  "피드백 확인"
] as const;

const liveRequestFlowSteps = [
  "슈퍼바이저 선택",
  "슈퍼비전 방식",
  "날짜와 시간",
  "사례자료 정리",
  "답변 확인",
  "결제",
  "수락 대기",
  "미팅 링크 확인"
] as const;

export function NewRequestForm({
  selectedSlot,
  selectedSlotEnd,
  selectedSlotStart,
  selection,
  serviceProductId
}: {
  selection: SelectionSummary;
  selectedSlot?: string;
  selectedSlotEnd?: string;
  selectedSlotStart?: string;
  serviceProductId: string;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSlotState, setSelectedSlotState] = useState({
    end: selectedSlotEnd ?? "",
    label:
      selectedSlot ||
      formatSelectedSlotLabel(selectedSlotStart ?? "", selectedSlotEnd ?? ""),
    start: selectedSlotStart ?? ""
  });
  const hasSelectedProduct = serviceProductId.length > 0;
  const requiresSelectedSlot = isTimedBookingKind(selection.productKind);
  const hasSelectedSlot = Boolean(selectedSlotState.start && selectedSlotState.end);
  const canSubmit = hasSelectedProduct && (!requiresSelectedSlot || hasSelectedSlot);
  const durationMinutes = durationMinutesForProduct({
    kind: selection.productKind,
    turnaroundHours: selection.productTurnaroundHours
  });
  const bookableSlots = useMemo(
    () =>
      requiresSelectedSlot && durationMinutes
        ? generateBookableStartSlots({
            durationMinutes,
            exceptions: selection.availabilityExceptions,
            weeklySlots: selection.availability
          })
        : [],
    [
      durationMinutes,
      requiresSelectedSlot,
      selection.availability,
      selection.availabilityExceptions
    ]
  );
  const methodName = displaySupervisionMethodName({
    kind: selection.productKind,
    title: selection.productTitle
  });
  const methodDescription = displaySupervisionMethodDescription({
    description: selection.productDescription,
    kind: selection.productKind
  });
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
    ? "슈퍼바이저 프로필에서 슈퍼비전 방식을 선택해야 초안을 저장할 수 있습니다."
    : requiresSelectedSlot && !hasSelectedSlot
      ? "화상 슈퍼비전은 가능한 날짜와 시간을 선택해야 초안을 저장할 수 있습니다."
      : "";
  const timingValue = requiresSelectedSlot
    ? selectedSlotState.label || "일정 미선택"
    : "예약 시간 선택 없음";
  const currentStep = !selection.supervisorName
    ? "슈퍼바이저 선택"
    : !hasSelectedProduct
      ? "슈퍼비전 방식"
      : requiresSelectedSlot && !hasSelectedSlot
        ? "날짜와 시간"
        : "사례자료 정리";
  const requestFlowSteps = requiresSelectedSlot
    ? liveRequestFlowSteps
    : asyncRequestFlowSteps;
  const stepRows = buildRequestSteps({
    canSubmit,
    currentStep,
    hasSelectedProduct,
    hasSelectedSlot,
    methodDescription,
    methodName,
    requiresSelectedSlot,
    selectedSlotLabel: timingValue,
    selection
  });

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
      <FlowStepNav current={currentStep} steps={requestFlowSteps} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <section className="grid gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="grid gap-2">
                <p className="text-sm font-bold text-brand-700">세션·일정</p>
                <h2 className="text-3xl font-bold tracking-tight text-ink-900">
                  현재 선택을 확인하고 초안을 저장합니다
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-ink-500">
                  초안 저장 뒤 사례자료 정리, 답변 확인, 결제, 수락 대기가 이어집니다.
                  화상 슈퍼비전은 날짜와 시간을 먼저 선택합니다.
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
              {stepRows.map((step, index) => (
                <RequestRow
                  description={step.description}
                  key={step.label}
                  label={`${String(index + 1)}. ${step.label}`}
                  state={step.state}
                  value={step.value}
                  {...(step.action ? { action: step.action } : {})}
                />
              ))}

              <input type="hidden" {...form.register("serviceProductId")} />
              <input type="hidden" {...form.register("selectedSlotStart")} />
              <input type="hidden" {...form.register("selectedSlotEnd")} />

              {requiresSelectedSlot ? (
                <BookingSlotPicker
                  durationMinutes={durationMinutes ?? 90}
                  onSelect={(slot) => {
                    form.setValue("selectedSlotStart", slot.startIso, {
                      shouldValidate: true
                    });
                    form.setValue("selectedSlotEnd", slot.endIso, {
                      shouldValidate: true
                    });
                    setSelectedSlotState({
                      end: slot.endIso,
                      label: slot.label,
                      start: slot.startIso
                    });
                  }}
                  selectedStart={selectedSlotState.start}
                  slots={bookableSlots}
                />
              ) : null}

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
          <h2 className="text-lg font-bold text-ink-900">선택값</h2>
          <div className="mt-4 grid divide-y divide-line">
            <SummaryLine
              label="슈퍼바이저"
              value={selection.supervisorName ?? "미선택"}
            />
            <SummaryLine
              label="슈퍼비전 방식"
              value={hasSelectedProduct ? methodName : "미선택"}
            />
            <SummaryLine label="예약 시간" value={timingValue} />
            <SummaryLine
              label="금액"
              value={formatCurrency(selection.productPriceKrw)}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}

function BookingSlotPicker({
  durationMinutes,
  onSelect,
  selectedStart,
  slots
}: {
  durationMinutes: number;
  onSelect: (slot: BookableStartSlot) => void;
  selectedStart: string;
  slots: BookableStartSlot[];
}) {
  const grouped = groupBookableSlots(slots);

  return (
    <section
      className="border-t border-line bg-surface-base px-5 py-5"
      id="booking-slots"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-700">예약 시간</p>
          <h3 className="mt-1 text-xl font-bold text-ink-900">
            화상 슈퍼비전 {String(durationMinutes)}분
          </h3>
          <p className="mt-1 text-sm font-semibold text-ink-500">
            {AVAILABILITY_TIMEZONE_LABEL}
          </p>
        </div>
      </div>

      {grouped.length > 0 ? (
        <div className="mt-4 grid max-h-[560px] gap-3 overflow-auto pr-1">
          {grouped.map((group) => (
            <div
              className="grid gap-2 rounded-md border border-line bg-surface-elevated px-4 py-3 md:grid-cols-[170px_minmax(0,1fr)]"
              key={group.date}
            >
              <span className="text-sm font-bold text-ink-900">{group.label}</span>
              <div className="flex flex-wrap gap-2">
                {group.slots.map((slot) => {
                  const active = slot.startIso === selectedStart;
                  return (
                    <button
                      aria-pressed={active}
                      className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line bg-surface-base text-ink-700 hover:border-brand-200 hover:text-brand-700"
                      }`}
                      key={slot.key}
                      onClick={() => onSelect(slot)}
                      title={`${slot.label} · ${AVAILABILITY_TIMEZONE_LABEL}`}
                      type="button"
                    >
                      {slot.startTime}-{slot.endTime}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 rounded-md border border-line bg-surface-elevated px-4 py-4">
          <p className="text-sm font-bold text-ink-800">
            현재 예약 가능한 시간이 없습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-md border border-line px-3 py-2 text-sm font-bold text-ink-700 transition hover:text-brand-700"
              href="/supervisors"
            >
              다른 슈퍼바이저 보기
            </a>
            <a
              className="rounded-md border border-line px-3 py-2 text-sm font-bold text-ink-700 transition hover:text-brand-700"
              href="/supervisors"
            >
              다른 슈퍼비전 방식 선택
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

function RequestRow({
  action,
  description,
  label,
  state,
  value
}: {
  action?: {
    href: string;
    label: string;
  };
  description: string;
  label: string;
  state: StepState;
  value: string;
}) {
  const rowTone =
    state === "current"
      ? "bg-brand-50/60"
      : state === "locked"
        ? "bg-surface-base text-ink-500"
        : "bg-surface-elevated";
  const titleTone = state === "locked" ? "text-ink-500" : "text-ink-900";
  const valueTone = state === "locked" ? "text-ink-500" : "text-ink-700";
  const stateTone =
    state === "current"
      ? "bg-brand-600 text-white"
      : state === "completed"
        ? "bg-brand-50 text-brand-700"
        : "bg-surface-sunken text-ink-500";

  return (
    <div
      aria-disabled={state === "locked" ? true : undefined}
      className={`grid gap-3 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_80px_auto] md:items-center ${rowTone}`}
    >
      <div className="min-w-0">
        <p className={`text-lg font-bold tracking-tight ${titleTone}`}>{label}</p>
        <p className={`mt-1 break-keep text-sm font-semibold ${valueTone}`}>{value}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
      </div>
      <span
        className={`w-fit rounded-md px-3 py-1 text-sm font-bold md:justify-self-end ${stateTone}`}
      >
        {stepStateLabel(state)}
      </span>
      {action ? (
        <a
          className="w-fit rounded-md border border-line px-3 py-2 text-sm font-bold text-ink-800 transition hover:border-brand-200 hover:text-brand-700 md:justify-self-end"
          href={action.href}
        >
          {action.label}
        </a>
      ) : (
        <span aria-hidden className="hidden md:block" />
      )}
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

function groupBookableSlots(slots: BookableStartSlot[]) {
  const groups = new Map<
    string,
    {
      date: string;
      label: string;
      slots: BookableStartSlot[];
    }
  >();
  for (const slot of slots) {
    const group = groups.get(slot.date) ?? {
      date: slot.date,
      label: `${slot.date} · ${slot.weekdayLabel}`,
      slots: []
    };
    group.slots.push(slot);
    groups.set(slot.date, group);
  }
  return Array.from(groups.values());
}

function formatSelectedSlotLabel(start: string, end: string): string {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "";
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul"
  }).format(startDate);
  const startTime = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(startDate);
  const endTime = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(endDate);
  return `${dateLabel} ${startTime}-${endTime}`;
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
    product_unavailable: "선택한 슈퍼비전 방식을 이용할 수 없습니다.",
    slot_required: "희망 일정을 먼저 선택해주세요.",
    slot_unavailable: "이미 예약되었거나 선택할 수 없는 시간입니다."
  };
  return labels[code ?? ""] ?? "요청서를 저장하지 못했습니다.";
}

function buildRequestSteps({
  canSubmit,
  currentStep,
  hasSelectedProduct,
  hasSelectedSlot,
  methodDescription,
  methodName,
  requiresSelectedSlot,
  selectedSlotLabel,
  selection
}: {
  canSubmit: boolean;
  currentStep: string;
  hasSelectedProduct: boolean;
  hasSelectedSlot: boolean;
  methodDescription: string;
  methodName: string;
  requiresSelectedSlot: boolean;
  selectedSlotLabel: string;
  selection: SelectionSummary;
}): RequestStepRow[] {
  const steps: RequestStepRow[] = [
    {
      label: "슈퍼바이저 선택",
      value: selection.supervisorName ?? "슈퍼바이저 미선택",
      description: selection.supervisorName
        ? "선택 완료"
        : "슈퍼바이저 프로필에서 선택합니다.",
      ...(selection.supervisorName
        ? {}
        : { action: { href: "/supervisors", label: "슈퍼바이저 찾기" } }),
      state: selection.supervisorName
        ? "completed"
        : currentStep === "슈퍼바이저 선택"
          ? "current"
          : "locked"
    },
    {
      label: "슈퍼비전 방식",
      value: hasSelectedProduct ? methodName : "방식 미선택",
      description: hasSelectedProduct
        ? methodDescription
        : "받고 싶은 피드백 방식을 선택합니다.",
      ...(hasSelectedProduct
        ? {}
        : { action: { href: "/supervisors", label: "방식 선택" } }),
      state: hasSelectedProduct
        ? "completed"
        : currentStep === "슈퍼비전 방식"
          ? "current"
          : "locked"
    }
  ];

  if (requiresSelectedSlot) {
    steps.push({
      label: "날짜와 시간",
      value: selectedSlotLabel,
      description: "대한민국 표준시 기준 예약 시간을 확인합니다.",
      ...(hasSelectedProduct && !hasSelectedSlot
        ? { action: { href: "#booking-slots", label: "시간 선택" } }
        : {}),
      state: !hasSelectedProduct
        ? "locked"
        : hasSelectedSlot
          ? "completed"
          : currentStep === "날짜와 시간"
            ? "current"
            : "locked"
    });
  } else {
    steps.push({
      label: "피드백 제공 기한",
      value: feedbackDeadlineLabel(selection.productTurnaroundHours),
      description: "서면 방식은 예약 시간 없이 사례자료 제출 후 검토가 시작됩니다.",
      state: hasSelectedProduct ? "completed" : "locked"
    });
  }

  steps.push(
    {
      label: "사례자료 정리",
      value: canSubmit ? "초안 저장 후 작성 화면으로 이동" : "앞 단계 선택 필요",
      description: "사례 요약과 질문은 의뢰 상세에서 작성합니다.",
      state: canSubmit ? "current" : "locked"
    },
    {
      label: "답변 확인",
      value: "자료 작성 후 확인",
      description: "제출 전 입력한 답변과 첨부 자료를 다시 확인합니다.",
      state: "locked"
    },
    {
      label: "결제",
      value: "최종 확인 후 진행",
      description: "의뢰 내용을 확정한 뒤 결제를 시작합니다.",
      state: "locked"
    },
    {
      label: "수락 대기",
      value: "결제 후 표시",
      description: "슈퍼바이저가 자료와 일정을 확인하고 수락 여부를 결정합니다.",
      state: "locked"
    }
  );

  if (requiresSelectedSlot) {
    steps.push({
      label: "미팅 링크 확인",
      value: "수락 후 표시",
      description: "화상 링크가 준비되면 의뢰 상세에 표시됩니다.",
      state: "locked"
    });
  } else {
    steps.push({
      label: "피드백 확인",
      value: "수락 후 표시",
      description: "슈퍼바이저가 등록한 피드백을 확인합니다.",
      state: "locked"
    });
  }

  return steps;
}

function stepStateLabel(state: StepState): string {
  if (state === "completed") return "완료";
  if (state === "current") return "현재";
  return "대기";
}

function formatCurrency(value: number | null): string {
  return value !== null ? `₩ ${value.toLocaleString("ko-KR")}` : "방식 선택 후 표시";
}
