import type { files, payments, profiles, supervision } from "@csp/db";
import { DEMO_IDS } from "@csp/db/demo-accounts";

const now = "2026-06-15T09:00:00.000Z";

type RequestStatus = supervision.SupervisionRequestSummary["status"];

export type DemoSupervisorProduct = {
  description: string | null;
  id: string;
  kind: string | null;
  priceKrw: number;
  turnaroundHours: number | null;
  title: string;
};

export type DemoSupervisor = {
  averageRating: string;
  avgResponseMinutes: number;
  bio: string;
  displayName: string;
  headline: string;
  id: string;
  photoUrl: string | null;
  qualifications: Array<{ name: string }>;
  serviceProducts: DemoSupervisorProduct[];
  specialties: string[];
  totalCompleted: number;
  userId: string;
  yearsOfExperience: number;
};

export const DEMO_PUBLIC_SUPERVISORS: DemoSupervisor[] = [
  {
    averageRating: "4.7",
    avgResponseMinutes: 240,
    bio: "성인 정신병리 평가와 성격평가 보고서 피드백을 중심으로, 근거 기반 해석과 윤리적 문서화를 함께 점검합니다.",
    displayName: "김도현 슈퍼바이저",
    headline: "성인 정신병리·MMPI·로르샤흐 슈퍼비전",
    id: DEMO_IDS.approvedSupervisor,
    photoUrl: null,
    qualifications: [{ name: "임상심리전문가" }],
    serviceProducts: [
      {
        description: "예약한 시간에 화상으로 사례를 함께 검토합니다.",
        id: DEMO_IDS.productZoom,
        kind: "zoom_90",
        priceKrw: 360000,
        turnaroundHours: 90,
        title: "화상 슈퍼비전"
      },
      {
        description: "업로드한 사례자료를 검토한 뒤 글로 피드백을 제공합니다.",
        id: DEMO_IDS.productAsync,
        kind: "async_comment",
        priceKrw: 120000,
        turnaroundHours: 72,
        title: "서면 피드백"
      }
    ],
    specialties: ["성인 정신병리", "성격평가", "보고서 피드백"],
    totalCompleted: 84,
    userId: DEMO_IDS.approvedSupervisor,
    yearsOfExperience: 12
  }
];

export function getDemoPublicSupervisor(id: string): DemoSupervisor | null {
  return DEMO_PUBLIC_SUPERVISORS.find((supervisor) => supervisor.id === id) ?? null;
}

type PublicDemoFallbackEnv = Record<string, string | undefined>;

export function shouldUsePublicDemoSupervisors(
  env: PublicDemoFallbackEnv = process.env
): boolean {
  const vercelEnv = env["VERCEL_ENV"];
  if (vercelEnv) return vercelEnv !== "production";

  const deploymentEnv = env["CLINICFLOW_DEPLOYMENT_ENV"] ?? env["APP_ENV"];
  if (deploymentEnv) {
    return ["development", "demo", "preview", "staging", "test"].includes(
      deploymentEnv
    );
  }

  return env["NODE_ENV"] !== "production";
}

function summary(input: {
  id: string;
  superviseeId: string;
  supervisorId: string | null;
  serviceProductId: string | null;
  status: RequestStatus;
  productTitle: string;
  productKind?: string;
  serviceProductSupervisionType?: "assessment" | "counseling";
  supervisorDisplayName: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  urgency?: "normal" | "urgent_24h" | null;
}): supervision.SupervisionRequestSummary {
  return {
    id: input.id,
    superviseeId: input.superviseeId,
    supervisorId: input.supervisorId,
    serviceProductId: input.serviceProductId,
    status: input.status,
    retentionDays: 30,
    retentionExpiresAt: "2026-07-15T09:00:00.000Z",
    urgency: input.urgency ?? "normal",
    desiredDeadline: null,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: now,
    productTitle: input.productTitle,
    productKind: input.productKind ?? "async_comment",
    serviceProductSupervisionType: input.serviceProductSupervisionType ?? "assessment",
    supervisorDisplayName: input.supervisorDisplayName,
    scheduledStart: input.scheduledStart ?? null,
    scheduledEnd: input.scheduledEnd ?? null,
    meetingUrl: null,
    bookingStatus: input.scheduledStart ? "scheduled" : null
  };
}

