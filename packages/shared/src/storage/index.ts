import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { TextDecoder } from "node:util";
import { detectPhi, type PhiDetection } from "../supervision/phi-regex";

export const allowedCaseFileMimeTypes = [
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/x-hwp",
  "application/haansofthwp",
  "application/vnd.hancom.hwp",
  "application/haansofthwpx",
  "application/vnd.hancom.hwpx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
] as const;

export type AllowedCaseFileMimeType = (typeof allowedCaseFileMimeTypes)[number];

export const allowedCaseFileExtensions = [
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".csv",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".hwp",
  ".hwpx",
  ".docx",
  ".xlsx"
] as const;

export const unsupportedCaseFileTypeCode = "unsupported_file_type";
export const unsupportedFileTypePendingScanCode = unsupportedCaseFileTypeCode;

type FilePolicyAllowed = {
  allowed: true;
  filename: string;
  extension: (typeof allowedCaseFileExtensions)[number];
  contentType: AllowedCaseFileMimeType;
};

type FilePolicyBlocked = {
  allowed: false;
  code: typeof unsupportedFileTypePendingScanCode;
  reason: "extension_not_allowed" | "mime_not_allowed" | "mime_extension_mismatch";
  filename: string;
  extension: string | null;
  contentType: string;
};

export type CaseFileUploadPolicyResult = FilePolicyAllowed | FilePolicyBlocked;

export type PrepareUploadInput = {
  filename: string;
  contentType: string;
  purpose: "qualification_evidence" | "case_file";
  maxBytes?: number;
};

export type PreparedUpload = {
  uploadKey: string;
  method: "PUT";
  url: string;
  expiresAt: Date;
  signedUrlId: string;
};

export type PreparedDownload = {
  method: "GET";
  url: string;
  expiresAt: Date;
  signedUrlId: string;
};

export type StoredObject = {
  uploadKey: string;
  bytes: Uint8Array;
  sizeBytes: number;
  checksumSha256: string;
};

export type StorageScanResult = {
  virusScanStatus: "clean" | "infected" | "error";
  phiScanStatus: "clean" | "pending" | "suspicious";
  detections: PhiDetection[];
  warnings: string[];
};

export type StorageAdapter = {
  prepareUpload: (input: PrepareUploadInput) => Promise<PreparedUpload>;
  writeUploadToken: (token: string, bytes: Uint8Array) => Promise<StoredObject>;
  commitUpload: (uploadKey: string) => Promise<StoredObject | null>;
  prepareDownload: (input: {
    fileId: string;
    uploadKey: string;
    filename: string;
    contentType: string;
    actorUserId: string;
    actorRole: string;
    watermark: string;
  }) => Promise<PreparedDownload>;
  readDownloadToken: (
    token: string
  ) => Promise<{ object: StoredObject; payload: StorageTokenPayload } | null>;
  deleteObject: (uploadKey: string) => Promise<void>;
};

export type StorageMode = "local" | "supabase" | "s3";

export type StorageFactoryEnv = {
  [key: string]: string | undefined;
};

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export type StorageTokenPayload = {
  kind: "upload" | "download";
  fileId?: string;
  uploadKey: string;
  exp: number;
  signedUrlId: string;
  filename?: string;
  contentType?: string;
  maxBytes?: number;
  actorUserId?: string;
  actorRole?: string;
  watermark?: string;
};

const defaultMaxBytes = 25 * 1024 * 1024;
const uploadTtlMs = 10 * 60 * 1000;
const downloadTtlMs = 15 * 60 * 1000;

type StorageAdapterOptions = {
  fetch?: FetchLike;
  publicBaseUrl?: string;
};

export class LocalStorageAdapter implements StorageAdapter {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(input: { rootDir?: string; publicBaseUrl?: string } = {}) {
    this.rootDir = resolve(
      input.rootDir ?? process.env["LOCAL_STORAGE_DIR"] ?? "dev-data/storage"
    );
    this.publicBaseUrl =
      input.publicBaseUrl ?? process.env["LOCAL_STORAGE_BASE_URL"] ?? "";
  }

