import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { profiles, withUserContext } from "@csp/db";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "../auth/current-user";
import { isSupervisor } from "../auth/guards";

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
  "packages/db/drizzle/0014_google_calendar.sql",
  "packages/db/drizzle/0015_qualification_evidence.sql"
] as const;

const supervisorId = "20000000-0000-0000-0000-000000000001";
const otherSupervisorId = "20000000-0000-0000-0000-000000000002";
const superviseeId = "20000000-0000-0000-0000-000000000003";
const adminId = "20000000-0000-0000-0000-000000000004";

type ApiEnvelope = {
  error: { code: string } | null;
};

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  await applyMigrations(pg);
  process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
  await seedUsers();
});

afterEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  await pg.close();
});

describe("profile and search integration", () => {
  it("seeds the public specialty catalog with at least twelve active codes", async () => {
    const catalog = await profiles.listSpecialtyCatalog(db);

    expect(catalog.length).toBeGreaterThanOrEqual(12);
    expect(catalog.map((item) => item.code)).toContain("adult_psychopathology");
  });

  it("keeps hidden supervisors out of public search", async () => {
    await seedSupervisor({
      userId: supervisorId,
      displayName: "숨김 전문가",
      visibility: "hidden",
      verificationStatus: "approved"
    });

    const results = await profiles.searchSupervisors(db, baseSearch());
    expect(results).toHaveLength(0);
  });

  it("matches public approved supervisors by specialty and keyword", async () => {
    const profileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "성인 평가 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    await attachSpecialty(profileId, "adult_psychopathology");
    await seedProduct(profileId, 120_000);

    const results = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      specialtyCodes: ["adult_psychopathology"],
      keyword: "성인"
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.specialties).toContain("성인 정신병리");
  });

  it("matches keyword searches against specialty labels and approved qualifications", async () => {
    const specialtyProfileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "전문분야 검색 대상",
      visibility: "public",
      verificationStatus: "approved"
    });
    const qualificationProfileId = await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "자격 검색 대상",
      visibility: "public",
      verificationStatus: "approved"
    });
    await attachSpecialty(specialtyProfileId, "adult_psychopathology");
    await seedQualification(
      qualificationProfileId,
      "정신건강임상심리사 1급",
      "approved"
    );

    const specialtyResults = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      keyword: "정신병리"
    });
    const qualificationResults = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      keyword: "정신건강"
    });

    expect(specialtyResults.map((result) => result.displayName)).toEqual([
      "전문분야 검색 대상"
    ]);
    expect(qualificationResults.map((result) => result.displayName)).toEqual([
      "자격 검색 대상"
    ]);
  });

  it("matches public approved supervisors by approved qualification", async () => {
    const matchedProfileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "임상 자격 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    const unmatchedProfileId = await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "다른 자격 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    await seedQualification(matchedProfileId, "임상심리전문가", "approved");
    await seedQualification(unmatchedProfileId, "정신건강임상심리사 1급", "approved");

    const results = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      qualification: "임상심리전문가"
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.displayName).toBe("임상 자격 전문가");
  });

  it("sorts public search by rating descending by default", async () => {
    await seedSupervisor({
      userId: supervisorId,
      displayName: "낮은 평점",
      visibility: "public",
      verificationStatus: "approved",
      averageRating: "3.20"
    });
    await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "높은 평점",
      visibility: "public",
      verificationStatus: "approved",
      averageRating: "4.80"
    });

    const results = await profiles.searchSupervisors(db, baseSearch());

    expect(results.map((result) => result.displayName)).toEqual([
      "높은 평점",
      "낮은 평점"
    ]);
  });

  it("filters public search by active service product price", async () => {
    const affordableProfileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "예산 내 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    const premiumProfileId = await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "고가 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    await seedProduct(affordableProfileId, 80_000);
    await seedProduct(premiumProfileId, 180_000);

    const results = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      priceMax: 100_000
    });

    expect(results.map((result) => result.displayName)).toEqual(["예산 내 전문가"]);
  });

  it("sorts public search by fastest response and completed sessions", async () => {
    await seedSupervisor({
      userId: supervisorId,
      displayName: "빠른 응답 전문가",
      visibility: "public",
      verificationStatus: "approved",
      avgResponseMinutes: 30,
      totalCompleted: 5
    });
    await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "많이 진행한 전문가",
      visibility: "public",
      verificationStatus: "approved",
      avgResponseMinutes: 240,
      totalCompleted: 40
    });

    const fastestResults = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      sort: "avg_response_minutes"
    });
    const completedResults = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      sort: "total_completed"
    });

    expect(fastestResults.map((result) => result.displayName)).toEqual([
      "빠른 응답 전문가",
      "많이 진행한 전문가"
    ]);
    expect(completedResults.map((result) => result.displayName)).toEqual([
      "많이 진행한 전문가",
      "빠른 응답 전문가"
    ]);
  });

  it("filters availability to supervisors with open platform slots", async () => {
    const availableProfileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "예약 가능 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    const unavailableProfileId = await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "캘린더 미연동 전문가",
      visibility: "public",
      verificationStatus: "approved"
    });
    await seedAvailability(availableProfileId, 1, "13:00", "14:00");
    await seedAvailability(unavailableProfileId, 1, "13:00", "14:00");

    const results = await profiles.searchSupervisors(db, {
      ...baseSearch(),
      availability: "this_week"
    });

    expect(results.map((result) => result.displayName).sort()).toEqual([
      "예약 가능 전문가",
      "캘린더 미연동 전문가"
    ]);
  });

  it("prevents non-owners from updating another supervisor profile through RLS", async () => {
    const otherProfileId = await seedSupervisor({
      userId: otherSupervisorId,
      displayName: "타인 프로필",
      visibility: "hidden",
      verificationStatus: "pending"
    });
    await pg.query("set role csp_app");
    await pg.query(
      `select set_config('app.current_user_id', '${supervisorId}', false)`
    );
    await pg.query("select set_config('app.current_user_role', 'supervisor', false)");

    const updated = await db.execute<{ id: string }>(sql`
      update supervisor_profiles
      set display_name = '침범'
      where id = ${otherProfileId}
      returning id
    `);

    expect(rowsOf(updated)).toHaveLength(0);
    await pg.query("reset role");
  });

  it("starts a supervisee's supervisor application as hidden and pending", async () => {
    const profile = await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee" },
      async (tx) =>
        profiles.startSupervisorApplication(tx, {
          displayName: "신청 임상가",
          userId: superviseeId
        })
    );
    const userRole = await db.execute<{ role: string }>(sql`
      select role
      from users
      where id = ${superviseeId}
    `);

    expect(profile.displayName).toBe("신청 임상가");
    expect(profile.verificationStatus).toBe("pending");
    expect(profile.visibility).toBe("hidden");
    expect(rowsOf(userRole)[0]?.role).toBe("supervisor");
  });

  it("blocks public visibility while a supervisor has only pending qualifications", async () => {
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        const profile = await profiles.upsertSupervisorProfile(tx, supervisorId, {
          displayName: "대기 전문가",
          photoUrl: null,
          headline: null,
          bio: null,
          yearsOfExperience: null
        });
        await profiles.createQualification(tx, {
          supervisorProfileId: profile.id,
          name: "임상심리전문가",
          number: null,
          issuingBody: null,
          issuedAt: null,
          expiresAt: null,
          evidenceFileId: null
        });

        expect(profile.verificationStatus).toBe("pending");
      }
    );
  });

  it("returns verification_required when pending qualifications request public visibility", async () => {
    const profileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "대기 검증 전문가",
      visibility: "hidden",
      verificationStatus: "pending"
    });
    await profiles.createQualification(db, {
      supervisorProfileId: profileId,
      name: "임상심리전문가",
      number: null,
      issuingBody: null,
      issuedAt: null,
      expiresAt: null,
      evidenceFileId: null
    });

    const response = await callVisibilityRoute(
      currentSupervisor({ userId: supervisorId, totpEnabled: true })
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(422);
    expect(body.error?.code).toBe("verification_required");
  });

  it("returns 2fa_required when an approved supervisor has TOTP disabled", async () => {
    await seedSupervisor({
      userId: supervisorId,
      displayName: "2FA 미설정 전문가",
      visibility: "hidden",
      verificationStatus: "approved"
    });

    const response = await callVisibilityRoute(
      currentSupervisor({ userId: supervisorId, totpEnabled: false })
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(422);
    expect(body.error?.code).toBe("2fa_required");
  });

  it("allows admin qualification approval only with a thirty character reason", async () => {
    const profileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "승인 전문가",
      visibility: "hidden",
      verificationStatus: "pending"
    });
    const evidence = await seedQualificationEvidence(profileId);
    const qualification = await profiles.createQualification(db, {
      supervisorProfileId: profileId,
      name: "임상심리전문가",
      number: "KCP-2024-001",
      issuingBody: "한국임상심리학회",
      issuedAt: null,
      expiresAt: null,
      evidenceFileId: evidence.id
    });
    const shortReason = "12345678901234567890123456789";
    const longReason = "자격증 원본과 발급기관 조회 결과가 일치하여 승인합니다";

    await withUserContext(
      db,
      { userId: adminId, role: "admin", adminReason: shortReason },
      async (tx) => {
        await expect(
          profiles.approveQualification(tx, {
            qualificationId: qualification.id,
            reason: shortReason
          })
        ).resolves.toBe(false);
      }
    );

    await withUserContext(
      db,
      { userId: adminId, role: "admin", adminReason: longReason },
      async (tx) => {
        await expect(
          profiles.approveQualification(tx, {
            qualificationId: qualification.id,
            reason: longReason
          })
        ).resolves.toBe(true);
      }
    );

    const approved = await profiles.getSupervisorProfileByUserId(db, supervisorId);
    expect(approved?.verificationStatus).toBe("approved");
  });

  it("blocks admin qualification approval when evidence is missing", async () => {
    const profileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "증빙 없는 전문가",
      visibility: "hidden",
      verificationStatus: "pending"
    });
    const qualification = await profiles.createQualification(db, {
      supervisorProfileId: profileId,
      name: "임상심리전문가",
      number: "KCP-2024-002",
      issuingBody: "한국임상심리학회",
      issuedAt: null,
      expiresAt: null,
      evidenceFileId: null
    });

    await withUserContext(
      db,
      {
        userId: adminId,
        role: "admin",
        adminReason: "증빙 누락 승인 차단 테스트를 위한 관리자 사유입니다."
      },
      async (tx) => {
        await expect(
          profiles.getQualificationReviewReadiness(tx, qualification.id)
        ).resolves.toBe("missing_evidence");
        await expect(
          profiles.approveQualification(tx, {
            qualificationId: qualification.id,
            reason: "증빙 누락 승인 차단 테스트를 위한 관리자 사유입니다."
          })
        ).resolves.toBe(false);
      }
    );
  });

  it("rejects supervisee access to supervisor-only profile writes at the guard", () => {
    expect(
      isSupervisor({
        session: {
          userId: superviseeId,
          role: "supervisee",
          issuedAt: Date.now(),
          expiresAt: Date.now() + 1000,
          sessionId: "test"
        },
        user: {
          id: superviseeId,
          email: "supervisee@example.com",
          role: "supervisee",
          status: "active",
          totpSecretEnc: null,
          totpEnabled: false,
          passwordChangedAt: null
        }
      })
    ).toBe(false);
  });

  it("enforces product and availability constraints", async () => {
    const profileId = await seedSupervisor({
      userId: supervisorId,
      displayName: "제약 전문가",
      visibility: "hidden",
      verificationStatus: "pending"
    });

    await expect(seedProduct(profileId, 9_000)).rejects.toThrow();
    await expect(
      db.execute(sql`
        insert into availability_slots (
          supervisor_profile_id,
          weekday,
          start_time,
          end_time
        ) values (${profileId}, 8, '10:00', '11:00')
      `)
    ).rejects.toThrow();
  });
});

