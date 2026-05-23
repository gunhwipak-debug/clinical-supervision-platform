import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import {
  withUserContext,
  type UserContext,
  type UserRole
} from "../packages/db/src/context";
import { pgcryptoRoundtrip } from "../packages/db/src/ops";
import { sql, type SQL } from "../packages/db/src/sql";

type SmokeStatus = "ok" | "warn" | "skipped" | "fail";

type SmokeCheck = {
  name: string;
  status: SmokeStatus;
  message: string;
  details?: Record<string, unknown>;
};

type Queryable = {
  execute: (query: SQL) => Promise<unknown>;
};

type ContextDatabase = Queryable & {
  transaction: <TResult>(
    operation: (tx: Queryable) => Promise<TResult>
  ) => Promise<TResult>;
};

type SmokeConnection = {
  name: "runtime" | "service";
  db: ContextDatabase;
  redactedUrl: string;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const jsonPath = join(evidenceDir, "real-db-smoke.json");
const markdownPath = join(evidenceDir, "REAL-DB-SMOKE.md");

const expectedTables = [
  "users",
  "supervisor_profiles",
  "supervisee_profiles",
  "qualifications",
  "specialty_catalog",
  "supervisor_specialties",
  "service_products",
  "availability_slots",
  "supervision_requests",
  "case_packets",
  "deidentification_checklists",
  "case_files",
  "payments",
  "refunds",
  "payouts",
  "auth_tokens",
  "totp_recovery_codes",
  "feedbacks",
  "completion_records",
  "reviews",
  "audit_logs",
  "access_logs"
] as const;

const rlsTables = [
  "users",
  "supervisor_profiles",
  "supervisee_profiles",
  "supervision_requests",
  "case_packets",
  "case_files",
  "payments",
  "refunds",
  "feedbacks",
  "completion_records",
  "reviews",
  "audit_logs",
  "access_logs"
] as const;

async function main() {
  mkdirSync(evidenceDir, { recursive: true });

  const checks: SmokeCheck[] = [];
  const runtimeUrl = process.env["DATABASE_URL"];
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];

  checks.push(checkUrlPresence(runtimeUrl, serviceUrl));
  checks.push(checkUrlSplit(runtimeUrl, serviceUrl));

  const runtime = runtimeUrl ? openConnection("runtime", runtimeUrl) : null;
  const service = serviceUrl ? openConnection("service", serviceUrl) : null;

  try {
    checks.push(await checkRuntimeRole(runtime));
    checks.push(await checkServiceRole(service, runtime));
    checks.push(await checkPgcrypto(runtime));
    checks.push(await checkAppHelpers(runtime));
    checks.push(await checkMigrationPresence(runtime));
    checks.push(await checkRlsEnabled(runtime));
    checks.push(await checkNoContextUsersSelect(runtime));
    checks.push(await checkSelfContextUsersSelect(runtime, service));
    checks.push(await checkPhiGucRoundtrip(runtime));
    checks.push(await checkTempWriteProbe(runtime));
  } finally {
    await closeConnection(runtime);
    await closeConnection(service);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "real-postgres-read-only",
    writeProbeEnabled: process.env["OPS_DB_SMOKE_WRITE"] === "1",
    connections: {
      runtime: runtime?.redactedUrl ?? null,
      service: service?.redactedUrl ?? null
    },
    checks
  };

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdown(report));

  console.log(renderConsoleSummary(checks));
  console.log(`\nReport: ${markdownPath}`);

  if (checks.some((check) => check.status === "fail")) {
    process.exitCode = 1;
  }
}

function openConnection(name: SmokeConnection["name"], url: string): SmokeConnection {
  const db: ContextDatabase = createDatabase(url);
  return { name, db, redactedUrl: redactDatabaseUrl(url) };
}

async function closeConnection(connection: SmokeConnection | null): Promise<void> {
  if (!connection) return;
  await closeDevDatabase();
}

function checkUrlPresence(runtimeUrl?: string, serviceUrl?: string): SmokeCheck {
  if (!runtimeUrl && !serviceUrl) {
    return warn(
      "db_url_presence",
      "DATABASE_URL/SERVICE_DATABASE_URL이 없어 실 DB smoke를 설정 점검 모드로만 실행했습니다."
    );
  }
  if (!runtimeUrl) {
    return warn(
      "db_url_presence",
      "DATABASE_URL이 없어 runtime(csp_app) 검증을 건너뜁니다."
    );
  }
  if (!serviceUrl) {
    return warn(
      "db_url_presence",
      "SERVICE_DATABASE_URL이 없어 service_role 샘플 조회를 건너뜁니다."
    );
  }
  return ok(
    "db_url_presence",
    "DATABASE_URL과 SERVICE_DATABASE_URL이 모두 설정되어 있습니다."
  );
}

