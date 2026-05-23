"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  MessageSquareText,
  ShieldCheck,
  UserX,
  Video,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { Field, Label, Textarea } from "../../../../../components/ui/form";
import { COMPLETION_RECORD_RESPONSIBILITY_NOTICE } from "../../../../../lib/supervision/completion-record";

const feedbackSchema = z.object({
  summary: z.string().min(10, "요약 피드백을 10자 이상 입력해주세요."),
  recommendations: z.string().min(10, "권고를 10자 이상 입력해주세요.")
});

const completionSchema = z.object({
  reviewedMaterials: z.string().min(2, "검토한 자료를 입력해주세요."),
  scope: z.string().min(2, "확인 범위를 입력해주세요."),
  limitations: z.string().min(10, "검토 한계를 10자 이상 입력해주세요."),
  responsibilityNotice: z.string().min(10, "책임 고지를 10자 이상 입력해주세요.")
});

const rejectSchema = z.object({
  reason: z.string().min(10, "반려 사유를 10자 이상 입력해주세요.")
});

type FeedbackValues = z.infer<typeof feedbackSchema>;
type CompletionValues = z.infer<typeof completionSchema>;
type RejectValues = z.infer<typeof rejectSchema>;

export function RequestWorkflow({
  compact = false,
  bookingStatus = null,
  latestReviewStatus = null,
  meetingUrl = null,
  needsCompletionRecord = null,
  requestId,
  scheduledEnd = null,
  scheduledStart = null,
  serviceProductSupervisionType = null,
  status
}: {
  compact?: boolean;
  bookingStatus?: string | null;
  latestReviewStatus?: string | null;
  meetingUrl?: string | null;
  needsCompletionRecord?: boolean | null;
  requestId: string;
  scheduledEnd?: Date | string | null;
  scheduledStart?: Date | string | null;
  serviceProductSupervisionType?: string | null;
  status: string;
}) {
  const [message, setMessage] = useState("");
  const feedbackForm = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { summary: "", recommendations: "" }
  });
  const completionForm = useForm<CompletionValues>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      reviewedMaterials: "",
      scope: "",
      limitations: "",
      responsibilityNotice: COMPLETION_RECORD_RESPONSIBILITY_NOTICE
    }
  });
  const rejectForm = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" }
  });

  async function post(action: string, body: unknown) {
    const response = await fetch(`/api/supervision-requests/${requestId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    const next = response.ok
      ? "처리되었습니다."
      : workflowErrorMessage(payload?.error?.code, payload?.error?.message);
    setMessage(next);
    if (response.ok) {
      toast.success(next);
      window.location.reload();
    } else {
      toast.error(next);
    }
  }

  async function feedback(values: FeedbackValues) {
    await post("feedback", values);
  }

  async function completion(values: CompletionValues) {
    await post("completion", {
      reviewedMaterials: splitList(values.reviewedMaterials),
      scope: splitList(values.scope),
      limitations: values.limitations,
      responsibilityNotice: values.responsibilityNotice
    });
  }

  async function reject(values: RejectValues) {
    await post("reject", values);
  }

  async function sessionOutcome(
    outcome: "completed" | "no_show_supervisee" | "no_show_supervisor"
  ) {
    await post("session-outcome", { outcome });
  }

  if (compact) {
    const canRequestRevision =
      status === "in_review" || status === "feedback_submitted";
    const canComplete = canIssueCompletion({
      latestReviewStatus,
      needsCompletionRecord,
      serviceProductSupervisionType,
      status
    });
    return (
      <div className="flex w-full items-center gap-sm sm:w-auto">
        <a
          aria-disabled={!canRequestRevision}
          className={`flex flex-1 items-center justify-center gap-xs rounded-lg border border-outline px-4 py-2 font-label-md text-label-md transition-colors sm:flex-none ${
            canRequestRevision
              ? "text-on-surface hover:bg-surface-container-lowest"
              : "pointer-events-none cursor-not-allowed text-on-surface-variant opacity-50"
          }`}
          href="#supervisor-actions"
          title={
            canRequestRevision
              ? "보완 요청 입력 영역으로 이동합니다."
              : "검토 중 또는 피드백 완료 상태에서 사용할 수 있습니다."
          }
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          보완 요청
        </a>
        <a
          aria-disabled={!canComplete}
          className={`flex flex-1 items-center justify-center gap-xs rounded-lg px-4 py-2 font-label-md text-label-md shadow-sm transition-opacity sm:flex-none ${
            canComplete
              ? "bg-primary text-on-primary hover:opacity-90"
              : "pointer-events-none cursor-not-allowed bg-primary text-on-primary opacity-50"
          }`}
          href="#supervisor-actions"
          title={
            canComplete
              ? "완료기록 입력 영역으로 이동합니다."
              : completionBlockedReason({
                  latestReviewStatus,
                  needsCompletionRecord,
                  serviceProductSupervisionType,
                  status
                })
          }
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          완료기록 발급
        </a>
      </div>
    );
  }

  const completionReady = canIssueCompletion({
    latestReviewStatus,
    needsCompletionRecord,
    serviceProductSupervisionType,
    status
  });

  return (
    <Card className="h-fit rounded-xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <WorkflowIcon status={status} />
        </span>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={workflowTone(status)}>{workflowTitle(status)}</Badge>
          </div>
          <h2 className="text-xl font-bold text-ink-900">처리 작업</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {workflowDescription(status)}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-line bg-surface-base p-4">
        <div className="flex items-start gap-3">
          <CalendarClock aria-hidden className="mt-0.5 text-brand-700" size={20} />
          <div>
            <h3 className="font-bold text-ink-900">예약 세션</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {formatBookingRange(scheduledStart, scheduledEnd)} ·{" "}
              {bookingStatusLabel(bookingStatus)}
            </p>
          </div>
        </div>
        {meetingUrl ? (
          <Button asChild variant="secondary">
            <a href={meetingUrl} rel="noreferrer" target="_blank">
              <Video aria-hidden size={18} />
              화상 세션 입장
            </a>
          </Button>
        ) : (
          <p className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-600">
            구글 캘린더 회의 링크가 아직 동기화되지 않았습니다.
          </p>
        )}
        {canRecordSessionOutcome(status, bookingStatus) ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              onClick={() => void sessionOutcome("completed")}
              type="button"
              variant="secondary"
            >
              <CheckCircle2 aria-hidden size={18} />
              세션 완료
            </Button>
            <Button
              onClick={() => void sessionOutcome("no_show_supervisee")}
              type="button"
              variant="secondary"
            >
              <UserX aria-hidden size={18} />
              슈퍼바이지 불참
            </Button>
            <Button
              onClick={() => void sessionOutcome("no_show_supervisor")}
              type="button"
              variant="secondary"
            >
              <UserX aria-hidden size={18} />
              슈퍼바이저 불참
            </Button>
          </div>
        ) : null}
      </div>

      {status === "awaiting_supervisor_review" ? (
        <div className="grid gap-4 rounded-lg border border-line bg-surface-base p-4">
          <div>
            <h3 className="font-bold text-ink-900">검토 가능 여부를 결정하세요</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              의뢰 범위, 자료 충분성, 일정 가능성을 확인한 뒤 수락 또는 반려를
              선택합니다.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => void post("accept", {})} type="button">
              <CheckCircle2 aria-hidden size={18} />
              수락하고 검토 시작
            </Button>
          </div>
          <form className="grid gap-3" onSubmit={rejectForm.handleSubmit(reject)}>
            <Field>
              <Label htmlFor="reject-reason">반려 사유</Label>
              <Textarea
                id="reject-reason"
                placeholder="의뢰 범위, 자료 부족, 일정 문제 등 반려 사유를 구체적으로 적어주세요."
                {...rejectForm.register("reason")}
              />
              {rejectForm.formState.errors.reason ? (
                <p className="text-sm text-danger">
                  {rejectForm.formState.errors.reason.message}
                </p>
              ) : null}
            </Field>
            <Button
              disabled={rejectForm.formState.isSubmitting}
              type="submit"
              variant="secondary"
            >
              <XCircle aria-hidden size={18} />
              사유를 남기고 반려
            </Button>
          </form>
        </div>
      ) : null}
      {status === "accepted" || status === "in_review" ? (
        <form
          className="grid gap-4 rounded-lg border border-line bg-surface-base p-4"
          onSubmit={feedbackForm.handleSubmit(feedback)}
        >
          <div>
            <h3 className="font-bold text-ink-900">피드백 작성</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              슈퍼비전 핵심 요약과 다음 수정 방향을 분리해 기록합니다.
            </p>
          </div>
          <Field>
            <Label htmlFor="summary">요약 피드백</Label>
            <Textarea
              id="summary"
              placeholder="검토한 자료의 핵심 강점과 주요 보완점을 요약하세요."
              {...feedbackForm.register("summary")}
            />
            {feedbackForm.formState.errors.summary ? (
              <p className="text-sm text-danger">
                {feedbackForm.formState.errors.summary.message}
              </p>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="recommendations">권고</Label>
            <Textarea
              id="recommendations"
              placeholder="해석, 보고서 구조, 추가 확인이 필요한 지점을 정리하세요."
              {...feedbackForm.register("recommendations")}
            />
            {feedbackForm.formState.errors.recommendations ? (
              <p className="text-sm text-danger">
                {feedbackForm.formState.errors.recommendations.message}
              </p>
            ) : null}
          </Field>
          <Button disabled={feedbackForm.formState.isSubmitting} type="submit">
            <MessageSquareText aria-hidden size={18} />
            피드백 제출
          </Button>
        </form>
      ) : null}
      {status === "feedback_submitted" && completionReady ? (
        <form
          className="grid gap-4 rounded-lg border border-line bg-surface-base p-4"
          onSubmit={completionForm.handleSubmit(completion)}
        >
          <div>
            <h3 className="font-bold text-ink-900">완료기록 발급</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              검토 범위와 한계를 남긴 뒤, 고정 책임 고지를 포함해 완료기록을 발급합니다.
            </p>
          </div>
          <Field>
            <Label htmlFor="reviewedMaterials">검토한 자료</Label>
            <Textarea
              id="reviewedMaterials"
              placeholder="예: 사례보고서 초안&#10;예: 심리검사 결과 요약본"
              {...completionForm.register("reviewedMaterials")}
            />
            {completionForm.formState.errors.reviewedMaterials ? (
              <p className="text-sm text-danger">
                {completionForm.formState.errors.reviewedMaterials.message}
              </p>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="scope">확인 범위</Label>
            <Textarea
              id="scope"
              placeholder="예: 검사 해석의 논리성&#10;예: 보고서 구조와 피드백 반영 여부"
              {...completionForm.register("scope")}
            />
            {completionForm.formState.errors.scope ? (
              <p className="text-sm text-danger">
                {completionForm.formState.errors.scope.message}
              </p>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="limitations">검토 한계</Label>
            <Textarea
              id="limitations"
              placeholder="자료 범위, 비동기 검토 한계, 추가 면담 부재 등 한계를 적습니다."
              {...completionForm.register("limitations")}
            />
            {completionForm.formState.errors.limitations ? (
              <p className="text-sm text-danger">
                {completionForm.formState.errors.limitations.message}
              </p>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="responsibilityNotice">책임 고지(고정 문구)</Label>
            <Textarea
              id="responsibilityNotice"
              readOnly
              {...completionForm.register("responsibilityNotice")}
            />
            <p className="text-xs leading-relaxed text-ink-500">
              완료기록이 진단서, 감정서, 법적 증명서처럼 오해되지 않도록 모든 발급
              기록에 동일하게 포함됩니다.
            </p>
            {completionForm.formState.errors.responsibilityNotice ? (
              <p className="text-sm text-danger">
                {completionForm.formState.errors.responsibilityNotice.message}
              </p>
            ) : null}
          </Field>
          <Button disabled={completionForm.formState.isSubmitting} type="submit">
            <FileCheck2 aria-hidden size={18} />
            완료기록 발급
          </Button>
        </form>
      ) : null}
      {status === "feedback_submitted" && !completionReady ? (
        <div className="rounded-lg border border-line bg-surface-base p-4">
          <h3 className="font-bold text-ink-900">완료기록 발급 대기</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {completionBlockedReason({
              latestReviewStatus,
              needsCompletionRecord,
              serviceProductSupervisionType,
              status
            })}
          </p>
        </div>
      ) : null}
      {isReadOnlyStatus(status) ? (
        <div className="rounded-lg border border-line bg-surface-base p-4">
          <h3 className="font-bold text-ink-900">읽기 전용 상태입니다</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {readOnlyDescription(status)}
          </p>
        </div>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-surface-sunken px-4 py-3 text-sm text-ink-700">
          {message}
        </p>
      ) : null}
    </Card>
  );
}

function canIssueCompletion({
  latestReviewStatus,
  needsCompletionRecord,
  serviceProductSupervisionType,
  status
}: {
  latestReviewStatus: string | null;
  needsCompletionRecord: boolean | null;
  serviceProductSupervisionType: string | null;
  status: string;
}): boolean {
  return (
    status === "feedback_submitted" &&
    serviceProductSupervisionType === "assessment" &&
    needsCompletionRecord !== false &&
    latestReviewStatus === "feedback_approved"
  );
}

function completionBlockedReason({
  latestReviewStatus,
  needsCompletionRecord,
  serviceProductSupervisionType,
  status
}: {
  latestReviewStatus: string | null;
  needsCompletionRecord: boolean | null;
  serviceProductSupervisionType: string | null;
  status: string;
}): string {
  if (status !== "feedback_submitted") {
    return "피드백 제출 후 슈퍼바이지 승인 단계에서 사용할 수 있습니다.";
  }
  if (
    serviceProductSupervisionType !== "assessment" ||
    needsCompletionRecord === false
  ) {
    return "이 의뢰는 완료기록 발급 대상이 아닙니다. 슈퍼바이지가 피드백을 확인하면 완료 처리됩니다.";
  }
  if (latestReviewStatus !== "feedback_approved") {
    return "슈퍼바이지가 피드백을 승인한 뒤 완료기록을 발급할 수 있습니다.";
  }
  return "완료기록 발급 조건을 확인하고 있습니다.";
}

function workflowErrorMessage(code: string | undefined, fallback?: string): string {
  const labels: Record<string, string> = {
    feedback_approval_required:
      "슈퍼바이지가 피드백을 승인한 뒤 완료기록을 발급할 수 있습니다.",
    booking_not_found: "결과를 기록할 예약을 찾지 못했습니다.",
    forbidden: "이 의뢰를 처리할 권한이 없습니다.",
    invalid_request: "입력값을 다시 확인해주세요.",
    invalid_state: "현재 상태에서는 처리할 수 없습니다.",
    not_found: "의뢰를 찾지 못했습니다.",
    phi_detected: "식별정보로 보일 수 있는 문구가 포함되어 있습니다.",
    stamp_not_required: "이 의뢰는 완료기록 발급 대상이 아닙니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? fallback ?? "처리하지 못했습니다.";
}

function canRecordSessionOutcome(
  status: string,
  bookingStatus: string | null
): boolean {
  return (
    ["accepted", "in_review", "meeting_scheduled"].includes(status) &&
    (bookingStatus === "scheduled" || bookingStatus === "rescheduled")
  );
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

function splitList(value: string): string[] {
  return value
    .split(/\n|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function WorkflowIcon({ status }: { status: string }) {
  if (status === "awaiting_supervisor_review") {
    return <ShieldCheck aria-hidden size={22} />;
  }
  if (status === "feedback_submitted") {
    return <FileCheck2 aria-hidden size={22} />;
  }
  if (status === "rejected" || status === "cancelled") {
    return <XCircle aria-hidden size={22} />;
  }
  if (status === "completed" || status === "completion_record_issued") {
    return <CheckCircle2 aria-hidden size={22} />;
  }
  return <MessageSquareText aria-hidden size={22} />;
}

function workflowTitle(status: string): string {
  const labels: Record<string, string> = {
    awaiting_supervisor_review: "수락 결정",
    accepted: "피드백 작성",
    in_review: "피드백 작성",
    feedback_submitted: "완료기록",
    additional_info_requested: "보완 요청됨",
    completion_record_issued: "발급 완료",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소"
  };
  return labels[status] ?? "상태 확인";
}

function workflowTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "rejected" || status === "cancelled") return "danger";
  if (status === "awaiting_supervisor_review" || status === "feedback_submitted") {
    return "accent";
  }
  if (status === "completed" || status === "completion_record_issued") return "brand";
  return "neutral";
}

function workflowDescription(status: string): string {
  const descriptions: Record<string, string> = {
    awaiting_supervisor_review: "자료를 검토한 뒤 수락 또는 반려를 선택합니다.",
    accepted: "수락한 의뢰의 피드백을 작성할 수 있습니다.",
    in_review: "검토 중인 의뢰의 피드백을 작성할 수 있습니다.",
    feedback_submitted: "피드백 제출 후 완료기록 발급을 진행합니다.",
    additional_info_requested: "슈퍼바이지의 수정본 제출을 기다립니다.",
    completion_record_issued: "완료기록이 발급되어 슈퍼바이지 확인을 기다립니다.",
    completed: "슈퍼비전 흐름이 완료되었습니다.",
    rejected: "반려된 의뢰는 추가 작업이 없습니다.",
    cancelled: "취소된 의뢰는 추가 작업이 없습니다."
  };
  return descriptions[status] ?? "현재 상태에서 가능한 작업을 확인합니다.";
}

function isReadOnlyStatus(status: string): boolean {
  return [
    "completion_record_issued",
    "completed",
    "additional_info_requested",
    "rejected",
    "cancelled",
    "expired"
  ].includes(status);
}

function readOnlyDescription(status: string): string {
  const descriptions: Record<string, string> = {
    completion_record_issued:
      "완료기록이 이미 발급되었습니다. 슈퍼바이지 리뷰 또는 완료 확인을 기다립니다.",
    completed: "완료된 의뢰입니다. 기록 확인만 가능합니다.",
    additional_info_requested:
      "보완 요청을 보냈습니다. 수정본 제출 후 다시 검토할 수 있습니다.",
    rejected: "반려 처리된 의뢰입니다. 새 작업은 생성되지 않습니다.",
    cancelled: "취소된 의뢰입니다. 감사 목적의 조회만 가능합니다.",
    expired: "보관 기간이 만료된 의뢰입니다."
  };
  return descriptions[status] ?? "현재 상태에서는 추가 입력이 필요하지 않습니다.";
}
