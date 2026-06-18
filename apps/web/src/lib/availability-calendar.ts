export const AVAILABILITY_TIMEZONE = "Asia/Seoul";
export const AVAILABILITY_TIMEZONE_LABEL = "대한민국 표준시 · Asia/Seoul · UTC+9";
export const SLOT_INTERVAL_MINUTES = 30;
export const DAY_MINUTES = 24 * 60;
export const SLOTS_PER_DAY = DAY_MINUTES / SLOT_INTERVAL_MINUTES;

export type WeekdayValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AvailabilityRange = {
  endTime: string;
  startTime: string;
};

export type WeeklyAvailabilitySlot = AvailabilityRange & {
  timezone: string;
  weekday: number;
};

export type AvailabilityExceptionMode = "custom" | "unavailable";

export type AvailabilityException = {
  date: string;
  id?: string;
  mode: AvailabilityExceptionMode;
  note?: string | null;
  ranges: AvailabilityRange[];
  timezone: string;
};

export type BookableStartSlot = {
  date: string;
  endIso: string;
  endTime: string;
  key: string;
  label: string;
  startIso: string;
  startTime: string;
  weekday: number;
  weekdayLabel: string;
};

export type BusyInterval = {
  endIso: string;
  startIso: string;
};

export const availabilityDays: Array<{
  shortLabel: string;
  value: WeekdayValue;
  label: string;
}> = [
  { value: 1, label: "월요일", shortLabel: "월" },
  { value: 2, label: "화요일", shortLabel: "화" },
  { value: 3, label: "수요일", shortLabel: "수" },
  { value: 4, label: "목요일", shortLabel: "목" },
  { value: 5, label: "금요일", shortLabel: "금" },
  { value: 6, label: "토요일", shortLabel: "토" },
  { value: 0, label: "일요일", shortLabel: "일" }
];

export const slotMinutes = Array.from(
  { length: SLOTS_PER_DAY },
  (_, index) => index * SLOT_INTERVAL_MINUTES
);

export function createSlotKey(weekday: number, slotIndex: number): string {
  return `${String(weekday)}:${String(slotIndex)}`;
}

export function parseSlotKey(key: string): { slotIndex: number; weekday: number } {
  const [weekday, slotIndex] = key.split(":").map(Number);
  return {
    slotIndex: slotIndex ?? 0,
    weekday: weekday ?? 0
  };
}

