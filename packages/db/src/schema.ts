import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  }
});

export const userRole = pgEnum("user_role", ["supervisee", "supervisor", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "suspended", "withdrawn"]);
export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
  "revoked"
]);
export const profileVisibility = pgEnum("profile_visibility", [
  "hidden",
  "public",
  "private"
]);
export const qualificationStatus = pgEnum("qualification_status", [
  "pending",
  "approved",
  "rejected"
]);
export const serviceProductKind = pgEnum("service_product_kind", [
  "async_comment",
  "async_direct_edit",
  "zoom_60",
  "zoom_90",
  "urgent_24h"
]);
export const supervisionStatus = pgEnum("supervision_status", [
  "draft",
  "submitted",
  "awaiting_payment",
  "paid",
  "awaiting_supervisor_review",
  "accepted",
  "rejected",
  "additional_info_requested",
  "in_review",
  "feedback_submitted",
  "meeting_scheduled",
  "meeting_completed",
  "completion_record_issued",
  "completed",
  "cancelled",
  "refunded",
  "expired",
  "deleted"
]);
export const urgency = pgEnum("urgency", ["normal", "urgent_24h"]);
export const preferredMethod = pgEnum("preferred_method", [
  "async_comment",
  "direct_edit",
  "zoom",
  "comment_plus_zoom"
]);
export const caseFileKind = pgEnum("case_file_kind", [
  "report_draft",
  "test_result",
  "scoring_sheet",
  "response_sheet",
  "behavioral_observation",
  "interview_summary",
  "other",
  "direct_edit_revision"
]);
export const virusScanStatus = pgEnum("virus_scan_status", [
  "pending",
  "clean",
  "infected",
  "error"
]);
export const phiScanStatus = pgEnum("phi_scan_status", [
  "pending",
  "clean",
  "suspicious"
]);
export const consentType = pgEnum("consent_type", [
  "tos",
  "privacy",
  "sensitive",
  "marketing"
]);
export const authTokenKind = pgEnum("auth_token_kind", [
  "email_verify",
  "password_reset"
]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "partially_refunded",
  "refunded",
  "cancelled"
]);
export const refundStatus = pgEnum("refund_status", [
  "requested",
  "approved",
  "rejected",
  "completed"
]);
export const payoutStatus = pgEnum("payout_status", [
  "scheduled",
  "held",
  "paid",
  "failed"
]);
export const bookingStatus = pgEnum("booking_status", [
  "scheduled",
  "rescheduled",
  "cancelled",
  "completed",
  "no_show_supervisee",
  "no_show_supervisor"
]);
export const commentSeverity = pgEnum("comment_severity", [
  "info",
  "suggestion",
  "warning",
  "critical"
]);
export const reviewStatus = pgEnum("review_status", ["visible", "hidden", "reported"]);
export const fileAccessAction = pgEnum("file_access_action", [
  "view",
  "download",
  "upload",
  "delete"
]);
export const disputeStatus = pgEnum("dispute_status", [
  "open",
  "investigating",
  "resolved_refund",
  "resolved_partial",
  "resolved_denied",
  "closed"
]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed"
]);
export const termsKind = pgEnum("terms_kind", [
  "tos",
  "privacy",
  "sensitive",
  "marketing"
]);
export const deletionTargetType = pgEnum("deletion_target_type", [
  "user",
  "case_file",
  "case_packet",
  "supervision_request"
]);
export const deletionStatus = pgEnum("deletion_status", [
  "pending",
  "approved",
  "rejected",
  "completed"
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    role: userRole("role").notNull(),
    displayNameEnc: bytea("display_name_enc"),
    phoneEnc: bytea("phone_enc"),
    totpSecretEnc: bytea("totp_secret_enc"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    status: userStatus("status").notNull().default("active"),
    organizationId: uuid("organization_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_status_idx").on(table.role, table.status)
  ]
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: authTokenKind("kind").notNull(),
    tokenHash: text("token_hash").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ip: text("ip")
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_unique").on(table.tokenHash),
    index("auth_tokens_user_kind_idx").on(table.userId, table.kind),
    index("auth_tokens_lookup_idx").on(table.kind, table.tokenHash, table.expiresAt)
  ]
);

