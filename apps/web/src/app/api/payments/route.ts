import { payments, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const db = createRuntimeDatabase();
  const items = await withUserContext(db, contextFor(current, request), (tx) =>
    payments.listPayments(tx)
  );

  return envelope({ payments: items }, null, 200);
}