function baseSearch(): Parameters<typeof profiles.searchSupervisors>[1] {
  return {
    availability: null,
    specialtyCodes: [],
    qualification: null,
    keyword: null,
    priceMin: null,
    priceMax: null,
    limit: 12,
    offset: 0,
    sort: "average_rating"
  };
}

function currentSupervisor(input: {
  userId: string;
  totpEnabled: boolean;
}): CurrentUser {
  return {
    session: {
      userId: input.userId,
      role: "supervisor",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
      sessionId: "test"
    },
    user: {
      id: input.userId,
      email: "supervisor@example.com",
      role: "supervisor",
      status: "active",
      totpSecretEnc: null,
      totpEnabled: input.totpEnabled,
      passwordChangedAt: null
    }
  };
}

async function callVisibilityRoute(current: CurrentUser): Promise<Response> {
  vi.doMock("@/lib/api/envelope", () => ({
    apiError: (code: string, message: string) => ({ code, message }),
    envelope: (data: unknown, error: unknown, status: number) =>
      Response.json(
        { data, error },
        {
          status,
          headers: { "X-Robots-Tag": "noindex" }
        }
      )
  }));
  vi.doMock("@/lib/api/request", () => ({
    parseJson: (request: Request) => request.json().catch(() => null)
  }));
  vi.doMock("@/lib/auth/current-user", () => ({
    getCurrentUser: () => Promise.resolve(current)
  }));
  vi.doMock("@/lib/auth/database", () => ({
    createRuntimeDatabase: () => db
  }));
  vi.doMock("@/lib/auth/guards", () => ({
    isSupervisor: (value: CurrentUser | null) => value?.user.role === "supervisor"
  }));
  vi.doMock("@/lib/profiles/validation", async () => {
    const { z } = await import("zod");
    return {
      visibilitySchema: z.object({
        visibility: z.enum(["hidden", "public", "private"])
      })
    };
  });

  const { POST } = await import("../../app/api/me/supervisor-profile/visibility/route");

  return POST(
    new NextRequest("http://localhost/api/me/supervisor-profile/visibility", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: "public" })
    })
  );
}

