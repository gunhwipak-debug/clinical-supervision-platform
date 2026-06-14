import Link from "next/link";
import { profiles, supervision, withUserContext } from "@csp/db";
import { SiteHeader } from "../../../components/clinicflow-shell";
import { DemoSupervisorHomePreview } from "../../../components/workflow-preview-pages";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { getCurrentUser } from "../../../lib/auth/current-user";

export const dynamic = "force-dynamic";

type SupervisorRequestItem = Awaited<
  ReturnType<typeof supervision.listSupervisionRequests>
>[number];

export default async function Page() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return <DemoSupervisorHomePreview />;
  }

  const db = createRuntimeDatabase();
  const [requests, profile, availability] = await withUserContext(
    db,
    { userId: current.session.userId, role: current.session.role },
    async (tx) =>
      Promise.all([
        supervision.listSupervisionRequests(tx),
        profiles.getSupervisorProfileByUserId(tx, current.session.userId),
        profiles.listAvailability(tx, current.session.userId)
      ])
  );

  const assigned = requests.filter(
    (request) => request.supervisorId === current.session.userId
  );
  const workQueue = assigned
    .filter((request) => isSupervisorActionable(request.status))
    .sort(compareSupervisorWork);
  const nextRequest = workQueue[0] ?? null;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <SiteHeader
        active="supervisor"
        actionHref="/supervisor/requests"
        actionLabel="의뢰 큐"
      />

      <main className="mx-auto grid max-w-container-max gap-lg px-gutter py-xl">
        <section className="grid gap-md md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-label-sm text-label-sm text-secondary">
              슈퍼바이저 콘솔
            </p>
            <h1 className="mt-xs font-display-lg text-display-lg text-on-background">
              {profile?.displayName ?? "슈퍼바이저 콘솔"}
            </h1>
            <p className="mt-sm max-w-2xl font-body-md text-body-md text-on-surface-variant">
              지금 처리할 의뢰와 프로필, 제공 항목, 가능시간을 관리합니다.
            </p>
          </div>
          <Link
            className="rounded-lg border border-outline-variant bg-surface px-md py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container"
            href="/settings"
          >
            계정 설정
          </Link>
        </section>

        <section className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-label-sm text-label-sm text-secondary">
              다음에 처리할 요청
            </p>
            <h2 className="mt-xs font-headline-lg text-headline-lg text-on-surface">
              {nextRequest
                ? nextActionTitle(nextRequest.status)
                : "현재 바로 처리할 요청은 없습니다"}
            </h2>
            <p className="mt-sm max-w-2xl font-body-md text-body-md text-on-surface-variant">
              {nextRequest
                ? `${nextRequest.productTitle ?? "슈퍼비전 의뢰"} · ${statusLabel(
                    nextRequest.status
                  )} 상태입니다.`
                : "새 요청이 들어오면 자료 확인, 수락, 피드백 작성 순서로 이곳에 먼저 표시됩니다."}
            </p>
          </div>
          <Link
            className={`rounded-lg px-md py-2 font-label-md text-label-md ${
              nextRequest
                ? "bg-primary text-on-primary"
                : "border border-outline-variant bg-surface text-on-surface"
            }`}
            href={
              nextRequest
                ? (`/supervisor/requests/${nextRequest.id}` as never)
                : "/supervisor/requests"
            }
          >
            {nextRequest ? "요청 열기" : "의뢰 큐 보기"}
          </Link>
        </section>

        <section className="grid gap-lg lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
            <div className="mb-md flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                지금 처리할 의뢰
              </h2>
              <Link
                className="font-label-md text-label-md text-secondary hover:underline"
                href="/supervisor/requests"
              >
                전체 보기
              </Link>
            </div>
            <div className="grid gap-sm">
              {workQueue.slice(0, 5).map((request) => (
                <Link
                  className="grid gap-3 rounded-lg border border-outline-variant bg-surface p-md hover:bg-surface-container-low md:grid-cols-[1fr_auto] md:items-center"
                  href={`/supervisor/requests/${request.id}`}
                  key={request.id}
                >
                  <div>
                    <p className="font-label-sm text-label-sm text-secondary">
                      {statusActionLabel(request.status)}
                    </p>
                    <p className="mt-xs font-label-md text-label-md text-on-surface">
                      {request.productTitle ?? "슈퍼비전 의뢰"}
                    </p>
                    <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                      {statusLabel(request.status)} · 보관{" "}
                      {String(request.retentionDays)}일
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary">
                    arrow_forward
                  </span>
                </Link>
              ))}
              {workQueue.length === 0 ? (
                <p className="rounded-lg border border-outline-variant p-md font-body-sm text-body-sm text-on-surface-variant">
                  현재 슈퍼바이저가 처리해야 할 의뢰가 없습니다.
                </p>
              ) : null}
            </div>
          </div>

          <aside className="grid gap-md">
            {[
              ["/supervisor/profile", "프로필", "badge", "소개와 공개 프로필 관리"],
              [
                "/supervisor/products",
                "제공 항목",
                "payments",
                "지도 방식과 가격 관리"
              ],
              [
                "/supervisor/availability",
                "일정",
                "calendar_month",
                `${String(availability.length)}개 가능시간`
              ],
              [
                "/supervisor/qualifications",
                "자격 검증",
                "verified",
                "자격 검증 자료 관리"
              ]
            ].map(([href, label, icon, body]) => (
              <Link
                className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-md transition-colors hover:border-secondary hover:bg-surface-bright"
                href={href as never}
                key={href}
              >
                <span className="material-symbols-outlined text-secondary">{icon}</span>
                <span>
                  <span className="block font-label-md text-label-md text-on-surface">
                    {label}
                  </span>
                  <span className="block font-body-sm text-body-sm text-on-surface-variant">
                    {body}
                  </span>
                </span>
              </Link>
            ))}
          </aside>
        </section>
      </main>
    </div>
  );
}