const demoSummaries: supervision.SupervisionRequestSummary[] = [
  summary({
    id: DEMO_IDS.requestCompletion,
    superviseeId: DEMO_IDS.supervisee,
    supervisorId: DEMO_IDS.childSupervisor,
    serviceProductId: DEMO_IDS.productChild,
    status: "completion_record_issued",
    productTitle: "아동 평가 보고서 슈퍼비전",
    supervisorDisplayName: "이민서 슈퍼바이저",
    scheduledStart: "2026-06-18T10:00:00.000Z",
    scheduledEnd: "2026-06-18T10:50:00.000Z"
  }),
  summary({
    id: DEMO_IDS.requestCompleted,
    superviseeId: DEMO_IDS.supervisee,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productZoom,
    status: "completed",
    productTitle: "화상 슈퍼비전",
    productKind: "zoom_60",
    supervisorDisplayName: "김도현 슈퍼바이저",
    scheduledStart: "2026-06-10T06:00:00.000Z",
    scheduledEnd: "2026-06-10T06:50:00.000Z"
  }),
  summary({
    id: DEMO_IDS.requestDraft,
    superviseeId: DEMO_IDS.draftAuthor,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productAsync,
    status: "draft",
    productTitle: "화상 슈퍼비전",
    supervisorDisplayName: "김도현 슈퍼바이저"
  }),
  summary({
    id: DEMO_IDS.requestRejected,
    superviseeId: DEMO_IDS.draftAuthor,
    supervisorId: DEMO_IDS.forensicSupervisor,
    serviceProductId: DEMO_IDS.productForensic,
    status: "rejected",
    productTitle: "법심리 보고서 검토",
    supervisorDisplayName: "정하린 슈퍼바이저"
  }),
  summary({
    id: DEMO_IDS.requestSubmitted,
    superviseeId: DEMO_IDS.superviseeTwo,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productAsync,
    status: "submitted",
    productTitle: "서면 피드백",
    supervisorDisplayName: "김도현 슈퍼바이저",
    scheduledStart: "2026-06-19T05:00:00.000Z",
    scheduledEnd: "2026-06-19T05:50:00.000Z"
  }),
  summary({
    id: DEMO_IDS.requestAwaitingPayment,
    superviseeId: DEMO_IDS.superviseeTwo,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productAsync,
    status: "awaiting_payment",
    productTitle: "화상 슈퍼비전",
    supervisorDisplayName: "김도현 슈퍼바이저",
    scheduledStart: "2026-06-20T02:00:00.000Z",
    scheduledEnd: "2026-06-20T02:50:00.000Z"
  }),
  summary({
    id: DEMO_IDS.requestPaid,
    superviseeId: DEMO_IDS.superviseeTwo,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productDirect,
    status: "paid",
    productTitle: "보고서 문장 검토",
    supervisorDisplayName: "김도현 슈퍼바이저",
    scheduledStart: "2026-06-21T04:00:00.000Z",
    scheduledEnd: "2026-06-21T04:50:00.000Z"
  }),
  summary({
    id: "10000000-0000-4000-8000-000000000610",
    superviseeId: DEMO_IDS.superviseeTwo,
    supervisorId: DEMO_IDS.approvedSupervisor,
    serviceProductId: DEMO_IDS.productAsync,
    status: "awaiting_supervisor_review",
    productTitle: "화상 슈퍼비전",
    supervisorDisplayName: "김도현 슈퍼바이저",
    scheduledStart: "2026-06-22T06:00:00.000Z",
    scheduledEnd: "2026-06-22T06:50:00.000Z"
  }),
  summary({
    id: DEMO_IDS.requestInReview,
    superviseeId: DEMO_IDS.superviseeThree,
    supervisorId: DEMO_IDS.neuroSupervisor,
    serviceProductId: DEMO_IDS.productNeuro,
    status: "in_review",
    productTitle: "인지 평가 해석 검토",
    supervisorDisplayName: "박준영 슈퍼바이저",
    scheduledStart: "2026-06-17T06:00:00.000Z",
    scheduledEnd: "2026-06-17T06:50:00.000Z",
    urgency: "urgent_24h"
  }),
  summary({
    id: DEMO_IDS.requestFeedback,
    superviseeId: DEMO_IDS.superviseeThree,
    supervisorId: DEMO_IDS.traumaSupervisor,
    serviceProductId: DEMO_IDS.productTrauma,
    status: "feedback_submitted",
    productTitle: "위기 사례 의사소통",
    supervisorDisplayName: "최유나 슈퍼바이저",
    scheduledStart: "2026-06-12T08:00:00.000Z",
    scheduledEnd: "2026-06-12T08:50:00.000Z"
  })
];