async function applyMigrations(database: PGlite): Promise<void> {
  for (const migration of migrations) {
    const statements = readFileSync(migration, "utf8")
      .replace(
        /CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint\n?/u,
        ""
      )
      .split(/--> statement-breakpoint/g)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await database.query(statement);
    }
  }

  await database.query(`
    create or replace function pgp_sym_encrypt(data text, key text, options text)
    returns bytea
    language sql
    immutable
    as $$ select convert_to(data, 'UTF8') $$
  `);
  await database.query(`
    create or replace function pgp_sym_decrypt(data bytea, key text, options text)
    returns text
    language sql
    immutable
    as $$ select convert_from(data, 'UTF8') $$
  `);
}

async function seedUsers(): Promise<void> {
  await db.execute(sql`
    insert into users (id, email, role, password_hash, totp_enabled)
    values
      (${supervisorId}, 'supervisor@example.com', 'supervisor', 'hash', true),
      (${otherSupervisorId}, 'other-supervisor@example.com', 'supervisor', 'hash', true),
      (${superviseeId}, 'supervisee@example.com', 'supervisee', 'hash', false),
      (${adminId}, 'admin@example.com', 'admin', 'hash', true)
  `);
}

async function seedSupervisor(input: {
  userId: string;
  displayName: string;
  visibility: "hidden" | "public";
  verificationStatus: "pending" | "approved";
  averageRating?: string;
  avgResponseMinutes?: number;
  totalCompleted?: number;
}): Promise<string> {
  const result = await db.execute<{ id: string }>(sql`
    insert into supervisor_profiles (
      user_id,
      display_name,
      headline,
      visibility,
      verification_status,
      average_rating,
      avg_response_minutes,
      total_completed
    ) values (
      ${input.userId},
      ${input.displayName},
      ${input.displayName},
      ${input.visibility},
      ${input.verificationStatus},
      ${input.averageRating ?? null},
      ${input.avgResponseMinutes ?? null},
      ${input.totalCompleted ?? 0}
    )
    returning id
  `);

  return rowsOf(result)[0]?.id ?? "";
}

