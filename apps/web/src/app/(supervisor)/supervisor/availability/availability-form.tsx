"use client";

import type { calendar, profiles } from "@csp/db";
import { CalendarDays, RotateCcw, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AVAILABILITY_TIMEZONE,
  AVAILABILITY_TIMEZONE_LABEL,
  SLOT_INTERVAL_MINUTES,
  availabilityDays,
  calculateDayMinutes,
  calculateWeeklyTotalMinutes,
  createSlotKey,
  formatDurationMinutes,
  generateBookableStartSlots,
  minutesToHHmm,
  normalizeRanges,
  rangesToSlotSet,
  seoulDateString,
  slotMinutes,
  slotSetToMergedRanges,
  slotSetToWeeklySlots,
  weekdayFromDateString,
  weekdayLabel,
  type AvailabilityException,
  type AvailabilityExceptionMode
} from "@/lib/availability-calendar";
import { Button } from "../../../../components/ui/button";

type DragMode = "add" | "erase";

type DragState = {
  currentIndex: number;
  mode: DragMode;
  startIndex: number;
  weekday: number;
};

type ExceptionDraft = AvailabilityException & {
  clientId: string;
};

const previewDurations = [50, 60, 90, 120] as const;

export function AvailabilityForm({
  availability,
  calendarConfigReady,
  calendarConnection,
  calendarMessage,
  exceptions
}: {
  availability: profiles.AvailabilitySlot[];
  calendarConfigReady: boolean;
  calendarConnection: calendar.ExternalCalendarConnectionSummary | null;
  calendarMessage: string;
  exceptions: profiles.AvailabilityException[];
}) {
  const initialSelected = useMemo(
    () =>
      rangesToSlotSet(
        availability.map((slot) => ({
          endTime: slot.endTime,
          startTime: slot.startTime,
          timezone: slot.timezone,
          weekday: slot.weekday
        }))
      ),
    [availability]
  );
  const initialExceptions = useMemo(
    () => buildExceptionDrafts(exceptions),
    [exceptions]
  );
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [exceptionDrafts, setExceptionDrafts] = useState(initialExceptions);
  const [activeTab, setActiveTab] = useState<"exceptions" | "weekly">("weekly");
  const [previewDuration, setPreviewDuration] =
    useState<(typeof previewDurations)[number]>(90);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(false);
  const [calendarCheckMessage, setCalendarCheckMessage] = useState("");
  const [preview, setPreview] = useState<Set<string>>(new Set());
  const dragRef = useRef<DragState | null>(null);

  const weeklySlots = useMemo(
    () => slotSetToWeeklySlots(selected, AVAILABILITY_TIMEZONE),
    [selected]
  );
  const previewSlots = useMemo(
    () =>
      generateBookableStartSlots({
        durationMinutes: previewDuration,
        exceptions: exceptionDrafts,
        weeklySlots
      }),
    [exceptionDrafts, previewDuration, weeklySlots]
  );
  const initialSignature = useMemo(
    () =>
      `${serializeSelected(initialSelected)}|${serializeExceptions(initialExceptions)}`,
    [initialExceptions, initialSelected]
  );
  const currentSignature = `${serializeSelected(selected)}|${serializeExceptions(exceptionDrafts)}`;
  const hasChanges = currentSignature !== initialSignature;

  const cancelDrag = useCallback(() => {
    dragRef.current = null;
    setPreview(new Set());
  }, []);

  const commitDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    const keys = buildDragKeys(drag);
    setSelected((current) => {
      const next = new Set(current);
      for (const key of keys) {
        if (drag.mode === "add") next.add(key);
        else next.delete(key);
      }
      return next;
    });
    dragRef.current = null;
    setPreview(new Set());
  }, []);

  useEffect(() => {
    function handlePointerUp() {
      commitDrag();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") cancelDrag();
    }
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelDrag, commitDrag]);

  function startDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    weekday: number,
    slotIndex: number
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const key = createSlotKey(weekday, slotIndex);
    const mode: DragMode = selected.has(key) ? "erase" : "add";
    const drag = { currentIndex: slotIndex, mode, startIndex: slotIndex, weekday };
    dragRef.current = drag;
    setPreview(new Set(buildDragKeys(drag)));
  }

  function updateDrag(weekday: number, slotIndex: number) {
    const drag = dragRef.current;
    if (!drag || drag.weekday !== weekday) return;
    const next = { ...drag, currentIndex: slotIndex };
    dragRef.current = next;
    setPreview(new Set(buildDragKeys(next)));
  }

  function updateDragFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell =
      target instanceof Element
        ? target.closest<HTMLButtonElement>("[data-slot-weekday][data-slot-index]")
        : null;
    if (!cell) return;
    const weekday = Number(cell.dataset["slotWeekday"]);
    const slotIndex = Number(cell.dataset["slotIndex"]);
    if (!Number.isInteger(weekday) || !Number.isInteger(slotIndex)) return;
    updateDrag(weekday, slotIndex);
  }

  function clearDay(weekday: number) {
    setSelected((current) => {
      const next = new Set(current);
      for (let index = 0; index < slotMinutes.length; index += 1) {
        next.delete(createSlotKey(weekday, index));
      }
      return next;
    });
  }

  function resetWeekdays() {
    const next = new Set<string>();
    for (const day of [1, 2, 3, 4, 5]) {
      for (let minutes = 9 * 60; minutes < 18 * 60; minutes += SLOT_INTERVAL_MINUTES) {
        if (minutes >= 12 * 60 && minutes < 13 * 60) continue;
        next.add(createSlotKey(day, minutes / SLOT_INTERVAL_MINUTES));
      }
    }
    setSelected(next);
  }

  async function save() {
    setBusy(true);
    setMessage("저장 중...");
    const slots = slotSetToWeeklySlots(selected, AVAILABILITY_TIMEZONE);
    const payload = {
      exceptions: exceptionDrafts.map((exception) => ({
        date: exception.date,
        mode: exception.mode,
        note: exception.note ?? null,
        ranges: exception.mode === "custom" ? normalizeRanges(exception.ranges) : [],
        timezone: AVAILABILITY_TIMEZONE
      })),
      slots
    };

    let response: Response;
    try {
      response = await fetch("/api/me/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
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
      ? "예약 가능 시간을 저장했습니다."
      : availabilityErrorMessage(body.error?.code);
    setMessage(next);
    setBusy(false);
    if (response.ok) {
      toast.success(next);
      window.location.reload();
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
      const next = `연동 정상: 향후 2주 동안 겹치는 일정 ${String(busyCount)}개를 예약 화면에서 제외합니다.`;
      setCalendarCheckMessage(next);
      toast.success(next);
      return;
    }

    const next = calendarCheckError(body.error?.code);
    setCalendarCheckMessage(next);
    toast.error(next);
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 border-b border-line pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-2">
          <p className="text-sm font-bold text-brand-700">일정 관리</p>
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">
            예약 가능한 시간을 칠합니다
          </h2>
          <p className="text-sm leading-6 text-ink-500">
            드래그해 예약 가능한 시간을 칠하고, 다시 드래그해 해제하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-10 rounded-md border border-line px-3 text-sm font-bold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
            disabled={busy || !hasChanges}
            onClick={() => {
              setSelected(new Set(initialSelected));
              setExceptionDrafts(initialExceptions);
              setMessage("변경사항을 취소했습니다.");
            }}
            type="button"
          >
            변경사항 취소
          </button>
          <Button
            disabled={busy || !hasChanges}
            onClick={() => void save()}
            type="button"
          >
            <Save aria-hidden size={16} />
            {busy ? "저장 중..." : "예약 가능 시간 저장"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-line bg-surface-elevated px-4 py-3 text-sm">
        <ContextItem label="기준 시간대" value={AVAILABILITY_TIMEZONE_LABEL} />
        <ContextItem label="예약 시작 간격" value="30분" />
        <ContextItem label="설정 방식" value="매주 반복" />
        <ContextItem
          label="저장 상태"
          value={busy ? "저장 중" : hasChanges ? "저장되지 않은 변경" : "저장됨"}
        />
      </div>

      <div className="flex w-fit overflow-hidden rounded-md border border-line bg-surface-elevated p-1">
        <TabButton
          active={activeTab === "weekly"}
          label="매주 반복 일정"
          onClick={() => setActiveTab("weekly")}
        />
        <TabButton
          active={activeTab === "exceptions"}
          label="날짜별 예외"
          onClick={() => setActiveTab("exceptions")}
        />
      </div>

      {activeTab === "weekly" ? (
        <WeeklyGridSection
          clearDay={clearDay}
          onCancelDrag={cancelDrag}
          onPointerEnter={updateDrag}
          onPointerMove={updateDragFromPointer}
          onPointerStart={startDrag}
          preview={preview}
          resetWeekdays={resetWeekdays}
          selected={selected}
          setSelected={setSelected}
        />
      ) : (
        <ExceptionEditor
          exceptions={exceptionDrafts}
          setExceptions={setExceptionDrafts}
        />
      )}

      <SelectionSummary selected={selected} />

      <SlotPreview
        duration={previewDuration}
        onDurationChange={setPreviewDuration}
        slots={previewSlots}
      />

      <ExternalCalendarSection
        calendarConfigReady={calendarConfigReady}
        calendarConnection={calendarConnection}
        calendarMessage={calendarMessage}
        checkingCalendar={checkingCalendar}
        checkMessage={calendarCheckMessage}
        onCheck={() => void checkCalendarSync()}
        onDisconnect={() => void disconnectCalendar()}
      />

      {message ? (
        <p
          aria-live="polite"
          className="rounded-md border border-line bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink-700"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function WeeklyGridSection({
  clearDay,
  onCancelDrag,
  onPointerEnter,
  onPointerMove,
  onPointerStart,
  preview,
  resetWeekdays,
  selected,
  setSelected
}: {
  clearDay: (weekday: number) => void;
  onCancelDrag: () => void;
  onPointerEnter: (weekday: number, slotIndex: number) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerStart: (
    event: React.PointerEvent<HTMLButtonElement>,
    weekday: number,
    slotIndex: number
  ) => void;
  preview: Set<string>;
  resetWeekdays: () => void;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  return (
    <section className="select-none overflow-hidden rounded-lg border border-line bg-surface-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-sunken px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-ink-600">
          <Legend swatch="bg-brand-600" text="예약 가능" />
          <Legend swatch="bg-surface-elevated" text="예약 불가" />
          <Legend swatch="bg-ink-200" text="선택할 수 없음" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton onClick={resetWeekdays}>평일 초기화</ToolbarButton>
          <ToolbarButton onClick={() => setSelected(new Set())}>
            전체 지우기
          </ToolbarButton>
          <ToolbarButton onClick={onCancelDrag}>드래그 취소</ToolbarButton>
        </div>
      </div>

      <div className="max-h-[680px] overflow-auto overscroll-contain">
        <div
          className="grid min-w-[980px] touch-none select-none"
          role="grid"
          style={{
            gridTemplateColumns: "72px repeat(7, minmax(118px, 1fr))"
          }}
        >
          <div className="sticky left-0 top-0 z-30 border-b border-r border-line bg-surface-sunken px-3 py-3 text-xs font-bold text-ink-500">
            시간
          </div>
          {availabilityDays.map((day) => (
            <div
              className="sticky top-0 z-20 border-b border-r border-line bg-surface-sunken px-3 py-2"
              key={day.value}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink-900">{day.shortLabel}</span>
                <button
                  className="rounded-sm border border-line px-2 py-1 text-xs font-bold text-ink-500 transition hover:text-danger"
                  onClick={() => clearDay(day.value)}
                  type="button"
                >
                  비우기
                </button>
              </div>
            </div>
          ))}

          {slotMinutes.map((minutes, slotIndex) => {
            const start = minutesToHHmm(minutes);
            const end = minutesToHHmm(minutes + SLOT_INTERVAL_MINUTES);
            const isHour = minutes % 60 === 0;
            return (
              <RowCells
                end={end}
                isHour={isHour}
                key={start}
                onKeyToggle={(weekday, index, forceSelected) =>
                  setSelected((current) =>
                    toggleSlot(current, weekday, index, forceSelected)
                  )
                }
                onCancelDrag={onCancelDrag}
                onPointerEnter={onPointerEnter}
                onPointerMove={onPointerMove}
                onPointerStart={onPointerStart}
                preview={preview}
                selected={selected}
                slotIndex={slotIndex}
                start={start}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RowCells({
  end,
  isHour,
  onCancelDrag,
  onKeyToggle,
  onPointerEnter,
  onPointerMove,
  onPointerStart,
  preview,
  selected,
  slotIndex,
  start
}: {
  end: string;
  isHour: boolean;
  onCancelDrag: () => void;
  onKeyToggle: (weekday: number, slotIndex: number, forceSelected?: boolean) => void;
  onPointerEnter: (weekday: number, slotIndex: number) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerStart: (
    event: React.PointerEvent<HTMLButtonElement>,
    weekday: number,
    slotIndex: number
  ) => void;
  preview: Set<string>;
  selected: Set<string>;
  slotIndex: number;
  start: string;
}) {
  return (
    <>
      <div
        className={`sticky left-0 z-10 border-r border-line bg-surface-elevated px-3 py-1 text-xs font-bold text-ink-500 ${
          isHour ? "border-t border-t-ink-200" : "border-t border-t-line/60"
        }`}
      >
        {start}
      </div>
      {availabilityDays.map((day) => {
        const key = createSlotKey(day.value, slotIndex);
        const isSelected = selected.has(key);
        const isPreview = preview.has(key);
        const stateLabel = isPreview
          ? isSelected
            ? "해제 예정"
            : "선택 예정"
          : isSelected
            ? "예약 가능"
            : "예약 불가";
        return (
          <button
            aria-label={`${day.label} ${start}부터 ${end}, ${stateLabel}`}
            aria-pressed={isSelected}
            className={`h-8 touch-none select-none border-r text-left text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-0 ${
              isHour ? "border-t border-t-ink-200" : "border-t border-t-line/60"
            } ${
              isPreview
                ? "bg-brand-200"
                : isSelected
                  ? "bg-brand-600"
                  : "bg-surface-elevated hover:bg-brand-50"
            }`}
            data-slot-cell={`${String(day.value)}-${String(slotIndex)}`}
            data-slot-index={String(slotIndex)}
            data-slot-weekday={String(day.value)}
            key={day.value}
            onKeyDown={(event) =>
              handleCellKeyDown(event, day.value, slotIndex, isSelected, onKeyToggle)
            }
            onPointerCancel={onCancelDrag}
            onPointerDown={(event) => onPointerStart(event, day.value, slotIndex)}
            onPointerEnter={() => onPointerEnter(day.value, slotIndex)}
            onPointerMove={onPointerMove}
            role="gridcell"
            type="button"
          >
            <span className="sr-only">{stateLabel}</span>
          </button>
        );
      })}
    </>
  );
}

function ExceptionEditor({
  exceptions,
  setExceptions
}: {
  exceptions: ExceptionDraft[];
  setExceptions: React.Dispatch<React.SetStateAction<ExceptionDraft[]>>;
}) {
  const [date, setDate] = useState(seoulDateString());
  const [mode, setMode] = useState<AvailabilityExceptionMode>("unavailable");
  const [note, setNote] = useState("");
  const weekday = weekdayFromDateString(date);
  const [customSelected, setCustomSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const existing = exceptions.find((item) => item.date === date);
    setMode(existing?.mode ?? "unavailable");
    setNote(existing?.note ?? "");
    if (existing?.mode === "custom") {
      setCustomSelected(
        rangesToSlotSet(
          existing.ranges.map((range) => ({
            ...range,
            timezone: AVAILABILITY_TIMEZONE,
            weekday
          }))
        )
      );
    } else {
      setCustomSelected(new Set());
    }
  }, [date, exceptions, weekday]);

  function saveException() {
    const ranges =
      mode === "custom" ? slotSetToMergedRanges(customSelected, weekday) : [];
    const next: ExceptionDraft = {
      clientId: `${date}-${mode}`,
      date,
      mode,
      note: note.trim() || null,
      ranges,
      timezone: AVAILABILITY_TIMEZONE
    };
    setExceptions((current) =>
      [...current.filter((item) => item.date !== date), next].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
  }

  return (
    <section className="grid gap-4 rounded-lg border border-line bg-surface-elevated p-4">
      <div className="grid gap-3 md:grid-cols-[180px_180px_minmax(0,1fr)_auto] md:items-end">
        <label className="grid gap-1">
          <span className="text-xs font-bold text-ink-500">날짜</span>
          <input
            className="h-10 rounded-md border border-line bg-surface-base px-3 text-sm font-semibold text-ink-900"
            onChange={(event) => setDate(event.currentTarget.value)}
            type="date"
            value={date}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-ink-500">모드</span>
          <select
            className="h-10 rounded-md border border-line bg-surface-base px-3 text-sm font-semibold text-ink-900"
            onChange={(event) =>
              setMode(event.currentTarget.value as AvailabilityExceptionMode)
            }
            value={mode}
          >
            <option value="unavailable">하루 종일 예약 불가</option>
            <option value="custom">이 날짜만 다른 시간 사용</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-ink-500">메모</span>
          <input
            className="h-10 rounded-md border border-line bg-surface-base px-3 text-sm text-ink-900"
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder="휴가, 학회, 공휴일"
            value={note}
          />
        </label>
        <Button onClick={saveException} type="button">
          예외 저장
        </Button>
      </div>

      {mode === "custom" ? (
        <OneDayGrid
          selected={customSelected}
          setSelected={setCustomSelected}
          weekday={weekday}
        />
      ) : (
        <p className="rounded-md border border-line bg-surface-base px-4 py-3 text-sm font-semibold text-ink-600">
          {date}은 반복 가능 시간과 관계없이 예약 가능한 시작 시각에서 제외됩니다.
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-line">
        {exceptions.length > 0 ? (
          exceptions.map((exception) => (
            <div
              className="grid gap-3 border-b border-line bg-surface-base px-4 py-3 text-sm last:border-b-0 md:grid-cols-[150px_180px_minmax(0,1fr)_auto] md:items-center"
              key={exception.clientId}
            >
              <span className="font-bold text-ink-900">{exception.date}</span>
              <span className="font-semibold text-ink-700">
                {exception.mode === "unavailable"
                  ? "하루 종일 예약 불가"
                  : "다른 시간 사용"}
              </span>
              <span className="text-ink-500">
                {exception.mode === "custom"
                  ? exception.ranges
                      .map((range) => `${range.startTime}-${range.endTime}`)
                      .join(" · ") || "시간 없음"
                  : exception.note || "메모 없음"}
              </span>
              <button
                className="inline-flex w-fit items-center gap-2 rounded-md border border-line px-3 py-2 font-bold text-ink-600 hover:text-danger"
                onClick={() =>
                  setExceptions((current) =>
                    current.filter((item) => item.clientId !== exception.clientId)
                  )
                }
                type="button"
              >
                <Trash2 aria-hidden size={14} />
                삭제
              </button>
            </div>
          ))
        ) : (
          <p className="bg-surface-base px-4 py-3 text-sm text-ink-500">
            저장된 날짜별 예외가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}

function OneDayGrid({
  selected,
  setSelected,
  weekday
}: {
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  weekday: number;
}) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border border-line">
      <div className="grid grid-cols-[80px_minmax(0,1fr)]">
        {slotMinutes.map((minutes, index) => {
          const start = minutesToHHmm(minutes);
          const end = minutesToHHmm(minutes + SLOT_INTERVAL_MINUTES);
          const key = createSlotKey(weekday, index);
          const isSelected = selected.has(key);
          return (
            <div className="contents" key={start}>
              <span className="border-r border-t border-line bg-surface-sunken px-3 py-2 text-xs font-bold text-ink-500">
                {start}
              </span>
              <button
                aria-label={`${weekdayLabel(weekday)} ${start}부터 ${end}, ${
                  isSelected ? "예약 가능" : "예약 불가"
                }`}
                aria-pressed={isSelected}
                className={`h-9 border-t border-line text-left text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  isSelected ? "bg-brand-600" : "bg-surface-base hover:bg-brand-50"
                }`}
                onClick={() =>
                  setSelected((current) => toggleSlot(current, weekday, index))
                }
                type="button"
              >
                <span className="sr-only">
                  {isSelected ? "예약 가능" : "예약 불가"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelectionSummary({ selected }: { selected: Set<string> }) {
  const total = calculateWeeklyTotalMinutes(selected);
  const dayParts = availabilityDays
    .map((day) => ({
      label: day.shortLabel,
      minutes: calculateDayMinutes(selected, day.value)
    }))
    .filter((day) => day.minutes > 0)
    .map((day) => `${day.label} ${formatDurationMinutes(day.minutes)}`);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-700">
      <span>선택한 가능 시간: 주 {formatDurationMinutes(total)}</span>
      {dayParts.length > 0 ? (
        <span className="text-ink-500">{dayParts.join(" · ")}</span>
      ) : (
        <span className="text-ink-500">선택한 요일 없음</span>
      )}
    </div>
  );
}

function SlotPreview({
  duration,
  onDurationChange,
  slots
}: {
  duration: (typeof previewDurations)[number];
  onDurationChange: (duration: (typeof previewDurations)[number]) => void;
  slots: ReturnType<typeof generateBookableStartSlots>;
}) {
  const grouped = groupSlotsByDate(slots.slice(0, 72));

  return (
    <section className="grid gap-3 rounded-lg border border-line bg-surface-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink-900">
            실제 예약 가능 시간 미리보기
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            30분 간격 시작 시각 중 세션 전체가 들어가는 시간만 표시합니다.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-ink-700">
          <CalendarDays aria-hidden size={16} />
          <select
            className="h-10 rounded-md border border-line bg-surface-base px-3 text-sm font-semibold text-ink-900"
            onChange={(event) =>
              onDurationChange(Number(event.currentTarget.value) as typeof duration)
            }
            value={duration}
          >
            {previewDurations.map((minutes) => (
              <option key={minutes} value={minutes}>
                화상 슈퍼비전 {minutes}분
              </option>
            ))}
          </select>
        </label>
      </div>
      {grouped.length > 0 ? (
        <div className="grid gap-2">
          {grouped.slice(0, 8).map((group) => (
            <div
              className="grid gap-2 border-t border-line pt-3 text-sm md:grid-cols-[170px_minmax(0,1fr)]"
              key={group.date}
            >
              <span className="font-bold text-ink-900">{group.label}</span>
              <span className="flex flex-wrap gap-2">
                {group.slots.slice(0, 10).map((slot) => (
                  <span
                    className="rounded-sm border border-brand-100 bg-brand-50 px-2 py-1 font-bold text-brand-700"
                    key={slot.key}
                  >
                    {slot.startTime}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-line bg-surface-base px-4 py-3 text-sm font-semibold text-ink-500">
          현재 예약 가능한 시간이 없습니다.
        </p>
      )}
    </section>
  );
}

function ExternalCalendarSection({
  calendarConfigReady,
  calendarConnection,
  calendarMessage,
  checkingCalendar,
  checkMessage,
  onCheck,
  onDisconnect
}: {
  calendarConfigReady: boolean;
  calendarConnection: calendar.ExternalCalendarConnectionSummary | null;
  calendarMessage: string;
  checkingCalendar: boolean;
  checkMessage: string;
  onCheck: () => void;
  onDisconnect: () => void;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-line bg-surface-elevated p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink-900">외부 캘린더 연동</h3>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            실제로 연결된 일정만 예약 충돌 확인에 사용합니다.
          </p>
          {calendarNotice(calendarMessage) ? (
            <p className="mt-3 rounded-md border border-line bg-surface-base px-3 py-2 text-sm text-ink-600">
              {calendarNotice(calendarMessage)}
            </p>
          ) : null}
        </div>
        <span
          className={`w-fit rounded-md px-3 py-1 text-sm font-bold ${
            calendarConnection?.syncStatus === "connected"
              ? "bg-brand-50 text-brand-700"
              : calendarConnection?.syncStatus === "error" ||
                  calendarConnection?.syncStatus === "needs_reauth"
                ? "bg-danger/10 text-danger"
                : "bg-surface-sunken text-ink-500"
          }`}
        >
          {calendarConnection
            ? calendarStatusLabel(calendarConnection.syncStatus)
            : "연동 안 됨"}
        </span>
      </div>
      {calendarConnection?.providerAccountEmail ? (
        <p className="text-sm font-semibold text-ink-600">
          {calendarConnection.providerAccountEmail}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {calendarConnection ? (
          <>
            <button
              className="rounded-md border border-line px-3 py-2 font-bold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
              disabled={checkingCalendar}
              onClick={onCheck}
              type="button"
            >
              {checkingCalendar ? "점검 중..." : "다시 동기화"}
            </button>
            <a
              className="rounded-md border border-line px-3 py-2 font-bold text-ink-700 transition hover:text-brand-700"
              href="/api/me/google-calendar/connect"
            >
              다시 연결
            </a>
            <button
              className="rounded-md border border-line px-3 py-2 font-bold text-ink-600 transition hover:text-ink-900"
              onClick={onDisconnect}
              type="button"
            >
              연결 해제
            </button>
          </>
        ) : calendarConfigReady ? (
          <a
            className="rounded-md bg-brand-600 px-4 py-2 font-bold text-white transition hover:bg-brand-700"
            href="/api/me/google-calendar/connect"
          >
            Google 캘린더 연결
          </a>
        ) : (
          <p className="text-sm font-semibold text-ink-500">
            운영 환경에 Google 캘린더 설정이 없어 새 연결을 시작할 수 없습니다.
          </p>
        )}
      </div>
      {checkMessage ? (
        <p className="rounded-md border border-line bg-surface-base px-3 py-2 text-sm text-ink-600">
          {checkMessage}
        </p>
      ) : null}
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-bold text-ink-400">{label}</span>
      <span className="font-bold text-ink-900">{value}</span>
    </span>
  );
}

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-9 rounded-sm px-3 text-sm font-bold transition ${
        active ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-surface-sunken"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ToolbarButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm font-bold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
      onClick={onClick}
      type="button"
    >
      <RotateCcw aria-hidden size={14} />
      {children}
    </button>
  );
}

function Legend({ swatch, text }: { swatch: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-3 border border-line ${swatch}`} />
      {text}
    </span>
  );
}

function buildDragKeys(drag: DragState): string[] {
  const start = Math.min(drag.startIndex, drag.currentIndex);
  const end = Math.max(drag.startIndex, drag.currentIndex);
  const keys: string[] = [];
  for (let index = start; index <= end; index += 1) {
    keys.push(createSlotKey(drag.weekday, index));
  }
  return keys;
}

function toggleSlot(
  selected: Set<string>,
  weekday: number,
  slotIndex: number,
  forceSelected?: boolean
): Set<string> {
  const next = new Set(selected);
  const key = createSlotKey(weekday, slotIndex);
  const shouldSelect = forceSelected ?? !next.has(key);
  if (shouldSelect) next.add(key);
  else next.delete(key);
  return next;
}

function handleCellKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  weekday: number,
  slotIndex: number,
  isSelected: boolean,
  onToggle: (weekday: number, slotIndex: number, forceSelected?: boolean) => void
) {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    onToggle(weekday, slotIndex);
    return;
  }

  const next = nextFocusTarget(event.key, weekday, slotIndex);
  if (!next) return;
  event.preventDefault();
  if (event.shiftKey && next.weekday === weekday) {
    onToggle(next.weekday, next.slotIndex, isSelected || undefined);
  }
  requestAnimationFrame(() => {
    const target = document.querySelector<HTMLButtonElement>(
      `[data-slot-cell="${String(next.weekday)}-${String(next.slotIndex)}"]`
    );
    target?.focus();
  });
}

function nextFocusTarget(
  key: string,
  weekday: number,
  slotIndex: number
): { slotIndex: number; weekday: number } | null {
  if (key === "ArrowUp") return { weekday, slotIndex: Math.max(0, slotIndex - 1) };
  if (key === "ArrowDown") {
    return { weekday, slotIndex: Math.min(slotMinutes.length - 1, slotIndex + 1) };
  }
  const dayIndex = availabilityDays.findIndex((day) => day.value === weekday);
  if (key === "ArrowLeft") {
    const previous = availabilityDays[Math.max(0, dayIndex - 1)];
    return previous ? { weekday: previous.value, slotIndex } : null;
  }
  if (key === "ArrowRight") {
    const next = availabilityDays[Math.min(availabilityDays.length - 1, dayIndex + 1)];
    return next ? { weekday: next.value, slotIndex } : null;
  }
  return null;
}

function serializeSelected(selected: Set<string>): string {
  return Array.from(selected).sort().join(",");
}

function serializeExceptions(exceptions: ExceptionDraft[]): string {
  return JSON.stringify(
    exceptions.map((exception) => ({
      date: exception.date,
      mode: exception.mode,
      note: exception.note ?? null,
      ranges: normalizeRanges(exception.ranges),
      timezone: exception.timezone
    }))
  );
}

function buildExceptionDrafts(
  exceptions: profiles.AvailabilityException[]
): ExceptionDraft[] {
  return exceptions.map((exception) => ({
    clientId: exception.id,
    date: exception.date,
    id: exception.id,
    mode: exception.mode,
    note: exception.note,
    ranges: normalizeRanges(exception.ranges),
    timezone: exception.timezone
  }));
}

function groupSlotsByDate(slots: ReturnType<typeof generateBookableStartSlots>) {
  const groups = new Map<
    string,
    {
      date: string;
      label: string;
      slots: ReturnType<typeof generateBookableStartSlots>;
    }
  >();
  for (const slot of slots) {
    const group = groups.get(slot.date) ?? {
      date: slot.date,
      label: `${slot.date} · ${slot.weekdayLabel}`,
      slots: []
    };
    group.slots.push(slot);
    groups.set(slot.date, group);
  }
  return Array.from(groups.values());
}

function calendarStatusLabel(
  status: calendar.ExternalCalendarConnectionSummary["syncStatus"]
): string {
  const labels = {
    connected: "연결됨",
    disconnected: "연동 안 됨",
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
    invalid_request: "예약 가능 시간을 다시 확인해주세요.",
    profile_required: "먼저 슈퍼바이저 프로필을 저장해주세요.",
    server_unavailable:
      "일시적인 문제로 가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    unauthorized: "로그인이 필요합니다."
  };
  return (
    labels[code ?? ""] ??
    "예약 가능 시간을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
  );
}

async function safeJson(response: Response): Promise<{ error?: { code?: string } }> {
  try {
    return (await response.json()) as { error?: { code?: string } };
  } catch {
    return {};
  }
}