  prepareUpload(input: PrepareUploadInput): Promise<PreparedUpload> {
    assertAllowedCaseFileUpload(input);
    return Promise.resolve(prepareSignedUpload(input, this.publicBaseUrl));
  }

  async writeUploadToken(token: string, bytes: Uint8Array): Promise<StoredObject> {
    const payload = verifyWritableUploadToken(token, bytes);
    return this.writeObject(payload.uploadKey, bytes);
  }

  async commitUpload(uploadKey: string): Promise<StoredObject | null> {
    if (!isSafeUploadKey(uploadKey)) return null;
    const path = this.pathFor(uploadKey);
    try {
      const [bytes, info] = await Promise.all([readFile(path), stat(path)]);
      return {
        uploadKey,
        bytes,
        sizeBytes: info.size,
        checksumSha256: sha256Hex(bytes)
      };
    } catch {
      return null;
    }
  }

  prepareDownload(input: {
    fileId: string;
    uploadKey: string;
    filename: string;
    contentType: string;
    actorUserId: string;
    actorRole: string;
    watermark: string;
  }): Promise<PreparedDownload> {
    return Promise.resolve(prepareSignedDownload(input, this.publicBaseUrl));
  }

  async readDownloadToken(
    token: string
  ): Promise<{ object: StoredObject; payload: StorageTokenPayload } | null> {
    const payload = verifyStorageToken(token, "download");
    if (!payload) return null;
    const object = await this.commitUpload(payload.uploadKey);
    if (!object) return null;
    return { object, payload };
  }

  async deleteObject(uploadKey: string): Promise<void> {
    if (!isSafeUploadKey(uploadKey)) return;
    await rm(this.pathFor(uploadKey), { force: true });
  }

  private async writeObject(
    uploadKey: string,
    bytes: Uint8Array
  ): Promise<StoredObject> {
    if (!isSafeUploadKey(uploadKey)) {
      throw new StorageTokenError("invalid_upload_key");
    }
    const path = this.pathFor(uploadKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
    return {
      uploadKey,
      bytes,
      sizeBytes: bytes.byteLength,
      checksumSha256: sha256Hex(bytes)
    };
  }

  private pathFor(uploadKey: string): string {
    return join(this.rootDir, uploadKey);
  }
}

export class DevStorageAdapter extends LocalStorageAdapter {}

export class StorageTokenError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export class StorageConfigurationError extends Error {
  readonly code = "storage_configuration_error";

  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export class RemoteStorageError extends Error {
  constructor(
    readonly code: string,
    message = code
  ) {
    super(message);
  }
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;
  private readonly bucket: string;
  private readonly serviceRoleKey: string;
  private readonly publicBaseUrl: string;

  constructor(input: {
    supabaseUrl: string;
    serviceRoleKey: string;
    bucket: string;
    publicBaseUrl?: string;
    fetch?: FetchLike;
  }) {
    if (!input.supabaseUrl || !input.serviceRoleKey || !input.bucket) {
      throw new StorageConfigurationError(
        "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET are required for STORAGE_MODE=supabase"
      );
    }
    this.baseUrl = input.supabaseUrl.replace(/\/$/u, "");
    this.bucket = input.bucket;
    this.serviceRoleKey = input.serviceRoleKey;
    this.fetchImpl = input.fetch ?? fetch;
    this.publicBaseUrl = input.publicBaseUrl ?? "";
  }

  prepareUpload(input: PrepareUploadInput): Promise<PreparedUpload> {
    assertAllowedCaseFileUpload(input);
    return Promise.resolve(prepareSignedUpload(input, this.publicBaseUrl));
  }

  async writeUploadToken(token: string, bytes: Uint8Array): Promise<StoredObject> {
    const payload = verifyWritableUploadToken(token, bytes);
    const response = await this.fetchImpl(this.objectUrl(payload.uploadKey), {
      method: "PUT",
      headers: {
        ...this.authHeaders(),
        "content-type": payload.contentType ?? "application/octet-stream",
        "x-upsert": "true"
      },
      body: Buffer.from(bytes)
    });
    await assertRemoteOk(response, "storage_upload_failed");
    return storedObject(payload.uploadKey, bytes);
  }

  async commitUpload(uploadKey: string): Promise<StoredObject | null> {
    if (!isSafeUploadKey(uploadKey)) return null;
    const response = await this.fetchImpl(this.objectUrl(uploadKey), {
      method: "GET",
      headers: this.authHeaders()
    });
    if (response.status === 404) return null;
    await assertRemoteOk(response, "storage_read_failed");
    const bytes = new Uint8Array(await response.arrayBuffer());
    return storedObject(uploadKey, bytes);
  }

  prepareDownload(input: {
    fileId: string;
    uploadKey: string;
    filename: string;
    contentType: string;
    actorUserId: string;
    actorRole: string;
    watermark: string;
  }): Promise<PreparedDownload> {
    return Promise.resolve(prepareSignedDownload(input, this.publicBaseUrl));
  }

  async readDownloadToken(
    token: string
  ): Promise<{ object: StoredObject; payload: StorageTokenPayload } | null> {
    const payload = verifyStorageToken(token, "download");
    if (!payload) return null;
    const object = await this.commitUpload(payload.uploadKey);
    if (!object) return null;
    return { object, payload };
  }

  async deleteObject(uploadKey: string): Promise<void> {
    if (!isSafeUploadKey(uploadKey)) return;
    const response = await this.fetchImpl(this.objectUrl(uploadKey), {
      method: "DELETE",
      headers: this.authHeaders()
    });
    if (response.status === 404) return;
    await assertRemoteOk(response, "storage_delete_failed");
  }

  private objectUrl(uploadKey: string): string {
    return `${this.baseUrl}/storage/v1/object/${encodePath(this.bucket)}/${encodePath(uploadKey)}`;
  }

  private authHeaders(): Record<string, string> {
    return {
      authorization: `Bearer ${this.serviceRoleKey}`,
      apikey: this.serviceRoleKey
    };
  }
}

export class S3StorageAdapter implements StorageAdapter {
  private readonly fetchImpl: FetchLike;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly publicBaseUrl: string;

