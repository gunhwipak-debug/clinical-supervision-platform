import Link from "next/link";
import { profiles, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import { SectionBlock } from "../../../components/clinicflow-shell";
import { Button } from "../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../components/locked-state";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { getCurrentUser } from "../../../lib/auth/current-user";

export const dynamic = "force-dynamic";

type SupervisorRequestItem = Awaited<
  ReturnType<typeof supervision.listSupervisionRequests>
>[number];

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="슈퍼바이저 업무" returnTo="/supervisor" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        title="슈퍼바이저 업무"
        description="이 화면은 슈퍼바이저 계정에서만 사용할 수 있습니다."
        actionHref="/requests"
        actionLabel="내 의뢰 보기"
      />
    );
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
    <AppShell
      action={
        <Button asChild>
          <Link
            href={
              nextRequest
                ? (`/supervisor/requests/${nextRequest.id}` as never)
                : "/supervisor/requests"
            }
          >
            {nextRequest ? "첫 요청 열기" : "요청 목록 열기"}
          </Link>
        </Button>
      }
      active="supervisor"
      title={profile?.displayName ?? "슈퍼바이저 업무"}
      subtitle="오늘 먼저 볼 의뢰와 프로필, 슈퍼비전 방식, 가능 시간을 정리합니다."
    >
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SectionBlock
          subtitle="새 자료 확인, 수락 여부 결정, 피드백 초안 마무리처럼 바로 처리할 일을 한 줄로 정리합니다."
          title="지금 이어갈 요청"
        >
          <div className="rounded-xl border border-line bg-surface-elevated">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <p className="text-lg font-bold text-ink-900">
                  {nextRequest
                    ? nextActionTitle(nextRequest.status)
                    : "현재 바로 처리할 요청이 없습니다"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  {nextRequest
                    ? `${nextRequest.productTitle ?? "슈퍼비전 의뢰"}에서 다음 행동을 이어갑니다.`
                    : "새 요청이 들어오면 이 화면에서 먼저 확인합니다."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {[
                  ["전체", workQueue.length],
                  [
                    "자료 도착",
                    workQueue.filter(
                      (request) => request.status === "additional_info_requested"
                    ).length
                  ],
                  [
                    "수락 대기",
                    workQueue.filter(
                      (request) => request.status === "awaiting_supervisor_review"
                    ).length
                  ],
                  [
                    "초안",
                    workQueue.filter((request) =>
                      ["accepted", "in_review", "feedback_submitted"].includes(
                        request.status
                      )
                    ).length
                  ]
                ].map(([label, count], index) => (
                  <span
                    className={`rounded-full border px-3 py-2 ${
                      index === 0
                        ? "border-brand-600 text-brand-700"
                        : "border-line text-ink-500"
                    }`}
                    key={label}
                  >
                    {label} {String(count)}
                  </span>
                ))}
              </div>
            </div>
            {workQueue.slice(0, 5).map((request) => (
              <article
                className="grid gap-4 border-b border-line px-5 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                key={request.id}
              >
                <div>
                  <p className="text-xs font-bold text-brand-700">
                    {statusActionLabel(request.status)}
                  </p>
                  <p className="mt-2 text-base font-bold text-ink-900">
                    {request.productTitle ?? "슈퍼비전 의뢰"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    {statusLabel(request.status)} · 자료 보관{" "}
                    {String(request.retentionDays)}일
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/supervisor/requests/${request.id}`}>
                    {requestActionLabel(request.status)}
                  </Link>
                </Button>
              </article>
            ))}
            {workQueue.length === 0 ? (
              <p className="px-5 py-8 text-sm leading-relaxed text-ink-500">
                현재 슈퍼바이저가 처리해야 할 의뢰가 없습니다.
              </p>
            ) : null}
          </div>
        </SectionBlock>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-brand-700">업무 요약</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900">오늘 점검할 준비 항목</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            요청 검토를 멈추지 않도록 공개 정보와 일정 설정 상태만 함께 확인합니다.
          </p>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine
              label="바로 처리할 요청"
              value={`${String(workQueue.length)}건`}
            />
            <SummaryLine
              label="공개 가능 시간"
              value={`${String(availability.length)}개`}
            />
            <SummaryLine
              label="프로필 표시명"
              value={profile?.displayName ?? "입력 전"}
            />
          </div>
          <div className="mt-5 grid gap-4">
            {[
              ["/supervisor/profile", "프로필", "소개와 공개 프로필"],
              ["/supervisor/products", "슈퍼비전 방식", "세션 유형과 시간"],
              [
                "/supervisor/availability",
                "일정",
                `${String(availability.length)}개 가능 시간`
              ],
              ["/supervisor/qualifications", "자격 심사", "자격 자료 확인"]
            ].map(([href, label, body]) => (
              <Link
                className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0"
                href={href as never}
                key={href}
              >
                <span className="text-sm font-bold text-ink-900">{label}</span>
                <span className="text-sm leading-relaxed text-ink-500">{body}</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
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
    in_review: "피드백 정리",
    feedback_submitted: "피드백 도착",
    completion_record_issued: "학습 기록 확인"
  };
  return labels[status] ?? "상태 확인";
}

function requestActionLabel(status: string): string {
  const labels: Record<string, string> = {
    additional_info_requested: "자료 확인",
    awaiting_supervisor_review: "수락 확인",
    accepted: "검토 시작",
    in_review: "이어 쓰기",
    feedback_submitted: "피드백 확인",
    completion_record_issued: "기록 확인"
  };
  return labels[status] ?? "열기";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "작성 중",
    submitted: "제출됨",
    awaiting_payment: "결제 필요",
    paid: "결제 완료",
    awaiting_supervisor_review: "수락 대기",
    accepted: "수락됨",
    in_review: "검토 중",
    feedback_submitted: "피드백 도착",
    additional_info_requested: "추가 자료 요청",
    completion_record_issued: "학습 기록 발급",
    completed: "완료",
    rejected: "수락되지 않음",
    cancelled: "취소"
  };
  return labels[status] ?? status;
}
