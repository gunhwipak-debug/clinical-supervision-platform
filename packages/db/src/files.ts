import { decryptPhi, encryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

export type CaseFileKind =
  | "report_draft"
  | "test_result"
  | "scoring_sheet"
  | "response_sheet"
  | "behavioral_observation"
  | "interview_summary"
  | "other"
  | "direct_edit_revision";

export type CaseFileRecord = {
  id: string;
  casePacketId: string;
  supervisionRequestId: string;
  superviseeId: string;
  supervisorId: string | null;
  requestStatus: string;
  uploadedBy: string;
  kind: CaseFileKind;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  parentFileId: string | null;
  versionNo: number;
  isFinalReturn: boolean;
  checksumSha256: string | null;
  virusScanStatus: "pending" | "clean" | "infected" | "error";
  phiScanStatus: "pending" | "clean" | "suspicious";
  uploadedAt: Date | string;
  retentionExpiresAt: Date | string | null;
  deletedAt: Date | string | null;
};

export type CaseFilePreviewRecord = {
  id: string;
  caseFileId: string;
  status: "pending" | "ready" | "failed";
  previewStorageKey: string | null;
  previewMimeType: string | null;
  pageCount: number | null;
  errorCode: string | null;
  generatedAt: Date | string | null;
  createdAt: Date | string;
};

export type CaseFileAnnotationRecord = {
  id: string;
  caseFileId: string;
  authorUserId: string;
  pageNumber: number;
  xPct: string;
  yPct: string;
  widthPct: string;
  heightPct: string;
  body: string | null;
  status: "active" | "resolved";
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type RetentionWarningTarget = {
  requestId: string;
  superviseeId: string;
  supervisorId: string | null;
  retentionExpiresAt: Date | string;
  fileCount: number;
};

export type DocumentReviewStatus =
  | "revision_requested"
  | "revision_uploaded"
  | "feedback_approved"
  | "stamped_returned";

export type DocumentReviewCycleRecord = {
  id: string;
  supervisionRequestId: string;
  actorUserId: string;
  targetFileId: string | null;
  status: DocumentReviewStatus;
  note: string | null;
  createdAt: Date | string;
  completedAt: Date | string | null;
};

export type UploadSource = {
  requestId: string;
  casePacketId: string | null;
  superviseeId: string;
  supervisorId: string | null;
  status: string;
  retentionExpiresAt: Date | string | null;
};

type FilesDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function getUploadSource(
  db: FilesDatabase,
  requestId: string
): Promise<UploadSource | null> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      cp.id as "casePacketId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status,
      sr.retention_expires_at as "retentionExpiresAt"
    from supervision_requests sr
    left join case_packets cp on cp.supervision_request_id = sr.id
    where sr.id = ${requestId}
    limit 1
  `);

  return rowsOf<UploadSource>(result)[0] ?? null;
}

export async function createCaseFile(
  db: FilesDatabase,
  input: {
    requestId: string;
    uploadedBy: string;
    kind: CaseFileKind;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    checksumSha256: string;
    virusScanStatus: "clean" | "infected" | "error";
    phiScanStatus: "clean" | "pending" | "suspicious";
    parentFileId?: string | null;
    isFinalReturn?: boolean;
  }
): Promise<CaseFileRecord | null> {
  const result = await db.execute(sql`
    insert into case_files (
      case_packet_id,
      uploaded_by,
      kind,
      original_filename,
      mime_type,
      size_bytes,
      storage_key,
      parent_file_id,
      version_no,
      is_final_return,
      checksum_sha256,
      virus_scan_status,
      phi_scan_status,
      retention_expires_at
    )
    select
      cp.id,
      ${input.uploadedBy},
      ${input.kind},
      ${input.originalFilename},
      ${input.mimeType},
      ${input.sizeBytes},
      ${input.storageKey},
      ${input.parentFileId ?? null},
      case
        when ${input.parentFileId ?? null}::uuid is null then 1
        else coalesce((
          select max(cf2.version_no) + 1
          from case_files cf2
          where cf2.id = ${input.parentFileId ?? null}::uuid
             or cf2.parent_file_id = ${input.parentFileId ?? null}::uuid
        ), 2)
      end,
      ${input.isFinalReturn ?? false},
      ${input.checksumSha256},
      ${input.virusScanStatus},
      ${input.phiScanStatus},
      sr.retention_expires_at
    from case_packets cp
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where sr.id = ${input.requestId}
      and (
        sr.supervisee_id = ${input.uploadedBy}
        or (${input.isFinalReturn ?? false} = true and sr.supervisor_id = ${input.uploadedBy})
      )
    returning
      id,
      case_packet_id as "casePacketId",
      (select supervision_request_id from case_packets where id = case_files.case_packet_id) as "supervisionRequestId",
      (select supervisee_id from supervision_requests where id = (select supervision_request_id from case_packets where id = case_files.case_packet_id)) as "superviseeId",
      (select supervisor_id from supervision_requests where id = (select supervision_request_id from case_packets where id = case_files.case_packet_id)) as "supervisorId",
      (select status from supervision_requests where id = (select supervision_request_id from case_packets where id = case_files.case_packet_id)) as "requestStatus",
      uploaded_by as "uploadedBy",
      kind,
      original_filename as "originalFilename",
      mime_type as "mimeType",
      size_bytes as "sizeBytes",
      storage_key as "storageKey",
      parent_file_id as "parentFileId",
      version_no as "versionNo",
      is_final_return as "isFinalReturn",
      checksum_sha256 as "checksumSha256",
      virus_scan_status as "virusScanStatus",
      phi_scan_status as "phiScanStatus",
      uploaded_at as "uploadedAt",
      retention_expires_at as "retentionExpiresAt",
      deleted_at as "deletedAt"
  `);

  return rowsOf<CaseFileRecord>(result)[0] ?? null;
}

export async function listCaseFilesForRequest(
  db: FilesDatabase,
  requestId: string
): Promise<CaseFileRecord[]> {
  const result = await db.execute(sql`
    select
      cf.id,
      cf.case_packet_id as "casePacketId",
      sr.id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status as "requestStatus",
      cf.uploaded_by as "uploadedBy",
      cf.kind,
      cf.original_filename as "originalFilename",
      cf.mime_type as "mimeType",
      cf.size_bytes as "sizeBytes",
      cf.storage_key as "storageKey",
      cf.parent_file_id as "parentFileId",
      cf.version_no as "versionNo",
      cf.is_final_return as "isFinalReturn",
      cf.checksum_sha256 as "checksumSha256",
      cf.virus_scan_status as "virusScanStatus",
      cf.phi_scan_status as "phiScanStatus",
      cf.uploaded_at as "uploadedAt",
      cf.retention_expires_at as "retentionExpiresAt",
      cf.deleted_at as "deletedAt"
    from case_files cf
    join case_packets cp on cp.id = cf.case_packet_id
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where sr.id = ${requestId}
      and cf.deleted_at is null
    order by cf.uploaded_at desc
  `);

  return rowsOf<CaseFileRecord>(result);
}

export async function getCaseFile(
  db: FilesDatabase,
  fileId: string
): Promise<CaseFileRecord | null> {
  const result = await db.execute(sql`
    select
      cf.id,
      cf.case_packet_id as "casePacketId",
      sr.id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status as "requestStatus",
      cf.uploaded_by as "uploadedBy",
      cf.kind,
      cf.original_filename as "originalFilename",
      cf.mime_type as "mimeType",
      cf.size_bytes as "sizeBytes",
      cf.storage_key as "storageKey",
      cf.parent_file_id as "parentFileId",
      cf.version_no as "versionNo",
      cf.is_final_return as "isFinalReturn",
      cf.checksum_sha256 as "checksumSha256",
      cf.virus_scan_status as "virusScanStatus",
      cf.phi_scan_status as "phiScanStatus",
      cf.uploaded_at as "uploadedAt",
      cf.retention_expires_at as "retentionExpiresAt",
      cf.deleted_at as "deletedAt"
    from case_files cf
    join case_packets cp on cp.id = cf.case_packet_id
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where cf.id = ${fileId}
      and cf.deleted_at is null
    limit 1
  `);

  return rowsOf<CaseFileRecord>(result)[0] ?? null;
}

export async function markCaseFileDeleted(
  db: FilesDatabase,
  fileId: string,
  userId: string
): Promise<CaseFileRecord | null> {
  const result = await db.execute(sql`
    update case_files cf
    set deleted_at = now()
    from case_packets cp, supervision_requests sr
    where cf.id = ${fileId}
      and cf.case_packet_id = cp.id
      and sr.id = cp.supervision_request_id
      and sr.supervisee_id = ${userId}
      and cf.deleted_at is null
      and sr.status in ('draft', 'in_review')
    returning
      cf.id,
      cf.case_packet_id as "casePacketId",
      sr.id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status as "requestStatus",
      cf.uploaded_by as "uploadedBy",
      cf.kind,
      cf.original_filename as "originalFilename",
      cf.mime_type as "mimeType",
      cf.size_bytes as "sizeBytes",
      cf.storage_key as "storageKey",
      cf.parent_file_id as "parentFileId",
      cf.version_no as "versionNo",
      cf.is_final_return as "isFinalReturn",
      cf.checksum_sha256 as "checksumSha256",
      cf.virus_scan_status as "virusScanStatus",
      cf.phi_scan_status as "phiScanStatus",
      cf.uploaded_at as "uploadedAt",
      cf.retention_expires_at as "retentionExpiresAt",
      cf.deleted_at as "deletedAt"
  `);

  return rowsOf<CaseFileRecord>(result)[0] ?? null;
}

export async function listExpiredCaseFiles(
  db: FilesDatabase,
  now: Date = new Date()
): Promise<CaseFileRecord[]> {
  const result = await db.execute(sql`
    select
      cf.id,
      cf.case_packet_id as "casePacketId",
      sr.id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status as "requestStatus",
      cf.uploaded_by as "uploadedBy",
      cf.kind,
      cf.original_filename as "originalFilename",
      cf.mime_type as "mimeType",
      cf.size_bytes as "sizeBytes",
      cf.storage_key as "storageKey",
      cf.parent_file_id as "parentFileId",
      cf.version_no as "versionNo",
      cf.is_final_return as "isFinalReturn",
      cf.checksum_sha256 as "checksumSha256",
      cf.virus_scan_status as "virusScanStatus",
      cf.phi_scan_status as "phiScanStatus",
      cf.uploaded_at as "uploadedAt",
      cf.retention_expires_at as "retentionExpiresAt",
      cf.deleted_at as "deletedAt"
    from case_files cf
    join case_packets cp on cp.id = cf.case_packet_id
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where cf.deleted_at is null
      and cf.retention_expires_at is not null
      and cf.retention_expires_at <= ${now}
    order by cf.retention_expires_at asc, cf.uploaded_at asc
  `);

  return rowsOf<CaseFileRecord>(result);
}

export async function listRetentionWarningTargets(
  db: FilesDatabase,
  input: { from: Date; to: Date }
): Promise<RetentionWarningTarget[]> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      min(cf.retention_expires_at) as "retentionExpiresAt",
      count(cf.id)::int as "fileCount"
    from case_files cf
    join case_packets cp on cp.id = cf.case_packet_id
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where cf.deleted_at is null
      and cf.retention_expires_at is not null
      and cf.retention_expires_at >= ${input.from.toISOString()}::timestamptz
      and cf.retention_expires_at < ${input.to.toISOString()}::timestamptz
    group by sr.id, sr.supervisee_id, sr.supervisor_id
    order by min(cf.retention_expires_at) asc
  `);

  return rowsOf<RetentionWarningTarget>(result);
}

