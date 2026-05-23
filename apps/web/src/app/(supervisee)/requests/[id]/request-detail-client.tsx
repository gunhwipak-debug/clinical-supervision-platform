"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { supervision } from "@csp/db";
import { detectPhi } from "@csp/shared/supervision/phi-regex";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  FileText,
  ShieldCheck,
  Video
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Field, Input, Label, Textarea } from "../../../../components/ui/form";

const checklistFields = [
  "removedName",
  "removedRrn",
  "removedPhone",
  "removedAddress",
  "removedGuardianName",
  "removedOrgName",
  "removedChartNumber",
  "filenameSafe",
  "rawDataSafe",
  "minimalInfo",
  "clientConsentConfirmed",
  "purposeUnderstood"
] as const;

type ChecklistField = (typeof checklistFields)[number];

const checklistItems: Array<{
  field: ChecklistField;
  label: string;
  description: string;
}> = [
  {
    field: "removedName",
    label: "이름 제거",
    description: "내담자, 보호자, 검사자 실명이 본문에 남아 있지 않습니다."
  },
  {
    field: "removedRrn",
    label: "주민등록번호 제거",
    description: "주민등록번호와 생년월일-성별 조합을 삭제했습니다."
  },
  {
    field: "removedPhone",
    label: "연락처 제거",
    description: "휴대폰, 유선전화, 이메일 등 직접 연락처를 제거했습니다."
  },
  {
    field: "removedAddress",
    label: "주소 제거",
    description: "거주지, 학교, 병원처럼 개인을 특정할 위치 정보를 줄였습니다."
  },
  {
    field: "removedGuardianName",
    label: "보호자 정보 제거",
    description: "보호자 이름과 관계망 식별 정보를 제거했습니다."
  },
  {
    field: "removedOrgName",
    label: "기관명 비식별",
    description: "의료기관, 학교, 직장 등 특정 가능한 기관명을 처리했습니다."
  },
  {
    field: "removedChartNumber",
    label: "차트번호 제거",
    description: "등록번호, 접수번호, 검사번호 등 내부 식별자를 삭제했습니다."
  },
  {
    field: "filenameSafe",
    label: "파일명 안전",
    description: "첨부파일명에 이름, 연락처, 기관명, 날짜 식별자가 없습니다."
  },
  {
    field: "rawDataSafe",
    label: "원자료 안전",
    description: "원자료와 표지, 메모 영역까지 직접 식별자가 남지 않았습니다."
  },
  {
    field: "minimalInfo",
    label: "최소 정보",
    description: "슈퍼비전에 필요한 정보만 남기고 세부 신상 정보는 덜어냈습니다."
  },
  {
    field: "clientConsentConfirmed",
    label: "동의 확인",
    description: "슈퍼비전 목적의 자료 활용 동의를 확인했습니다."
  },
  {
    field: "purposeUnderstood",
    label: "목적 이해",
    description: "자료가 교육·슈퍼비전 목적으로만 쓰인다는 점을 확인했습니다."
  }
];

const ageBandValues = ["6-12", "13-18", "19-39", "40-64", "65+"] as const;
const settingValues = [
  "hospital",
  "counseling_center",
  "community_center",
  "school",
  "other"
] as const;
const preferredMethodValues = [
  "async_comment",
  "direct_edit",
  "zoom",
  "comment_plus_zoom"
] as const;

const statusCopy: Record<
  string,
  {
    label: string;
    title: string;
    description: string;
    tone: "brand" | "accent" | "neutral" | "danger";
  }
> = {
  draft: {
    label: "초안",
    title: "케이스 패킷을 저장하면 제출할 수 있습니다",
    description:
      "자료 점검 체크리스트는 선택 확인 절차이며, 제출 자체는 패킷 저장 후 가능합니다.",
    tone: "accent"
  },
  submitted: {
    label: "제출됨",
    title: "제출이 완료되었습니다",
    description: "결제를 완료하면 슈퍼바이저 검토 대기 상태로 넘어갑니다.",
    tone: "brand"
  },
  awaiting_payment: {
    label: "결제 대기",
    title: "결제 확인이 필요합니다",
    description: "결제창에서 결제를 완료하면 슈퍼바이저 검토 대기 상태로 이동합니다.",
    tone: "accent"
  },
  paid: {
    label: "결제 완료",
    title: "결제가 완료되었습니다",
    description: "곧 슈퍼바이저 검토 대기 상태로 정리됩니다.",
    tone: "brand"
  },
  awaiting_supervisor_review: {
    label: "슈퍼바이저 검토 대기",
    title: "슈퍼바이저 응답을 기다리고 있습니다",
    description: "자료는 잠겼고, 배정된 슈퍼바이저가 수락 또는 반려를 결정합니다.",
    tone: "brand"
  },
  accepted: {
    label: "수락됨",
    title: "슈퍼바이저가 의뢰를 수락했습니다",
    description: "피드백 작성이 시작되면 검토 중 상태로 표시됩니다.",
    tone: "brand"
  },
  in_review: {
    label: "검토 중",
    title: "슈퍼바이저가 자료를 검토하고 있습니다",
    description:
      "첨부파일은 계속 확인할 수 있으며, 필요한 경우 추가 자료를 정리하세요.",
    tone: "brand"
  },
  feedback_submitted: {
    label: "피드백 도착",
    title: "슈퍼비전 피드백이 제출되었습니다",
    description: "완료 기록 발급이 필요한 의뢰라면 슈퍼바이저의 발급을 기다립니다.",
    tone: "brand"
  },
  completion_record_issued: {
    label: "완료 기록 발급",
    title: "완료 기록이 발급되었습니다",
    description: "리뷰를 작성하면 의뢰가 완료 상태로 정리됩니다.",
    tone: "brand"
  },
  completed: {
    label: "완료",
    title: "의뢰가 완료되었습니다",
    description: "패킷과 첨부파일은 보관기간 안에서만 조회됩니다.",
    tone: "brand"
  },
  rejected: {
    label: "반려",
    title: "슈퍼바이저가 의뢰를 반려했습니다",
    description: "필요하면 다른 상품으로 새 의뢰를 시작하세요.",
    tone: "danger"
  },
  cancelled: {
    label: "취소",
    title: "의뢰가 취소되었습니다",
    description: "취소된 의뢰는 다시 제출할 수 없습니다.",
    tone: "neutral"
  },
  refunded: {
    label: "환불",
    title: "환불 처리된 의뢰입니다",
    description: "결제와 진행 상태를 결제 내역에서 확인하세요.",
    tone: "neutral"
  },
  expired: {
    label: "만료",
    title: "보관기간이 만료되었습니다",
    description: "보관 정책에 따라 자료 접근이 제한됩니다.",
    tone: "neutral"
  }
};

const packetFormSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(160),
  chiefComplaint: z.string().trim().min(1, "주호소를 입력해 주세요.").max(2000),
  referralReason: z.string().trim().min(1, "의뢰 사유를 입력해 주세요.").max(2000),
  purpose: z.string().max(1000),
  clientAgeBand: z.enum(["", "6-12", "13-18", "19-39", "40-64", "65+"]),
  clientGender: z.string().max(80),
  setting: z.enum([
    "",
    "hospital",
    "counseling_center",
    "community_center",
    "school",
    "other"
  ]),
  testsUsed: z.string().max(1000),
  requestItems: z.string().max(1000),
  preferredMethod: z.enum([
    "",
    "async_comment",
    "direct_edit",
    "zoom",
    "comment_plus_zoom"
  ]),
  needsCompletionRecord: z.boolean()
});

const checklistFormSchema = z
  .object(
    Object.fromEntries(checklistFields.map((field) => [field, z.boolean()])) as Record<
      ChecklistField,
      z.ZodBoolean
    >
  )
  .refine((value) => Object.values(value).every(Boolean), {
    message: "저장하려면 12개 자료 점검 항목을 모두 확인해 주세요."
  });

const reviewScore = z.coerce.number().int().min(1).max(5);
const reviewFormSchema = z.object({
  educational: reviewScore,
  ethics: reviewScore,
  expertise: reviewScore,
  freeText: z.string().max(1000).optional(),
  helpfulness: reviewScore,
  onTime: reviewScore,
  responseSpeed: reviewScore,
  reuseIntent: reviewScore,
  specificity: reviewScore
});

type PacketFormValues = z.infer<typeof packetFormSchema>;
type ChecklistFormValues = z.infer<typeof checklistFormSchema>;
type ReviewFormInput = z.input<typeof reviewFormSchema>;
type ReviewFormValues = z.output<typeof reviewFormSchema>;

type PaymentIntentResponse = {
  data?: {
    amount: number;
    paymentId: string;
    paymentMode: "dev" | "prod";
    pgOrderId: string;
    tossClientPayload: {
      amount: number;
      clientKey: string;
      customerEmail: string | null;
      orderId: string;
      orderName: string;
      paymentId: string;
    };
  };
  error?: { code: string };
};

type TossPaymentWindow = {
  requestPayment(input: {
    amount: { currency: "KRW"; value: number };
    card: { flowMode: "DEFAULT" };
    customerEmail?: string;
    failUrl: string;
    method: "CARD";
    orderId: string;
    orderName: string;
    successUrl: string;
  }): Promise<void>;
};

type TossPaymentsSdk = {
  payment(input: { customerKey: string }): TossPaymentWindow;
};

type TossPaymentsFactory = (clientKey: string) => TossPaymentsSdk;

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

