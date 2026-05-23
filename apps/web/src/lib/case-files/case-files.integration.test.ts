import { mkdtemp, rm } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PGlite } from "@electric-sql/pglite";
import { files } from "@csp/db";
import { getStorageAdapter } from "@csp/shared/storage";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "../auth/current-user";

const migrations = [
  "packages/db/drizzle/0000_initial_schema.sql",
  "packages/db/drizzle/0001_rls_policies.sql",
  "packages/db/drizzle/0002_app_role_and_fixes.sql",
  "packages/db/drizzle/0003_default_privileges.sql",
  "packages/db/drizzle/0004_auth_columns.sql",
  "packages/db/drizzle/0005_auth_tokens.sql",
  "packages/db/drizzle/0006_totp_recovery_codes.sql",
  "packages/db/drizzle/0007_specialty_catalog_seed.sql",
  "packages/db/drizzle/0008_profile_constraints.sql",
  "packages/db/drizzle/0009_supervision_request_constraints.sql",
  "packages/db/drizzle/0010_payments_constraints.sql",
  "packages/db/drizzle/0011_critical_path.sql",
  "packages/db/drizzle/0012_case_files_security.sql",
  "packages/db/drizzle/0013_document_workspace.sql"
] as const;

const superviseeId = "50000000-0000-4000-8000-000000000001";
const otherSuperviseeId = "50000000-0000-4000-8000-000000000002";
const supervisorId = "50000000-0000-4000-8000-000000000003";
const adminId = "50000000-0000-4000-8000-000000000004";
const productId = "50000000-0000-4000-8000-000000000101";
const requestId = "50000000-0000-4000-8000-000000000201";
const packetId = "50000000-0000-4000-8000-000000000202";
const adminReason = "Administrative file download reason with at least thirty chars";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;
let storageDir: string;

beforeEach(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  storageDir = await mkdtemp(join(tmpdir(), "csp-case-files-"));
  process.env["LOCAL_STORAGE_DIR"] = storageDir;
  process.env["LOCAL_STORAGE_SECRET"] = "test-local-storage-secret";
  await applyMigrations();
  await seedDomain();
});

afterEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env["LOCAL_STORAGE_DIR"];
  delete process.env["LOCAL_STORAGE_SECRET"];
  await pg.close();
  await rm(storageDir, { force: true, recursive: true });
});