const detailById = new Map<string, supervision.SupervisionRequestDetails>(
  demoSummaries.map((request) => [
    request.id,
    {
      ...request,
      casePacketId: `20000000-0000-4000-8000-${request.id.slice(-12)}`,
      title:
        request.id === DEMO_IDS.requestFeedback
          ? "위기 사례 의사소통"
          : "종합심리평가 보고서",
      purpose: ["보고서 구조 점검", "해석 근거 확인", "보완 질문 정리"],
      clientAgeBand: "13-18",
      clientGender: "비공개",
      setting: "hospital",
      chiefComplaint:
        "평가 결과와 면담 내용을 보고서 결론으로 연결하는 데 어려움이 있습니다.",
      referralReason:
        "검사 결과, 보호자 면담, 관찰 기록을 통합해 슈퍼바이저에게 핵심 질문을 확인받고자 합니다.",
      testsUsed: ["K-WISC-V", "MMPI-A", "문장완성검사"],
      requestItems: [
        "결론 문단의 흐름",
        "검사 결과 해석의 근거",
        "보완 자료가 필요한 부분"
      ],
      preferredMethod: "async_comment",
      needsCompletionRecord: true,
      packetComplete: request.status !== "draft",
      deidentificationComplete: request.status !== "draft",
      feedbackSummary:
        request.status === "feedback_submitted" ||
        request.status === "completion_record_issued" ||
        request.status === "completed"
          ? "핵심 피드백과 보완 자료 방향이 정리되었습니다."
          : null,
      feedbackRecommendations:
        request.status === "feedback_submitted" ||
        request.status === "completion_record_issued" ||
        request.status === "completed"
          ? "결론 문단은 의뢰 사유, 검사 결과, 면담 관찰을 같은 순서로 연결해 다시 작성하세요."
          : null,
      feedbackSubmittedAt:
        request.status === "feedback_submitted" ||
        request.status === "completion_record_issued" ||
        request.status === "completed"
          ? "2026-06-14T06:00:00.000Z"
          : null
    }
  ])
);

const demoUserIds = new Set<string>(Object.values(DEMO_IDS));

export function isDemoUserId(userId: string): boolean {
  return demoUserIds.has(userId);
}

export function listDemoSuperviseeRequests(
  superviseeId: string
): supervision.SupervisionRequestSummary[] {
  return demoSummaries.filter((request) => request.superviseeId === superviseeId);
}

export function listDemoSupervisorRequests(
  supervisorId: string
): supervision.SupervisionRequestSummary[] {
  return demoSummaries.filter((request) => request.supervisorId === supervisorId);
}

export function getDemoSupervisionRequestDetails(
  requestId: string
): supervision.SupervisionRequestDetails | null {
  return detailById.get(requestId) ?? null;
}

const demoPayments: payments.PaymentRecord[] = [
  {
    id: DEMO_IDS.paymentPaid,
    supervisionRequestId: DEMO_IDS.requestCompleted,
    superviseeId: DEMO_IDS.supervisee,
    supervisorId: DEMO_IDS.approvedSupervisor,
    amountKrw: 360000,
    platformFeeKrw: 72000,
    supervisorNetKrw: 288000,
    pgProvider: "demo",
    pgPaymentKey: "demo-completed-payment-key",
    pgOrderId: "demo-completed-order",
    status: "paid",
    paidAt: "2026-06-10T09:00:00.000Z",
    createdAt: "2026-06-10T08:50:00.000Z",
    requestStatus: "completed",
    productTitle: "화상 슈퍼비전"
  }
];

export function listDemoPaymentsForSupervisee(
  superviseeId: string
): payments.PaymentRecord[] {
  return demoPayments.filter((payment) => payment.superviseeId === superviseeId);
}

export function getDemoPaymentById(paymentId: string): payments.PaymentRecord | null {
  return demoPayments.find((payment) => payment.id === paymentId) ?? null;
}

export function getDemoSupervisorProfile(
  supervisorId: string
): profiles.SupervisorProfile | null {
  if (supervisorId !== DEMO_IDS.approvedSupervisor) return null;

  return {
    id: DEMO_IDS.approvedSupervisorProfile,
    userId: DEMO_IDS.approvedSupervisor,
    displayName: "김도현 슈퍼바이저",
    photoUrl: null,
    headline: "성인 정신병리·MMPI·로르샤흐 슈퍼비전",
    bio: "성인 정신병리 평가와 성격평가 보고서 피드백을 중심으로, 근거 기반 해석과 윤리적 문서화를 함께 점검합니다.",
    yearsOfExperience: 12,
    zoomMeetingUrl: null,
    verificationStatus: "approved",
    verifiedAt: "2026-06-10T09:00:00.000Z",
    visibility: "public",
    avgResponseMinutes: 240,
    totalCompleted: 84,
    averageRating: "4.70"
  };
}

