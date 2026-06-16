import type { files, supervision } from "@csp/db";
import { DEMO_IDS } from "@csp/db/demo-accounts";

const now = "2026-06-15T09:00:00.000Z";

type RequestStatus = supervision.SupervisionRequestSummary["status"];

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
    productTitle: "사례 개념화 50분",
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
    productTitle: "사례 개념화 50분",
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
    productTitle: "사례 개념화 50분",
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
    productTitle: "사례 개념화 50분",
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
    productTitle: "사례 개념화 50분",
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