describe("case file integration", () => {
  it("uploads, registers, lists, and downloads a clean text file with watermark", async () => {
    const prepared = await prepareUpload(currentUser(superviseeId, "supervisee"), {
      requestId,
      filename: "report.txt",
      contentType: "text/plain",
      sizeBytes: 18,
      kind: "report_draft"
    });

    const token = String(prepared.data?.url).split("/").pop() ?? "";
    const uploadResponse = await callLocalUpload(token, "clean case content");
    expect(uploadResponse.status).toBe(200);

    const registered = await registerFile(currentUser(superviseeId, "supervisee"), {
      requestId,
      uploadKey: String(prepared.data?.uploadKey),
      kind: "report_draft",
      originalFilename: "report.txt",
      mimeType: "text/plain",
      sizeBytes: 18
    });
    expect(registered.status).toBe(200);
    const registeredBody = (await registered.json()) as RegisterEnvelope;
    const fileId = registeredBody.data?.file.id ?? "";

    const listResponse = await listFiles(currentUser(superviseeId, "supervisee"));
    const listBody = (await listResponse.json()) as ListEnvelope;
    expect(listResponse.status).toBe(200);
    expect(listBody.data?.files).toHaveLength(1);

    const downloadUrl = await createDownloadUrl(
      currentUser(superviseeId, "supervisee"),
      fileId
    );
    const downloadBody = (await downloadUrl.json()) as DownloadEnvelope;
    expect(downloadUrl.status).toBe(200);

    const signedToken = String(downloadBody.data?.download.url).split("/").pop() ?? "";
    const signedResponse = await callSignedDownload(signedToken);
    expect(signedResponse.status).toBe(200);
    expect(await signedResponse.text()).toContain("[ClinicFlow watermark]");

    const logCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count from access_logs where file_id = ${fileId}
    `);
    expect(rowsOf(logCount)[0]?.count).toBeGreaterThanOrEqual(2);
  });

  it("keeps admin reason out of signed download tokens and stores it in audit logs", async () => {
    const prepared = await prepareUpload(currentUser(superviseeId, "supervisee"), {
      requestId,
      filename: "admin-report.txt",
      contentType: "text/plain",
      sizeBytes: 18,
      kind: "report_draft"
    });
    const uploadToken = String(prepared.data?.url).split("/").pop() ?? "";
    await callLocalUpload(uploadToken, "clean case content");
    const registered = await registerFile(currentUser(superviseeId, "supervisee"), {
      requestId,
      uploadKey: String(prepared.data?.uploadKey),
      kind: "report_draft",
      originalFilename: "admin-report.txt",
      mimeType: "text/plain",
      sizeBytes: 18
    });
    const registeredBody = (await registered.json()) as RegisterEnvelope;
    const fileId = registeredBody.data?.file.id ?? "";

    const downloadUrl = await createDownloadUrl(currentUser(adminId, "admin"), fileId, {
      "x-admin-reason": adminReason
    });
    const downloadBody = (await downloadUrl.json()) as DownloadEnvelope;
    const signedToken = String(downloadBody.data?.download.url).split("/").pop() ?? "";
    const tokenBody = decodeTokenBody(signedToken);

    expect(downloadUrl.status).toBe(200);
    expect(JSON.stringify(tokenBody)).not.toContain(adminReason);

    const signedResponse = await callSignedDownload(signedToken);
    expect(signedResponse.status).toBe(200);

    const auditRows = rowsOf<{ reason: string | null }>(
      await db.execute(sql`
        select reason
        from audit_logs
        where action = 'signed_url_issue'
          and target_id = ${fileId}
          and context ->> 'signedUrlId' = ${String(downloadBody.data?.download.signedUrlId)}
      `)
    );
    expect(auditRows[0]?.reason).toBe(adminReason);
  });

  it("accepts original text files containing identifiers and records suspicious scan status", async () => {
    const phiContent = "010-1234-5678";
    const phiSize = new TextEncoder().encode(phiContent).byteLength;
    const prepared = await prepareUpload(currentUser(superviseeId, "supervisee"), {
      requestId,
      filename: "010-1234-5678.txt",
      contentType: "text/plain",
      sizeBytes: phiSize,
      kind: "report_draft"
    });
    const token = String(prepared.data?.url).split("/").pop() ?? "";
    await callLocalUpload(token, phiContent);

    const response = await registerFile(currentUser(superviseeId, "supervisee"), {
      requestId,
      uploadKey: String(prepared.data?.uploadKey),
      kind: "report_draft",
      originalFilename: "010-1234-5678.txt",
      mimeType: "text/plain",
      sizeBytes: phiSize
    });
    const body = (await response.json()) as RegisterEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.file.phiScanStatus).toBe("suspicious");
  });

  it("issues upload URLs for supported PDF evidence", async () => {
    const response = await prepareUploadResponse(
      currentUser(superviseeId, "supervisee"),
      {
        requestId,
        filename: "report.pdf",
        contentType: "application/pdf",
        sizeBytes: 24,
        kind: "report_draft"
      }
    );
    const body = (await response.json()) as UploadEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.url).toContain("/api/case-files/local-upload/");
  });

  it("accepts supported binary evidence at the local upload endpoint", async () => {
    const token = signTestUploadToken({
      kind: "upload",
      uploadKey: "case_file/50000000-0000-4000-8000-000000009999-report.pdf",
      exp: Date.now() + 60_000,
      signedUrlId: "50000000-0000-4000-8000-000000009998",
      filename: "report.pdf",
      contentType: "application/pdf",
      maxBytes: 1024
    });
    const response = await callLocalUpload(token, "%PDF-1.7");
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(200);
    expect(body.error).toBeNull();
  });

  it("rejects risky file metadata during registration", async () => {
    const prepared = await prepareUpload(currentUser(superviseeId, "supervisee"), {
      requestId,
      filename: "report.txt",
      contentType: "text/plain",
      sizeBytes: 18,
      kind: "report_draft"
    });
    const uploadToken = String(prepared.data?.url).split("/").pop() ?? "";
    await callLocalUpload(uploadToken, "clean case content");

    const response = await registerFile(currentUser(superviseeId, "supervisee"), {
      requestId,
      uploadKey: String(prepared.data?.uploadKey),
      kind: "report_draft",
      originalFilename: "installer.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 18
    });
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(422);
    expect(body.error?.code).toBe("unsupported_file_type");
  });

  it("keeps another supervisee from listing files on the request", async () => {
    const response = await listFiles(currentUser(otherSuperviseeId, "supervisee"));
    const body = (await response.json()) as ListEnvelope;

    expect(response.status).toBe(200);
    expect(body.data?.files).toHaveLength(0);
  });

  it("purges expired files from storage and marks the row deleted", async () => {
    const prepared = await prepareUpload(currentUser(superviseeId, "supervisee"), {
      requestId,
      filename: "expired.txt",
      contentType: "text/plain",
      sizeBytes: 15,
      kind: "report_draft"
    });
    const token = String(prepared.data?.url).split("/").pop() ?? "";
    await callLocalUpload(token, "expired content");

    const registered = await registerFile(currentUser(superviseeId, "supervisee"), {
      requestId,
      uploadKey: String(prepared.data?.uploadKey),
      kind: "report_draft",
      originalFilename: "expired.txt",
      mimeType: "text/plain",
      sizeBytes: 15
    });
    const registeredBody = (await registered.json()) as RegisterEnvelope;
    const fileId = registeredBody.data?.file.id ?? "";

    await db.execute(sql`
      update case_files
      set retention_expires_at = now() - interval '1 day'
      where id = ${fileId}
    `);

    const expired = await files.listExpiredCaseFiles(db);
    expect(expired.map((file) => file.id)).toContain(fileId);

    await getStorageAdapter().deleteObject(expired[0]?.storageKey ?? "");
    const purged = await files.markExpiredCaseFileDeleted(db, fileId);

    expect(purged?.deletedAt).toBeTruthy();
    expect(
      await getStorageAdapter().commitUpload(String(prepared.data?.uploadKey))
    ).toBeNull();
  });

  it("groups files that need retention warnings by supervision request", async () => {
    const first = await files.createCaseFile(db, {
      checksumSha256: "a".repeat(64),
      kind: "report_draft",
      mimeType: "text/plain",
      originalFilename: "warning-a.txt",
      phiScanStatus: "clean",
      requestId,
      sizeBytes: 10,
      storageKey: "case_file/warning-a.txt",
      uploadedBy: superviseeId,
      virusScanStatus: "clean"
    });
    const second = await files.createCaseFile(db, {
      checksumSha256: "b".repeat(64),
      kind: "test_result",
      mimeType: "text/plain",
      originalFilename: "warning-b.txt",
      phiScanStatus: "clean",
      requestId,
      sizeBytes: 11,
      storageKey: "case_file/warning-b.txt",
      uploadedBy: superviseeId,
      virusScanStatus: "clean"
    });
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();

    await db.execute(sql`
      update case_files
      set retention_expires_at = now() + interval '2 days'
      where id in (${first?.id ?? ""}, ${second?.id ?? ""})
    `);

    const targets = await files.listRetentionWarningTargets(db, {
      from: new Date(Date.now() - 60_000),
      to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });

    expect(targets).toEqual([
      expect.objectContaining({
        fileCount: 2,
        requestId,
        superviseeId,
        supervisorId
      })
    ]);
  });

  it("records revision request, revision upload, and feedback approval review cycles", async () => {
    const draft = await files.createCaseFile(db, {
      requestId,
      uploadedBy: superviseeId,
      kind: "report_draft",
      originalFilename: "draft.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 128,
      storageKey: "case_file/draft.docx",
      checksumSha256: "d".repeat(64),
      virusScanStatus: "clean",
      phiScanStatus: "pending"
    });
    expect(draft).toBeTruthy();

    const revisionRequest = await files.createDocumentReviewCycle(db, {
      supervisionRequestId: requestId,
      actorUserId: supervisorId,
      targetFileId: draft?.id ?? null,
      status: "revision_requested"
    });
    expect(revisionRequest?.status).toBe("revision_requested");

    const revision = await files.createCaseFile(db, {
      requestId,
      uploadedBy: superviseeId,
      kind: "direct_edit_revision",
      originalFilename: "draft-revision.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 160,
      storageKey: "case_file/draft-revision.docx",
      checksumSha256: "e".repeat(64),
      virusScanStatus: "clean",
      phiScanStatus: "pending",
      parentFileId: draft?.id ?? null
    });
    expect(revision?.parentFileId).toBe(draft?.id);

    const revisionUploaded = await files.createDocumentReviewCycle(db, {
      supervisionRequestId: requestId,
      actorUserId: superviseeId,
      targetFileId: revision?.id ?? null,
      status: "revision_uploaded",
      completed: true
    });
    expect(revisionUploaded?.completedAt).toBeTruthy();

    const approved = await files.createDocumentReviewCycle(db, {
      supervisionRequestId: requestId,
      actorUserId: supervisorId,
      targetFileId: revision?.id ?? null,
      status: "feedback_approved"
    });
    expect(approved?.status).toBe("feedback_approved");
  });

  it("schedules completed raw case files for purge seven days after stamped completion", async () => {
    const raw = await files.createCaseFile(db, {
      requestId,
      uploadedBy: superviseeId,
      kind: "test_result",
      originalFilename: "raw-result.pdf",
      mimeType: "application/pdf",
      sizeBytes: 256,
      storageKey: "case_file/raw-result.pdf",
      checksumSha256: "a".repeat(64),
      virusScanStatus: "clean",
      phiScanStatus: "pending"
    });
    const stamped = await files.createCaseFile(db, {
      requestId,
      uploadedBy: supervisorId,
      kind: "direct_edit_revision",
      originalFilename: "stamped-return.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      storageKey: "case_file/stamped-return.pdf",
      checksumSha256: "b".repeat(64),
      virusScanStatus: "clean",
      phiScanStatus: "pending",
      parentFileId: raw?.id ?? null,
      isFinalReturn: true
    });

    expect(stamped?.isFinalReturn).toBe(true);
    await db.execute(sql`
      update case_files
      set retention_expires_at = null
      where id in (${raw?.id ?? ""}, ${stamped?.id ?? ""})
    `);
    expect(await files.scheduleRawCaseFilesForCompletedPurge(db, requestId)).toBe(1);

    const scheduled = await files.getCaseFile(db, raw?.id ?? "");
    const finalReturn = await files.getCaseFile(db, stamped?.id ?? "");
    expect(scheduled?.retentionExpiresAt).toBeTruthy();
    expect(finalReturn?.retentionExpiresAt).toBeNull();
  });
});

async function prepareUpload(
  current: CurrentUser,
  body: unknown
): Promise<UploadEnvelope> {
  const response = await prepareUploadResponse(current, body);
  return (await response.json()) as UploadEnvelope;
}

async function prepareUploadResponse(
  current: CurrentUser,
  body: unknown
): Promise<Response> {
  mockRuntime(current);
  const { POST } = await import("../../app/api/case-files/upload-url/route");
  return POST(jsonRequest(body, "POST"));
}

async function callLocalUpload(token: string, body: string): Promise<Response> {
  const { PUT } = await import("../../app/api/case-files/local-upload/[token]/route");
  return PUT(
    new NextRequest(`http://localhost/api/case-files/local-upload/${token}`, {
      method: "PUT",
      body
    }),
    { params: Promise.resolve({ token }) }
  );
}