function isSupervisorActionable(status: string): boolean {
  return [
    "awaiting_supervisor_review",
    "accepted",
    "in_review",
    "feedback_submitted",
    "additional_info_requested",
    "completion_record_issued"
  ].includes(status);
}

function compareSupervisorWork(
  a: SupervisorRequestItem,
  b: SupervisorRequestItem
): number {
  const priority = (status: string) =>
    ({
      additional_info_requested: 0,
      awaiting_supervisor_review: 1,
      accepted: 2,
      in_review: 3,
      feedback_submitted: 4,
      completion_record_issued: 5
    })[status] ?? 10;
  const priorityGap = priority(a.status) - priority(b.status);
  if (priorityGap !== 0) return priorityGap;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function nextActionTitle(status: string): string {
  const labels: Record<string, string> = {
    additional_info_requested: "보완 자료가 들어왔습니다",
    awaiting_supervisor_review: "수락 여부를 확인해야 합니다",
    accepted: "슈퍼비전 준비 상태를 확인하세요",
    in_review: "피드백 작성을 이어가세요",
    feedback_submitted: "제출한 피드백을 마무리하세요",
    completion_record_issued: "완료 기록을 확인하세요"
  };
  return labels[status] ?? "요청 상태를 확인하세요";
}

function statusActionLabel(status: string): string {
  const labels: Record<string, string> = {
    additional_info_requested: "자료 보완 확인",
    awaiting_supervisor_review: "수락 여부 결정",
    accepted: "검토 준비",
    in_review: "피드백 작성",
    feedback_submitted: "피드백 제출됨",
    completion_record_issued: "완료 기록 확인"
  };
  return labels[status] ?? "상태 확인";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "작성 중",
    submitted: "제출됨",
    awaiting_payment: "결제 대기",
    paid: "결제 완료",
    awaiting_supervisor_review: "검토 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 완료",
    additional_info_requested: "보완 요청",
    completion_record_issued: "완료기록 발급",
    completed: "완료",
    rejected: "반려",
    cancelled: "취소"
  };
  return labels[status] ?? status;
}
