import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { EmptyState } from "../../../../components/ui/state";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import {
  isDemoUserId,
  listDemoSupervisorQualifications
} from "../../../../lib/demo/supervision";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";
import { QualificationForm } from "./qualification-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <LoginRequiredState title="자격 심사" returnTo="/supervisor/qualifications" />
    );
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="자격 심사"
        description="자격 심사는 슈퍼바이저 계정에서만 진행합니다."
      />
    );
  }

  let qualifications: Awaited<ReturnType<typeof profiles.listQualifications>>;
  try {
    qualifications = await withUserContext(
      createRuntimeDatabase(),
      {
        userId: current.session.userId,
        role: current.session.role,
        phiAccess: true
      },
      (tx) => profiles.listQualifications(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error) && !isDemoUserId(current.session.userId)) {
      throw error;
    }

    qualifications = [];
  }
  if (qualifications.length === 0 && isDemoUserId(current.session.userId)) {
    qualifications = listDemoSupervisorQualifications(current.session.userId);
  }
  const pendingCount = qualifications.filter(
    (qualification) => qualification.status === "pending"
  ).length;
  const approvedCount = qualifications.filter(
    (qualification) => qualification.status === "approved"
  ).length;
  const rejectedCount = qualifications.filter(
    (qualification) => qualification.status === "rejected"
  ).length;

  return (
    <AppShell
      active="supervisor-qualifications"
      currentUser={current.user}
      action={
        <Button asChild>
          <a href="#qualification-form">첫 심사 열기</a>
        </Button>
      }
      title="자격 심사"
      subtitle="공개 목록에 필요한 자격 증빙을 제출하고, 운영자 확인 상태를 봅니다."
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-6">
          <section className="grid gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">제출한 자격</h2>
              <p className="mt-1 text-base leading-relaxed text-ink-500">
                자격명, 발급기관, 증빙 파일, 공개 조건을 한 줄씩 확인합니다.
              </p>
            </div>
            {qualifications.length === 0 ? (
              <EmptyState
                title="제출된 자격이 없습니다"
                description="아래 제출 폼에서 공개 프로필에 필요한 자격 증빙을 먼저 올립니다."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
                {qualifications.map((qualification) => (
                  <article
                    className="grid gap-4 border-b border-line p-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
                    key={qualification.id}
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone={qualificationTone(qualification.status)}>
                          {qualificationStatusLabel(qualification.status)}
                        </Badge>
                        <span className="text-sm font-semibold text-ink-500">
                          {qualification.issuingBody ?? "발급 기관 미입력"}
                        </span>
                      </div>
                      <h3 className="break-keep text-xl font-bold text-ink-900">
                        {qualification.name}
                      </h3>
                      <p className="mt-2 break-keep text-sm leading-relaxed text-ink-600">
                        {qualification.evidenceOriginalFilename
                          ? `${qualification.evidenceOriginalFilename} · ${formatBytes(
                              qualification.evidenceSizeBytes
                            )}`
                          : "제출 증빙 파일이 아직 연결되지 않았습니다."}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">
                        {qualificationChecklist(qualification.status)}
                      </p>
                    </div>
                    <dl className="grid gap-2 text-sm md:min-w-44">
                      <div>
                        <dt className="font-bold text-ink-400">자격번호</dt>
                        <dd className="mt-1 font-semibold text-ink-900">
                          {qualification.number ?? "미입력"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold text-ink-400">유효기간</dt>
                        <dd className="mt-1 font-semibold text-ink-900">
                          {formatDate(qualification.issuedAt)} -{" "}
                          {formatDate(qualification.expiresAt) ?? "만료일 없음"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4" id="qualification-form">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">새 자격 제출</h2>
              <p className="mt-1 text-base leading-relaxed text-ink-500">
                공개 프로필에 표시할 자격만 제출하고, 증빙 파일은 최신 상태로
                유지합니다.
              </p>
            </div>
            <QualificationForm />
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-brand-700">심사 기준</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900">제출 전 확인할 항목</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            공개 프로필에 표시될 자격, 전문분야, 소개 문구가 제출 증빙과 맞는지 운영자가
            확인합니다.
          </p>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <DarkSummaryLine label="심사 대기" value={`${String(pendingCount)}건`} />
            <DarkSummaryLine label="승인됨" value={`${String(approvedCount)}건`} />
            <DarkSummaryLine label="반려됨" value={`${String(rejectedCount)}건`} />
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-relaxed text-ink-600">
            <p>자격번호와 발급기관이 공개 문구와 일치해야 합니다.</p>
            <p>증빙 파일이 오래되었거나 만료되면 다시 제출해야 합니다.</p>
            <p>승인 전까지는 검색 공개 전환이 제한될 수 있습니다.</p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatBytes(value: number | null): string {
  if (!value) return "크기 확인 필요";
  if (value < 1024 * 1024) return `${String(Math.round(value / 102.4) / 10)}KB`;
  return `${String(Math.round(value / 1024 / 102.4) / 10)}MB`;
}

function qualificationStatusLabel(status: string): string {
  if (status === "approved") return "승인";
  if (status === "rejected") return "반려";
  return "대기";
}

function qualificationTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "approved") return "brand";
  if (status === "rejected") return "danger";
  return "accent";
}

function qualificationChecklist(status: string): string {
  if (status === "approved") {
    return "공개 프로필 표시 조건을 통과했습니다. 소개 문구와 전문분야도 함께 다시 확인하세요.";
  }
  if (status === "rejected") {
    return "반려 사유를 확인한 뒤 증빙 파일과 자격 정보를 다시 제출해야 합니다.";
  }
  return "운영자가 자격번호, 발급기관, 공개 문구 일치 여부를 심사 중입니다.";
}

function DarkSummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3">
      <span className="font-bold text-ink-500">{label}</span>
      <span className="font-semibold leading-relaxed text-ink-900">{value}</span>
    </div>
  );
}