function checkUrlSplit(runtimeUrl?: string, serviceUrl?: string): SmokeCheck {
  if (!runtimeUrl || !serviceUrl) {
    return skipped("db_url_split", "두 DB URL 중 하나가 없어 분리 검증을 건너뜁니다.");
  }
  if (runtimeUrl === serviceUrl) {
    return fail("db_url_split", "DATABASE_URL과 SERVICE_DATABASE_URL이 같습니다.");
  }
  return ok("db_url_split", "runtime/service_role DB URL이 분리되어 있습니다.");
}

async function checkRuntimeRole(runtime: SmokeConnection | null): Promise<SmokeCheck> {
  if (!runtime) return skipped("runtime_role", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const role = await currentRole(runtime.db);
    if (role.rolsuper || role.rolbypassrls) {
      return fail(
        "runtime_role",
        "runtime DB role이 superuser 또는 BYPASSRLS 권한을 갖고 있습니다.",
        role
      );
    }
    if (role.username !== "csp_app") {
      return warn("runtime_role", "runtime role이 csp_app이 아닙니다.", role);
    }
    return ok(
      "runtime_role",
      "runtime role은 csp_app이며 superuser/BYPASSRLS가 아닙니다.",
      role
    );
  } catch (error) {
    return fail("runtime_role", formatError(error));
  }
}

async function checkServiceRole(
  service: SmokeConnection | null,
  runtime: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!service)
    return skipped("service_role", "SERVICE_DATABASE_URL이 없어 건너뜁니다.");
  try {
    const role = await currentRole(service.db);
    const runtimeRole = runtime ? await currentRole(runtime.db) : null;
    if (runtimeRole && role.username === runtimeRole.username) {
      return fail("service_role", "service role과 runtime role이 같습니다.", {
        serviceRole: role.username,
        runtimeRole: runtimeRole.username
      });
    }
    return ok("service_role", "service role 연결을 확인했습니다.", role);
  } catch (error) {
    return warn("service_role", formatError(error));
  }
}

async function checkPgcrypto(runtime: SmokeConnection | null): Promise<SmokeCheck> {
  if (!runtime) return skipped("pgcrypto_roundtrip", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const value = await pgcryptoRoundtrip(runtime.db);
    if (value !== "ops-smoke") {
      return fail("pgcrypto_roundtrip", "pgcrypto roundtrip 결과가 예상과 다릅니다.", {
        value
      });
    }
    return ok("pgcrypto_roundtrip", "runtime role에서 pgcrypto encrypt/decrypt 성공.");
  } catch (error) {
    return fail("pgcrypto_roundtrip", formatError(error));
  }
}

async function checkAppHelpers(runtime: SmokeConnection | null): Promise<SmokeCheck> {
  if (!runtime) return skipped("app_helpers", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const rows = await queryRows<{
      current_user_id: string | null;
      current_user_role: string | null;
      is_admin_with_reason: string | null;
    }>(
      runtime.db,
      sql`
        select
          to_regprocedure('app.current_user_id()')::text as current_user_id,
          to_regprocedure('app.current_user_role()')::text as current_user_role,
          to_regprocedure('app.is_admin_with_reason()')::text as is_admin_with_reason
      `
    );
    const helpers = rows[0];
    const missing = Object.entries(helpers ?? {})
      .filter(([, value]) => !value)
      .map(([key]) => key);
    if (missing.length > 0) {
      return fail("app_helpers", "app schema helper 함수가 누락되었습니다.", {
        missing
      });
    }
    return ok("app_helpers", "app schema helper 함수가 존재합니다.", helpers);
  } catch (error) {
    return fail("app_helpers", formatError(error));
  }
}