export const totpRecoveryCodes = pgTable(
  "totp_recovery_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    codeHash: text("code_hash").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("totp_recovery_codes_code_hash_unique").on(table.codeHash),
    index("totp_recovery_codes_user_active_idx").on(table.userId, table.consumedAt)
  ]
);

export const supervisorProfiles = pgTable(
  "supervisor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    displayName: text("display_name").notNull(),
    photoUrl: text("photo_url"),
    headline: text("headline"),
    bio: text("bio"),
    yearsOfExperience: integer("years_of_experience"),
    signatureStorageKey: text("signature_storage_key"),
    verificationStatus: verificationStatus("verification_status")
      .notNull()
      .default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    visibility: profileVisibility("visibility").notNull().default("hidden"),
    avgResponseMinutes: integer("avg_response_minutes"),
    acceptRate: numeric("accept_rate", { precision: 4, scale: 3 }),
    totalCompleted: integer("total_completed").notNull().default(0),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("supervisor_profiles_user_id_unique").on(table.userId),
    index("supervisor_profiles_visibility_verification_idx").on(
      table.visibility,
      table.verificationStatus
    )
  ]
);

export const superviseeProfiles = pgTable(
  "supervisee_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    displayName: text("display_name").notNull(),
    headline: text("headline"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("supervisee_profiles_user_id_unique").on(table.userId)]
);

export const qualificationEvidenceFiles = pgTable(
  "qualification_evidence_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisorProfileId: uuid("supervisor_profile_id")
      .notNull()
      .references(() => supervisorProfiles.id),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    checksumSha256: text("checksum_sha256"),
    virusScanStatus: virusScanStatus("virus_scan_status").notNull().default("clean"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("qualification_evidence_files_storage_key_unique").on(table.storageKey),
    index("qualification_evidence_files_profile_idx").on(
      table.supervisorProfileId,
      table.uploadedAt
    ),
    check("qualification_evidence_files_size_positive", sql`${table.sizeBytes} > 0`)
  ]
);

export const qualifications = pgTable(
  "qualifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisorProfileId: uuid("supervisor_profile_id")
      .notNull()
      .references(() => supervisorProfiles.id),
    name: text("name").notNull(),
    numberEnc: bytea("number_enc"),
    issuingBody: text("issuing_body"),
    issuedAt: date("issued_at"),
    expiresAt: date("expires_at"),
    evidenceFileId: uuid("evidence_file_id").references(
      () => qualificationEvidenceFiles.id
    ),
    verificationNote: text("verification_note"),
    status: qualificationStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("qualifications_supervisor_profile_status_idx").on(
      table.supervisorProfileId,
      table.status
    )
  ]
);

export const specialtyCatalog = pgTable(
  "specialty_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    labelKo: text("label_ko").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => specialtyCatalog.id),
    displayOrder: integer("display_order"),
    active: boolean("active").notNull().default(true)
  },
  (table) => [uniqueIndex("specialty_catalog_code_unique").on(table.code)]
);

export const supervisorSpecialties = pgTable(
  "supervisor_specialties",
  {
    supervisorProfileId: uuid("supervisor_profile_id")
      .notNull()
      .references(() => supervisorProfiles.id),
    specialtyId: uuid("specialty_id")
      .notNull()
      .references(() => specialtyCatalog.id)
  },
  (table) => [
    primaryKey({
      columns: [table.supervisorProfileId, table.specialtyId]
    }),
    index("supervisor_specialties_specialty_id_idx").on(table.specialtyId)
  ]
);

export const serviceProducts = pgTable(
  "service_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisorProfileId: uuid("supervisor_profile_id")
      .notNull()
      .references(() => supervisorProfiles.id),
    kind: serviceProductKind("kind").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priceKrw: integer("price_krw").notNull(),
    turnaroundHours: integer("turnaround_hours"),
    supervisionType: text("supervision_type").notNull().default("assessment"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("service_products_supervisor_active_idx").on(
      table.supervisorProfileId,
      table.active
    ),
    check(
      "service_products_supervision_type_allowed",
      sql`${table.supervisionType} in ('assessment', 'counseling')`
    )
  ]
);