  constructor(input: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    publicBaseUrl?: string;
    fetch?: FetchLike;
  }) {
    if (
      !input.bucket ||
      !input.region ||
      !input.accessKeyId ||
      !input.secretAccessKey
    ) {
      throw new StorageConfigurationError(
        "S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required for STORAGE_MODE=s3"
      );
    }
    this.bucket = input.bucket;
    this.region = input.region;
    this.accessKeyId = input.accessKeyId;
    this.secretAccessKey = input.secretAccessKey;
    this.endpoint =
      input.endpoint?.replace(/\/$/u, "") ??
      `https://${input.bucket}.s3.${input.region}.amazonaws.com`;
    this.fetchImpl = input.fetch ?? fetch;
    this.publicBaseUrl = input.publicBaseUrl ?? "";
  }

  prepareUpload(input: PrepareUploadInput): Promise<PreparedUpload> {
    assertAllowedCaseFileUpload(input);
    return Promise.resolve(prepareSignedUpload(input, this.publicBaseUrl));
  }

  async writeUploadToken(token: string, bytes: Uint8Array): Promise<StoredObject> {
    const payload = verifyWritableUploadToken(token, bytes);
    const url = this.objectUrl(payload.uploadKey);
    const headers = this.signRequest("PUT", url, bytes, {
      "content-type": payload.contentType ?? "application/octet-stream"
    });
    const response = await this.fetchImpl(url, {
      method: "PUT",
      headers,
      body: Buffer.from(bytes)
    });
    await assertRemoteOk(response, "storage_upload_failed");
    return storedObject(payload.uploadKey, bytes);
  }

