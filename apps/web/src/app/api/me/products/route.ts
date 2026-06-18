import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { serverUnavailable } from "@/lib/api/errors";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { nullable, productSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  try {
    const db = createRuntimeDatabase();
    const products = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      (tx) => profiles.listProducts(tx, current.session.userId)
    );

    return envelope({ products }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.products.get]",
      error,
      "슈퍼비전 방식을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = productSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "슈퍼비전 방식 정보 형식이 올바르지 않습니다."),
      422
    );
  }

  try {
    const db = createRuntimeDatabase();
    const productInput = {
      ...(typeof parsed.data.active === "boolean"
        ? { active: parsed.data.active }
        : {}),
      description: nullable(parsed.data.description),
      kind: parsed.data.kind,
      priceKrw: parsed.data.priceKrw,
      title: parsed.data.title,
      turnaroundHours: nullable(parsed.data.turnaroundHours)
    };
    const product = await withUserContext(
      db,
      { userId: current.session.userId, role: current.session.role },
      async (tx) => {
        const supervisorProfileId = await profiles.getSupervisorProfileIdForUser(
          tx,
          current.session.userId
        );

        if (!supervisorProfileId) return null;

        if (typeof parsed.data.active === "boolean") {
          return profiles.upsertProductByKind(tx, {
            supervisorProfileId,
            ...productInput
          });
        }

        return profiles.createProduct(tx, {
          supervisorProfileId,
          ...productInput
        });
      }
    );

    if (!product) {
      return envelope(
        null,
        apiError("profile_required", "먼저 슈퍼바이저 프로필을 등록해주세요."),
        422
      );
    }

    return envelope({ product }, null, 200);
  } catch (error) {
    return serverUnavailable(
      "[me.products.post]",
      error,
      "슈퍼비전 방식을 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