export const availabilitySlots = pgTable("availability_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  supervisorProfileId: uuid("supervisor_profile_id")
    .notNull()
    .references(() => supervisorProfiles.id),
  weekday: smallint("weekday"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  timezone: text("timezone").notNull().default("Asia/Seoul")
});

export const supervisionRequests = pgTable(
  "supervision_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    superviseeId: uuid("supervisee_id")
      .notNull()
      .references(() => users.id),
    supervisorId: uuid("supervisor_id").references(() => users.id),
    serviceProductId: uuid("service_product_id").references(() => serviceProducts.id),
    status: supervisionStatus("status").notNull().default("draft"),
    retentionDays: integer("retention_days").notNull(),
    retentionExpiresAt: timestamp("retention_expires_at", {
      withTimezone: true
    }),
    urgency: urgency("urgency"),
    desiredDeadline: date("desired_deadline"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("supervision_requests_supervisee_status_idx").on(
      table.superviseeId,
      table.status
    ),
    index("supervision_requests_supervisor_status_idx").on(
      table.supervisorId,
      table.status
    ),
    check(
      "supervision_requests_retention_days_allowed",
      sql`${table.retentionDays} in (7, 30, 90)`
    )
  ]
);

export const casePackets = pgTable(
  "case_packets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    titleEnc: bytea("title_enc").notNull(),
    purpose: jsonb("purpose").$type<string[]>(),
    clientAgeBand: text("client_age_band"),
    clientGender: text("client_gender"),
    setting: text("setting"),
    chiefComplaintEnc: bytea("chief_complaint_enc"),
    referralReasonEnc: bytea("referral_reason_enc"),
    testsUsed: jsonb("tests_used").$type<string[]>(),
    requestItems: jsonb("request_items").$type<string[]>(),
    preferredMethod: preferredMethod("preferred_method"),
    needsCompletionRecord: boolean("needs_completion_record").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check(
      "case_packets_client_age_band_allowed",
      sql`${table.clientAgeBand} is null or ${table.clientAgeBand} in ('6-12', '13-18', '19-39', '40-64', '65+')`
    ),
    check(
      "case_packets_setting_allowed",
      sql`${table.setting} is null or ${table.setting} in ('hospital', 'counseling_center', 'community_center', 'school', 'other')`
    )
  ]
);