export async function markExpiredCaseFileDeleted(
  db: FilesDatabase,
  fileId: string,
  now: Date = new Date()
): Promise<CaseFileRecord | null> {
  const result = await db.execute(sql`
    update case_files cf
    set deleted_at = now()
    from case_packets cp, supervision_requests sr
    where cf.id = ${fileId}
      and cf.case_packet_id = cp.id
      and sr.id = cp.supervision_request_id
      and cf.deleted_at is null
      and cf.retention_expires_at is not null
      and cf.retention_expires_at <= ${now}
    returning
      cf.id,
      cf.case_packet_id as "casePacketId",
      sr.id as "supervisionRequestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status as "requestStatus",
      cf.uploaded_by as "uploadedBy",
      cf.kind,
      cf.original_filename as "originalFilename",
      cf.mime_type as "mimeType",
      cf.size_bytes as "sizeBytes",
      cf.storage_key as "storageKey",
      cf.parent_file_id as "parentFileId",
      cf.version_no as "versionNo",
      cf.is_final_return as "isFinalReturn",
      cf.checksum_sha256 as "checksumSha256",
      cf.virus_scan_status as "virusScanStatus",
      cf.phi_scan_status as "phiScanStatus",
      cf.uploaded_at as "uploadedAt",
      cf.retention_expires_at as "retentionExpiresAt",
      cf.deleted_at as "deletedAt"
  `);

  return rowsOf<CaseFileRecord>(result)[0] ?? null;
}

