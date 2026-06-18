import { calendar, profiles, withUserContext } from "@csp/db";
import { AppShell } from "../../../../components/app-shell";
import {
  LoginRequiredState,
  RoleRequiredState
} from "../../../../components/locked-state";
import { createRuntimeDatabase } from "../../../../lib/auth/database";
import { getCurrentUser } from "../../../../lib/auth/current-user";
import {
  isDemoUserId,
  listDemoSupervisorAvailability
} from "../../../../lib/demo/supervision";
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
  let exceptions: profiles.AvailabilityException[];
  let calendarConnection: calendar.ExternalCalendarConnectionSummary | null;

  try {
    const db = createRuntimeDatabase();
    availability = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listAvailability(tx, current.session.userId)
    );
    exceptions = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listAvailabilityExceptions(tx, current.session.userId)
    );
    calendarConnection = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => calendar.getConnectionSummaryForUser(tx, current.session.userId)
    );
  } catch (error) {
    if (!isMissingDatabaseRelation(error) && !isDemoUserId(current.session.userId)) {
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
    exceptions = [];
    calendarConnection = null;
  }
  if (availability.length === 0 && isDemoUserId(current.session.userId)) {
    availability = listDemoSupervisorAvailability(current.session.userId);
  }
  const calendarConfigReady = Boolean(
    process.env["GOOGLE_CALENDAR_CLIENT_ID"] &&
    process.env["GOOGLE_CALENDAR_CLIENT_SECRET"]
  );

  return (
    <AppShell
      active="supervisor-availability"
      currentUser={current.user}
      subtitle="슈퍼비전을 진행할 수 있는 시간을 설정합니다."
      title="일정 관리"
    >
      <AvailabilityForm
        availability={availability}
        calendarConfigReady={calendarConfigReady}
        calendarConnection={calendarConnection}
        calendarMessage={params.calendar ?? ""}
        exceptions={exceptions}
      />
    </AppShell>
  );
}