async function registerFile(current: CurrentUser, body: unknown): Promise<Response> {
  mockRuntime(current);
  const { POST } = await import("../../app/api/case-files/route");
  return POST(jsonRequest(body, "POST"));
}

async function listFiles(current: CurrentUser): Promise<Response> {
  mockRuntime(current);
  const { GET } = await import("../../app/api/case-files/route");
  return GET(
    new NextRequest(`http://localhost/api/case-files?requestId=${requestId}`, {
      method: "GET"
    })
  );
}

async function createDownloadUrl(
  current: CurrentUser,
  fileId: string,
  headers: Record<string, string> = {}
): Promise<Response> {
  mockRuntime(current);
  const { GET } = await import("../../app/api/case-files/[id]/download-url/route");
  return GET(
    new NextRequest(`http://localhost/api/case-files/${fileId}/download-url`, {
      headers
    }),
    {
      params: Promise.resolve({ id: fileId })
    }
  );
}

async function callSignedDownload(token: string): Promise<Response> {
  const { GET } = await import("../../app/api/case-files/signed/[token]/route");
  return GET(new NextRequest(`http://localhost/api/case-files/signed/${token}`), {
    params: Promise.resolve({ token })
  });
}

function mockRuntime(current: CurrentUser): void {
  vi.resetModules();
  vi.doMock("@/lib/auth/current-user", () => ({
    getCurrentUser: () => Promise.resolve(current)
  }));
  vi.doMock("@/lib/auth/database", () => ({
    createRuntimeDatabase: () => db
  }));
}

