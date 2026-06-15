import Link from "next/link";
import { calendar, profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import {
  PrimaryActionPanel,
  SectionBlock
} from "../../../../components/clinicflow-shell";
import { Button } from "../../../../components/ui/button";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import { isMissingDatabaseRelation } from "../../../../lib/db/missing-relation";
import { SupervisorPageLoadError } from "../_components/supervisor-page-load-error";
import { AvailabilityForm } from "./availability-form";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const current = await getCurrentUser();
  const params = await searchParams;

  if (!current) {
    return <LoginRequiredState title="일정 관리" returnTo="/supervisor/availability" />;
  }
  if (current.user.role !== "supervisor") {
    return (
      <RoleRequiredState
        currentUser={current.user}
        title="일정 관리"
        description="일정 관리는 슈퍼바이저 계정에서만 사용할 수 있습니다."
      />
    );
  }

  let availability: profiles.AvailabilitySlot[];
  let calendarConnection: calendar.ExternalCalendarConnectionSummary | null;

  try {
    const db = createRuntimeDatabase();
    availability = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listAvailability(tx, current.session.userId)
    );
    calendarConnection = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => calendar.getConnectionSummaryForUser(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error)) {
      console.error("[supervisor.availability.page]", error);
      return (
        <SupervisorPageLoadError
          active="supervisor-availability"
          currentUser={current.user}
          title="일정 관리"
          subtitle="가능 시간 정보를 불러오는 동안 문제가 생겼습니다."
        />
      );
    }

    availability = [];
    calendarConnection = null;
  }
  const calendarConfigReady = Boolean(
    process.env["GOOGLE_CALENDAR_CLIENT_ID"] &&
    process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]
  );

  return (
    <AppShell
      active="supervisor-availability"
      currentUser={current.user}
      action={
        <Button asChild variant="secondary">
          <Link href="/supervisor">업무 홈</Link>
        </Button>
      }
      subtitle="슈퍼비전을 받을 수 있는 요일과 시간을 정리합니다."
      title="일정 관리"
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          <PrimaryActionPanel title="예약 가능한 시간을 먼저 정하세요">
            신청자는 이 시간표를 기준으로 세션을 선택합니다. 가능한 시간만 남기면 일정
            조율이 줄어듭니다.
          </PrimaryActionPanel>

          <SectionBlock
            subtitle="요일별 가능 시간과 일정 연동 상태를 한 화면에서 관리합니다."
            title="가능 시간"
          >
            <div
              className="rounded-xl border border-line bg-surface-elevated p-5"
              id="availability-form"
            >
              <AvailabilityForm
                availability={availability}
                calendarConfigReady={calendarConfigReady}
                calendarConnection={calendarConnection}
                calendarMessage={params.calendar ?? ""}
              />
            </div>
          </SectionBlock>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface-elevated p-5 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-ink-900">일정 요약</h2>
          <div className="mt-5 grid divide-y divide-line text-sm">
            <SummaryLine
              label="등록된 시간"
              value={`${String(availability.length)}개`}
            />
            <SummaryLine
              label="일정 연동"
              value={calendarConnection ? "연동됨" : "확인 필요"}
            />
            <SummaryLine
              label="설정 상태"
              value={calendarConfigReady ? "예약 사용 가능" : "연동 설정 필요"}
            />
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
