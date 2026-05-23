import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import {
  evaluateCaseFileUploadPolicy,
  getStorageAdapter,
  hasValidMagicNumber,
  LocalStorageAdapter,
  S3StorageAdapter,
  sanitizeFilename,
  scanStoredObject,
  StorageConfigurationError,
  SupabaseStorageAdapter,
  type FetchLike
} from "./index";

describe("case file upload policy", () => {
  it.each([
    ["report.txt", "text/plain"],
    ["case-notes.md", "text/markdown"],
    ["payload.json", "application/json"],
    ["table.csv", "text/csv"],
    ["report.pdf", "application/pdf"],
    ["image.png", "image/png"],
    ["photo.jpg", "image/jpeg"],
    ["scan.webp", "image/webp"],
    ["record.hwp", "application/x-hwp"],
    ["record.hwpx", "application/vnd.hancom.hwpx"],
    [
      "document.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    ["sheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
  ])("allows supported case evidence upload %s", (filename, contentType) => {
    expect(evaluateCaseFileUploadPolicy({ filename, contentType })).toMatchObject({
      allowed: true
    });
  });

  it.each([
    ["malware.exe", "application/x-msdownload", "extension_not_allowed"],
    ["archive.zip", "application/zip", "extension_not_allowed"],
    ["disk.dmg", "application/x-apple-diskimage", "extension_not_allowed"],
    ["unknown.bin", "application/octet-stream", "extension_not_allowed"],
    ["payload.txt", "application/x-msdownload", "mime_not_allowed"],
    ["archive.pdf", "application/zip", "mime_not_allowed"]
  ])(
    "blocks executable, archive, and unsupported binary upload %s",
    (filename, contentType, reason) => {
      expect(evaluateCaseFileUploadPolicy({ filename, contentType })).toMatchObject({
        allowed: false,
        code: "unsupported_file_type",
        reason
      });
    }
  );

  it("blocks allowed MIME paired with a risky extension", () => {
    expect(
      evaluateCaseFileUploadPolicy({
        filename: "report.exe",
        contentType: "text/plain"
      })
    ).toMatchObject({
      allowed: false,
      reason: "extension_not_allowed"
    });
  });

  it("blocks an allowed extension paired with risky MIME", () => {
    expect(
      evaluateCaseFileUploadPolicy({
        filename: "report.txt",
        contentType: "application/pdf"
      })
    ).toMatchObject({
      allowed: false,
      reason: "mime_extension_mismatch"
    });
  });

  it("infers allowed type from extension when Content-Type is missing or octet-stream", () => {
    expect(evaluateCaseFileUploadPolicy({ filename: "report.txt" })).toMatchObject({
      allowed: true,
      contentType: "text/plain"
    });
    expect(
      evaluateCaseFileUploadPolicy({
        filename: "payload.json",
        contentType: "application/octet-stream"
      })
    ).toMatchObject({
      allowed: true,
      contentType: "application/json"
    });
  });
});

describe("local storage adapter", () => {
  it("round-trips an uploaded object through a signed upload token", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "csp-storage-"));
    const adapter = new LocalStorageAdapter({ rootDir });
    const prepared = await adapter.prepareUpload({
      purpose: "case_file",
      filename: "report.txt",
      contentType: "text/plain",
      maxBytes: 1024
    });

    const written = await adapter.writeUploadToken(
      prepared.url.split("/").pop() ?? "",
      new TextEncoder().encode("clean file")
    );
    const committed = await adapter.commitUpload(prepared.uploadKey);

    expect(written.checksumSha256).toBe(committed?.checksumSha256);
    expect(committed?.sizeBytes).toBe(10);
    await rm(rootDir, { force: true, recursive: true });
  });

  it("sanitizes traversal-style filenames", () => {
    expect(sanitizeFilename("../secret/report.pdf")).toBe("..-secret-report.pdf");
    expect(sanitizeFilename("")).toBe("upload.bin");
  });
});

describe("storage adapter factory", () => {
  it("defaults to local storage mode", () => {
    expect(getStorageAdapter({})).toBeInstanceOf(LocalStorageAdapter);
  });

  it("requires Supabase storage credentials", () => {
    expect(() => getStorageAdapter({ STORAGE_MODE: "supabase" })).toThrow(
      StorageConfigurationError
    );
  });

  it("requires S3 storage credentials", () => {
    expect(() => getStorageAdapter({ STORAGE_MODE: "s3" })).toThrow(
      StorageConfigurationError
    );
  });

  it("fails fast when production storage signing secret is missing", async () => {
    const previousNodeEnv = process.env["NODE_ENV"];
    const previousSecret = process.env["LOCAL_STORAGE_SECRET"];
    delete process.env["LOCAL_STORAGE_SECRET"];
    process.env["NODE_ENV"] = "production";
    vi.resetModules();
    const { LocalStorageAdapter: FreshLocalStorageAdapter } = await import("./index");
    const adapter = new FreshLocalStorageAdapter();

    expect(() =>
      adapter.prepareUpload({
        purpose: "case_file",
        filename: "report.txt",
        contentType: "text/plain"
      })
    ).toThrow("LOCAL_STORAGE_SECRET is required in production");

    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("LOCAL_STORAGE_SECRET", previousSecret);
    vi.resetModules();
  });

  it("warns and uses a dev-only storage signing secret outside production", async () => {
    const previousNodeEnv = process.env["NODE_ENV"];
    const previousSecret = process.env["LOCAL_STORAGE_SECRET"];
    delete process.env["LOCAL_STORAGE_SECRET"];
    process.env["NODE_ENV"] = "test";
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { LocalStorageAdapter: FreshLocalStorageAdapter } = await import("./index");
    const adapter = new FreshLocalStorageAdapter();

    await expect(
      adapter.prepareUpload({
        purpose: "case_file",
        filename: "report.txt",
        contentType: "text/plain"
      })
    ).resolves.toMatchObject({ method: "PUT" });
    expect(warn).toHaveBeenCalledWith(
      "[storage] LOCAL_STORAGE_SECRET is not set; using a dev-only signing secret"
    );

    warn.mockRestore();
    restoreEnv("NODE_ENV", previousNodeEnv);
    restoreEnv("LOCAL_STORAGE_SECRET", previousSecret);
    vi.resetModules();
  });
});