function jsonRequest(body: unknown, method: string): NextRequest {
  return new NextRequest("http://localhost/api/case-files", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function currentUser(
  userId: string,
  role: "supervisee" | "supervisor" | "admin"
): CurrentUser {
  return {
    session: {
      userId,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
      sessionId: "test"
    },
    user: {
      id: userId,
      email: `${role}@example.com`,
      role,
      status: "active",
      totpSecretEnc: null,
      totpEnabled: role === "admin",
      passwordChangedAt: null
    }
  };
}

async function applyMigrations(): Promise<void> {
  for (const migration of migrations) {
    const source = readFileSync(migration, "utf8").replace(
      /CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint\n?/u,
      ""
    );
    const statements = source
      .split(/--> statement-breakpoint/g)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pg.query(statement);
    }
  }
}

async function seedDomain(): Promise<void> {
  await db.execute(sql`
    insert into users (id, email, role, password_hash, totp_enabled)
    values
      (${superviseeId}, 'supervisee-files@example.com', 'supervisee', 'hash', false),
      (${otherSuperviseeId}, 'other-files@example.com', 'supervisee', 'hash', false),
      (${supervisorId}, 'supervisor-files@example.com', 'supervisor', 'hash', true),
      (${adminId}, 'admin-files@example.com', 'admin', 'hash', true)
  `);
  await db.execute(sql`
    insert into supervisor_profiles (id, user_id, display_name, verification_status, visibility)
    values (
      '50000000-0000-4000-8000-000000000100',
      ${supervisorId},
      '파일 슈퍼바이저',
      'approved',
      'public'
    )
  `);
  await db.execute(sql`
    insert into service_products (id, supervisor_profile_id, kind, title, price_krw, active)
    values (
      ${productId},
      '50000000-0000-4000-8000-000000000100',
      'async_comment',
      '파일 검토',
      120000,
      true
    )
  `);
  await db.execute(sql`
    insert into supervision_requests (
      id,
      supervisee_id,
      supervisor_id,
      service_product_id,
      status,
      retention_days,
      retention_expires_at
    ) values (
      ${requestId},
      ${superviseeId},
      ${supervisorId},
      ${productId},
      'draft',
      30,
      now() + interval '30 days'
    )
  `);
  await db.execute(sql`
    insert into case_packets (id, supervision_request_id, title_enc)
    values (${packetId}, ${requestId}, decode('00', 'hex'))
  `);
}

function rowsOf<TRow>(result: TRow[] | { rows: TRow[] }): TRow[] {
  return Array.isArray(result) ? result : result.rows;
}

function decodeTokenBody(token: string): Record<string, unknown> {
  const body = token.split(".")[0] ?? "";
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
}

function signTestUploadToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env["LOCAL_STORAGE_SECRET"] ?? "")
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

type ApiEnvelope = {
  data?: unknown;
  error?: { code: string };
};

type UploadEnvelope = {
  data?: { url: string; uploadKey: string; contentType: string };
  error?: { code: string };
};

type RegisterEnvelope = {
  data?: { file: { id: string; phiScanStatus?: string } };
  error?: { code: string };
};

type ListEnvelope = {
  data?: { files: Array<{ id: string }> };
  error?: { code: string };
};

type DownloadEnvelope = {
  data?: { download: { url: string; signedUrlId: string } };
  error?: { code: string };
};
