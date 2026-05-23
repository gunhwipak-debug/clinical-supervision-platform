import Link from "next/link";
import { calendar, profiles, supervision, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/state";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { isSupervisor } from "../../../lib/auth/guards";
import { contextFor } from "../../../lib/supervision/authz";
import { SettingsProfileForm } from "./settings-profile-form";
import { SupervisorApplicationButton } from "./supervisor-application-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <main className="min-h-screen bg-background p-gutter">
        <EmptyState
          title="로그인이 필요합니다"
          description="계정과 프로필 설정을 보려면 먼저 로그인하세요."
        />
      </main>
    );
  }

  const db = createRuntimeDatabase();
  const [superviseeProfile, supervisorProfile, calendarConnection, requests] =
    await withUserContext(db, contextFor(current), async (tx) =>
      Promise.all([
        profiles.getSuperviseeProfileByUserId(tx, current.session.userId),
        isSupervisor(current)
          ? profiles.getSupervisorProfileByUserId(tx, current.session.userId)
          : Promise.resolve(null),
        isSupervisor(current)
          ? calendar.getConnectionSummaryForUser(tx, current.session.userId)
          : Promise.resolve(null),
        supervision.listSupervisionRequests(tx)
      ])
    );

  const sentRequests = requests.filter(
    (request) => request.superviseeId === current.session.userId
  );
  const receivedRequests = requests.filter(
    (request) => request.supervisorId === current.session.userId
  );

  return (
    <AppShell
      title="계정 설정"
      subtitle="로그인 계정, 슈퍼바이지 프로필, 슈퍼바이저 업무 상태를 실제 저장 데이터 기준으로 관리합니다."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 계정</CardTitle>
              <CardDescription>
                모든 사용자는 슈퍼비전을 받을 수 있는 임상가 계정으로 시작합니다.
              </CardDescription>
            </CardHeader>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <SettingRow label="이메일" value={current.user.email} />
              <SettingRow label="현재 권한" value={roleLabel(current.user.role)} />
              <SettingRow label="계정 상태" value={statusLabel(current.user.status)} />
              <SettingRow
                label="2단계 인증"
                value={current.user.totpEnabled ? "사용 중" : "사용하지 않음"}
              />
              <SettingRow
                label="비밀번호 변경"
                value={
                  current.user.passwordChangedAt
                    ? formatDate(current.user.passwordChangedAt)
                    : "변경 기록 없음"
                }
              />
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>[의뢰자 전용] 슈퍼바이지 프로필 설정</CardTitle>
              <CardDescription>
                후배 임상가(의뢰자)로서 선배 슈퍼바이저에게 슈퍼비전을 신청할 때 전달되는 정보입니다.
              </CardDescription>
            </CardHeader>
            <SettingsProfileForm profile={superviseeProfile} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>슈퍼바이저 업무 상태</CardTitle>
              <CardDescription>
                슈퍼바이저도 필요할 때 다른 슈퍼바이저에게 슈퍼비전을 의뢰할 수
                있습니다. 아래 정보는 슈퍼바이저 업무를 수행할 때만 추가로 적용됩니다.
              </CardDescription>
            </CardHeader>
            {isSupervisor(current) ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={supervisorProfile ? "brand" : "neutral"}>
                    {supervisorProfile ? "프로필 등록됨" : "프로필 미등록"}
                  </Badge>
                  <Badge tone={calendarConnection ? "brand" : "neutral"}>
                    구글 캘린더 {calendarConnection ? "연동됨" : "미연동"}
                  </Badge>
                  {supervisorProfile ? (
                    <Badge
                      tone={verificationTone(supervisorProfile.verificationStatus)}
                    >
                      {verificationLabel(supervisorProfile.verificationStatus)}
                    </Badge>
                  ) : null}
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <SettingRow
                    label="공개 이름"
                    value={supervisorProfile?.displayName ?? "아직 등록되지 않음"}
                  />
                  <SettingRow
                    label="공개 상태"
                    value={
                      supervisorProfile
                        ? visibilityLabel(supervisorProfile.visibility)
                        : "-"
                    }
                  />
                  <SettingRow
                    label="받은 자료"
                    value={`${receivedRequests.length.toLocaleString("ko-KR")}건`}
                  />
                  <SettingRow
                    label="내가 의뢰한 자료"
                    value={`${sentRequests.length.toLocaleString("ko-KR")}건`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary">
                    <Link href="/supervisor/profile">슈퍼바이저 프로필 관리</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/supervisor/availability">예약 가능시간 관리</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-md rounded-xl border border-secondary/20 bg-gradient-to-r from-secondary/5 via-surface to-surface p-md text-sm text-on-surface">
                <div className="flex flex-col gap-sm">
                  <span className="inline-flex max-w-fit rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
                    슈퍼바이저 매칭 안내
                  </span>
                  <h4 className="font-title-md text-base font-bold text-on-surface">
                    회원가입만으로 간편하게 시작하는 지도교수 업무 절차
                  </h4>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    복잡한 인증 절차 없이, 본인만의 임상 프로필과 예약 가능한 시간 슬롯을 지정하여 후배 임상가(슈퍼바이지)와 매칭을 즉각 시작하세요.
                  </p>
                  
                  <div className="mt-sm grid gap-sm sm:grid-cols-2 md:grid-cols-4 text-xs">
                    <div className="rounded-lg border border-outline-variant/60 bg-surface/50 p-sm shadow-2xs">
                      <strong className="block text-secondary">1. 권한 신청 시작</strong>
                      <p className="mt-xs text-on-surface-variant text-[11px]">아래 [신청 시작] 버튼을 누르고 약관에 동의합니다.</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/60 bg-surface/50 p-sm shadow-2xs">
                      <strong className="block text-secondary">2. 프로필 및 캘린더 등록</strong>
                      <p className="mt-xs text-on-surface-variant text-[11px]">이름, 주요 학력 및 예약 가능한 시간 슬롯을 지정합니다.</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/60 bg-surface/50 p-sm shadow-2xs">
                      <strong className="block text-secondary">3. 상품 구성</strong>
                      <p className="mt-xs text-on-surface-variant text-[11px]">대면, 비대면(화상), 서면 등 제공할 상품 단가를 등록합니다.</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant/60 bg-surface/50 p-sm shadow-2xs">
                      <strong className="block text-secondary">4. 매칭 및 자동 정산</strong>
                      <p className="mt-xs text-on-surface-variant text-[11px]">매칭 건당 수수료를 제외한 금액이 본인 계좌로 자동 정산됩니다.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-md flex justify-end border-t border-outline-variant/30 pt-sm">
                  <SupervisorApplicationButton />
                </div>
              </div>
            )}
          </Card>
        </section>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>보안</CardTitle>
              <CardDescription>
                민감자료 접근 기록과 2단계 인증은 운영 정책의 핵심 항목입니다.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 text-sm">
              <div className="rounded-md border border-line bg-surface-sunken p-3">
                <p className="font-semibold text-ink-900">2단계 인증</p>
                <p className="mt-1 text-ink-600">
                  {current.user.totpEnabled
                    ? "현재 2단계 인증이 켜져 있습니다."
                    : "관리자와 슈퍼바이저 업무에는 2단계 인증을 켜는 것을 권장합니다."}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-sunken p-3">
      <dt className="text-xs font-semibold text-ink-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "관리자",
    supervisee: "슈퍼바이지",
    supervisor: "슈퍼바이지 + 슈퍼바이저"
  };
  return labels[role] ?? role;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "정상",
    suspended: "정지",
    withdrawn: "탈퇴"
  };
  return labels[status] ?? status;
}

function verificationLabel(status: string): string {
  const labels: Record<string, string> = {
    approved: "검증 완료",
    pending: "검증 대기",
    rejected: "검증 반려",
    revoked: "검증 취소"
  };
  return labels[status] ?? status;
}

function verificationTone(status: string): "brand" | "accent" | "neutral" | "danger" {
  if (status === "approved") return "brand";
  if (status === "pending") return "accent";
  if (status === "rejected" || status === "revoked") return "danger";
  return "neutral";
}

function visibilityLabel(visibility: string): string {
  const labels: Record<string, string> = {
    hidden: "비공개",
    private: "링크 공개",
    public: "검색 공개"
  };
  return labels[visibility] ?? visibility;
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