  async commitUpload(uploadKey: string): Promise<StoredObject | null> {
    if (!isSafeUploadKey(uploadKey)) return null;
    const url = this.objectUrl(uploadKey);
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: this.signRequest("GET", url)
    });
    if (response.status === 404) return null;
    await assertRemoteOk(response, "storage_read_failed");
    const bytes = new Uint8Array(await response.arrayBuffer());
    return storedObject(uploadKey, bytes);
  }

  prepareDownload(input: {
    fileId: string;
    uploadKey: string;
    filename: string;
    contentType: string;
    actorUserId: string;
    actorRole: string;
    watermark: string;
  }): Promise<PreparedDownload> {
    return Promise.resolve(prepareSignedDownload(input, this.publicBaseUrl));
  }

  async readDownloadToken(
    token: string
  ): Promise<{ object: StoredObject; payload: StorageTokenPayload } | null> {
    const payload = verifyStorageToken(token, "download");
    if (!payload) return null;
    const object = await this.commitUpload(payload.uploadKey);
    if (!object) return null;
    return { object, payload };
  }

  async deleteObject(uploadKey: string): Promise<void> {
    if (!isSafeUploadKey(uploadKey)) return;
    const url = this.objectUrl(uploadKey);
    const response = await this.fetchImpl(url, {
      method: "DELETE",
      headers: this.signRequest("DELETE", url)
    });
    if (response.status === 404) return;
    await assertRemoteOk(response, "storage_delete_failed");
  }

  private objectUrl(uploadKey: string): string {
    const path = encodePath(uploadKey);
    if (this.endpoint.includes(this.bucket)) return `${this.endpoint}/${path}`;
    return `${this.endpoint}/${encodePath(this.bucket)}/${path}`;
  }

  private signRequest(
    method: "GET" | "PUT" | "DELETE",
    inputUrl: string,
    body: Uint8Array = new Uint8Array(),
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const url = new URL(inputUrl);
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/gu, "");
    const shortDate = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(body);
    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...lowercaseHeaders(extraHeaders)
    };
    const signedHeaders = Object.keys(headers).sort().join(";");
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map((key) => `${key}:${headers[key]?.trim() ?? ""}\n`)
      .join("");
    const canonicalRequest = [
      method,
      url.pathname,
      url.searchParams.toString(),
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join("\n");
    const scope = `${shortDate}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      sha256Hex(new TextEncoder().encode(canonicalRequest))
    ].join("\n");
    const signingKey = s3SigningKey(this.secretAccessKey, shortDate, this.region);
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    return {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    };
  }
}

export function scanStoredObject(input: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): StorageScanResult {
  const warnings: string[] = [];
  if (!isAllowedCaseFileMimeType(input.contentType)) {
    return {
      virusScanStatus: "error",
      phiScanStatus: "pending",
      detections: [],
      warnings: ["mime_not_allowed"]
    };
  }
  if (!hasValidMagicNumber(input.bytes, input.contentType)) {
    return {
      virusScanStatus: "error",
      phiScanStatus: "pending",
      detections: [],
      warnings: ["magic_number_mismatch"]
    };
  }

  const virusScanStatus = containsEicar(input.bytes) ? "infected" : "clean";
  const filenameDetections = detectPhi(input.filename);
  const text = decodeTextForPhiScan(input.bytes, input.contentType);
  const contentDetections = text ? detectPhi(text) : [];
  if (!text && !isTextCaseFileMimeType(input.contentType)) {
    warnings.push("content_phi_scan_not_performed");
  }

  const detections = [...filenameDetections, ...contentDetections];
  return {
    virusScanStatus,
    phiScanStatus: detections.length > 0 ? "suspicious" : text ? "clean" : "pending",
    detections,
    warnings
  };
}

export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .normalize("NFKC")
    .replace(/[\\/:\0]/gu, "-")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 160);
  return sanitized || "upload.bin";
}

export function isAllowedCaseFileMimeType(
  contentType: string
): contentType is AllowedCaseFileMimeType {
  return allowedCaseFileMimeTypes.includes(
    normalizeContentType(contentType) as AllowedCaseFileMimeType
  );
}

export function evaluateCaseFileUploadPolicy(input: {
  filename: string;
  contentType?: string | null;
}): CaseFileUploadPolicyResult {
  const filename = sanitizeFilename(input.filename);
  const extension = extensionForFilename(filename);
  const contentType = normalizeContentType(input.contentType ?? "");
  if (!isAllowedExtension(extension)) {
    return {
      allowed: false,
      code: unsupportedFileTypePendingScanCode,
      reason: "extension_not_allowed",
      filename,
      extension,
      contentType
    };
  }

  if (!contentType || contentType === "application/octet-stream") {
    return {
      allowed: true,
      filename,
      extension,
      contentType: defaultContentTypeForExtension(extension)
    };
  }

  if (!isAllowedCaseFileMimeType(contentType)) {
    return {
      allowed: false,
      code: unsupportedFileTypePendingScanCode,
      reason: "mime_not_allowed",
      filename,
      extension,
      contentType
    };
  }

  if (!compatibleContentTypesForExtension(extension).includes(contentType)) {
    return {
      allowed: false,
      code: unsupportedFileTypePendingScanCode,
      reason: "mime_extension_mismatch",
      filename,
      extension,
      contentType
    };
  }

  return {
    allowed: true,
    filename,
    extension,
    contentType
  };
}

export function assertAllowedCaseFileUpload(input: {
  filename: string;
  contentType?: string | null;
}): FilePolicyAllowed {
  const result = evaluateCaseFileUploadPolicy(input);
  if (!result.allowed) {
    throw new StorageTokenError(result.code);
  }
  return result;
}

export function hasValidMagicNumber(bytes: Uint8Array, contentType: string): boolean {
  const normalized = normalizeContentType(contentType);
  if (normalized === "application/pdf") return startsWithAscii(bytes, "%PDF");
  if (normalized === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte
    );
  }
  if (normalized === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (normalized === "image/webp") {
    return startsWithAscii(bytes, "RIFF") && startsWithAscii(bytes.slice(8), "WEBP");
  }
  if (isZipBasedOfficeMimeType(normalized)) {
    return startsWithAscii(bytes, "PK");
  }
  if (isHwpMimeType(normalized)) {
    return bytes.byteLength > 0;
  }
  if (isTextCaseFileMimeType(normalized)) {
    return !bytes.includes(0);
  }
  return false;
}

export function withDownloadWatermark(
  bytes: Uint8Array,
  contentType: string,
  watermark: string
): Uint8Array {
  const prefix = `[ClinicFlow watermark] ${watermark}\n\n`;
  if (isTextCaseFileMimeType(contentType)) {
    return new TextEncoder().encode(`${prefix}${new TextDecoder().decode(bytes)}`);
  }
  if (contentType === "application/pdf") {
    return new Uint8Array([...new TextEncoder().encode(`% ${prefix}`), ...bytes]);
  }
  return bytes;
}

export function getStorageAdapter(
  env: StorageFactoryEnv = process.env,
  options: StorageAdapterOptions = {}
): StorageAdapter {
  const mode = parseStorageMode(env["STORAGE_MODE"]);
  if (mode === "local") {
    const input: { rootDir?: string; publicBaseUrl?: string } = {};
    if (env["LOCAL_STORAGE_DIR"]) input.rootDir = env["LOCAL_STORAGE_DIR"];
    const publicBaseUrl = options.publicBaseUrl ?? env["LOCAL_STORAGE_BASE_URL"];
    if (publicBaseUrl) input.publicBaseUrl = publicBaseUrl;
    return new LocalStorageAdapter(input);
  }
  if (mode === "supabase") {
    const input: {
      supabaseUrl: string;
      serviceRoleKey: string;
      bucket: string;
      publicBaseUrl?: string;
      fetch?: FetchLike;
    } = {
      supabaseUrl: env["SUPABASE_URL"] ?? "",
      serviceRoleKey: env["SUPABASE_SERVICE_ROLE_KEY"] ?? "",
      bucket: env["SUPABASE_STORAGE_BUCKET"] ?? ""
    };
    const publicBaseUrl = options.publicBaseUrl ?? env["LOCAL_STORAGE_BASE_URL"];
    if (publicBaseUrl) input.publicBaseUrl = publicBaseUrl;
    if (options.fetch) input.fetch = options.fetch;
    return new SupabaseStorageAdapter(input);
  }
  const input: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    publicBaseUrl?: string;
    fetch?: FetchLike;
  } = {
    bucket: env["S3_BUCKET"] ?? "",
    region: env["S3_REGION"] ?? "",
    accessKeyId: env["S3_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: env["S3_SECRET_ACCESS_KEY"] ?? ""
  };
  if (env["S3_ENDPOINT"]) input.endpoint = env["S3_ENDPOINT"];
  const publicBaseUrl = options.publicBaseUrl ?? env["LOCAL_STORAGE_BASE_URL"];
  if (publicBaseUrl) input.publicBaseUrl = publicBaseUrl;
  if (options.fetch) input.fetch = options.fetch;
  return new S3StorageAdapter(input);
}

function parseStorageMode(value: string | undefined): StorageMode {
  if (!value || value === "local") return "local";
  if (value === "supabase" || value === "s3") return value;
  throw new StorageConfigurationError(`Unsupported STORAGE_MODE: ${value}`);
}

function prepareSignedUpload(
  input: PrepareUploadInput,
  publicBaseUrl: string
): PreparedUpload {
  const policy = assertAllowedCaseFileUpload(input);
  const filename = policy.filename;
  const uploadKey = `${input.purpose}/${randomUUID()}-${filename}`;
  const signedUrlId = randomUUID();
  const expiresAt = new Date(Date.now() + uploadTtlMs);
  const token = signStorageToken({
    kind: "upload",
    uploadKey,
    exp: expiresAt.getTime(),
    signedUrlId,
    filename,
    contentType: policy.contentType,
    maxBytes: input.maxBytes ?? defaultMaxBytes
  });

  return {
    uploadKey,
    method: "PUT",
    url: `${publicBaseUrl}/api/case-files/local-upload/${token}`,
    expiresAt,
    signedUrlId
  };
}

function prepareSignedDownload(
  input: {
    fileId: string;
    uploadKey: string;
    filename: string;
    contentType: string;
    actorUserId: string;
    actorRole: string;
    watermark: string;
  },
  publicBaseUrl: string
): PreparedDownload {
  const signedUrlId = randomUUID();
  const expiresAt = new Date(Date.now() + downloadTtlMs);
  const token = signStorageToken({
    kind: "download",
    fileId: input.fileId,
    uploadKey: input.uploadKey,
    exp: expiresAt.getTime(),
    signedUrlId,
    filename: sanitizeFilename(input.filename),
    contentType: input.contentType,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    watermark: input.watermark
  });

  return {
    method: "GET",
    url: `${publicBaseUrl}/api/case-files/signed/${token}`,
    expiresAt,
    signedUrlId
  };
}

function signStorageToken(payload: StorageTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", storageSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifyStorageToken(
  token: string,
  expectedKind: StorageTokenPayload["kind"]
): StorageTokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", storageSecret())
    .update(body)
    .digest("base64url");
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    provided.length !== expectedBuffer.length ||
    !timingSafeEqual(provided, expectedBuffer)
  ) {
    return null;
  }

  let payload: StorageTokenPayload | null = null;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as StorageTokenPayload;
  } catch {
    return null;
  }
  if (payload.kind !== expectedKind || payload.exp < Date.now()) return null;
  if (!isSafeUploadKey(payload.uploadKey)) return null;
  return payload;
}

function storageSecret(): string {
  const secret = process.env["LOCAL_STORAGE_SECRET"];
  if (secret) return secret;
  if (process.env["NODE_ENV"] === "production") {
    throw new StorageConfigurationError(
      "LOCAL_STORAGE_SECRET is required in production"
    );
  }
  return devOnlyStorageSecret();
}

let warnedAboutDevStorageSecret = false;

function devOnlyStorageSecret(): string {
  if (!warnedAboutDevStorageSecret) {
    console.warn(
      "[storage] LOCAL_STORAGE_SECRET is not set; using a dev-only signing secret"
    );
    warnedAboutDevStorageSecret = true;
  }
  return "dev-only-local-storage-secret-never-use-in-prod";
}

function verifyWritableUploadToken(
  token: string,
  bytes: Uint8Array
): StorageTokenPayload {
  const payload = verifyStorageToken(token, "upload");
  if (!payload) {
    throw new StorageTokenError("invalid_storage_token");
  }
  if (bytes.byteLength > (payload.maxBytes ?? defaultMaxBytes)) {
    throw new StorageTokenError("file_too_large");
  }
  const policyInput: { filename: string; contentType?: string } | null =
    payload.filename
      ? {
          filename: payload.filename,
          ...(payload.contentType ? { contentType: payload.contentType } : {})
        }
      : null;
  if (!policyInput || !evaluateCaseFileUploadPolicy(policyInput).allowed) {
    throw new StorageTokenError(unsupportedFileTypePendingScanCode);
  }
  return payload;
}

function isSafeUploadKey(uploadKey: string): boolean {
  return (
    /^[a-z_]+\/[a-f0-9-]+-[^/]+$/u.test(uploadKey) &&
    !uploadKey.includes("..") &&
    !uploadKey.includes("\\")
  );
}

function storedObject(uploadKey: string, bytes: Uint8Array): StoredObject {
  return {
    uploadKey,
    bytes,
    sizeBytes: bytes.byteLength,
    checksumSha256: sha256Hex(bytes)
  };
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function assertRemoteOk(response: Response, code: string): Promise<void> {
  if (response.ok) return;
  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "";
  }
  throw new RemoteStorageError(
    code,
    `${code}: ${String(response.status)} ${body}`.trim()
  );
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function lowercaseHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
}

function s3SigningKey(secret: string, date: string, region: string): Buffer {
  const dateKey = createHmac("sha256", `AWS4${secret}`).update(date).digest();
  const regionKey = createHmac("sha256", dateKey).update(region).digest();
  const serviceKey = createHmac("sha256", regionKey).update("s3").digest();
  return createHmac("sha256", serviceKey).update("aws4_request").digest();
}

function startsWithAscii(bytes: Uint8Array, prefix: string): boolean {
  const encoded = new TextEncoder().encode(prefix);
  return encoded.every((byte, index) => bytes[index] === byte);
}

function containsEicar(bytes: Uint8Array): boolean {
  return new TextDecoder().decode(bytes).includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE");
}

function decodeTextForPhiScan(bytes: Uint8Array, contentType: string): string | null {
  if (!isTextCaseFileMimeType(contentType)) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function normalizeContentType(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function extensionForFilename(filename: string): string | null {
  const index = filename.lastIndexOf(".");
  if (index <= 0 || index === filename.length - 1) return null;
  return filename.slice(index).toLowerCase();
}

function isAllowedExtension(
  extension: string | null
): extension is (typeof allowedCaseFileExtensions)[number] {
  return allowedCaseFileExtensions.includes(
    extension as (typeof allowedCaseFileExtensions)[number]
  );
}

function defaultContentTypeForExtension(
  extension: (typeof allowedCaseFileExtensions)[number]
): AllowedCaseFileMimeType {
  if (extension === ".md" || extension === ".markdown") return "text/markdown";
  if (extension === ".json") return "application/json";
  if (extension === ".csv") return "text/csv";
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".hwp") return "application/x-hwp";
  if (extension === ".hwpx") return "application/vnd.hancom.hwpx";
  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === ".xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "text/plain";
}

function compatibleContentTypesForExtension(
  extension: (typeof allowedCaseFileExtensions)[number]
): AllowedCaseFileMimeType[] {
  if (extension === ".md" || extension === ".markdown") {
    return ["text/markdown", "text/plain"];
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    return ["image/jpeg"];
  }
  if (extension === ".hwp") {
    return [
      "application/x-hwp",
      "application/haansofthwp",
      "application/vnd.hancom.hwp"
    ];
  }
  if (extension === ".hwpx") {
    return [
      "application/vnd.hancom.hwpx",
      "application/haansofthwpx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
  }
  return [defaultContentTypeForExtension(extension)];
}

function isTextCaseFileMimeType(contentType: string): boolean {
  return (
    normalizeContentType(contentType) === "text/plain" ||
    normalizeContentType(contentType) === "text/markdown" ||
    normalizeContentType(contentType) === "application/json" ||
    normalizeContentType(contentType) === "text/csv"
  );
}

function isZipBasedOfficeMimeType(contentType: string): boolean {
  const normalized = normalizeContentType(contentType);
  return (
    normalized === "application/vnd.hancom.hwpx" ||
    normalized === "application/haansofthwpx" ||
    normalized ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalized === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

function isHwpMimeType(contentType: string): boolean {
  const normalized = normalizeContentType(contentType);
  return (
    normalized === "application/x-hwp" ||
    normalized === "application/haansofthwp" ||
    normalized === "application/vnd.hancom.hwp"
  );
}