async function checkMigrationPresence(
  runtime: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!runtime) return skipped("migration_presence", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const rows = await queryRows<{ table_name: string }>(
      runtime.db,
      sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name in (${sql.join(
            expectedTables.map((table) => sql`${table}`),
            sql`, `
          )})
      `
    );
    const found = new Set(rows.map((row) => row.table_name));
    const missing = expectedTables.filter((table) => !found.has(table));
    if (missing.length > 0) {
      return fail("migration_presence", "핵심 테이블 일부가 누락되었습니다.", {
        missing
      });
    }
    return ok("migration_presence", "핵심 테이블이 모두 존재합니다.", {
      tableCount: expectedTables.length
    });
  } catch (error) {
    return fail("migration_presence", formatError(error));
  }
}

async function checkRlsEnabled(runtime: SmokeConnection | null): Promise<SmokeCheck> {
  if (!runtime) return skipped("rls_enabled", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const rows = await queryRows<{
      relname: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(
      runtime.db,
      sql`
        select c.relname, c.relrowsecurity, c.relforcerowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in (${sql.join(
            rlsTables.map((table) => sql`${table}`),
            sql`, `
          )})
      `
    );
    const byName = new Map(rows.map((row) => [row.relname, row]));
    const missing = rlsTables.filter((table) => !byName.has(table));
    const disabled = rows
      .filter((row) => !row.relrowsecurity)
      .map((row) => row.relname);
    if (missing.length > 0 || disabled.length > 0) {
      return fail("rls_enabled", "RLS 대상 테이블 상태가 예상과 다릅니다.", {
        missing,
        disabled
      });
    }
    return ok("rls_enabled", "핵심 테이블 RLS가 활성화되어 있습니다.", {
      checked: rows.length,
      forceRls: rows.filter((row) => row.relforcerowsecurity).map((row) => row.relname)
    });
  } catch (error) {
    return fail("rls_enabled", formatError(error));
  }
}

async function checkNoContextUsersSelect(
  runtime: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!runtime)
    return skipped("no_context_users_select", "DATABASE_URL이 없어 건너뜁니다.");
  try {
    const rows = await queryRows<{ count: number | string }>(
      runtime.db,
      sql`select count(*)::int as count from users`
    );
    const count = Number(rows[0]?.count ?? 0);
    if (count > 0) {
      return fail(
        "no_context_users_select",
        "GUC 컨텍스트 없이 runtime role이 users 행을 볼 수 있습니다.",
        { count }
      );
    }
    return ok("no_context_users_select", "GUC 컨텍스트 없이 users SELECT가 0건입니다.");
  } catch (error) {
    return ok(
      "no_context_users_select",
      "GUC 컨텍스트 없는 users SELECT가 DB에서 차단되었습니다.",
      { error: formatError(error) }
    );
  }
}

async function checkSelfContextUsersSelect(
  runtime: SmokeConnection | null,
  service: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!runtime)
    return skipped("self_context_users_select", "DATABASE_URL이 없어 건너뜁니다.");
  if (!service) {
    return skipped(
      "self_context_users_select",
      "SERVICE_DATABASE_URL이 없어 샘플 user 조회를 건너뜁니다."
    );
  }
  try {
    const samples = await queryRows<{ id: string; role: UserRole }>(
      service.db,
      sql`select id::text as id, role from users order by created_at asc limit 1`
    );
    const sample = samples[0];
    if (!sample) {
      return skipped("self_context_users_select", "users 샘플 행이 없어 건너뜁니다.");
    }
    const count = await withUserContext(
      runtime.db,
      { userId: sample.id, role: sample.role },
      async (tx) => {
        const rows = await queryRows<{ count: number | string }>(
          tx,
          sql`select count(*)::int as count from users where id = ${sample.id}`
        );
        return Number(rows[0]?.count ?? 0);
      }
    );
    if (count !== 1) {
      return fail(
        "self_context_users_select",
        "본인 GUC 컨텍스트 SELECT가 1건이 아닙니다.",
        {
          userId: sample.id,
          role: sample.role,
          count
        }
      );
    }
    return ok(
      "self_context_users_select",
      "본인 GUC 컨텍스트에서 users self SELECT 성공.",
      {
        role: sample.role
      }
    );
  } catch (error) {
    return fail("self_context_users_select", formatError(error));
  }
}

async function checkPhiGucRoundtrip(
  runtime: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!runtime) return skipped("phi_guc_roundtrip", "DATABASE_URL이 없어 건너뜁니다.");
  if (!process.env["PHI_ENCRYPTION_KEY"]) {
    return warn(
      "phi_guc_roundtrip",
      "PHI_ENCRYPTION_KEY가 없어 phiAccess GUC 검증을 건너뜁니다."
    );
  }
  try {
    const context: UserContext = {
      userId: "00000000-0000-4000-8000-000000000001",
      role: "supervisee",
      phiAccess: true
    };
    const value = await withUserContext(runtime.db, context, async (tx) => {
      const rows = await queryRows<{ value: string }>(
        tx,
        sql`
          select pgp_sym_decrypt(
            pgp_sym_encrypt('ops-phi', current_setting('app.phi_key', true), 'cipher-algo=aes256'),
            current_setting('app.phi_key', true),
            'cipher-algo=aes256'
          ) as value
        `
      );
      return rows[0]?.value ?? null;
    });
    if (value !== "ops-phi") {
      return fail(
        "phi_guc_roundtrip",
        "phiAccess GUC roundtrip 결과가 예상과 다릅니다.",
        {
          value
        }
      );
    }
    return ok(
      "phi_guc_roundtrip",
      "phiAccess=true 컨텍스트에서 app.phi_key roundtrip 성공."
    );
  } catch (error) {
    return fail("phi_guc_roundtrip", formatError(error));
  }
}

async function checkTempWriteProbe(
  runtime: SmokeConnection | null
): Promise<SmokeCheck> {
  if (!runtime) return skipped("temp_write_probe", "DATABASE_URL이 없어 건너뜁니다.");
  if (process.env["OPS_DB_SMOKE_WRITE"] !== "1") {
    return skipped(
      "temp_write_probe",
      "OPS_DB_SMOKE_WRITE=1이 아니므로 운영 DB 쓰기 probe를 건너뜁니다."
    );
  }
  try {
    await runtime.db.execute(
      sql`create temporary table csp_ops_smoke_temp(id text primary key)`
    );
    await runtime.db.execute(sql`insert into csp_ops_smoke_temp(id) values ('ok')`);
    const rows = await queryRows<{ count: number | string }>(
      runtime.db,
      sql`select count(*)::int as count from csp_ops_smoke_temp`
    );
    const count = Number(rows[0]?.count ?? 0);
    if (count !== 1) {
      return fail(
        "temp_write_probe",
        "임시 테이블 write probe 결과가 예상과 다릅니다.",
        {
          count
        }
      );
    }
    return ok("temp_write_probe", "pg_temp 임시 테이블 write probe 성공.");
  } catch (error) {
    return fail("temp_write_probe", formatError(error));
  }
}

async function currentRole(db: Queryable): Promise<{
  username: string;
  rolsuper: boolean;
  rolbypassrls: boolean;
}> {
  const rows = await queryRows<{
    username: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
  }>(
    db,
    sql`
      select current_user::text as username, r.rolsuper, r.rolbypassrls
      from pg_roles r
      where r.rolname = current_user
    `
  );
  const role = rows[0];
  if (!role) {
    throw new Error("current_user role metadata를 찾을 수 없습니다.");
  }
  return role;
}

async function queryRows<TRow>(db: Queryable, query: SQL): Promise<TRow[]> {
  return rowsOf<TRow>(await db.execute(query));
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as TRow[];
  }
  return [];
}

function ok(
  name: string,
  message: string,
  details?: Record<string, unknown>
): SmokeCheck {
  return details
    ? { name, status: "ok", message, details }
    : { name, status: "ok", message };
}

function warn(
  name: string,
  message: string,
  details?: Record<string, unknown>
): SmokeCheck {
  return details
    ? { name, status: "warn", message, details }
    : { name, status: "warn", message };
}

function skipped(
  name: string,
  message: string,
  details?: Record<string, unknown>
): SmokeCheck {
  return details
    ? { name, status: "skipped", message, details }
    : { name, status: "skipped", message };
}

function fail(
  name: string,
  message: string,
  details?: Record<string, unknown>
): SmokeCheck {
  return details
    ? { name, status: "fail", message, details }
    : { name, status: "fail", message };
}

function redactDatabaseUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.password) url.password = "****";
    return url.toString();
  } catch {
    return "<invalid-url>";
  }
}

function renderConsoleSummary(checks: SmokeCheck[]): string {
  return checks
    .map((check) => `${statusIcon(check.status)} ${check.name}: ${check.message}`)
    .join("\n");
}

function renderMarkdown(report: {
  generatedAt: string;
  mode: string;
  writeProbeEnabled: boolean;
  connections: { runtime: string | null; service: string | null };
  checks: SmokeCheck[];
}): string {
  const rows = report.checks
    .map(
      (check) =>
        `| ${statusIcon(check.status)} ${check.status} | ${check.name} | ${check.message.replace(/\|/gu, "\\|")} |`
    )
    .join("\n");
  return `# Real DB Smoke Report

Generated: ${report.generatedAt}

Mode: ${report.mode}

Write probe enabled: ${report.writeProbeEnabled ? "yes" : "no"}

Runtime URL: ${report.connections.runtime ?? "not configured"}

Service URL: ${report.connections.service ?? "not configured"}

| Status | Check | Message |
| --- | --- | --- |
${rows}

## Notes

- 이 스크립트는 기본적으로 앱 테이블에 쓰지 않습니다.
- \`OPS_DB_SMOKE_WRITE=1\`을 설정하면 \`pg_temp\` 임시 테이블 write probe만 수행합니다.
- credential 미설정은 실패가 아니라 warn/skipped로 기록합니다.
`;
}

function statusIcon(status: SmokeStatus): string {
  if (status === "ok") return "✓";
  if (status === "fail") return "✗";
  return "⚠";
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error: unknown) => {
  mkdirSync(evidenceDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "real-postgres-read-only",
    writeProbeEnabled: process.env["OPS_DB_SMOKE_WRITE"] === "1",
    connections: { runtime: null, service: null },
    checks: [fail("real_db_smoke", formatError(error))]
  };
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdown(report));
  process.exitCode = 1;
});
