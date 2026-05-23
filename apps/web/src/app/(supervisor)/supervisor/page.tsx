import Link from "next/link";
import { profiles, supervision, withUserContext } from "@csp/db";
import { EmptyState } from "../../../components/ui/state";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { getCurrentUser } from "../../../lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="슈퍼바이저 콘솔은 슈퍼바이저 계정으로 로그인해야 사용할 수 있습니다."
        />
      </main>
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
  const actionable = assigned.filter((request) =>
    isSupervisorActionable(request.status)
  );
  const waiting = assigned.filter(
    (request) => request.status === "awaiting_supervisor_review"
  ).length;
  const active = assigned.filter((request) =>
    [
      "accepted",
      "in_review",
      "feedback_submitted",
      "additional_info_requested"
    ].includes(request.status)
  ).length;
  const completed = assigned.filter((request) => request.status === "completed").length;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-lg">
        <Link
          className="font-headline-md text-headline-md font-bold text-primary"
          href="/"
        >
          ClinicFlow
        </Link>
        <div className="flex items-center gap-md">
          <Link
            className="rounded-lg bg-primary px-md py-2 font-label-md text-label-md text-on-primary"
            href="/supervisor/requests"
          >
            의뢰 검토
          </Link>
          <Link
            className="grid h-8 w-8 place-items-center rounded-full border border-outline-variant bg-surface-container-high"
            href="/supervisor/profile"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              person
            </span>
          </Link>
        </div>
      </header>

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
              지금 처리할 의뢰와 프로필, 상품, 가능시간을 관리합니다.
            </p>
          </div>
          <Link
            className="rounded-lg border border-outline-variant bg-surface px-md py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container"
            href="/settings"
          >
            계정 설정
          </Link>
        </section>

        <section className="grid gap-md md:grid-cols-3">
          <KpiCard icon="clinical_notes" label="새 의뢰" value={waiting} />
          <KpiCard icon="rate_review" label="검토 중" value={active} />
          <KpiCard icon="task_alt" label="완료" value={completed} />
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
              {actionable.slice(0, 5).map((request) => (
                <Link
                  className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-md hover:bg-surface-container-low"
                  href={`/supervisor/requests/${request.id}`}
                  key={request.id}
                >
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">
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
              {actionable.length === 0 ? (
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
                "서비스 상품",
                "payments",
                "서비스 상품과 가격 관리"
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
                className="flex items-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-md transition-all duration-250 hover:scale-[1.015] hover:border-secondary hover:bg-surface-bright active:scale-[0.985] shadow-2xs hover:shadow-sm"
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

function KpiCard({
  icon,
  label,
  value
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg transition-all duration-300 hover:scale-[1.025] hover:border-secondary hover:shadow-lg hover:shadow-secondary/5 cursor-default">
      <span className="material-symbols-outlined text-secondary">{icon}</span>
      <p className="mt-md font-label-md text-label-md text-on-surface-variant">
        {label}
      </p>
      <p className="mt-xs font-display-lg text-display-lg text-on-background">
        {String(value)}
      </p>
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