export async function upsertCaseFilePreview(
  db: FilesDatabase,
  input: {
    caseFileId: string;
    status: "ready" | "failed" | "pending";
    previewStorageKey?: string | null;
    previewMimeType?: string | null;
    pageCount?: number | null;
    errorCode?: string | null;
  }
): Promise<CaseFilePreviewRecord | null> {
  const result = await db.execute(sql`
    insert into case_file_previews (
      case_file_id,
      status,
      preview_storage_key,
      preview_mime_type,
      page_count,
      error_code,
      generated_at
    )
    values (
      ${input.caseFileId},
      ${input.status},
      ${input.previewStorageKey ?? null},
      ${input.previewMimeType ?? null},
      ${input.pageCount ?? null},
      ${input.errorCode ?? null},
      case when ${input.status} in ('ready', 'failed') then now() else null end
    )
    on conflict (case_file_id) do update
    set status = excluded.status,
        preview_storage_key = excluded.preview_storage_key,
        preview_mime_type = excluded.preview_mime_type,
        page_count = excluded.page_count,
        error_code = excluded.error_code,
        generated_at = excluded.generated_at
    returning
      id,
      case_file_id as "caseFileId",
      status,
      preview_storage_key as "previewStorageKey",
      preview_mime_type as "previewMimeType",
      page_count as "pageCount",
      error_code as "errorCode",
      generated_at as "generatedAt",
      created_at as "createdAt"
  `);

  return rowsOf<CaseFilePreviewRecord>(result)[0] ?? null;
}