export function RequestDetailClient({
  requestId,
  initialTitle,
  initialPurpose,
  initialClientAgeBand,
  initialClientGender,
  initialSetting,
  initialChiefComplaint,
  initialReferralReason,
  initialTestsUsed,
  initialRequestItems,
  initialPreferredMethod,
  initialNeedsCompletionRecord,
  completionRecord,
  feedbackRecommendations,
  feedbackSubmittedAt,
  feedbackSummary,
  bookingStatus,
  initialMeetingUrl,
  initialScheduledEnd,
  initialScheduledStart,
  packetComplete,
  deidentificationComplete,
  phiDisabled,
  serviceProductSupervisionType,
  status
}: {
  requestId: string;
  initialTitle: string;
  initialPurpose: string[] | null;
  initialClientAgeBand: string | null;
  initialClientGender: string | null;
  initialSetting: string | null;
  initialChiefComplaint: string;
  initialReferralReason: string;
  initialTestsUsed: string[] | null;
  initialRequestItems: string[] | null;
  initialPreferredMethod: string | null;
  initialNeedsCompletionRecord: boolean | null;
  completionRecord: supervision.CompletionRecord | null;
  feedbackRecommendations: string | null;
  feedbackSubmittedAt: Date | string | null;
  feedbackSummary: string | null;
  bookingStatus: string | null;
  initialMeetingUrl: string | null;
  initialScheduledEnd: Date | string | null;
  initialScheduledStart: Date | string | null;
  packetComplete: boolean;
  deidentificationComplete: boolean;
  phiDisabled: boolean;
  serviceProductSupervisionType: string;
  status: string;
}) {
  const [message, setMessage] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState(
    toDateTimeLocalValue(initialScheduledStart)
  );
  const [rescheduleEnd, setRescheduleEnd] = useState(
    toDateTimeLocalValue(initialScheduledEnd)
  );
  const editablePacket = status === "draft";
  const editableChecklist = status === "draft";
  const canSubmit = status === "draft" && packetComplete;
  const canCancel =
    status === "draft" || status === "submitted" || status === "awaiting_payment";
  const canReschedule =
    Boolean(initialScheduledStart && initialScheduledEnd) &&
    [
      "draft",
      "submitted",
      "awaiting_payment",
      "paid",
      "awaiting_supervisor_review",
      "accepted",
      "in_review",
      "meeting_scheduled"
    ].includes(status);
  const canWriteFinalReview =
    status === "completion_record_issued" ||
    (status === "feedback_submitted" &&
      (serviceProductSupervisionType === "counseling" ||
        initialNeedsCompletionRecord === false));
  const copy = statusCopy[status] ?? {
    label: status,
    title: "진행 상태를 확인하고 있습니다",
    description: "현재 상태에 맞는 다음 행동만 사용할 수 있습니다.",
    tone: "neutral" as const
  };
  const readiness =
    status === "draft"
      ? [
          {
            label: "케이스 패킷",
            done: packetComplete,
            description: "제목, 주호소, 의뢰 사유 저장"
          },
          {
            label: "자료 점검",
            done: deidentificationComplete,
            description: "권장 확인 항목"
          },
          {
            label: "제출 가능",
            done: packetComplete && canSubmit,
            description: "초안 상태에서 패킷 저장 완료"
          }
        ]
      : [
          {
            label: "상태 확정",
            done: true,
            description: copy.label
          },
          {
            label: "자료 잠금",
            done: true,
            description: "제출 이후 직접 수정 제한"
          },
          {
            label: "보관 정책",
            done: true,
            description: "보관기간 안에서만 조회"
          }
        ];
  const packetForm = useForm<PacketFormValues>({
    resolver: zodResolver(packetFormSchema),
    defaultValues: {
      title: initialTitle,
      chiefComplaint: initialChiefComplaint,
      referralReason: initialReferralReason,
      purpose: joinList(initialPurpose),
      clientAgeBand: selectValue(initialClientAgeBand, ageBandValues),
      clientGender: initialClientGender ?? "",
      setting: selectValue(initialSetting, settingValues),
      testsUsed: joinList(initialTestsUsed),
      requestItems: joinList(initialRequestItems),
      preferredMethod: selectValue(initialPreferredMethod, preferredMethodValues),
      needsCompletionRecord: initialNeedsCompletionRecord ?? true
    }
  });
  const checklistForm = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: Object.fromEntries(
      checklistFields.map((field) => [field, deidentificationComplete])
    ) as ChecklistFormValues
  });
  const reviewForm = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      educational: 5,
      ethics: 5,
      expertise: 5,
      freeText: "",
      helpfulness: 5,
      onTime: 5,
      responseSpeed: 5,
      reuseIntent: 5,
      specificity: 5
    }
  });
  const watchedTitle = packetForm.watch("title");
  const watchedChiefComplaint = packetForm.watch("chiefComplaint");
  const watchedReferralReason = packetForm.watch("referralReason");
  const checklistValues = checklistForm.watch();
  const checkedCount = checklistItems.filter(
    (item) => checklistValues[item.field]
  ).length;
  const checklistProgress = Math.round((checkedCount / checklistItems.length) * 100);
  const phiMatches = useMemo(
    () => [
      ...detectPhi(watchedTitle),
      ...detectPhi(watchedChiefComplaint),
      ...detectPhi(watchedReferralReason)
    ],
    [watchedTitle, watchedChiefComplaint, watchedReferralReason]
  );

  async function savePacket(values: PacketFormValues) {
    if (phiDisabled) {
      setMessage("현재 DB 환경에서 PHI 암호화 저장 경로를 사용할 수 없습니다.");
      return;
    }
    const response = await fetch(`/api/supervision-requests/${requestId}/case-packet`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        chiefComplaint: values.chiefComplaint,
        referralReason: values.referralReason,
        purpose: splitList(values.purpose),
        clientAgeBand: emptyToNull(values.clientAgeBand),
        clientGender: emptyToNull(values.clientGender),
        setting: emptyToNull(values.setting),
        testsUsed: splitList(values.testsUsed),
        requestItems: splitList(values.requestItems),
        preferredMethod: emptyToNull(values.preferredMethod),
        needsCompletionRecord: values.needsCompletionRecord
      })
    });
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function saveChecklist(values: ChecklistFormValues) {
    const response = await fetch(
      `/api/supervision-requests/${requestId}/deidentification`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values)
      }
    );
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function transition(action: "submit" | "cancel") {
    const response = await fetch(`/api/supervision-requests/${requestId}/${action}`, {
      method: "POST"
    });
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function approveFeedback() {
    const response = await fetch(`/api/supervision-requests/${requestId}/approval`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: "피드백 내용을 확인했고 승인합니다." })
    });
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function submitFinalReview(values: ReviewFormValues) {
    const response = await fetch(`/api/supervision-requests/${requestId}/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        freeText: emptyToNull(values.freeText ?? "")
      })
    });
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function reschedule() {
    if (!rescheduleStart || !rescheduleEnd) {
      setMessage("변경할 시작 시간과 종료 시간을 모두 입력해주세요.");
      return;
    }
    const response = await fetch(`/api/supervision-requests/${requestId}/reschedule`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        selectedSlotEnd: fromSeoulDateTimeLocal(rescheduleEnd),
        selectedSlotStart: fromSeoulDateTimeLocal(rescheduleStart)
      })
    });
    await setApiMessage(response);
    if (response.ok) window.location.reload();
  }

  async function startPayment() {
    const intentResponse = await fetch("/api/payments/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ supervisionRequestId: requestId })
    });
    const intentBody = (await intentResponse.json()) as PaymentIntentResponse;
    if (!intentResponse.ok || !intentBody.data) {
      setMessage(apiErrorMessage(intentBody.error?.code));
      return;
    }

    setMessage("결제창을 준비하고 있습니다.");
    if (
      intentBody.data.paymentMode === "dev" &&
      isLocalTossIntent(intentBody.data.tossClientPayload)
    ) {
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: intentBody.data.amount,
          paymentId: intentBody.data.paymentId,
          pgPaymentKey: `local-payment-${intentBody.data.paymentId}`
        })
      });
      await setApiMessage(confirmResponse);
      if (confirmResponse.ok) window.location.reload();
      return;
    }

    try {
      await requestTossPayment(intentBody.data);
    } catch {
      setMessage("결제창을 열지 못했습니다. 잠시 후 다시 시도해주세요.");
      toast.error("결제창을 열지 못했습니다.");
    }
  }

  async function setApiMessage(response: Response) {
    const body = (await response.json()) as { error?: { code: string } };
    const next = response.ok ? "처리되었습니다." : apiErrorMessage(body.error?.code);
    setMessage(next);
    if (response.ok) {
      toast.success(next);
    } else {
      toast.error(next);
    }
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-5 rounded-xl border-brand-100 bg-brand-50/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-3">
            <Badge className="w-fit" tone={copy.tone}>
              {copy.label}
            </Badge>
            <div>
              <h2 className="text-2xl font-bold text-ink-900">{copy.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                {copy.description}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border border-line bg-surface-elevated p-3 text-sm shadow-card md:min-w-72">
            {readiness.map((item) => (
              <div className="flex items-start gap-2" key={item.label}>
                {item.done ? (
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-brand-600"
                    aria-hidden
                    size={17}
                  />
                ) : (
                  <Circle
                    className="mt-0.5 shrink-0 text-ink-300"
                    aria-hidden
                    size={17}
                  />
                )}
                <div>
                  <p className="font-semibold text-ink-900">{item.label}</p>
                  <p className="text-xs text-ink-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="grid gap-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <CalendarClock aria-hidden size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">예약 일정</h2>
            <p className="mt-1 text-sm text-ink-500">
              예약 일정은 슈퍼바이저의 구글 캘린더와 동기화됩니다. 변경은 세션 24시간
              전까지만 가능합니다.
            </p>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-line bg-surface-base p-4 text-sm text-ink-700">
          <p>
            현재 일정 ·{" "}
            <strong className="text-ink-900">
              {formatBookingRange(initialScheduledStart, initialScheduledEnd)}
            </strong>
          </p>
          <p>
            예약 상태 ·{" "}
            <strong className="text-ink-900">
              {bookingStatusLabel(bookingStatus)}
            </strong>
          </p>
          {initialMeetingUrl ? (
            <Button asChild>
              <a href={initialMeetingUrl} rel="noreferrer" target="_blank">
                <Video aria-hidden size={18} />
                화상 세션 입장
              </a>
            </Button>
          ) : (
            <p className="rounded-lg bg-surface-sunken p-3 text-sm text-ink-600">
              구글 캘린더 회의 링크가 아직 없습니다. 슈퍼바이저의 캘린더 재연동 또는
              관리자 확인이 필요합니다.
            </p>
          )}
        </div>
        {canReschedule ? (
          <div className="grid gap-3 rounded-lg border border-line bg-surface-base p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field>
              <Label htmlFor="reschedule-start">새 시작 시간</Label>
              <Input
                id="reschedule-start"
                onChange={(event) => setRescheduleStart(event.target.value)}
                type="datetime-local"
                value={rescheduleStart}
              />
            </Field>
            <Field>
              <Label htmlFor="reschedule-end">새 종료 시간</Label>
              <Input
                id="reschedule-end"
                onChange={(event) => setRescheduleEnd(event.target.value)}
                type="datetime-local"
                value={rescheduleEnd}
              />
            </Field>
            <Button onClick={() => void reschedule()} type="button" variant="secondary">
              일정 변경
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="rounded-xl">
        {editablePacket ? (
          <form className="grid gap-4" onSubmit={packetForm.handleSubmit(savePacket)}>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <FileText aria-hidden size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold">케이스 패킷</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  실명, 연락처, 이메일, 주민번호, 계좌번호는 서버 검증에서 차단됩니다.
                </p>
              </div>
            </div>
            {phiDisabled ? (
              <p className="rounded-lg bg-warn/10 p-3 text-sm text-ink-700">
                현재 DB 환경에서 케이스 패킷 PHI 암호화 저장 경로를 사용할 수 없습니다.
              </p>
            ) : null}
            <Field>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                {...packetForm.register("title")}
                aria-invalid={Boolean(packetForm.formState.errors.title)}
              />
              <FormError message={packetForm.formState.errors.title?.message} />
            </Field>
            <Field>
              <Label htmlFor="chiefComplaint">주호소</Label>
              <Textarea
                id="chiefComplaint"
                {...packetForm.register("chiefComplaint")}
                aria-invalid={Boolean(packetForm.formState.errors.chiefComplaint)}
              />
              <FormError
                message={packetForm.formState.errors.chiefComplaint?.message}
              />
            </Field>
            <Field>
              <Label htmlFor="referralReason">의뢰 사유</Label>
              <Textarea
                id="referralReason"
                {...packetForm.register("referralReason")}
                aria-invalid={Boolean(packetForm.formState.errors.referralReason)}
              />
              <FormError
                message={packetForm.formState.errors.referralReason?.message}
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field>
                <Label>의뢰 목적</Label>
                <Input
                  {...packetForm.register("purpose")}
                  placeholder="예: 해석 점검"
                />
              </Field>
              <Field>
                <Label>검사명</Label>
                <Input
                  {...packetForm.register("testsUsed")}
                  placeholder="예: MMPI, SCT"
                />
              </Field>
              <Field>
                <Label>요청 항목</Label>
                <Input
                  {...packetForm.register("requestItems")}
                  placeholder="예: 보고서 코멘트"
                />
              </Field>
              <select
                className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
                {...packetForm.register("clientAgeBand")}
              >
                <option value="">연령대</option>
                <option value="6-12">6-12</option>
                <option value="13-18">13-18</option>
                <option value="19-39">19-39</option>
                <option value="40-64">40-64</option>
                <option value="65+">65+</option>
              </select>
              <Field>
                <Label>성별/표현</Label>
                <Input
                  {...packetForm.register("clientGender")}
                  placeholder="예: 여성"
                />
              </Field>
              <select
                className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
                {...packetForm.register("setting")}
              >
                <option value="">장면</option>
                <option value="hospital">병원</option>
                <option value="counseling_center">상담센터</option>
                <option value="community_center">지역사회기관</option>
                <option value="school">학교</option>
                <option value="other">기타</option>
              </select>
              <select
                className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
                {...packetForm.register("preferredMethod")}
              >
                <option value="">선호 방식</option>
                <option value="async_comment">코멘트</option>
                <option value="direct_edit">직접 수정</option>
                <option value="zoom">Zoom</option>
                <option value="comment_plus_zoom">코멘트+Zoom</option>
              </select>
            </div>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...packetForm.register("needsCompletionRecord")}
              />{" "}
              완료 기록 필요
            </Label>
            {phiMatches.length > 0 ? (
              <p
                className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 shrink-0" aria-hidden size={16} />
                <span>
                  개인정보 의심 패턴: {phiMatches.map((match) => match.kind).join(", ")}
                </span>
              </p>
            ) : null}
            <Button type="submit">패킷 저장</Button>
          </form>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">케이스 패킷</h2>
              <Badge tone={packetComplete ? "brand" : "danger"}>
                {packetComplete ? "저장 완료" : "패킷 미완료"}
              </Badge>
            </div>
            <SummaryBlock label="제목" value={initialTitle} />
            <SummaryBlock
              label="의뢰 목적"
              value={displayList(initialPurpose, purposeLabel)}
            />
            <SummaryBlock
              label="내담자 정보"
              value={[
                initialClientAgeBand
                  ? `연령대: ${ageBandLabel(initialClientAgeBand)}`
                  : "",
                initialClientGender ? `성별/표현: ${initialClientGender}` : "",
                initialSetting ? `장면: ${settingLabel(initialSetting)}` : ""
              ]
                .filter(Boolean)
                .join("\n")}
            />
            <SummaryBlock label="주호소" value={initialChiefComplaint} />
            <SummaryBlock label="의뢰 사유" value={initialReferralReason} />
            <SummaryBlock
              label="검사명"
              value={displayList(initialTestsUsed, identityLabel)}
            />
            <SummaryBlock
              label="요청 항목"
              value={displayList(initialRequestItems, requestItemLabel)}
            />
            <SummaryBlock
              label="진행 선호"
              value={[
                initialPreferredMethod
                  ? preferredMethodLabel(initialPreferredMethod)
                  : "",
                initialNeedsCompletionRecord === null
                  ? ""
                  : `완료 기록: ${initialNeedsCompletionRecord ? "필요" : "불필요"}`
              ]
                .filter(Boolean)
                .join("\n")}
            />
            <p className="rounded-lg bg-surface-sunken p-3 text-sm text-ink-600">
              제출 이후에는 의뢰 내용을 직접 수정할 수 없습니다. 추가 자료는 첨부 파일로
              보완하고, 상태 변경은 아래 진행 카드에서 확인하세요.
            </p>
          </div>
        )}
      </Card>

      {status === "feedback_submitted" ||
      status === "completion_record_issued" ||
      status === "completed" ? (
        <Card className="grid gap-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <CheckCircle2 aria-hidden size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">슈퍼바이저 피드백</h2>
              <p className="mt-1 text-sm text-ink-500">
                제출된 지도 의견을 확인한 뒤 승인하거나 최종 리뷰를 남깁니다.
              </p>
            </div>
          </div>
          {feedbackSummary || feedbackRecommendations ? (
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-ink-600">
                제출 시각 · {formatDateTime(feedbackSubmittedAt)}
              </p>
              <SummaryBlock label="요약 피드백" value={feedbackSummary ?? ""} />
              <SummaryBlock
                label="권고 및 다음 단계"
                value={feedbackRecommendations ?? ""}
              />
            </div>
          ) : (
            <p className="rounded-lg bg-surface-sunken p-3 text-sm text-ink-600">
              피드백 상태이지만 표시할 지도 의견 본문을 찾지 못했습니다. 새로고침 후에도
              계속 비어 있으면 운영자에게 문의해주세요.
            </p>
          )}
        </Card>
      ) : null}

      <Card className="rounded-xl">
        {editableChecklist ? (
          <form
            className="grid gap-3"
            onSubmit={checklistForm.handleSubmit(saveChecklist)}
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <ShieldCheck aria-hidden size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">자료 점검 체크리스트</h2>
                  <span className="text-sm font-semibold text-brand-700">
                    {checkedCount} / {checklistItems.length}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  제출 필수 조건은 아니며, 자료 전달 전 확인 기록으로 남깁니다.
                </p>
              </div>
            </div>
            <div
              aria-label={`자료 점검 확인률 ${String(checklistProgress)}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={checklistProgress}
              className="h-2 rounded-pill bg-surface-sunken"
              role="progressbar"
            >
              <div
                className="h-2 rounded-pill bg-brand-600"
                style={{ width: `${String(checklistProgress)}%` }}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {checklistItems.map((item) => (
                <Label
                  className="flex items-start gap-3 rounded-lg border border-line bg-surface-base p-3 transition hover:border-brand-500 hover:bg-brand-50"
                  key={item.field}
                >
                  <input
                    className="mt-1"
                    type="checkbox"
                    {...checklistForm.register(item.field)}
                  />
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-sm text-ink-500">
                      {item.description}
                    </span>
                  </span>
                </Label>
              ))}
            </div>
            <FormError message={checklistForm.formState.errors.root?.message} />
            <Button type="submit" variant="secondary">
              체크리스트 저장
            </Button>
          </form>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">자료 점검 체크리스트</h2>
              <Badge tone={deidentificationComplete ? "brand" : "neutral"}>
                {deidentificationComplete ? "기록됨" : "기록 없음"}
              </Badge>
            </div>
            <p className="rounded-lg bg-surface-sunken p-3 text-sm text-ink-600">
              {deidentificationComplete
                ? "자료 점검 확인 기록이 저장된 의뢰입니다."
                : "체크리스트 기록이 없어도 제출은 케이스 패킷 기준으로 가능합니다."}
            </p>
          </div>
        )}
      </Card>

      {canSubmit || canCancel || message ? (
        <Card className="flex flex-wrap items-center gap-3 rounded-xl">
          {canSubmit ? (
            <Button onClick={() => void transition("submit")} type="button">
              제출
            </Button>
          ) : status === "draft" ? (
            <p className="rounded-md bg-surface-sunken px-3 py-2 text-sm font-semibold text-ink-500">
              케이스 패킷을 저장하면 제출할 수 있습니다.
            </p>
          ) : null}
          {canCancel ? (
            <Button
              onClick={() => void transition("cancel")}
              type="button"
              variant="secondary"
            >
              취소
            </Button>
          ) : null}
          {message ? <Badge tone="accent">{message}</Badge> : null}
        </Card>
      ) : null}

      <Card className="grid gap-4 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <CreditCard aria-hidden size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">결제</h2>
            <p className="mt-1 text-sm text-ink-500">
              제출 후 결제가 완료되면 슈퍼바이저 검토 대기로 이동합니다.
            </p>
          </div>
        </div>
        {status === "submitted" ? (
          <Button onClick={() => void startPayment()} type="button">
            결제하기
          </Button>
        ) : null}
        {status === "awaiting_payment" ? (
          <div className="grid gap-3 rounded-lg border border-line bg-surface-sunken p-4">
            <p className="text-sm leading-relaxed text-ink-700">
              결제 요청이 만들어졌습니다. 결제창이 닫혔거나 중단된 경우 같은 결제를 다시
              이어서 진행할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void startPayment()} type="button">
                결제 다시 시도
              </Button>
              <Button asChild variant="secondary">
                <a href="/payments">결제 내역 보기</a>
              </Button>
            </div>
          </div>
        ) : null}
        {status === "paid" || status === "awaiting_supervisor_review" ? (
          <p className="text-sm text-ink-700">결제가 완료되었습니다.</p>
        ) : null}
        {status === "completed" ? (
          <p className="text-sm text-ink-700">
            결제, 피드백, 완료 기록, 리뷰까지 모두 마무리된 의뢰입니다.
          </p>
        ) : null}
        {completionRecord ? (
          <section className="grid gap-3 rounded-lg border border-line bg-surface-base p-4">
            <div>
              <h3 className="font-bold text-ink-900">완료 기록</h3>
              <p className="mt-1 text-sm text-ink-600">
                기록번호 {completionRecord.recordNo} · 발급일{" "}
                {formatDateTime(completionRecord.issuedAt)}
              </p>
            </div>
            <CompletionRecordList
              label="검토한 자료"
              values={completionRecord.reviewedMaterials}
            />
            <CompletionRecordList label="확인 범위" values={completionRecord.scope} />
            {completionRecord.limitations ? (
              <div>
                <p className="text-sm font-semibold text-ink-900">검토 한계</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-sm leading-relaxed text-ink-700">
                  {completionRecord.limitations}
                </p>
              </div>
            ) : null}
            {completionRecord.responsibilityNotice ? (
              <div>
                <p className="text-sm font-semibold text-ink-900">책임 고지</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-sm leading-relaxed text-ink-700">
                  {completionRecord.responsibilityNotice}
                </p>
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-ink-500">
              이 기록은 플랫폼 안에서 확인되는 슈퍼비전 완료 기록입니다. 공식
              증명서나 법적 제출용 문서처럼 오해되지 않도록 검토 범위와 한계를 함께
              확인하세요.
            </p>
          </section>
        ) : null}
        {status === "feedback_submitted" && !canWriteFinalReview ? (
          <Button onClick={() => void approveFeedback()} type="button">
            피드백 승인
          </Button>
        ) : null}
        {canWriteFinalReview ? (
          <form
            className="grid gap-3 rounded-lg border border-line bg-surface-base p-4"
            onSubmit={reviewForm.handleSubmit(submitFinalReview)}
          >
            <div>
              <h3 className="font-bold text-ink-900">최종 리뷰 및 완료</h3>
              <p className="mt-1 text-sm text-ink-600">
                슈퍼바이저 피드백을 확인한 뒤 평가를 남기면 의뢰가 완료됩니다.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ScoreSelect
                label="전문성"
                registration={reviewForm.register("expertise")}
              />
              <ScoreSelect
                label="구체성"
                registration={reviewForm.register("specificity")}
              />
              <ScoreSelect
                label="도움 정도"
                registration={reviewForm.register("helpfulness")}
              />
              <ScoreSelect label="윤리성" registration={reviewForm.register("ethics")} />
              <ScoreSelect
                label="응답 속도"
                registration={reviewForm.register("responseSpeed")}
              />
              <ScoreSelect
                label="시간 준수"
                registration={reviewForm.register("onTime")}
              />
              <ScoreSelect
                label="교육적 가치"
                registration={reviewForm.register("educational")}
              />
              <ScoreSelect
                label="재의뢰 의향"
                registration={reviewForm.register("reuseIntent")}
              />
            </div>
            <Field>
              <Label htmlFor="review-free-text">남길 말</Label>
              <Textarea
                id="review-free-text"
                placeholder="피드백에서 특히 도움이 되었던 점이나 다음 이용자를 위한 참고를 적어주세요."
                {...reviewForm.register("freeText")}
              />
            </Field>
            <Button disabled={reviewForm.formState.isSubmitting} type="submit">
              리뷰 제출 및 완료
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[] | null): string {
  return value?.join(", ") ?? "";
}

function selectValue<T extends string>(
  value: string | null,
  allowed: readonly T[]
): T | "" {
  return allowed.includes(value as T) ? (value as T) : "";
}

function displayList(
  value: string[] | null,
  labeler: (value: string) => string
): string {
  return value?.map(labeler).join("\n") ?? "";
}

function identityLabel(value: string): string {
  return value;
}

function purposeLabel(value: string): string {
  const labels: Record<string, string> = {
    diagnostic_hypothesis_review: "진단 가설 점검",
    intervention_planning: "개입 계획 점검",
    report_quality: "보고서 품질 점검",
    risk_review: "위험도 평가 점검"
  };
  return labels[value] ?? value;
}

function requestItemLabel(value: string): string {
  const labels: Record<string, string> = {
    diagnostic_hypothesis_review: "진단 가설 검토",
    interpretation_review: "검사 해석 검토",
    intervention_feedback: "개입 피드백",
    report_comment: "보고서 코멘트"
  };
  return labels[value] ?? value;
}

function ageBandLabel(value: string): string {
  const labels: Record<string, string> = {
    "6-12": "아동",
    "13-18": "청소년",
    "19-39": "성인 초기",
    "40-64": "성인 중장년",
    "65+": "노년"
  };
  return labels[value] ?? value;
}

function settingLabel(value: string): string {
  const labels: Record<string, string> = {
    counseling_center: "상담센터",
    community_center: "지역사회기관",
    hospital: "병원",
    other: "기타",
    school: "학교"
  };
  return labels[value] ?? value;
}

function preferredMethodLabel(value: string): string {
  const labels: Record<string, string> = {
    async_comment: "문서 코멘트",
    comment_plus_zoom: "문서 코멘트와 화상 미팅",
    direct_edit: "직접 수정 제안",
    zoom: "화상 미팅"
  };
  return labels[value] ?? value;
}

function apiErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    calendar_config_required:
      "서비스의 구글 캘린더 연동 설정이 완료되지 않아 일정을 변경할 수 없습니다.",
    calendar_not_connected:
      "슈퍼바이저의 구글 캘린더가 아직 연결되지 않아 일정을 변경할 수 없습니다.",
    calendar_reauth_required:
      "슈퍼바이저의 구글 캘린더 재연동이 필요합니다. 캘린더 확인 전까지 일정을 변경할 수 없습니다.",
    calendar_sync_failed:
      "구글 캘린더와 예약 시간을 동기화하지 못했습니다. 캘린더 확인 전까지 일정을 변경할 수 없습니다.",
    booking_not_found: "변경할 예약 일정을 찾지 못했습니다.",
    deid_incomplete: "자료 점검 항목을 모두 확인해주세요.",
    forbidden: "이 의뢰를 처리할 권한이 없습니다.",
    invalid_slot: "선택한 일정이 올바르지 않습니다.",
    invalid_request: "입력값을 다시 확인해주세요.",
    invalid_state: "현재 상태에서는 이 작업을 진행할 수 없습니다.",
    packet_incomplete: "케이스 패킷을 먼저 저장해주세요.",
    past_slot: "지난 시간대는 선택할 수 없습니다.",
    phi_detected:
      "개인정보로 보이는 내용이 있습니다. 비식별 처리 후 다시 저장해주세요.",
    reschedule_cutoff:
      "세션 시작 24시간 전부터는 일정 변경 대신 관리자 문의가 필요합니다.",
    slot_unavailable: "이미 예약되었거나 선택할 수 없는 시간입니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

async function requestTossPayment(intent: NonNullable<PaymentIntentResponse["data"]>) {
  const createTossPayments = await loadTossPayments();
  const tossPayments = createTossPayments(intent.tossClientPayload.clientKey);
  const origin = window.location.origin;
  const payment = tossPayments.payment({ customerKey: `user-${intent.paymentId}` });
  await payment.requestPayment({
    amount: { currency: "KRW", value: intent.amount },
    card: { flowMode: "DEFAULT" },
    ...(intent.tossClientPayload.customerEmail
      ? { customerEmail: intent.tossClientPayload.customerEmail }
      : {}),
    failUrl: `${origin}/payments/${intent.paymentId}?payment=failed`,
    method: "CARD",
    orderId: intent.pgOrderId,
    orderName: intent.tossClientPayload.orderName,
    successUrl: `${origin}/payments/confirm?paymentId=${intent.paymentId}`
  });
}

async function loadTossPayments(): Promise<TossPaymentsFactory> {
  if (window.TossPayments) {
    return window.TossPayments;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.tosspayments.com/v2/standard"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("toss_sdk_failed")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://js.tosspayments.com/v2/standard";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("toss_sdk_failed")), {
      once: true
    });
    document.head.appendChild(script);
  });

  const tossPayments = window.TossPayments;
  if (typeof tossPayments !== "function") {
    throw new Error("toss_sdk_missing");
  }
  return tossPayments;
}