export function listDemoSupervisorQualifications(
  supervisorId: string
): profiles.Qualification[] {
  if (supervisorId !== DEMO_IDS.approvedSupervisor) return [];

  return [
    {
      id: DEMO_IDS.qualification,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      name: "임상심리전문가",
      number: "KCP-2014-DEMO",
      issuingBody: "한국임상심리학회",
      issuedAt: "2014-03-01",
      expiresAt: null,
      evidenceFileId: null,
      evidenceOriginalFilename: "임상심리전문가_자격확인.pdf",
      evidenceMimeType: "application/pdf",
      evidenceSizeBytes: 420000,
      evidenceUploadedAt: "2026-06-10T09:00:00.000Z",
      evidenceVirusScanStatus: "clean",
      verificationNote: "Demo approved qualification",
      status: "approved",
      createdAt: "2026-06-10T09:00:00.000Z"
    }
  ];
}

export function listDemoSupervisorSpecialties(
  supervisorId: string
): profiles.Specialty[] {
  if (supervisorId !== DEMO_IDS.approvedSupervisor) return [];

  return [
    {
      id: "demo-specialty-adult",
      code: "adult_psychopathology",
      labelKo: "성인 정신병리",
      displayOrder: 1,
      active: true
    },
    {
      id: "demo-specialty-personality",
      code: "personality_assessment",
      labelKo: "성격평가",
      displayOrder: 2,
      active: true
    }
  ];
}

export function listDemoSupervisorProducts(supervisorId: string): profiles.Product[] {
  if (supervisorId !== DEMO_IDS.approvedSupervisor) return [];

  return [
    {
      id: DEMO_IDS.productZoom,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      active: true,
      kind: "zoom_90",
      title: "화상 슈퍼비전",
      description: "평가자료 해석과 보고서 방향을 실시간으로 논의합니다.",
      priceKrw: 360000,
      turnaroundHours: 90,
      createdAt: "2026-06-10T09:00:00.000Z"
    },
    {
      id: DEMO_IDS.productAsync,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      active: true,
      kind: "async_comment",
      title: "서면 피드백",
      description: "보고서 초안에 구조화 코멘트를 제공합니다.",
      priceKrw: 120000,
      turnaroundHours: 72,
      createdAt: "2026-06-10T09:00:00.000Z"
    }
  ];
}

export function listDemoSupervisorAvailability(
  supervisorId: string
): profiles.AvailabilitySlot[] {
  if (supervisorId !== DEMO_IDS.approvedSupervisor) return [];

  return [
    {
      id: DEMO_IDS.slotMonday,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      weekday: 1,
      startTime: "10:00",
      endTime: "12:00",
      timezone: "Asia/Seoul"
    },
    {
      id: DEMO_IDS.slotWednesday,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      weekday: 3,
      startTime: "14:00",
      endTime: "17:00",
      timezone: "Asia/Seoul"
    },
    {
      id: DEMO_IDS.slotFriday,
      supervisorProfileId: DEMO_IDS.approvedSupervisorProfile,
      weekday: 5,
      startTime: "09:00",
      endTime: "11:00",
      timezone: "Asia/Seoul"
    }
  ];
}

export function listDemoCaseFilesForRequest(requestId: string): files.CaseFileRecord[] {
  const request = detailById.get(requestId);
  if (!request?.casePacketId) return [];

  return [
    {
      id: `30000000-0000-4000-8000-${requestId.slice(-12)}`,
      casePacketId: request.casePacketId,
      supervisionRequestId: requestId,
      superviseeId: request.superviseeId,
      supervisorId: request.supervisorId,
      requestStatus: request.status,
      uploadedBy: request.superviseeId,
      kind: "report_draft",
      originalFilename: "보고서_초안.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1840000,
      storageKey: `demo/${requestId}/report-draft.pdf`,
      parentFileId: null,
      versionNo: 1,
      isFinalReturn: false,
      checksumSha256: null,
      virusScanStatus: "clean",
      phiScanStatus: "clean",
      uploadedAt: "2026-06-14T02:30:00.000Z",
      retentionExpiresAt: request.retentionExpiresAt,
      deletedAt: null
    },
    {
      id: `30000000-0000-4000-8001-${requestId.slice(-12)}`,
      casePacketId: request.casePacketId,
      supervisionRequestId: requestId,
      superviseeId: request.superviseeId,
      supervisorId: request.supervisorId,
      requestStatus: request.status,
      uploadedBy: request.superviseeId,
      kind: "test_result",
      originalFilename: "검사결과_요약.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 820000,
      storageKey: `demo/${requestId}/test-summary.xlsx`,
      parentFileId: null,
      versionNo: 1,
      isFinalReturn: false,
      checksumSha256: null,
      virusScanStatus: "clean",
      phiScanStatus: "clean",
      uploadedAt: "2026-06-14T02:35:00.000Z",
      retentionExpiresAt: request.retentionExpiresAt,
      deletedAt: null
    }
  ];
}
