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

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u);

export const availabilitySchema = z.object({
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: timeSchema,
        endTime: timeSchema,
        timezone: z.string().trim().min(1).max(80).default("Asia/Seoul")
      })
    )
    .max(84)
    .superRefine((slots, context) => {
      const seen = new Set<string>();

      for (const [index, slot] of slots.entries()) {
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
