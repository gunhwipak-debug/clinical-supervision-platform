import { describe, expect, it } from "vitest";
import {
  AVAILABILITY_TIMEZONE,
  createSlotKey,
  generateBookableStartSlots,
  rangesToSlotSet,
  seoulDateString,
  slotSetToMergedRanges,
  slotSetToWeeklySlots,
  validateThirtyMinuteAlignment,
  type AvailabilityException,
  type WeeklyAvailabilitySlot
} from "./availability-calendar";

describe("availability calendar utilities", () => {
  it("converts ranges to slot sets and merges adjacent cells back to stable ranges", () => {
    const slots: WeeklyAvailabilitySlot[] = [
      {
        endTime: "12:00",
        startTime: "09:00",
        timezone: AVAILABILITY_TIMEZONE,
        weekday: 1
      },
      {
        endTime: "18:00",
        startTime: "13:30",
        timezone: AVAILABILITY_TIMEZONE,
        weekday: 1
      }
    ];

    const selected = rangesToSlotSet(slots);

    expect(selected.has(createSlotKey(1, 18))).toBe(true);
    expect(slotSetToMergedRanges(selected, 1)).toEqual([
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "13:30", endTime: "18:00" }
    ]);
  });

  it("splits a range after erased cells are removed", () => {
    const selected = rangesToSlotSet([
      {
        endTime: "12:00",
        startTime: "09:00",
        timezone: AVAILABILITY_TIMEZONE,
        weekday: 1
      }
    ]);

    selected.delete(createSlotKey(1, 20));
    selected.delete(createSlotKey(1, 21));

    expect(slotSetToMergedRanges(selected, 1)).toEqual([
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "11:00", endTime: "12:00" }
    ]);
  });

  it("preserves timezone while converting selected cells to weekly slots", () => {
    const selected = new Set([createSlotKey(3, 28), createSlotKey(3, 29)]);

    expect(slotSetToWeeklySlots(selected, AVAILABILITY_TIMEZONE)).toEqual([
      {
        endTime: "15:00",
        startTime: "14:00",
        timezone: "Asia/Seoul",
        weekday: 3
      }
    ]);
  });

  it("validates 30-minute alignment", () => {
    expect(validateThirtyMinuteAlignment("09:00")).toBe(true);
    expect(validateThirtyMinuteAlignment("09:30")).toBe(true);
    expect(validateThirtyMinuteAlignment("09:15")).toBe(false);
  });

  it("generates duration-aware 90-minute start slots and excludes overflow starts", () => {
    const starts = generateBookableStartSlots({
      durationMinutes: 90,
      fromDate: "2026-06-22",
      weeklySlots: [
        {
          endTime: "12:00",
          startTime: "09:00",
          timezone: AVAILABILITY_TIMEZONE,
          weekday: 1
        }
      ]
    })
      .filter((slot) => slot.date === "2026-06-22")
      .map((slot) => slot.startTime);

    expect(starts.slice(0, 4)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(starts).not.toContain("11:00");
  });

  it("generates 50-minute starts on 30-minute boundaries only when the full session fits", () => {
    const starts = generateBookableStartSlots({
      durationMinutes: 50,
      fromDate: "2026-06-22",
      weeklySlots: [
        {
          endTime: "10:00",
          startTime: "09:00",
          timezone: AVAILABILITY_TIMEZONE,
          weekday: 1
        }
      ]
    })
      .filter((slot) => slot.date === "2026-06-22")
      .map((slot) => slot.startTime);

    expect(starts).toEqual(["09:00"]);
  });

  it("lets date exceptions override weekly recurrence", () => {
    const exceptions: AvailabilityException[] = [
      {
        date: "2026-06-22",
        mode: "unavailable",
        ranges: [],
        timezone: AVAILABILITY_TIMEZONE
      }
    ];

    const slots = generateBookableStartSlots({
      durationMinutes: 60,
      exceptions,
      fromDate: "2026-06-22",
      weeklySlots: [
        {
          endTime: "12:00",
          startTime: "09:00",
          timezone: AVAILABILITY_TIMEZONE,
          weekday: 1
        }
      ]
    });

    expect(slots.filter((slot) => slot.date === "2026-06-22")).toHaveLength(0);
  });

  it("generates valid starts for every live duration on a 30-minute grid", () => {
    const startsByDuration = [50, 60, 90, 120].map((durationMinutes) => ({
      durationMinutes,
      starts: generateBookableStartSlots({
        durationMinutes,
        fromDate: "2026-06-22",
        weeklySlots: [
          {
            endTime: "12:00",
            startTime: "09:00",
            timezone: AVAILABILITY_TIMEZONE,
            weekday: 1
          }
        ]
      })
        .filter((slot) => slot.date === "2026-06-22")
        .map((slot) => slot.startTime)
    }));

    expect(startsByDuration).toEqual([
      { durationMinutes: 50, starts: ["09:00", "09:30", "10:00", "10:30", "11:00"] },
      { durationMinutes: 60, starts: ["09:00", "09:30", "10:00", "10:30", "11:00"] },
      { durationMinutes: 90, starts: ["09:00", "09:30", "10:00", "10:30"] },
      { durationMinutes: 120, starts: ["09:00", "09:30", "10:00"] }
    ]);
  });

  it("excludes starts that overlap existing busy intervals", () => {
    const starts = generateBookableStartSlots({
      busyIntervals: [
        {
          endIso: "2026-06-22T11:30:00+09:00",
          startIso: "2026-06-22T10:30:00+09:00"
        }
      ],
      durationMinutes: 90,
      fromDate: "2026-06-22",
      weeklySlots: [
        {
          endTime: "12:00",
          startTime: "09:00",
          timezone: AVAILABILITY_TIMEZONE,
          weekday: 1
        }
      ]
    })
      .filter((slot) => slot.date === "2026-06-22")
      .map((slot) => slot.startTime);

    expect(starts).toEqual(["09:00"]);
  });

  it("derives the Seoul date from an explicit UTC instant", () => {
    expect(seoulDateString(new Date("2026-06-21T14:59:00.000Z"))).toBe(
      "2026-06-21"
    );
    expect(seoulDateString(new Date("2026-06-21T15:00:00.000Z"))).toBe(
      "2026-06-22"
    );
  });
});
