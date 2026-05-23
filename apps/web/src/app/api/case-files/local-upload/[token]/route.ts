import { getStorageAdapter, StorageTokenError } from "@csp/shared/storage";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    const object = await getStorageAdapter().writeUploadToken(token, bytes);
    return NextResponse.json(
      {
        data: {
          uploadKey: object.uploadKey,
          sizeBytes: object.sizeBytes,
          checksumSha256: object.checksumSha256
        },
        error: null
      },
      { status: 200, headers: { "X-Robots-Tag": "noindex" } }
    );
  } catch (error) {
    const code =
      error instanceof StorageTokenError ? error.code : "storage_write_failed";
    const status =
      code === "file_too_large" ||
      code === "unsupported_file_type" ||
      code === "unsupported_file_type_pending_scan"
        ? 422
        : 401;
    return NextResponse.json(
      { data: null, error: { code, message: code } },
      {
        status,
        headers: { "X-Robots-Tag": "noindex" }
      }
    );
  }
}
