import type { profiles } from "@csp/db";

export type SupervisionMethodCatalogItem = {
  readonly code: profiles.ServiceProductKind;
  readonly defaultDescription: string;
  readonly defaultPriceKrw: number;
  readonly defaultTurnaroundHours: number | null;
  readonly deliveryMode: "asynchronous" | "live_video";
  readonly helpText: string;
  readonly name: string;
  readonly requiresSchedule: boolean;
  readonly settingLabel: string;
};

export const liveSessionDurations = [50, 60, 90, 120] as const;

export const standardSupervisionMethods = [
  {
    code: "async_comment",
    defaultDescription: "업로드한 사례자료를 검토한 뒤 글로 피드백을 제공합니다.",
    defaultPriceKrw: 120_000,
    defaultTurnaroundHours: 72,
    deliveryMode: "asynchronous",
    helpText: "사례 요약, 질문, 첨부자료를 바탕으로 서면 답변을 받습니다.",
    name: "서면 피드백",
    requiresSchedule: false,
    settingLabel: "피드백 제공 기한"
  },
  {
    code: "async_direct_edit",
    defaultDescription:
      "심리평가 보고서의 내용과 구성에 대해 문서 주석과 함께 피드백을 제공합니다.",
    defaultPriceKrw: 150_000,
    defaultTurnaroundHours: 96,
    deliveryMode: "asynchronous",
    helpText:
      "보고서 파일을 업로드할 때는 이름, 생년월일, 연락처 등 개인을 알아볼 수 있는 정보는 지운 뒤 업로드해 주세요.",
    name: "보고서 검토",
    requiresSchedule: false,
    settingLabel: "피드백 제공 기한"
  },
  {
    code: "zoom_90",
    defaultDescription: "예약한 시간에 화상으로 사례를 함께 검토합니다.",
    defaultPriceKrw: 180_000,
    defaultTurnaroundHours: 90,
    deliveryMode: "live_video",
    helpText: "가능 시간에서 세션 전체가 확보된 시작 시각만 신청자에게 보입니다.",
    name: "화상 슈퍼비전",
    requiresSchedule: true,
    settingLabel: "세션 시간"
  }
] as const satisfies readonly SupervisionMethodCatalogItem[];

export const standardSupervisionMethodCodes = new Set<profiles.ServiceProductKind>(
  standardSupervisionMethods.map((method) => method.code)
);

export function supervisionMethodByKind(
  kind: string | null | undefined
): SupervisionMethodCatalogItem | null {
  return (
    standardSupervisionMethods.find((method) => method.code === kind) ??
    legacyMethodByKind(kind)
  );
}

export function displaySupervisionMethodName(input: {
  kind?: string | null;
  title?: string | null;
}): string {
  const method = supervisionMethodByKind(input.kind);
  return method?.name ?? input.title ?? "슈퍼비전 방식";
}

export function displaySupervisionMethodDescription(input: {
  description?: string | null;
  kind?: string | null;
}): string {
  const method = supervisionMethodByKind(input.kind);
  return input.description?.trim() || method?.defaultDescription || "설명 미등록";
}

export function isTimedBookingKind(kind: string | null | undefined): boolean {
  return kind === "zoom_60" || kind === "zoom_90";
}

export function durationMinutesForKind(kind: string | null | undefined): number | null {
  if (kind === "zoom_60") return 60;
  if (kind === "zoom_90") return 90;
  return null;
}

export function durationMinutesForProduct(input: {
  kind?: string | null;
  turnaroundHours?: number | null;
}): number | null {
  if (!isTimedBookingKind(input.kind)) return null;
  if (
    typeof input.turnaroundHours === "number" &&
    liveSessionDurations.includes(
      input.turnaroundHours as (typeof liveSessionDurations)[number]
    )
  ) {
    return input.turnaroundHours;
  }
  return durationMinutesForKind(input.kind);
}

export function feedbackDeadlineLabel(hours: number | null | undefined): string {
  if (!hours) return "제공 기한 미정";
  if (hours % 24 === 0) return `${String(hours / 24)}일 이내`;
  return `${String(hours)}시간 이내`;
}

function legacyMethodByKind(
  kind: string | null | undefined
): SupervisionMethodCatalogItem | null {
  if (kind === "zoom_60") {
    return {
      code: "zoom_60",
      defaultDescription: "예약한 시간에 화상으로 사례를 함께 검토합니다.",
      defaultPriceKrw: 150_000,
      defaultTurnaroundHours: null,
      deliveryMode: "live_video",
      helpText: "기존 60분 화상 방식입니다. 신규 기본 방식은 90분 화상 슈퍼비전입니다.",
      name: "화상 슈퍼비전",
      requiresSchedule: true,
      settingLabel: "세션 시간"
    };
  }
  if (kind === "urgent_24h") {
    return {
      code: "urgent_24h",
      defaultDescription: "짧은 기한이 필요한 사례를 우선 검토합니다.",
      defaultPriceKrw: 220_000,
      defaultTurnaroundHours: 24,
      deliveryMode: "asynchronous",
      helpText: "기존 긴급 검토 방식입니다. 표준 catalog 전환 전까지 보존합니다.",
      name: "긴급 서면 피드백",
      requiresSchedule: false,
      settingLabel: "피드백 제공 기한"
    };
  }
  return null;
}
