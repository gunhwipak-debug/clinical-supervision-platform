import { z } from "zod";

export const serviceProductKinds = [
  "async_comment",
  "async_direct_edit",
  "zoom_60",
  "zoom_90",
  "urgent_24h"
] as const;

export const supervisorProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  photoUrl: z.url().max(500).nullable().optional(),
  headline: z.string().trim().max(180).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
  zoomMeetingUrl: z.string().trim().max(500).nullable().optional()
});

export const visibilitySchema = z.object({
  visibility: z.enum(["hidden", "public", "private"])
});

export const qualificationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  number: z.string().trim().max(120).nullable().optional(),
  issuingBody: z.string().trim().max(160).nullable().optional(),
  issuedAt: z.iso.date().nullable().optional(),
  expiresAt: z.iso.date().nullable().optional(),
  evidenceFileId: z.uuid()
});

export const qualificationEvidenceUploadUrlSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().max(160).nullable().optional(),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(25 * 1024 * 1024)
});

export const qualificationEvidenceRegisterSchema = z.object({
  uploadKey: z.string().trim().min(1).max(500),
  originalFilename: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().max(160).nullable().optional(),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(25 * 1024 * 1024)
});

export const specialtiesSchema = z.object({
  codes: z.array(z.string().trim().min(1).max(80)).max(24)
});

export const productSchema = z.object({
  active: z.boolean().optional(),
  kind: z.enum(serviceProductKinds),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  priceKrw: z.number().int().min(10_000).max(10_000_000),
  turnaroundHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .nullable()
    .optional()
});

const timezoneSchema = z.literal("Asia/Seoul");
const timeSchema = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/u);

const availabilityRangeSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema
});

export const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: timeSchema,
        endTime: timeSchema,
        timezone: timezoneSchema.default("Asia/Seoul")
      })
    )
    .max(336)
    .superRefine((slots, context) => {
      const seen = new Set<string>();
      const byDay = new Map<
        string,
        Array<{ end: number; index: number; start: number }>
      >();

      for (const [index, slot] of slots.entries()) {
        if (
          !isThirtyMinuteAligned(slot.startTime) ||
          !isThirtyMinuteAligned(slot.endTime)
        ) {
          context.addIssue({
            code: "custom",
            message: "availability must use 30-minute alignment",
            path: [index]
          });
        }

        if (slot.startTime >= slot.endTime) {
          context.addIssue({
            code: "custom",
            message: "startTime must be before endTime",
            path: [index, "startTime"]
          });
        }

        const key = `${String(slot.weekday)}:${slot.timezone}:${slot.startTime}-${slot.endTime}`;
        if (seen.has(key)) {
          context.addIssue({
            code: "custom",
            message: "duplicate availability slot",
            path: [index]
          });
        }
        seen.add(key);

        const groupKey = `${String(slot.weekday)}:${slot.timezone}`;
        const group = byDay.get(groupKey) ?? [];
        group.push({
          end: minutesFromTime(slot.endTime),
          index,
          start: minutesFromTime(slot.startTime)
        });
        byDay.set(groupKey, group);
      }

      for (const ranges of byDay.values()) {
        const sorted = ranges.sort((a, b) => a.start - b.start);
        for (let index = 1; index < sorted.length; index += 1) {
          const previous = sorted[index - 1];
          const current = sorted[index];
          if (previous && current && current.start < previous.end) {
            context.addIssue({
              code: "custom",
              message: "overlapping availability slot",
              path: [current.index]
            });
          }
        }
      }
    }),
  exceptions: z
    .array(
      z.object({
        date: z.iso.date(),
        mode: z.enum(["custom", "unavailable"]),
        note: z.string().trim().max(240).nullable().optional(),
        ranges: z.array(availabilityRangeSchema).max(48).default([]),
        timezone: timezoneSchema.default("Asia/Seoul")
      })
    )
    .max(180)
    .default([])
    .superRefine((exceptions, context) => {
      const seenDates = new Set<string>();

      for (const [exceptionIndex, exception] of exceptions.entries()) {
        if (seenDates.has(exception.date)) {
          context.addIssue({
            code: "custom",
            message: "duplicate availability exception date",
            path: [exceptionIndex, "date"]
          });
        }
        seenDates.add(exception.date);

        if (exception.mode === "unavailable" && exception.ranges.length > 0) {
          context.addIssue({
            code: "custom",
            message: "unavailable date cannot include ranges",
            path: [exceptionIndex, "ranges"]
          });
        }

        const ranges = exception.ranges
          .map((range, index) => ({
            end: minutesFromTime(range.endTime),
            index,
            start: minutesFromTime(range.startTime)
          }))
          .sort((a, b) => a.start - b.start);

        for (const range of ranges) {
          if (range.start >= range.end) {
            context.addIssue({
              code: "custom",
              message: "exception startTime must be before endTime",
              path: [exceptionIndex, "ranges", range.index]
            });
          }
          if (range.start % 30 !== 0 || range.end % 30 !== 0) {
            context.addIssue({
              code: "custom",
              message: "exception ranges must use 30-minute alignment",
              path: [exceptionIndex, "ranges", range.index]
            });
          }
        }

        for (let index = 1; index < ranges.length; index += 1) {
          const previous = ranges[index - 1];
          const current = ranges[index];
          if (previous && current && current.start < previous.end) {
            context.addIssue({
              code: "custom",
              message: "overlapping exception range",
              path: [exceptionIndex, "ranges", current.index]
            });
          }
        }
      }
    })
});

export const superviseeProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  headline: z.string().trim().max(180).nullable().optional()
});

export function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

function minutesFromTime(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

function isThirtyMinuteAligned(value: string): boolean {
  return minutesFromTime(value) % 30 === 0;
}