export function minutesToHHmm(minutes: number): string {
  const bounded = Math.max(0, Math.min(DAY_MINUTES, minutes));
  const hour = Math.floor(bounded / 60);
  const minute = bounded % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function hhmmToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

export function validateThirtyMinuteAlignment(value: string | number): boolean {
  const minutes = typeof value === "number" ? value : hhmmToMinutes(value);
  return (
    Number.isInteger(minutes) &&
    minutes >= 0 &&
    minutes <= DAY_MINUTES &&
    minutes % 30 === 0
  );
}

export function rangesToSlotSet(slots: WeeklyAvailabilitySlot[]): Set<string> {
  const selected = new Set<string>();

  for (const slot of slots) {
    const start = hhmmToMinutes(slot.startTime);
    const end = hhmmToMinutes(slot.endTime);
    if (start >= end) continue;

    for (let minutes = start; minutes < end; minutes += SLOT_INTERVAL_MINUTES) {
      selected.add(createSlotKey(slot.weekday, minutes / SLOT_INTERVAL_MINUTES));
    }
  }

  return selected;
}

export function slotSetToMergedRanges(
  selected: Set<string>,
  weekday: number
): AvailabilityRange[] {
  const indices = Array.from(selected)
    .map(parseSlotKey)
    .filter((slot) => slot.weekday === weekday)
    .map((slot) => slot.slotIndex)
    .sort((a, b) => a - b);

  const ranges: AvailabilityRange[] = [];
  let startIndex: number | null = null;
  let previousIndex: number | null = null;

  for (const index of indices) {
    if (startIndex === null) {
      startIndex = index;
      previousIndex = index;
      continue;
    }

    if (previousIndex !== null && index === previousIndex + 1) {
      previousIndex = index;
      continue;
    }

    ranges.push({
      startTime: minutesToHHmm(startIndex * SLOT_INTERVAL_MINUTES),
      endTime: minutesToHHmm(
        ((previousIndex ?? startIndex) + 1) * SLOT_INTERVAL_MINUTES
      )
    });
    startIndex = index;
    previousIndex = index;
  }

  if (startIndex !== null) {
    ranges.push({
      startTime: minutesToHHmm(startIndex * SLOT_INTERVAL_MINUTES),
      endTime: minutesToHHmm(
        ((previousIndex ?? startIndex) + 1) * SLOT_INTERVAL_MINUTES
      )
    });
  }

  return ranges;
}

export function slotSetToWeeklySlots(
  selected: Set<string>,
  timezone = AVAILABILITY_TIMEZONE
): WeeklyAvailabilitySlot[] {
  return availabilityDays.flatMap((day) =>
    slotSetToMergedRanges(selected, day.value).map((range) => ({
      ...range,
      timezone,
      weekday: day.value
    }))
  );
}

export function calculateWeeklyTotalMinutes(selected: Set<string>): number {
  return selected.size * SLOT_INTERVAL_MINUTES;
}

export function calculateDayMinutes(selected: Set<string>, weekday: number): number {
  let count = 0;
  for (const key of selected) {
    if (parseSlotKey(key).weekday === weekday) count += 1;
  }
  return count * SLOT_INTERVAL_MINUTES;
}

export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${String(remainder)}분`;
  if (remainder === 0) return `${String(hours)}시간`;
  return `${String(hours)}시간 ${String(remainder)}분`;
}

export function rangeContainsDuration(
  range: AvailabilityRange,
  startMinutes: number,
  durationMinutes: number
): boolean {
  const rangeStart = hhmmToMinutes(range.startTime);
  const rangeEnd = hhmmToMinutes(range.endTime);
  return startMinutes >= rangeStart && startMinutes + durationMinutes <= rangeEnd;
}

export function generateBookableStartSlots({
  busyIntervals = [],
  daysAhead = 28,
  durationMinutes,
  exceptions = [],
  fromDate = seoulDateString(),
  weeklySlots
}: {
  busyIntervals?: BusyInterval[];
  daysAhead?: number;
  durationMinutes: number;
  exceptions?: AvailabilityException[];
  fromDate?: string;
  weeklySlots: WeeklyAvailabilitySlot[];
}): BookableStartSlot[] {
  const result: BookableStartSlot[] = [];
  const exceptionsByDate = new Map(exceptions.map((item) => [item.date, item]));

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = addDaysToDateString(fromDate, offset);
    const weekday = weekdayFromDateString(date);
    const exception = exceptionsByDate.get(date);
    const ranges =
      exception?.mode === "unavailable"
        ? []
        : exception?.mode === "custom"
          ? exception.ranges
          : weeklySlots.filter((slot) => slot.weekday === weekday);

    for (const range of ranges) {
      const start = hhmmToMinutes(range.startTime);
      const end = hhmmToMinutes(range.endTime);
      for (
        let minutes = start;
        minutes + durationMinutes <= end;
        minutes += SLOT_INTERVAL_MINUTES
      ) {
        const startTime = minutesToHHmm(minutes);
        const endTime = minutesToHHmm(minutes + durationMinutes);
        const startIso = toSeoulOffsetIso(date, startTime);
        const endIso = toSeoulOffsetIso(date, endTime);
        if (busyIntervals.some((interval) => intervalsOverlap(startIso, endIso, interval))) {
          continue;
        }
        const weekdayLabel =
          availabilityDays.find((day) => day.value === weekday)?.label ?? "요일";
        result.push({
          date,
          endIso,
          endTime,
          key: `${date}-${startTime}-${String(durationMinutes)}`,
          label: `${formatKoreanDate(date)} ${startTime}-${endTime}`,
          startIso,
          startTime,
          weekday,
          weekdayLabel
        });
      }
    }
  }

  return result;
}

export function normalizeRanges(ranges: AvailabilityRange[]): AvailabilityRange[] {
  return ranges
    .filter(
      (range) =>
        validateThirtyMinuteAlignment(range.startTime) &&
        validateThirtyMinuteAlignment(range.endTime) &&
        hhmmToMinutes(range.startTime) < hhmmToMinutes(range.endTime)
    )
    .sort((a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime));
}

export function weekdayLabel(weekday: number): string {
  return availabilityDays.find((day) => day.value === weekday)?.label ?? "요일";
}

export function seoulDateString(date = new Date()): string {
  const offsetDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return offsetDate.toISOString().slice(0, 10);
}

export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayFromDateString(dateString: string): WeekdayValue {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  return date.getUTCDay() as WeekdayValue;
}

export function formatKoreanDate(dateString: string): string {
  const [, month, day] = dateString.split("-").map(Number);
  const label =
    availabilityDays
      .find((item) => item.value === weekdayFromDateString(dateString))
      ?.label.replace("요일", "") ?? "";
  return `${String(month)}월 ${String(day)}일 ${label}요일`;
}

export function toSeoulOffsetIso(dateString: string, time: string): string {
  return `${dateString}T${time}:00+09:00`;
}

function intervalsOverlap(
  startIso: string,
  endIso: string,
  interval: BusyInterval
): boolean {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const busyStart = Date.parse(interval.startIso);
  const busyEnd = Date.parse(interval.endIso);
  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    Number.isNaN(busyStart) ||
    Number.isNaN(busyEnd)
  ) {
    return false;
  }
  return start < busyEnd && busyStart < end;
}
