import Link from "next/link";
import { profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../components/app-shell";
import { SectionBlock } from "../../../components/clinicflow-shell";
import { Button } from "../../../components/ui/button";
import { LoginRequiredState } from "../../../components/locked-state";
import { getCurrentUser } from "../../../lib/auth/current-user";
import { createRuntimeDatabase } from "../../../lib/auth/database";
import { isSupervisor } from "../../../lib/auth/guards";
import { isMissingDatabaseRelation } from "../../../lib/db/missing-relation";
import { contextFor } from "../../../lib/supervision/authz";
import { SettingsProfileForm } from "./settings-profile-form";
import { SupervisorApplicationButton } from "./supervisor-application-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await getCurrentUser();

  if (!current) {
    return <LoginRequiredState title="계정 설정" returnTo="/settings" />;
  }

  let superviseeProfile: profiles.SuperviseeProfile | null;
  try {
    const db = createRuntimeDatabase();
    superviseeProfile = await withUserContext(db, contextFor(current), (tx) =>
      profiles.getSuperviseeProfileByUserId(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      throw error;
    }

    console.warn(
      "[supervisee.settings.page.demo-fallback]",
      "rendering fallback because the local database schema is unavailable."
    );
    superviseeProfile = null;
  }
  const supervisorMode = isSupervisor(current);

  return (
    <AppShell
      active="settings"
      currentUser={current.user}
      title="계정 설정"
      subtitle="로그인 계정과 신청자 프로필만 정리합니다."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-6">
          <SectionBlock
            title="기본 계정"
            subtitle="로그인과 알림에 사용하는 계정 상태입니다."
          >
            <dl className="rounded-xl border border-line bg-surface-elevated px-5 text-sm">
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
          </SectionBlock>

          <SectionBlock
            title="신청자 프로필"
            subtitle="슈퍼비전을 신청할 때 슈퍼바이저에게 전달되는 기본 정보입니다."
          >
            <div className="rounded-xl border border-line bg-surface-elevated p-5">
              <SettingsProfileForm profile={superviseeProfile} />
            </div>
          </SectionBlock>
        </section>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-ink-900">계정 확인</h2>
          <dl className="mt-5 grid divide-y divide-line text-sm">
            <SettingRow
              label="2단계 인증"
              value={current.user.totpEnabled ? "사용 중" : "확인 필요"}
            />
            <SettingRow label="계정 상태" value={statusLabel(current.user.status)} />
            <div className="grid gap-1 py-3">
              <dt className="font-bold text-ink-400">안내</dt>
              <dd className="break-keep font-semibold leading-relaxed text-ink-900">
                {current.user.totpEnabled
                  ? "현재 계정 확인이 완료되어 있습니다."
                  : "슈퍼바이저 업무를 시작하기 전 계정 확인을 권장합니다."}
              </dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-line pt-5">
            <h3 className="text-base font-bold text-ink-900">슈퍼바이저 업무</h3>
            <p className="mt-2 break-keep text-sm leading-relaxed text-ink-500">
              공개 프로필, 가능 시간, 제공 세션 관리는 슈퍼바이저 홈에서 이어갑니다.
            </p>
            <div className="mt-4">
              {supervisorMode ? (
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/supervisor">슈퍼바이저 홈으로 이동</Link>
                </Button>
              ) : (
                <SupervisorApplicationButton />
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0">
      <dt className="font-bold text-ink-400">{label}</dt>
      <dd className="break-words font-semibold leading-relaxed text-ink-900">
        {value}
      </dd>
    </div>
  );
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "관리자",
    supervisee: "신청자",
    supervisor: "신청자 + 슈퍼바이저"
  };
  return labels[role] ?? role;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "정상",
    suspended: "정지",
    withdrawn: "탈퇴"
  };
  return labels[status] ?? "상태 확인 필요";
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}