async function attachSpecialty(profileId: string, code: string): Promise<void> {
  await db.execute(sql`
    insert into supervisor_specialties (supervisor_profile_id, specialty_id)
    select ${profileId}, id
    from specialty_catalog
    where code = ${code}
  `);
}

async function seedProduct(profileId: string, priceKrw: number): Promise<void> {
  await db.execute(sql`
    insert into service_products (
      supervisor_profile_id,
      kind,
      title,
      price_krw,
      active
    ) values (
      ${profileId},
      'async_comment',
      '코멘트 슈퍼비전',
      ${priceKrw},
      true
    )
  `);
}

async function seedQualificationEvidence(profileId: string): Promise<{ id: string }> {
  const result = await db.execute<{ id: string }>(sql`
    insert into qualification_evidence_files (
      supervisor_profile_id,
      uploaded_by,
      original_filename,
      mime_type,
      size_bytes,
      storage_key,
      checksum_sha256,
      virus_scan_status
    ) values (
      ${profileId},
      ${supervisorId},
      'qualification.pdf',
      'application/pdf',
      1024,
      'qualification_evidence/00000000-0000-4000-8000-000000000999-qualification.pdf',
      'checksum',
      'clean'
    )
    returning id
  `);

  return rowsOf(result)[0] ?? { id: "" };
}

async function seedQualification(
  profileId: string,
  name: string,
  status: "pending" | "approved" | "rejected"
): Promise<void> {
  await db.execute(sql`
    insert into qualifications (
      supervisor_profile_id,
      name,
      issuing_body,
      status
    ) values (
      ${profileId},
      ${name},
      '테스트 발급기관',
      ${status}
    )
  `);
}

async function seedAvailability(
  profileId: string,
  weekday: number,
  startTime: string,
  endTime: string
): Promise<void> {
  await db.execute(sql`
    insert into availability_slots (
      supervisor_profile_id,
      weekday,
      start_time,
      end_time,
      timezone
    ) values (
      ${profileId},
      ${weekday},
      ${startTime},
      ${endTime},
      'Asia/Seoul'
    )
  `);
}

function rowsOf<TRow>(result: TRow[] | { rows: TRow[] }): TRow[] {
  return Array.isArray(result) ? result : result.rows;
}