function isLocalTossIntent(
  intent: NonNullable<PaymentIntentResponse["data"]>["tossClientPayload"]
): boolean {
  return intent.clientKey === "dev-client-key" || intent.orderId.startsWith("csp-dev-");
}

function toDateTimeLocalValue(value: Date | string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seoulOffsetMs = 9 * 60 * 60 * 1000;
  return new Date(date.getTime() + seoulOffsetMs).toISOString().slice(0, 16);
}

function fromSeoulDateTimeLocal(value: string): string {
  return new Date(`${value}:00+09:00`).toISOString();
}

function formatBookingRange(
  startValue: Date | string | null,
  endValue: Date | string | null
): string {
  if (!startValue || !endValue) return "선택된 일정 없음";
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "일정 확인 필요";
  }
  const date = new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
    weekday: "short",
    year: "numeric"
  }).format(start);
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}

function formatDateTime(value: Date | string | null): string {
  if (!value) return "기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "기록 확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    month: "long",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric"
  }).format(date);
}

function bookingStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    cancelled: "취소됨",
    completed: "세션 완료",
    no_show_supervisee: "슈퍼바이지 불참",
    no_show_supervisor: "슈퍼바이저 불참",
    rescheduled: "일정 변경됨",
    scheduled: "예약됨"
  };
  return labels[status ?? ""] ?? "예약 상태 확인 필요";
}

function ScoreSelect({
  label,
  registration
}: {
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <Field>
      <Label>{label}</Label>
      <select
        className="h-11 rounded-lg border border-line bg-surface-elevated px-3"
        {...registration}
      >
        <option value="5">5점 · 매우 만족</option>
        <option value="4">4점 · 만족</option>
        <option value="3">3점 · 보통</option>
        <option value="2">2점 · 아쉬움</option>
        <option value="1">1점 · 매우 아쉬움</option>
      </select>
    </Field>
  );
}

function CompletionRecordList({
  label,
  values
}: {
  label: string;
  values: string[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      <ul className="mt-1 grid gap-1 rounded-lg bg-surface-sunken p-3 text-sm text-ink-700">
        {values.map((value) => (
          <li key={value}>- {value}</li>
        ))}
      </ul>
    </div>
  );
}

function FormError({ message }: { message: string | undefined }) {
  return message ? (
    <p className="text-sm font-medium text-danger" role="alert">
      {message}
    </p>
  ) : null;
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-ink-900">
        {value.trim() || "저장된 내용이 없습니다."}
      </p>
    </div>
  );
}
