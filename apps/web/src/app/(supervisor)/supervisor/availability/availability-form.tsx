"use client";

import type { profiles } from "@csp/db";
import type { calendar } from "@csp/db";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const days = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토", muted: true },
  { value: 0, label: "일", muted: true }
] as const;

const times = ["13:00", "14:00", "15:00", "16:00", "17:00"] as const;

type WeekDay = {
  value: number;
  label: string;
  monthDayLabel: string;
};

type SlotDraft = {
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
};

export function AvailabilityForm({
  availability,
  calendarConfigReady,
  calendarConnection,
  calendarMessage
}: {
  availability: profiles.AvailabilitySlot[];
  calendarConfigReady: boolean;
  calendarConnection: calendar.ExternalCalendarConnectionSummary | null;
  calendarMessage: string;
}) {
  const initial = useMemo(
    () =>
      new Set(availability.map((slot) => `${String(slot.weekday)}-${slot.startTime}`)),
    [availability]
  );
  const [selected, setSelected] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(false);
  const [calendarCheckMessage, setCalendarCheckMessage] = useState("");
  const currentWeek = useMemo(() => buildCurrentWeek(), []);

  function toggle(weekday: number, startTime: string) {
    setSelected((current) => {
      const next = new Set(current);
      const key = `${String(weekday)}-${startTime}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function save() {
    setBusy(true);
    const slots = Array.from(selected)
      .map<SlotDraft | null>((key) => {
        const [weekdayValue, startTime] = key.split("-");
        if (!weekdayValue || !startTime) return null;
        return {
          weekday: Number(weekdayValue),
          startTime,
          endTime: addHour(startTime),
          timezone: "Asia/Seoul"
        };
      })
      .filter((slot): slot is SlotDraft => slot !== null)
      .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));

    const response = await fetch("/api/me/availability", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slots })
    });
    const body = (await response.json()) as { error?: { code: string } };
    const next = response.ok
      ? "가능시간을 저장했습니다."
      : (body.error?.code ?? "저장 실패");
    setMessage(next);
    setBusy(false);
    if (response.ok) {
      toast.success(next);
    } else {
      toast.error(next);
    }
  }

  async function disconnectCalendar() {
    const response = await fetch("/api/me/google-calendar", { method: "DELETE" });
    if (response.ok) {
      toast.success("구글 캘린더 연동을 해제했습니다.");
      window.location.href = "/supervisor/availability?calendar=disconnected";
      return;
    }
    toast.error("연동 해제에 실패했습니다.");
  }

  async function checkCalendarSync() {
    setCheckingCalendar(true);
    setCalendarCheckMessage("구글 캘린더 연결을 점검하는 중입니다.");
    const response = await fetch("/api/me/google-calendar/sync-check", {
      method: "POST"
    });
    const body = (await response.json()) as {
      data?: { busyCount?: number; checkedAt?: string };
      error?: { code?: string };
    };

    setCheckingCalendar(false);
    if (response.ok) {
      const busyCount = body.data?.busyCount ?? 0;
      const next = `연동 정상: 향후 2주 동안 구글 일정 ${String(busyCount)}개를 반영했습니다.`;
      setCalendarCheckMessage(next);
      toast.success(next);
      return;
    }

    const next = calendarCheckError(body.error?.code);
    setCalendarCheckMessage(next);
    toast.error(next);
  }

  return (
    <div className="grid grid-cols-1 gap-lg xl:grid-cols-12">
      <div className="space-y-md xl:col-span-8">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-bright p-md">
            <div>
              <h3 className="font-label-md text-label-md text-on-background">
                주간 예약 슬롯
              </h3>
              <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                {currentWeek.title} 기준 미리보기입니다. 저장되는 값은 매주 반복되는
                요일별 가능시간입니다.
              </p>
            </div>
            <div className="flex items-center gap-md font-label-sm text-label-sm text-on-surface-variant">
              <div className="flex items-center gap-xs">
                <div className="h-3 w-3 rounded-full border border-dashed border-outline-variant bg-surface-container-lowest" />
                <span>비어있음</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="h-3 w-3 rounded-full bg-secondary-container" />
                <span>예약 가능</span>
              </div>
            </div>
          </div>
          <div className="calendar-scroll overflow-x-auto p-md">
            <div className="grid min-w-[600px] grid-cols-8 gap-xs">
              <div className="flex flex-col gap-sm pr-sm pt-8 text-right font-label-sm text-label-sm text-on-surface-variant">
                {times.map((time) => (
                  <div className="flex h-10 items-center justify-end" key={time}>
                    {time}
                  </div>
                ))}
              </div>
              {currentWeek.days.map((day) => (
                <div
                  className={`flex flex-col gap-sm ${day.value === 0 || day.value === 6 ? "opacity-50" : ""}`}
                  key={day.value}
                >
                  <div className="mb-xs border-b border-outline-variant pb-sm text-center">
                    <div
                      className={`font-label-md text-label-md ${
                        day.value === 0 ? "text-error" : "text-on-background"
                      }`}
                    >
                      {day.label}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {day.monthDayLabel}
                    </div>
                  </div>
                  {times.map((time) => {
                    const isSelected = selected.has(`${String(day.value)}-${time}`);
                    return (
                      <button
                        className={`slot-btn h-10 w-full rounded border font-label-sm text-label-sm ${
                          isSelected ? "slot-available shadow-sm" : "slot-empty"
                        }`}
                        key={time}
                        onClick={() => toggle(day.value, time)}
                        type="button"
                      >
                        {isSelected ? "가능" : "+ 추가"}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-md xl:col-span-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <h3 className="mb-sm font-label-md text-label-md text-on-background">
            외부 캘린더 연동
          </h3>
          {calendarNotice(calendarMessage) ? (
            <p className="mb-sm rounded-lg border border-outline-variant bg-surface-container p-sm font-body-sm text-body-sm text-on-surface-variant">
              {calendarNotice(calendarMessage)}
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary">
                calendar_today
              </span>
              <div>
                <p className="font-label-md text-label-md text-on-background">
                  구글 캘린더
                </p>
                <p
                  className={`font-label-sm text-label-sm ${
                    calendarConnection?.syncStatus === "connected"
                      ? "text-secondary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {calendarConnection
                    ? calendarStatusLabel(calendarConnection.syncStatus)
                    : "연동되지 않음"}
                </p>
                {calendarConnection?.providerAccountEmail ? (
                  <p className="mt-xs font-label-sm text-[10px] text-on-surface-variant">
                    {calendarConnection.providerAccountEmail}
                  </p>
                ) : null}
              </div>
            </div>
            {calendarConnection ? (
              <div className="flex items-center gap-xs">
                <button
                  className="font-label-sm text-label-sm text-secondary transition-colors hover:underline disabled:opacity-50"
                  disabled={checkingCalendar}
                  onClick={() => void checkCalendarSync()}
                  type="button"
                >
                  점검
                </button>
                <a
                  className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-secondary hover:underline"
                  href="/api/me/google-calendar/connect"
                >
                  재연동
                </a>
                <button
                  className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-on-background"
                  onClick={() => void disconnectCalendar()}
                  type="button"
                >
                  해제
                </button>
              </div>
            ) : (
              <>
                {calendarConfigReady ? (
                  <a
                    className="font-label-sm text-label-sm text-secondary hover:underline"
                    href="/api/me/google-calendar/connect"
                  >
                    연동
                  </a>
                ) : (
                  <span className="font-label-sm text-label-sm text-error">
                    운영 설정 필요
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
            플랫폼 가능시간과 구글 캘린더의 바쁜 시간이 함께 반영됩니다. 개인 일정이
            있는 시간대는 공개 예약 화면에서 자동으로 제외됩니다.
          </p>
          {calendarCheckMessage ? (
            <p className="mt-sm rounded-lg border border-outline-variant bg-surface-container p-sm font-label-sm text-label-sm text-on-surface-variant">
              {calendarCheckMessage}
            </p>
          ) : null}
          {!calendarConfigReady ? (
            <p className="mt-sm font-label-sm text-label-sm text-error">
              운영 설정에 구글 OAuth 정보가 없어 새 계정 인증을 시작할 수 없습니다.
              기존 연동 토큰이 살아 있으면 예약 충돌 확인은 계속 반영됩니다.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <h3 className="font-label-md text-label-md text-on-background">
            반복 일정 설정
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            선택한 슬롯은 로그인한 슈퍼바이저 프로필에만 저장됩니다. 다른 슈퍼바이저의
            공개 캘린더와 섞이지 않습니다.
          </p>
          <button
            className="mt-sm w-full rounded-lg bg-primary py-sm font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={() => void save()}
            type="button"
          >
            일괄 적용 저장
          </button>
          {message ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function calendarStatusLabel(
  status: calendar.ExternalCalendarConnectionSummary["syncStatus"]
): string {
  const labels = {
    connected: "연동됨",
    disconnected: "연동 해제됨",
    error: "동기화 오류",
    needs_reauth: "다시 인증 필요"
  } satisfies Record<calendar.ExternalCalendarConnectionSummary["syncStatus"], string>;
  return labels[status];
}

function calendarNotice(code: string): string {
  const labels: Record<string, string> = {
    connected: "구글 캘린더 연동이 완료되었습니다.",
    "config-required": "구글 캘린더 계정 인증을 위한 운영 설정이 필요합니다.",
    "connect-failed": "구글 캘린더 인증을 완료하지 못했습니다.",
    disconnected: "구글 캘린더 연동을 해제했습니다.",
    "invalid-state": "인증 요청이 만료되었습니다. 다시 시도해주세요.",
    "profile-required": "먼저 슈퍼바이저 프로필을 저장해주세요."
  };
  return labels[code] ?? "";
}

function calendarCheckError(code: string | undefined): string {
  const labels: Record<string, string> = {
    calendar_config_required:
      "서비스의 구글 캘린더 OAuth 설정이 없어 연동 상태를 점검할 수 없습니다.",
    calendar_not_connected: "먼저 구글 캘린더 계정을 연동해주세요.",
    calendar_reauth_required: "구글 캘린더 재인증이 필요합니다.",
    calendar_sync_failed:
      "구글 캘린더와 통신하지 못했습니다. 잠시 후 다시 점검해주세요.",
    forbidden: "슈퍼바이저 계정에서만 연동을 점검할 수 있습니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "구글 캘린더 연동 점검에 실패했습니다.";
}

function addHour(startTime: string): string {
  const [hour, minute] = startTime.split(":").map(Number);
  return `${String((hour ?? 0) + 1).padStart(2, "0")}:${String(minute ?? 0).padStart(2, "0")}`;
}

function buildCurrentWeek(): { days: WeekDay[]; title: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const weekday = date.getDay();
    return {
      value: weekday,
      label: days.find((item) => item.value === weekday)?.label ?? "요일",
      monthDayLabel: `${String(date.getMonth() + 1)}월 ${String(date.getDate())}일`
    };
  });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    days: weekDays,
    title: `${String(monday.getFullYear())}년 ${String(monday.getMonth() + 1)}월 ${String(weekOfMonth(monday))}주차 · ${String(monday.getMonth() + 1)}월 ${String(monday.getDate())}일-${String(sunday.getMonth() + 1)}월 ${String(sunday.getDate())}일`
  };
}

function weekOfMonth(date: Date): number {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstMondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  return Math.ceil((date.getDate() + firstMondayOffset) / 7);
}