export async function getCaseFilePreview(
  db: FilesDatabase,
  caseFileId: string
): Promise<CaseFilePreviewRecord | null> {
  const result = await db.execute(sql`
    select
      id,
      case_file_id as "caseFileId",
      status,
      preview_storage_key as "previewStorageKey",
      preview_mime_type as "previewMimeType",
      page_count as "pageCount",
      error_code as "errorCode",
      generated_at as "generatedAt",
      created_at as "createdAt"
    from case_file_previews
    where case_file_id = ${caseFileId}
    limit 1
  `);

  return rowsOf<CaseFilePreviewRecord>(result)[0] ?? null;
}

export async function listCaseFileAnnotations(
  db: FilesDatabase,
  caseFileId: string
): Promise<CaseFileAnnotationRecord[]> {
  const result = await db.execute(sql`
    select
      id,
      case_file_id as "caseFileId",
      author_user_id as "authorUserId",
      page_number as "pageNumber",
      x_pct::text as "xPct",
      y_pct::text as "yPct",
      width_pct::text as "widthPct",
      height_pct::text as "heightPct",
      ${nullableDecrypt(sql`body_enc`)} as body,
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
    from case_file_annotations
    where case_file_id = ${caseFileId}
    order by page_number asc, created_at asc
  `);

  return rowsOf<CaseFileAnnotationRecord>(result);
}

export async function createCaseFileAnnotation(
  db: FilesDatabase,
  input: {
    caseFileId: string;
    authorUserId: string;
    pageNumber: number;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    body: string;
  }
): Promise<CaseFileAnnotationRecord | null> {
  const result = await db.execute(sql`
    insert into case_file_annotations (
      case_file_id,
      author_user_id,
      page_number,
      x_pct,
      y_pct,
      width_pct,
      height_pct,
      body_enc
    )
    values (
      ${input.caseFileId},
      ${input.authorUserId},
      ${input.pageNumber},
      ${input.xPct},
      ${input.yPct},
      ${input.widthPct},
      ${input.heightPct},
      ${encryptPhi(input.body)}
    )
    returning
      id,
      case_file_id as "caseFileId",
      author_user_id as "authorUserId",
      page_number as "pageNumber",
      x_pct::text as "xPct",
      y_pct::text as "yPct",
      width_pct::text as "widthPct",
      height_pct::text as "heightPct",
      ${nullableDecrypt(sql`body_enc`)} as body,
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `);

  return rowsOf<CaseFileAnnotationRecord>(result)[0] ?? null;
}

