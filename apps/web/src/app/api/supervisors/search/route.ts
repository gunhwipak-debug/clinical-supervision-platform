import { profiles } from "@csp/db";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { createRuntimeDatabase } from "@/lib/auth/database";

export const runtime = "nodejs";

const searchSchema = z.object({
  availability: z.enum(["this_week", "this_month"]).nullable(),
  keyword: z.string().trim().max(120).nullable(),
  qualification: z.string().trim().max(80).nullable(),
  priceMin: z.coerce.number().int().min(0).nullable(),
  priceMax: z.coerce.number().int().min(0).nullable(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z
    .enum(["avg_response_minutes", "average_rating", "total_completed"])
    .default("average_rating")
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    keyword: url.searchParams.get("keyword"),
    availability: url.searchParams.get("availability"),
    qualification: url.searchParams.get("qualification"),
    priceMin: url.searchParams.get("priceMin"),
    priceMax: url.searchParams.get("priceMax"),
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined
  });
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "검색 조건이 올바르지 않습니다."),
      422
    );
  }
  const specialtyCodes = [
    ...url.searchParams.getAll("specialty"),
    ...url.searchParams.getAll("specialty[]")
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const db = createRuntimeDatabase();
  const supervisors = await profiles.searchSupervisors(db, {
    specialtyCodes,
    availability: parsed.data.availability,
    qualification: parsed.data.qualification || null,
    keyword: parsed.data.keyword || null,
    priceMin: parsed.data.priceMin,
    priceMax: parsed.data.priceMax,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
    sort: parsed.data.sort
  });

  return envelope({ supervisors }, null, 200);
}
