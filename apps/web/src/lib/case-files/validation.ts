import { z } from "zod";

export const caseFileKindSchema = z.enum([
  "report_draft",
  "test_result",
  "scoring_sheet",
  "response_sheet",
  "behavioral_observation",
  "interview_summary",
  "other",
  "direct_edit_revision"
]);

export const uploadUrlSchema = z.object({
  requestId: z.uuid(),
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim().max(120).optional().default(""),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  kind: caseFileKindSchema
});

export const registerCaseFileSchema = z.object({
  requestId: z.uuid(),
  uploadKey: z.string().trim().min(1).max(300),
  parentFileId: z.uuid().optional().nullable(),
  kind: caseFileKindSchema,
  originalFilename: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().max(120).optional().default(""),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024)
});

export const requestIdQuerySchema = z.object({
  requestId: z.uuid()
});

export const fileIdParamsSchema = z.object({
  id: z.uuid()
});
