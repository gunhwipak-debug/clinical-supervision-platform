import { profiles } from "@csp/db";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createRuntimeDatabase } from "@/lib/auth/database";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "슈퍼바이저 ID가 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const supervisor = await profiles.getPublicSupervisorDetails(db, parsed.data.id);

  if (!supervisor)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );

  return envelope({ supervisor }, null, 200);
}