export const caseFiles = pgTable(
  "case_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    casePacketId: uuid("case_packet_id")
      .notNull()
      .references(() => casePackets.id),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id),
    kind: caseFileKind("kind").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    parentFileId: uuid("parent_file_id").references((): AnyPgColumn => caseFiles.id),
    versionNo: integer("version_no").notNull().default(1),
    isFinalReturn: boolean("is_final_return").notNull().default(false),
    kmsKeyId: text("kms_key_id"),
    checksumSha256: text("checksum_sha256"),
    virusScanStatus: virusScanStatus("virus_scan_status").notNull().default("pending"),
    phiScanStatus: phiScanStatus("phi_scan_status").notNull().default("pending"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    retentionExpiresAt: timestamp("retention_expires_at", {
      withTimezone: true
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => [
    index("case_files_case_packet_id_idx").on(table.casePacketId),
    index("case_files_retention_expires_at_idx").on(table.retentionExpiresAt),
    index("case_files_parent_file_id_idx").on(table.parentFileId),
    index("case_files_case_packet_version_idx").on(
      table.casePacketId,
      table.originalFilename,
      table.versionNo
    ),
    uniqueIndex("case_files_storage_key_unique").on(table.storageKey),
    check("case_files_version_no_positive", sql`${table.versionNo} > 0`),
    check("case_files_size_positive", sql`${table.sizeBytes} > 0`),
    check(
      "case_files_checksum_sha256_format",
      sql`${table.checksumSha256} is null or ${table.checksumSha256} ~ '^[a-f0-9]{64}$'`
    )
  ]
);

export const caseFilePreviews = pgTable(
  "case_file_previews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseFileId: uuid("case_file_id")
      .notNull()
      .references(() => caseFiles.id),
    status: text("status").notNull().default("pending"),
    previewStorageKey: text("preview_storage_key"),
    previewMimeType: text("preview_mime_type"),
    pageCount: integer("page_count"),
    errorCode: text("error_code"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("case_file_previews_case_file_unique").on(table.caseFileId),
    check(
      "case_file_previews_status_allowed",
      sql`${table.status} in ('pending', 'ready', 'failed')`
    ),
    check(
      "case_file_previews_page_count_positive",
      sql`${table.pageCount} is null or ${table.pageCount} > 0`
    )
  ]
);

export const caseFileAnnotations = pgTable(
  "case_file_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseFileId: uuid("case_file_id")
      .notNull()
      .references(() => caseFiles.id),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    pageNumber: integer("page_number").notNull(),
    xPct: numeric("x_pct", { precision: 6, scale: 3 }).notNull(),
    yPct: numeric("y_pct", { precision: 6, scale: 3 }).notNull(),
    widthPct: numeric("width_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    heightPct: numeric("height_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    bodyEnc: bytea("body_enc").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("case_file_annotations_file_status_idx").on(
      table.caseFileId,
      table.status,
      table.createdAt
    ),
    check(
      "case_file_annotations_status_allowed",
      sql`${table.status} in ('active', 'resolved')`
    ),
    check("case_file_annotations_page_positive", sql`${table.pageNumber} > 0`),
    check(
      "case_file_annotations_bounds",
      sql`${table.xPct} >= 0 and ${table.xPct} <= 100 and ${table.yPct} >= 0 and ${table.yPct} <= 100 and ${table.widthPct} >= 0 and ${table.widthPct} <= 100 and ${table.heightPct} >= 0 and ${table.heightPct} <= 100`
    )
  ]
);

export const deidentificationChecklists = pgTable(
  "deidentification_checklists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    casePacketId: uuid("case_packet_id")
      .notNull()
      .references(() => casePackets.id),
    removedName: boolean("removed_name").notNull(),
    removedRrn: boolean("removed_rrn").notNull(),
    removedPhone: boolean("removed_phone").notNull(),
    removedAddress: boolean("removed_address").notNull(),
    removedGuardianName: boolean("removed_guardian_name").notNull(),
    removedOrgName: boolean("removed_org_name").notNull(),
    removedChartNumber: boolean("removed_chart_number").notNull(),
    filenameSafe: boolean("filename_safe").notNull(),
    rawDataSafe: boolean("raw_data_safe").notNull(),
    minimalInfo: boolean("minimal_info").notNull(),
    clientConsentConfirmed: boolean("client_consent_confirmed").notNull(),
    purposeUnderstood: boolean("purpose_understood").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acknowledgedBy: uuid("acknowledged_by").references(() => users.id)
  },
  (table) => [
    uniqueIndex("deidentification_checklists_case_packet_unique").on(table.casePacketId)
  ]
);

export const termsVersions = pgTable("terms_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: termsKind("kind").notNull(),
  version: text("version").notNull(),
  contentMd: text("content_md"),
  effectiveFrom: date("effective_from"),
  isActive: boolean("is_active").notNull().default(true)
});

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    termsVersionId: uuid("terms_version_id")
      .notNull()
      .references(() => termsVersions.id),
    consentType: consentType("consent_type").notNull(),
    consented: boolean("consented").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent")
  },
  (table) => [
    index("consent_records_user_type_idx").on(table.userId, table.consentType)
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    amountKrw: integer("amount_krw").notNull(),
    platformFeeKrw: integer("platform_fee_krw").notNull(),
    supervisorNetKrw: integer("supervisor_net_krw").notNull(),
    pgProvider: text("pg_provider").notNull().default("toss"),
    pgPaymentKey: text("pg_payment_key"),
    pgOrderId: text("pg_order_id").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("payments_supervision_request_status_idx").on(
      table.supervisionRequestId,
      table.status
    ),
    uniqueIndex("payments_pg_order_id_unique").on(table.pgOrderId),
    uniqueIndex("payments_pg_payment_key_unique")
      .on(table.pgPaymentKey)
      .where(sql`${table.pgPaymentKey} is not null`),
    check("payments_amount_krw_min", sql`${table.amountKrw} >= 1000`),
    check("payments_platform_fee_non_negative", sql`${table.platformFeeKrw} >= 0`),
    check("payments_supervisor_net_non_negative", sql`${table.supervisorNetKrw} >= 0`),
    check(
      "payments_net_matches_amount_minus_fee",
      sql`${table.supervisorNetKrw} = ${table.amountKrw} - ${table.platformFeeKrw}`
    )
  ]
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    amountKrw: integer("amount_krw").notNull(),
    reason: text("reason"),
    initiatedBy: uuid("initiated_by").references(() => users.id),
    status: refundStatus("status").notNull().default("requested"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("refunds_payment_id_idx").on(table.paymentId),
    check("refunds_amount_krw_positive", sql`${table.amountKrw} > 0`)
  ]
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisorId: uuid("supervisor_id")
      .notNull()
      .references(() => users.id),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    grossKrw: integer("gross_krw").notNull(),
    platformFeeKrw: integer("platform_fee_krw").notNull(),
    netKrw: integer("net_krw").notNull(),
    status: payoutStatus("status").notNull().default("scheduled"),
    scheduledAt: date("scheduled_at"),
    paidAt: timestamp("paid_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("payouts_supervisor_period_unique").on(
      table.supervisorId,
      table.periodStart,
      table.periodEnd
    ),
    check("payouts_gross_krw_non_negative", sql`${table.grossKrw} >= 0`),
    check("payouts_platform_fee_krw_non_negative", sql`${table.platformFeeKrw} >= 0`),
    check("payouts_net_krw_non_negative", sql`${table.netKrw} >= 0`)
  ]
);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  supervisionRequestId: uuid("supervision_request_id")
    .notNull()
    .references(() => supervisionRequests.id),
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
  meetingUrlEnc: bytea("meeting_url_enc"),
  status: bookingStatus("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const externalCalendarConnections = pgTable(
  "external_calendar_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisorProfileId: uuid("supervisor_profile_id")
      .notNull()
      .references(() => supervisorProfiles.id),
    provider: text("provider").notNull().default("google"),
    providerAccountEmail: text("provider_account_email"),
    calendarId: text("calendar_id").notNull().default("primary"),
    accessTokenEnc: bytea("access_token_enc").notNull(),
    refreshTokenEnc: bytea("refresh_token_enc").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true
    }),
    syncStatus: text("sync_status").notNull().default("connected"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    disconnectedAt: timestamp("disconnected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("external_calendar_connections_profile_provider_unique").on(
      table.supervisorProfileId,
      table.provider
    ),
    index("external_calendar_connections_profile_status_idx").on(
      table.supervisorProfileId,
      table.syncStatus
    ),
    check(
      "external_calendar_connections_provider_google",
      sql`${table.provider} = 'google'`
    ),
    check(
      "external_calendar_connections_status_allowed",
      sql`${table.syncStatus} in ('connected', 'needs_reauth', 'error', 'disconnected')`
    )
  ]
);

