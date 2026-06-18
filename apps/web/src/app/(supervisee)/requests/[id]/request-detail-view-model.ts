import { supervision, withUserContext } from "@csp/db";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { createRuntimeDatabase } from "@/lib/auth/database";
import { isMissingDatabaseRelation } from "@/lib/db/missing-relation";
import { contextFor } from "@/lib/supervision/authz";

type RuntimeDatabase = ReturnType<typeof createRuntimeDatabase>;

export type RequestNextAction = {
  readonly actionLabel: string;
  readonly description: string;
  readonly eyebrow?: string;
  readonly href: string;
  readonly title: string;
};

export const requestFlowSteps = [
  "슈퍼바이저 선택",
  "슈퍼비전 방식",
  "예약 시간",
  "사례자료 정리",
  "답변 확인",
  "결제",
  "수락 대기"
] as const;

export async function readPhiDetail(
  db: RuntimeDatabase,
  current: CurrentUser,
  requestId: string
) {
  try {
    return await withUserContext(
      db,
      contextFor(current, undefined, { phiAccess: true }),
      (tx) =>
        supervision.getSupervisionRequestDetails(tx, requestId, {
          includePhi: true
        })
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      console.warn("[requests.detail.phi]", describeError(error));
    }
    return null;
  }
}

export async function readCompletionRecord(
  db: RuntimeDatabase,
  current: CurrentUser,
  requestId: string
) {
  try {
    return await withUserContext(
      db,
      contextFor(current, undefined, { phiAccess: true }),
      (tx) => supervision.getCompletionRecordForRequest(tx, requestId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      console.warn("[requests.detail.completion-record]", describeError(error));
    }
    return null;
  }
}

export function flowStepForStatus(status: string): (typeof requestFlowSteps)[number] {
  if (
    status === "draft" ||
    status === "submitted" ||
    status === "in_review" ||
    status === "additional_info_requested"
  ) {
    return "사례자료 정리";
  }
  if (status === "awaiting_payment") return "결제";
  if (
    status === "paid" ||
    status === "awaiting_supervisor_review" ||
    status === "accepted" ||
    status === "feedback_submitted" ||
    status === "completion_record_issued" ||
    status === "completed"
  ) {
    return "수락 대기";
  }
  return "답변 확인";
}

export function formatBookingSlot(
  request: supervision.SupervisionRequestDetails
): string {
  if (!request.scheduledStart || !request.scheduledEnd) return "선택된 일정 없음";
  const start = new Date(request.scheduledStart);
  const end = new Date(request.scheduledEnd);
  const date = new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
    weekday: "short",
    year: "numeric"
  }).format(start);
  const time = new Intl.DateTimeFormat("ko-KR", {
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  });
  return `${date} ${time.format(start)}-${time.format(end)}`;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "작성 중",
    submitted: "제출 완료",
    awaiting_payment: "결제 필요",
    paid: "결제 완료",
    awaiting_supervisor_review: "수락 대기",
    accepted: "수락됨",
    additional_info_requested: "추가 자료 요청됨",
    in_review: "검토 진행 중",
    feedback_submitted: "피드백 도착",
    completion_record_issued: "이수 기록 발급됨",
    completed: "완료",
    rejected: "수락되지 않음",
    cancelled: "취소",
    refunded: "환불",
    expired: "만료"
  };
  return labels[status] ?? "상태 미분류";
}

export function pageTitle(status: string): string {
  if (status === "awaiting_supervisor_review" || status === "accepted") {
    return "슈퍼바이저 확인을 기다립니다";
  }
  if (status === "awaiting_payment" || status === "paid") {
    return "선택 내용을 확인하고 결제합니다";
  }
  return "의뢰 상세";
}

export function pageSubtitle(request: supervision.SupervisionRequestDetails): string {
  if (
    request.status === "awaiting_supervisor_review" ||
    request.status === "accepted"
  ) {
    return "결제와 사례자료 정리가 끝났습니다. 슈퍼바이저가 일정과 자료를 확인하면 슈퍼비전이 시작됩니다.";
  }
  if (request.status === "additional_info_requested") {
    return `${request.id.slice(0, 8).toUpperCase()} · 추가 자료가 필요합니다.`;
  }
  if (request.status === "awaiting_payment" || request.status === "paid") {
    return "선택 내용과 결제 상태를 확인합니다.";
  }
  if (
    request.status === "feedback_submitted" ||
    request.status === "completion_record_issued" ||
    request.status === "completed"
  ) {
    return "피드백과 이수 기록을 확인합니다.";
  }
  return `${statusLabel(request.status)} · ${formatBookingSlot(request)}`;
}

export function summaryHeading(status: string): string {
  if (status === "awaiting_supervisor_review" || status === "accepted") {
    return "신청 요약";
  }
  if (
    status === "feedback_submitted" ||
    status === "completion_record_issued" ||
    status === "completed"
  ) {
    return "기록 요약";
  }
  return "의뢰 요약";
}

export function nextActionForStatus(
  status: string,
  requestId: string
): RequestNextAction {
  if (status === "draft" || status === "submitted") {
    return {
      actionLabel: "사례 자료 정리",
      description: "보고서 초안, 검사 결과, 면담 요약을 정리합니다.",
      href: `/requests/${requestId}#case-files`,
      title: "자료를 정리한 뒤 제출 상태를 확인하세요"
    };
  }
  if (status === "additional_info_requested") {
    return {
      actionLabel: "추가 자료 올리기",
      description: "슈퍼바이저가 요청한 보완 자료를 올립니다.",
      eyebrow: "추가 자료 요청",
      href: `/requests/${requestId}#case-files`,
      title: "필요한 자료를 보완하세요"
    };
  }
  if (status === "awaiting_payment" || status === "paid") {
    return {
      actionLabel: "결제 확인",
      description: "신청 내용과 결제 상태를 확인합니다.",
      eyebrow: "확인·결제",
      href: "/payments",
      title: "신청 내용을 확인하고 결제를 마무리하세요"
    };
  }
  if (status === "awaiting_supervisor_review" || status === "accepted") {
    return {
      actionLabel: "진행 상태 보기",
      description: "슈퍼바이저 확인을 기다립니다.",
      eyebrow: "수락 대기",
      href: `/requests/${requestId}#case-info`,
      title: "슈퍼바이저 확인을 기다립니다"
    };
  }
  if (status === "in_review") {
    return {
      actionLabel: "자료 상태 확인",
      description: "검토 상태와 자료 요청 여부를 확인합니다.",
      eyebrow: "검토 진행 중",
      href: `/requests/${requestId}#case-files`,
      title: "검토 진행 상태를 확인하세요"
    };
  }
  if (
    status === "feedback_submitted" ||
    status === "completion_record_issued" ||
    status === "completed"
  ) {
    return {
      actionLabel: "학습 기록 보기",
      description: "피드백과 이수 기록을 확인합니다.",
      eyebrow: "피드백 도착",
      href: "/case-archive",
      title: "피드백을 확인하고 학습 기록에 남기세요"
    };
  }
  return {
    actionLabel: "의뢰 목록",
    description: "의뢰 목록에서 진행 항목을 다시 선택해주세요.",
    eyebrow: "상태 확인",
    href: "/requests",
    title: "의뢰 진행 상태를 다시 확인하세요"
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.name : "Unknown error";
}