export async function createDocumentReviewCycle(
  db: FilesDatabase,
  input: {
    supervisionRequestId: string;
    actorUserId: string;
    status: DocumentReviewStatus;
    targetFileId?: string | null;
    note?: string | null;
    completed?: boolean;
  }
): Promise<DocumentReviewCycleRecord | null> {
  const result = await db.execute(sql`
    insert into document_review_cycles (
      supervision_request_id,
      actor_user_id,
      target_file_id,
      status,
      note_enc,
      completed_at
    )
    values (
      ${input.supervisionRequestId},
      ${input.actorUserId},
      ${input.targetFileId ?? null},
      ${input.status},
      ${input.note ? encryptPhi(input.note) : null},
      case when ${input.completed ?? false} then now() else null end
    )
    returning
      id,
      supervision_request_id as "supervisionRequestId",
      actor_user_id as "actorUserId",
      target_file_id as "targetFileId",
      status,
      null::text as note,
      created_at as "createdAt",
      completed_at as "completedAt"
  `);

  return rowsOf<DocumentReviewCycleRecord>(result)[0] ?? null;
}

export async function latestDocumentReviewCycle(
  db: FilesDatabase,
  requestId: string
): Promise<DocumentReviewCycleRecord | null> {
  const result = await db.execute(sql`
    select
      id,
      supervision_request_id as "supervisionRequestId",
      actor_user_id as "actorUserId",
      target_file_id as "targetFileId",
      status,
      null::text as note,
      created_at as "createdAt",
      completed_at as "completedAt"
    from document_review_cycles
    where supervision_request_id = ${requestId}
    order by created_at desc
    limit 1
  `);

  return rowsOf<DocumentReviewCycleRecord>(result)[0] ?? null;
}

export async function scheduleRawCaseFilesForCompletedPurge(
  db: FilesDatabase,
  requestId: string
): Promise<number> {
  const result = await db.execute(sql`
    update case_files cf
    set retention_expires_at = now() + interval '7 days'
    from case_packets cp
    where cf.case_packet_id = cp.id
      and cp.supervision_request_id = ${requestId}
      and cf.deleted_at is null
      and cf.is_final_return = false
    returning cf.id
  `);

  return rowsOf<{ id: string }>(result).length;
}

export async function logFileAccess(
  db: FilesDatabase,
  input: {
    userId: string;
    fileId: string;
    action: "view" | "download" | "upload" | "delete";
    ipAddress?: string | null;
    signedUrlId?: string | null;
  }
): Promise<void> {
  await db.execute(sql`
    insert into access_logs (user_id, file_id, action, ip_address, signed_url_id)
    values (
      ${input.userId},
      ${input.fileId},
      ${input.action},
      ${input.ipAddress ?? null},
      ${input.signedUrlId ?? null}
    )
  `);
}

export async function logSignedUrlIssue(
  db: FilesDatabase,
  input: {
    actorUserId: string;
    actorRole: string;
    fileId: string;
    signedUrlId: string;
    reason?: string | null;
    ipAddress?: string | null;
  }
): Promise<void> {
  await db.execute(sql`
    insert into audit_logs (
      actor_user_id,
      actor_role,
      action,
      target_type,
      target_id,
      reason,
      ip_address,
      context
    )
    values (
      ${input.actorUserId},
      ${input.actorRole},
      'signed_url_issue',
      'case_file',
      ${input.fileId},
      ${input.reason ?? null},
      ${input.ipAddress ?? null},
      jsonb_build_object('signedUrlId', ${input.signedUrlId}::text)
    )
  `);
}

export async function getSignedUrlIssueReason(
  db: FilesDatabase,
  input: {
    actorUserId: string;
    fileId: string;
    signedUrlId: string;
  }
): Promise<string | null> {
  const result = await db.execute(sql`
    select reason
    from audit_logs
    where actor_user_id = ${input.actorUserId}
      and action = 'signed_url_issue'
      and target_type = 'case_file'
      and target_id = ${input.fileId}
      and context ->> 'signedUrlId' = ${input.signedUrlId}
    order by created_at desc
    limit 1
  `);
  return rowsOf<{ reason: string | null }>(result)[0]?.reason ?? null;
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) {
    return result as TRow[];
  }

  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }

  return [];
}

function nullableDecrypt(ciphertext: SQLWrapper): SQL<string | null> {
  return sql<
    string | null
  >`case when ${ciphertext} is null then null else ${decryptPhi(ciphertext)} end`;
}