export const externalCalendarEvents = pgTable(
  "external_calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    provider: text("provider").notNull().default("google"),
    providerEventId: text("provider_event_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("external_calendar_events_booking_provider_unique").on(
      table.bookingId,
      table.provider
    ),
    uniqueIndex("external_calendar_events_provider_event_unique").on(
      table.provider,
      table.providerEventId
    ),
    check("external_calendar_events_provider_google", sql`${table.provider} = 'google'`)
  ]
);

export const feedbacks = pgTable(
  "feedbacks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    supervisorId: uuid("supervisor_id")
      .notNull()
      .references(() => users.id),
    summaryEnc: bytea("summary_enc"),
    recommendationsEnc: bytea("recommendations_enc"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("feedbacks_supervision_request_unique").on(table.supervisionRequestId)
  ]
);

export const inlineComments = pgTable("inline_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .notNull()
    .references(() => feedbacks.id),
  targetFileId: uuid("target_file_id").references(() => caseFiles.id),
  anchor: jsonb("anchor").$type<{
    page?: number;
    paragraph?: string;
    charRange?: [number, number];
  }>(),
  commentEnc: bytea("comment_enc"),
  severity: commentSeverity("severity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const completionRecords = pgTable(
  "completion_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    recordNo: text("record_no").notNull(),
    supervisorId: uuid("supervisor_id")
      .notNull()
      .references(() => users.id),
    superviseeId: uuid("supervisee_id")
      .notNull()
      .references(() => users.id),
    supervisorQualificationSnapshot: jsonb("supervisor_qualification_snapshot"),
    reviewedMaterials: jsonb("reviewed_materials"),
    scope: jsonb("scope"),
    limitationsEnc: bytea("limitations_enc"),
    responsibilityNotice: text("responsibility_notice"),
    signatureStorageKey: text("signature_storage_key"),
    signatureAttachedAt: timestamp("signature_attached_at", {
      withTimezone: true
    }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    pdfStorageKey: text("pdf_storage_key")
  },
  (table) => [
    uniqueIndex("completion_records_request_unique").on(table.supervisionRequestId),
    uniqueIndex("completion_records_record_no_unique").on(table.recordNo)
  ]
);

export const documentReviewCycles = pgTable(
  "document_review_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    targetFileId: uuid("target_file_id").references(() => caseFiles.id),
    status: text("status").notNull(),
    noteEnc: bytea("note_enc"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true })
  },
  (table) => [
    index("document_review_cycles_request_status_idx").on(
      table.supervisionRequestId,
      table.status,
      table.createdAt
    ),
    index("document_review_cycles_target_file_idx").on(table.targetFileId),
    check(
      "document_review_cycles_status_allowed",
      sql`${table.status} in ('revision_requested', 'revision_uploaded', 'feedback_approved', 'stamped_returned')`
    )
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supervisionRequestId: uuid("supervision_request_id")
      .notNull()
      .references(() => supervisionRequests.id),
    supervisorId: uuid("supervisor_id")
      .notNull()
      .references(() => users.id),
    superviseeId: uuid("supervisee_id")
      .notNull()
      .references(() => users.id),
    expertise: smallint("expertise"),
    specificity: smallint("specificity"),
    helpfulness: smallint("helpfulness"),
    ethics: smallint("ethics"),
    responseSpeed: smallint("response_speed"),
    onTime: smallint("on_time"),
    educational: smallint("educational"),
    reuseIntent: smallint("reuse_intent"),
    freeText: text("free_text"),
    status: reviewStatus("status").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("reviews_supervision_request_unique").on(table.supervisionRequestId)
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("notifications_user_created_idx").on(table.userId, table.createdAt)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id"),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    reason: text("reason"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("audit_logs_actor_created_at_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_target_idx").on(table.targetType, table.targetId)
  ]
);

export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    fileId: uuid("file_id").notNull(),
    action: fileAccessAction("action").notNull(),
    ipAddress: text("ip_address"),
    signedUrlId: text("signed_url_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("access_logs_file_created_at_idx").on(table.fileId, table.createdAt)
  ]
);

export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  supervisionRequestId: uuid("supervision_request_id")
    .notNull()
    .references(() => supervisionRequests.id),
  raisedBy: uuid("raised_by")
    .notNull()
    .references(() => users.id),
  reason: text("reason"),
  descriptionEnc: bytea("description_enc"),
  status: disputeStatus("status").notNull().default("open"),
  resolutionNote: text("resolution_note"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id"),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  reason: text("reason"),
  description: text("description"),
  status: reportStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const deletionRequests = pgTable("deletion_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestedBy: uuid("requested_by"),
  targetType: deletionTargetType("target_type"),
  targetId: uuid("target_id"),
  reason: text("reason"),
  status: deletionStatus("status").notNull().default("pending"),
  processedBy: uuid("processed_by"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SupervisionRequest = typeof supervisionRequests.$inferSelect;
export type CasePacket = typeof casePackets.$inferSelect;
export type CaseFile = typeof caseFiles.$inferSelect;
