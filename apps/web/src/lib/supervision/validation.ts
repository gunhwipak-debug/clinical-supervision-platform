import { z } from "zod";

export const createSupervisionRequestSchema = z.object({
  serviceProductId: z.uuid(),
  retentionDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  urgency: z.enum(["normal", "urgent_24h"]).nullable().optional(),
  desiredDeadline: z.iso.date().nullable().optional(),
  selectedSlotEnd: z.iso.datetime({ offset: true }).nullable().optional(),
  selectedSlotStart: z.iso.datetime({ offset: true }).nullable().optional()
});

export const casePacketSchema = z.object({
  title: z.string().trim().min(1).max(160),
  purpose: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  clientAgeBand: z
    .enum(["6-12", "13-18", "19-39", "40-64", "65+"])
    .nullable()
    .optional(),
  clientGender: z.string().trim().max(80).nullable().optional(),
  setting: z
    .enum(["hospital", "counseling_center", "community_center", "school", "other"])
    .nullable()
    .optional(),
  chiefComplaint: z.string().trim().min(1).max(2000),
  referralReason: z.string().trim().min(1).max(2000),
  testsUsed: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  requestItems: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  preferredMethod: z
    .enum(["async_comment", "direct_edit", "zoom", "comment_plus_zoom"])
    .nullable()
    .optional(),
  needsCompletionRecord: z.boolean().default(true)
});

export const deidentificationSchema = z.object({
  removedName: z.boolean(),
  removedRrn: z.boolean(),
  removedPhone: z.boolean(),
  removedAddress: z.boolean(),
  removedGuardianName: z.boolean(),
  removedOrgName: z.boolean(),
  removedChartNumber: z.boolean(),
  filenameSafe: z.boolean(),
  rawDataSafe: z.boolean(),
  minimalInfo: z.boolean(),
  clientConsentConfirmed: z.boolean(),
  purposeUnderstood: z.boolean()
});

export function isDeidentificationComplete(
  value: z.infer<typeof deidentificationSchema>
): boolean {
  return Object.values(value).every(Boolean);
}

export function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}
