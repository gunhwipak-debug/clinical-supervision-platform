import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { EmptyState } from "../../../../components/ui/state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { QualificationForm } from "./qualification-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const current = await getCurrentUser();

  if (!current || current.user.role !== "supervisor") {
    return (
      <AppShell title="자격 관리" subtitle="슈퍼바이저 계정으로 로그인해주세요.">
        <EmptyState
          title="로그인이 필요합니다"
          description="자격 제출은 슈퍼바이저만 사용할 수 있습니다."
        />
      </AppShell>
    );
  }

  const qualifications = await withUserContext(
    createRuntimeDatabase(),
    {
      userId: current.session.userId,
      role: current.session.role,
      phiAccess: true
    },
    (tx) => profiles.listQualifications(tx, current.session.userId)
  );

  return (
    <AppShell
      title="자격 관리"
      subtitle="모집된 슈퍼바이저가 승인 받을 자격을 제출하고 상태를 확인합니다."
    >
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {qualifications.length === 0 ? (
            <EmptyState
              title="제출된 자격이 없습니다"
              description="첫 자격을 제출하면 운영자가 승인 여부를 확인합니다."
            />
          ) : (
            qualifications.map((qualification) => (
              <Card className="rounded-2xl" key={qualification.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{qualification.name}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {qualification.issuingBody ?? "발급 기관 미입력"}
                    </p>
                    <dl className="mt-3 grid gap-2 text-sm text-ink-600 md:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-ink-700">자격번호</dt>
                        <dd>{qualification.number ?? "미입력"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-ink-700">유효기간</dt>
                        <dd>
                          {formatDate(qualification.issuedAt)} -{" "}
                          {formatDate(qualification.expiresAt) ?? "만료일 없음"}
                        </dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="font-semibold text-ink-700">제출 증빙</dt>
                        <dd>
                          {qualification.evidenceOriginalFilename
                            ? `${qualification.evidenceOriginalFilename} · ${formatBytes(
                                qualification.evidenceSizeBytes
                              )}`
                            : "증빙 없음"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Badge
                    tone={qualification.status === "approved" ? "brand" : "accent"}
                  >
                    {qualification.status === "approved"
                      ? "승인"
                      : qualification.status === "rejected"
                        ? "반려"
                        : "대기"}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
        <QualificationForm />
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
