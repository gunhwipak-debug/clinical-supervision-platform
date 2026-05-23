"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const requestSchema = z.object({
  serviceProductId: z.uuid("상품 ID가 필요합니다."),
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

const steps = ["선택 확인", "상품·일정 확인", "보관기간", "긴급도 확인"] as const;
const asyncSteps = ["선택 확인", "상품 방식 확인", "보관기간", "긴급도 확인"] as const;

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
  const [step, setStep] = useState(0);
  const hasSelectedProduct = serviceProductId.length > 0;
  const requiresSelectedSlot = isTimedBookingProduct(selection.productKind);
  const hasSelectedSlot = Boolean(selectedSlotStart && selectedSlotEnd);
  const canProceed = hasSelectedProduct && (!requiresSelectedSlot || hasSelectedSlot);
  const stepLabels = requiresSelectedSlot ? steps : asyncSteps;
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
      toast.success("초안이 생성되었습니다.");
      window.location.href = `/requests/${body.data.request.id}`;
      return;
    }
    const nextMessage = requestErrorMessage(body.error?.code);
    setMessage(nextMessage);
    toast.error(nextMessage);
  }

  return (
    <main className="flex-grow px-gutter pb-xl pt-sm md:px-0">
      <div className="mx-auto max-w-container-max md:px-gutter">
        <div className="mb-xl text-center md:text-left">
          <h1 className="mb-sm font-headline-lg text-headline-lg text-on-surface">
            새로운 수퍼비전 요청
          </h1>
          <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            안전하고 체계적인 임상 수퍼비전을 위한 요청서를 작성합니다. 입력된 모든
            정보는 암호화되어 안전하게 보관됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-xl lg:flex-row">
          <div className="flex-shrink-0 lg:w-1/4">
            <div className="sticky top-[104px] rounded-lg border border-outline-variant bg-surface-container-lowest p-md">
              <h2 className="mb-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                진행 단계
              </h2>
              <ul className="space-y-sm">
                {stepLabels.map((label, index) => (
                  <li
                    className={`flex items-center gap-sm ${index > step ? "opacity-50" : ""}`}
                    key={label}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-label-md text-label-md ${
                        index === step
                          ? "bg-secondary text-on-primary"
                          : index < step
                            ? "bg-secondary-container text-on-secondary-container"
                            : "border border-outline-variant bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`font-label-md text-label-md ${
                        index === step ? "text-secondary" : "text-on-surface-variant"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex-grow lg:w-3/4">
            <form
              className="rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm"
              onSubmit={form.handleSubmit(submit)}
            >
              <div className="flex items-center justify-between rounded-t-lg border-b border-outline-variant bg-surface-bright p-lg">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {step + 1}. {stepLabels[step]}
                  </h3>
                  <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                    {requiresSelectedSlot
                      ? "프로필 캘린더에서 선택한 상품과 일정을 확인한 뒤 초안을 생성합니다."
                      : "비동기 상품은 일정 예약 없이 자료 제출 초안을 먼저 생성합니다."}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[32px] font-light text-secondary">
                  medical_services
                </span>
              </div>

              <div className="space-y-xl p-lg">
                {step === 0 ? (
                  <>
                    <div className="rounded-lg border border-secondary bg-surface p-md shadow-sm ring-1 ring-secondary">
                      <div className="flex items-start justify-between gap-md">
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined filled text-secondary">
                            medical_services
                          </span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">
                              선택한 슈퍼비전 상품
                            </p>
                            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                              {requiresSelectedSlot
                                ? "슈퍼바이저 프로필의 일정 캘린더에서 고른 상품과 시간으로 요청서를 작성합니다."
                                : "비동기 검토 상품은 자료를 제출하면 슈퍼바이저가 작업 화면에서 검토합니다."}
                            </p>
                          </div>
                        </div>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-secondary bg-secondary">
                          <span className="material-symbols-outlined text-[14px] text-on-primary">
                            check
                          </span>
                        </div>
                      </div>
                      {!hasSelectedProduct ? (
                        <p className="mt-md rounded-lg border border-outline-variant bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                          아직 선택된 상품이 없습니다. 슈퍼바이저 프로필에서 가능 일정을
                          먼저 선택해주세요.
                        </p>
                      ) : null}
                      {hasSelectedProduct && requiresSelectedSlot && !hasSelectedSlot ? (
                        <p className="mt-md rounded-lg border border-outline-variant bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                          신청 전에 슈퍼바이저의 가능 일정에서 시간대를 먼저 선택해야
                          합니다.
                        </p>
                      ) : null}
                      {hasSelectedProduct && !requiresSelectedSlot ? (
                        <p className="mt-md rounded-lg border border-secondary bg-surface-container p-sm font-body-sm text-body-sm text-secondary">
                          이 상품은 비동기 검토 방식이라 시간대를 고르지 않고 초안을
                          만들 수 있습니다.
                        </p>
                      ) : null}
                      {selectedSlot ? (
                        <p className="mt-md rounded-lg border border-secondary bg-surface-container p-sm font-body-sm text-body-sm text-secondary">
                          선택한 일정: {selectedSlot}
                        </p>
                      ) : null}
                      {selection.supervisorName || selection.productTitle ? (
                        <div className="mt-md grid gap-xs rounded-lg border border-outline-variant bg-surface-container-lowest p-sm font-body-sm text-body-sm text-on-surface-variant">
                          {selection.supervisorName ? (
                            <p>
                              <span className="font-label-md text-label-md text-on-surface">
                                슈퍼바이저
                              </span>
                              : {selection.supervisorName}
                            </p>
                          ) : null}
                          {selection.productTitle ? (
                            <p>
                              <span className="font-label-md text-label-md text-on-surface">
                                상품
                              </span>
                              : {selection.productTitle}
                            </p>
                          ) : null}
                          {selection.productPriceKrw !== null ? (
                            <p>
                              <span className="font-label-md text-label-md text-on-surface">
                                금액
                              </span>
                              : ₩ {selection.productPriceKrw.toLocaleString("ko-KR")}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md font-body-sm text-body-sm text-on-surface-variant">
                      사례 설명, 주호소, 검사자료, 보완 요청사항은 초안 생성 후 상세
                      화면의 사례 패킷에서 저장합니다.
                    </p>
                  </>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-md">
                    <label className="grid gap-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        선택한 상품
                      </span>
                      {hasSelectedProduct ? (
                        <>
                          <input type="hidden" {...form.register("serviceProductId")} />
                          <span className="rounded-lg border border-outline-variant bg-surface p-sm font-body-sm text-body-sm text-on-surface-variant">
                            {selection.productTitle ?? "프로필에서 선택한 상품"}
                            {selection.productPriceKrw !== null
                              ? ` · ₩ ${selection.productPriceKrw.toLocaleString("ko-KR")}`
                              : ""}
                          </span>
                          {selection.productDescription ? (
                            <span className="rounded-lg bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                              {selection.productDescription}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="rounded-lg border border-outline-variant bg-surface p-sm font-body-sm text-body-sm text-on-surface-variant">
                          선택된 상품이 없습니다.
                        </span>
                      )}
                    </label>
                    <input type="hidden" {...form.register("selectedSlotStart")} />
                    <input type="hidden" {...form.register("selectedSlotEnd")} />
                    {selection.supervisorName ? (
                      <p className="rounded-lg bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                        선택한 슈퍼바이저: {selection.supervisorName}
                      </p>
                    ) : null}
                    {requiresSelectedSlot && selectedSlot ? (
                      <p className="rounded-lg bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                        선택한 희망 일정: {selectedSlot}
                      </p>
                    ) : requiresSelectedSlot ? (
                      <p className="rounded-lg bg-surface-container p-sm font-body-sm text-body-sm text-error">
                        선택된 희망 일정이 없습니다. 가능 일정에서 시간대를
                        선택해주세요.
                      </p>
                    ) : (
                      <p className="rounded-lg bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
                        비동기 상품입니다. 자료 제출 후 슈퍼바이저가 검토 작업을
                        시작합니다.
                      </p>
                    )}
                    {form.formState.errors.serviceProductId ? (
                      <p className="text-sm text-error">
                        {form.formState.errors.serviceProductId.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 ? (
                  <fieldset className="grid gap-md">
                    <legend className="font-label-md text-label-md text-on-surface">
                      원자료 보관기간
                    </legend>
                    <div className="grid gap-md md:grid-cols-3">
                      {[7, 30, 90].map((days) => (
                        <label
                          className="grid cursor-pointer gap-sm rounded-lg border border-outline-variant bg-surface p-md"
                          key={days}
                        >
                          <span className="flex items-center justify-between">
                            <span className="font-headline-md text-headline-md text-primary">
                              {days}일
                            </span>
                            <input
                              type="radio"
                              value={days}
                              {...form.register("retentionDays", {
                                valueAsNumber: true
                              })}
                            />
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            완료 후 정책에 따라 원자료 삭제 일정을 관리합니다.
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                {step === 3 ? (
                  <div className="grid gap-md">
                    <label className="grid gap-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        긴급 여부
                      </span>
                      <select
                        className="rounded-lg border border-outline-variant bg-surface px-sm py-2"
                        {...form.register("urgency")}
                      >
                        <option value="normal">일반</option>
                        <option value="urgent_24h">24시간 긴급</option>
                      </select>
                    </label>
                    <label className="grid gap-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        희망 마감일
                      </span>
                      <input
                        className="rounded-lg border border-outline-variant bg-surface px-sm py-2"
                        type="date"
                        {...form.register("desiredDeadline")}
                      />
                    </label>
                    <p className="rounded-lg bg-surface-container p-md font-body-sm text-body-sm text-on-surface-variant">
                      결제는 사례 패킷과 첨부파일을 제출한 뒤 진행합니다. 초안 생성 후
                      상세 화면에서 자료를 이어서 작성하세요.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-md rounded-b-lg border-t border-outline-variant bg-surface-bright p-lg">
                {step > 0 ? (
                  <button
                    className="cursor-pointer rounded border border-outline-variant px-lg py-sm font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container active:opacity-80"
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    type="button"
                  >
                    이전
                  </button>
                ) : null}
                {step < stepLabels.length - 1 ? (
                  <button
                    className="flex cursor-pointer items-center gap-xs rounded bg-primary px-lg py-sm font-label-md text-label-md text-on-primary transition-opacity hover:bg-opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() =>
                      setStep((current) => Math.min(stepLabels.length - 1, current + 1))
                    }
                    disabled={!canProceed}
                    type="button"
                  >
                    다음 단계
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <button
                    className="flex cursor-pointer items-center gap-xs rounded bg-primary px-lg py-sm font-label-md text-label-md text-on-primary transition-opacity hover:bg-opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!isHydrated || form.formState.isSubmitting}
                    type="submit"
                  >
                    초안 생성
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </button>
                )}
              </div>
              {message ? (
                <p className="px-lg pb-lg font-body-sm text-body-sm text-on-surface-variant">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

function requestErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    calendar_config_required:
      "서비스의 구글 캘린더 연동 설정이 완료되지 않아 일정 예약을 진행할 수 없습니다.",
    calendar_not_connected:
      "슈퍼바이저의 구글 캘린더가 아직 연결되지 않아 이 시간대는 예약할 수 없습니다.",
    calendar_reauth_required:
      "슈퍼바이저의 구글 캘린더 재연동이 필요합니다. 캘린더 확인 전까지 이 시간대는 예약할 수 없습니다.",
    calendar_sync_failed:
      "구글 캘린더와 예약 시간을 확인하지 못했습니다. 캘린더 확인 전까지 이 시간대는 예약할 수 없습니다.",
    invalid_request: "요청 형식이 올바르지 않습니다.",
    invalid_slot: "선택한 일정이 올바르지 않습니다.",
    product_unavailable: "선택한 상품을 이용할 수 없습니다.",
    slot_required: "희망 일정을 먼저 선택해주세요.",
    slot_unavailable: "이미 예약되었거나 선택할 수 없는 시간입니다."
  };
  return labels[code ?? ""] ?? "요청서를 저장하지 못했습니다.";
}

function isTimedBookingProduct(kind: string | null | undefined): boolean {
  return kind === "zoom_60" || kind === "zoom_90";
}
