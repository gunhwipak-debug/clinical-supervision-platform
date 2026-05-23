import { profiles, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisor } from "@/lib/auth/guards";
import { nullable, qualificationSchema } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const db = createRuntimeDatabase();
  const qualifications = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: current.session.role,
      phiAccess: true
    },
    (tx) => profiles.listQualifications(tx, current.session.userId)
  );

  return envelope({ qualifications }, null, 200);
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisor(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = qualificationSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "자격 정보 형식이 올바르지 않습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const qualification = await withUserContext(
    db,
    {
      userId: current.session.userId,
      role: current.session.role,
      phiAccess: true
    },
    async (tx) => {
      const supervisorProfileId = await profiles.getSupervisorProfileIdForUser(
        tx,
        current.session.userId
      );

      if (!supervisorProfileId) {
        return null;
      }

      const evidence = await profiles.getQualificationEvidenceFile(
        tx,
        parsed.data.evidenceFileId
      );
      if (!evidence || evidence.virusScanStatus !== "clean") {
        return "evidence_required";
      }

      return profiles.createQualification(tx, {
        supervisorProfileId,
        name: parsed.data.name,
        number: nullable(parsed.data.number),
        issuingBody: nullable(parsed.data.issuingBody),
        issuedAt: nullable(parsed.data.issuedAt),
        expiresAt: nullable(parsed.data.expiresAt),
        evidenceFileId: parsed.data.evidenceFileId
      });
    }
  );

  if (qualification === "evidence_required") {
    return envelope(
      null,
      apiError("evidence_required", "자격 증빙 파일을 먼저 업로드해주세요."),
      422
    );
  }

  if (!qualification) {
    return envelope(
      null,
      apiError("profile_required", "먼저 슈퍼바이저 프로필을 등록해주세요."),
      422
    );
  }

  return envelope({ qualification }, null, 200);
}
