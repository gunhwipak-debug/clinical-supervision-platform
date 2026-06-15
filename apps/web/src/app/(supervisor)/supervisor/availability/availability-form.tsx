"use client";

import type { profiles } from "@csp/db";
import type { calendar } from "@csp/db";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";

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

    let response: Response;
    try {
      response = await fetch("/api/me/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slots })
      });
    } catch {
      const next = availabilityErrorMessage("server_unavailable");
      setMessage(next);
      setBusy(false);
      toast.error(next);
      return;
    }

    const body = await safeJson(response);
    const next = response.ok
      ? "가능 시간을 저장했습니다."
      : availabilityErrorMessage(body.error?.code);
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
      toast.success("일정 연동을 해제했습니다.");
      window.location.href = "/supervisor/availability?calendar=disconnected";
      return;
    }
    toast.error("연동 해제에 실패했습니다.");
  }

  async function checkCalendarSync() {
    setCheckingCalendar(true);
    setCalendarCheckMessage("일정 연결을 점검하는 중입니다.");
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
      const next = `연동 정상: 향후 2주 동안 겹치는 일정 ${String(busyCount)}개를 반영했습니다.`;
      setCalendarCheckMessage(next);
      toast.success(next);
      return;
    }

    const next = calendarCheckError(body.error?.code);
    setCalendarCheckMessage(next);
    toast.error(next);
  }

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-line bg-surface-base px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-ink-900">주간 예약 시간대</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {currentWeek.title} 기준 미리보기입니다. 저장되는 값은 매주 반복되는
              요일별 가능 시간입니다.
            </p>
          </div>
          <div className="hidden items-center gap-4 text-sm text-ink-500 md:flex">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-dashed border-line bg-surface-base" />
              <span>선택 전</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-brand-600" />
              <span>예약 가능</span>
            </div>
          </div>
        </div>
        <div className="calendar-scroll overflow-x-auto p-5">
          <div className="grid min-w-[600px] grid-cols-8 gap-2">
            <div className="flex flex-col gap-3 pr-3 pt-8 text-right text-sm text-ink-500">
              {times.map((time) => (
                <div className="flex h-10 items-center justify-end" key={time}>
                  {time}
                </div>
              ))}
            </div>
            {currentWeek.days.map((day) => (
              <div
                className={`flex flex-col gap-3 ${day.value === 0 || day.value === 6 ? "opacity-50" : ""}`}
                key={day.value}
              >
                <div className="mb-1 border-b border-line pb-3 text-center">
                  <div
                    className={`text-sm font-semibold ${
                      day.value === 0 ? "text-danger" : "text-ink-900"
                    }`}
                  >
                    {day.label}
                  </div>
                  <div className="text-xs text-ink-500">{day.monthDayLabel}</div>
                </div>
                {times.map((time) => {
                  const isSelected = selected.has(`${String(day.value)}-${time}`);
                  return (
                    <button
                      aria-label={`${day.label}요일 ${day.monthDayLabel} ${time} 가능 시간 ${isSelected ? "해제" : "추가"}`}
                      aria-pressed={isSelected}
                      className={`flex h-10 w-full items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-dashed border-line bg-surface-base text-ink-500 hover:border-brand-300 hover:bg-brand-50"
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
      </Card>

      <details className="overflow-hidden rounded-xl border border-line bg-surface-elevated">
        <summary className="cursor-pointer list-none p-4 text-sm font-bold text-ink-900">
          외부 일정 연동
        </summary>
        <div className="grid gap-4 border-t border-line p-4">
          {calendarNotice(calendarMessage) ? (
            <p className="rounded-lg border border-line bg-surface-sunken p-3 text-sm text-ink-600">
              {calendarNotice(calendarMessage)}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">연동 상태</p>
              <p
                className={`mt-1 text-sm ${
                  calendarConnection?.syncStatus === "connected"
                    ? "text-brand-700"
                    : "text-ink-500"
                }`}
              >
                {calendarConnection
                  ? calendarStatusLabel(calendarConnection.syncStatus)
                  : "연동되지 않음"}
              </p>
              {calendarConnection?.providerAccountEmail ? (
                <p className="mt-1 text-xs text-ink-500">
                  {calendarConnection.providerAccountEmail}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {calendarConnection ? (
                <>
                  <button
                    className="font-semibold text-brand-700 transition-colors hover:underline disabled:opacity-50"
                    disabled={checkingCalendar}
                    onClick={() => void checkCalendarSync()}
                    type="button"
                  >
                    점검
                  </button>
                  <a
                    className="text-ink-500 transition-colors hover:text-brand-700 hover:underline"
                    href="/api/me/google-calendar/connect"
                  >
                    다시 연결
                  </a>
                  <button
                    className="text-ink-500 transition-colors hover:text-ink-900"
                    onClick={() => void disconnectCalendar()}
                    type="button"
                  >
                    해제
                  </button>
                </>
              ) : calendarConfigReady ? (
                <a
                  className="font-semibold text-brand-700 hover:underline"
                  href="/api/me/google-calendar/connect"
                >
                  연결
                </a>
              ) : (
                <span className="text-danger">운영 설정 필요</span>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-ink-500">
            외부 일정이 연결되어 있으면 개인 일정이 있는 시간대는 공개 예약 화면에서
            제외됩니다.
          </p>
          {calendarCheckMessage ? (
            <p className="rounded-lg border border-line bg-surface-sunken p-3 text-sm text-ink-600">
              {calendarCheckMessage}
            </p>
          ) : null}
          {!calendarConfigReady ? (
            <p className="text-sm text-danger">
              현재는 새 일정 연결을 시작할 수 없습니다. 이미 연결된 일정이 있으면 예약
              충돌 확인은 계속 반영됩니다.
            </p>
          ) : null}
        </div>
      </details>

      <div className="grid gap-3 rounded-xl border border-line bg-surface-elevated p-4">
        <div>
          <h3 className="text-lg font-bold text-ink-900">가능 시간 저장</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            선택한 시간대만 신청자에게 예약 가능한 시간으로 보입니다.
          </p>
        </div>
        <Button disabled={busy} onClick={() => void save()} type="button">
          일정 저장
        </Button>
        {message ? <p className="text-sm text-ink-600">{message}</p> : null}
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
    connected: "일정 연동이 완료되었습니다.",
    "config-required": "일정 연결 준비가 완료되지 않았습니다.",
    "connect-failed": "일정 연결을 완료하지 못했습니다.",
    disconnected: "일정 연동을 해제했습니다.",
    "invalid-state": "인증 요청이 만료되었습니다. 다시 시도해주세요.",
    "profile-required": "먼저 슈퍼바이저 프로필을 저장해주세요."
  };
  return labels[code] ?? "";
}

function calendarCheckError(code: string | undefined): string {
  const labels: Record<string, string> = {
    calendar_config_required:
      "일정 연결 준비가 완료되지 않아 연동 상태를 점검할 수 없습니다.",
    calendar_not_connected: "먼저 외부 일정을 연결해주세요.",
    calendar_reauth_required: "일정 연결을 다시 확인해야 합니다.",
    calendar_sync_failed: "외부 일정과 연결하지 못했습니다. 잠시 후 다시 점검해주세요.",
    forbidden: "슈퍼바이저 계정에서만 연동을 점검할 수 있습니다.",
    unauthorized: "로그인이 필요합니다."
  };
  return labels[code ?? ""] ?? "일정 연동 점검에 실패했습니다.";
}

function availabilityErrorMessage(code: string | undefined): string {
  const labels: Record<string, string> = {
    forbidden: "슈퍼바이저 계정에서만 일정을 관리할 수 있습니다.",
    invalid_request: "선택한 가능 시간을 다시 확인해주세요.",
    server_unavailable:
      "일시적인 문제로 가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return (
    labels[code ?? ""] ?? "가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
  );
}

async function safeJson(response: Response): Promise<{ error?: { code?: string } }> {
  try {
    return (await response.json()) as { error?: { code?: string } };
  } catch {
    return {};
  }
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