describe("remote storage adapters", () => {
  it("round-trips through Supabase Storage REST calls with injected fetch", async () => {
    const store = new Map<string, Uint8Array>();
    const adapter = new SupabaseStorageAdapter({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "service-key",
      bucket: "case-files",
      fetch: memoryObjectFetch(store)
    });

    const prepared = await adapter.prepareUpload({
      purpose: "case_file",
      filename: "clean.txt",
      contentType: "text/plain",
      maxBytes: 1024
    });
    const token = prepared.url.split("/").pop() ?? "";
    const bytes = new TextEncoder().encode("clean remote file");

    await expect(adapter.writeUploadToken(token, bytes)).resolves.toMatchObject({
      uploadKey: prepared.uploadKey,
      sizeBytes: bytes.byteLength
    });
    const committed = await adapter.commitUpload(prepared.uploadKey);
    expect(committed?.checksumSha256).toBeTypeOf("string");
    await adapter.deleteObject(prepared.uploadKey);
    await expect(adapter.commitUpload(prepared.uploadKey)).resolves.toBeNull();
  });

  it("signs and round-trips S3-compatible object operations", async () => {
    const store = new Map<string, Uint8Array>();
    const calls: Array<{ method: string; authorization: string | null }> = [];
    const adapter = new S3StorageAdapter({
      endpoint: "https://s3.example.test",
      bucket: "case-files",
      region: "ap-northeast-2",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        calls.push({
          method: init?.method ?? "GET",
          authorization: headers.get("authorization")
        });
        return memoryObjectFetch(store)(input, init);
      }
    });

    const prepared = await adapter.prepareUpload({
      purpose: "case_file",
      filename: "remote.txt",
      contentType: "text/plain",
      maxBytes: 1024
    });
    const token = prepared.url.split("/").pop() ?? "";
    await adapter.writeUploadToken(token, new TextEncoder().encode("s3 file"));
    await expect(adapter.commitUpload(prepared.uploadKey)).resolves.toMatchObject({
      uploadKey: prepared.uploadKey
    });

    expect(
      calls.some((call) => call.authorization?.startsWith("AWS4-HMAC-SHA256"))
    ).toBe(true);
  });
});

describe("storage scan", () => {
  it("accepts clean UTF-8 text", () => {
    const result = scanStoredObject({
      filename: "report.txt",
      contentType: "text/plain",
      bytes: new TextEncoder().encode("심리평가 보고서 검토 요청")
    });

    expect(result.virusScanStatus).toBe("clean");
    expect(result.phiScanStatus).toBe("clean");
  });

  it("marks EICAR content as infected", () => {
    const result = scanStoredObject({
      filename: "eicar.txt",
      contentType: "text/plain",
      bytes: new TextEncoder().encode(
        "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
      )
    });

    expect(result.virusScanStatus).toBe("infected");
  });

  it("marks filename or text PHI as suspicious", () => {
    const result = scanStoredObject({
      filename: "010-1234-5678.txt",
      contentType: "text/plain",
      bytes: new TextEncoder().encode("연락처 test.user@example.com")
    });

    expect(result.phiScanStatus).toBe("suspicious");
    expect(result.detections.map((item) => item.kind)).toContain("phone");
    expect(result.detections.map((item) => item.kind)).toContain("email");
  });

  it("validates common magic numbers", () => {
    expect(
      hasValidMagicNumber(new TextEncoder().encode("%PDF-1.7"), "application/pdf")
    ).toBe(true);
    expect(hasValidMagicNumber(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(
      true
    );
    expect(
      hasValidMagicNumber(new TextEncoder().encode("not pdf"), "application/pdf")
    ).toBe(false);
  });
});

function memoryObjectFetch(store: Map<string, Uint8Array>): FetchLike {
  return async (input, init) => {
    const url = new URL(urlForFetchInput(input));
    const key = decodeURIComponent(url.pathname);
    const method = init?.method ?? "GET";
    if (method === "PUT") {
      const body = init?.body;
      const bytes =
        body instanceof Uint8Array
          ? body
          : new Uint8Array(await new Response(body as BodyInit | null).arrayBuffer());
      store.set(key, bytes);
      return new Response("{}", { status: 200 });
    }
    if (method === "GET") {
      const bytes = store.get(key);
      if (!bytes) return new Response("missing", { status: 404 });
      return new Response(Buffer.from(bytes), { status: 200 });
    }
    if (method === "DELETE") {
      store.delete(key);
      return new Response("{}", { status: 200 });
    }
    return new Response("method not allowed", { status: 405 });
  };
}

function urlForFetchInput(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    unsetEnv(name);
  } else {
    process.env[name] = value;
  }
}

function unsetEnv(name: string): void {
  if (name === "NODE_ENV") {
    delete process.env["NODE_ENV"];
    return;
  }
  if (name === "LOCAL_STORAGE_SECRET") {
    delete process.env["LOCAL_STORAGE_SECRET"];
  }
}
