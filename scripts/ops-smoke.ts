import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getMailer, ResendMailer } from "../packages/shared/src/email/mailer";
import {
  getStorageAdapter,
  StorageConfigurationError
} from "../packages/shared/src/storage";
import {
  getTossClient,
  TossConfigurationError
} from "../packages/shared/src/payments/toss";
import { closeDevDatabase, createDatabase } from "../packages/db/src/client";
import { listExpiredCaseFiles } from "../packages/db/src/files";
import { pgcryptoRoundtrip } from "../packages/db/src/ops";

type SmokeStatus = "ok" | "warn" | "skipped" | "fail";

type SmokeCheck = {
  name: string;
  status: SmokeStatus;
  message: string;
  details?: Record<string, unknown>;
};

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDir = join(root, "demo-evidence");
const jsonPath = join(evidenceDir, "ops-smoke.json");
const markdownPath = join(evidenceDir, "OPS-REPORT.md");

async function main() {
  mkdirSync(evidenceDir, { recursive: true });
  const checks: SmokeCheck[] = [];

  checks.push(checkDbConfiguration());
  checks.push(checkRoleSplit());
  checks.push(checkAdminAllowlist());
  checks.push(await checkPgcryptoRoundtrip());
  checks.push(checkStorageAdapter());
  checks.push(checkGoogleCalendarConfig());
  checks.push(await checkTossAdapter());
  checks.push(checkMailerConfig());
  checks.push(await checkPurgeDryRun());

  const report = {
    generatedAt: new Date().toISOString(),
    checks
  };
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdown(report));

  console.log(renderConsoleSummary(checks));
  await closeDevDatabase();

  if (checks.some((check) => check.status === "fail")) {
    process.exitCode = 1;
  }
}

function checkDbConfiguration(): SmokeCheck {
  if (process.env["DEV_DB"] === "pglite") {
    return ok("db_configuration", "DEV_DB=pglite 로컬 데모 DB 모드입니다.");
  }
  if (!process.env["DATABASE_URL"]) {
    return warn("db_configuration", "DATABASE_URL이 없어 운영 DB 연결은 건너뜁니다.");
  }
  return ok("db_configuration", "DATABASE_URL이 설정되어 있습니다.");
}

function checkRoleSplit(): SmokeCheck {
  if (process.env["DEV_DB"] === "pglite") {
    return warn(
      "role_split",
      "PGlite 데모는 csp_app/service_role을 같은 파일 DB 인스턴스로 처리합니다."
    );
  }
  const runtimeUrl = process.env["DATABASE_URL"];
  const serviceUrl = process.env["SERVICE_DATABASE_URL"];
  if (!runtimeUrl || !serviceUrl) {
    return warn(
      "role_split",
      "DATABASE_URL 또는 SERVICE_DATABASE_URL이 없어 role 분리 검증을 건너뜁니다."
    );
  }
  if (runtimeUrl === serviceUrl) {
    return warn("role_split", "DATABASE_URL과 SERVICE_DATABASE_URL이 같습니다.");
  }
  return ok("role_split", "runtime/service_role DB URL이 분리되어 있습니다.");
}

function checkAdminAllowlist(): SmokeCheck {
  const allowlist = process.env["ADMIN_IP_ALLOWLIST"];
  if (allowlist) {
    return ok("admin_ip_allowlist", "관리자 콘솔 IP allowlist 설정 확인 완료.");
  }
  if (process.env["NODE_ENV"] === "production") {
    return fail(
      "admin_ip_allowlist",
      "운영 환경에서는 ADMIN_IP_ALLOWLIST를 설정해 관리자 콘솔 접근망을 제한해야 합니다."
    );
  }
  return warn(
    "admin_ip_allowlist",
    "ADMIN_IP_ALLOWLIST가 없어 개발 환경에서는 관리자 콘솔 네트워크 제한을 건너뜁니다."
  );
}

async function checkPgcryptoRoundtrip(): Promise<SmokeCheck> {
  const db = safeCreateDatabase();
  if (!db) return skipped("pgcrypto_roundtrip", "DB 연결 정보가 없어 건너뜁니다.");
  try {
    const value = await pgcryptoRoundtrip(db);
    if (value !== "ops-smoke") {
      return fail("pgcrypto_roundtrip", "pgcrypto roundtrip 결과가 예상과 다릅니다.");
    }
    return ok("pgcrypto_roundtrip", "pgcrypto encrypt/decrypt roundtrip 성공.");
  } catch (error) {
    return warn("pgcrypto_roundtrip", formatError(error));
  }
}

function checkStorageAdapter(): SmokeCheck {
  try {
    const adapter = getStorageAdapter();
    return ok("storage_adapter", `${adapter.constructor.name} 설정 확인 완료.`);
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return warn("storage_adapter", error.message);
    }
    return fail("storage_adapter", formatError(error));
  }
}

function checkGoogleCalendarConfig(): SmokeCheck {
  const clientId = process.env["GOOGLE_CALENDAR_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CALENDAR_CLIENT_SECRET"];
  const redirectUri = process.env["GOOGLE_CALENDAR_REDIRECT_URI"];

  if (clientId && clientSecret) {
    return ok("google_calendar", "구글 캘린더 OAuth 설정 확인 완료.", {
      redirectUri: redirectUri ?? "기본값: {origin}/api/me/google-calendar/callback"
    });
  }

  const message =
    "예약 시스템은 구글 캘린더 OAuth가 필수입니다. GOOGLE_CALENDAR_CLIENT_ID와 GOOGLE_CALENDAR_CLIENT_SECRET이 없으면 슈퍼바이저 OAuth, FreeBusy 충돌 제외, 예약 이벤트 생성/변경/삭제를 보장할 수 없어 배포 준비 상태가 아닙니다.";
  return fail("google_calendar", message);
}

async function checkTossAdapter(): Promise<SmokeCheck> {
  try {
    const client = getTossClient();
    const intent = await client.createIntent({
      paymentId: "ops-smoke",
      amount: 1000,
      orderName: "Ops smoke",
      customerEmail: "ops@example.com"
    });
    return ok("toss_adapter", "Toss adapter dry-run intent 생성 성공.", {
      orderId: intent.orderId
    });
  } catch (error) {
    if (error instanceof TossConfigurationError) {
      if (process.env["NODE_ENV"] === "production") {
        return fail("toss_adapter", error.message);
      }
      return warn("toss_adapter", error.message);
    }
    return fail("toss_adapter", formatError(error));
  }
}

function checkMailerConfig(): SmokeCheck {
  try {
    const mailer = getMailer();
    if (process.env["NODE_ENV"] === "production" && !(mailer instanceof ResendMailer)) {
      return fail(
        "mailer_config",
        "운영 환경에서는 MAILER_MODE=resend와 RESEND_API_KEY, MAIL_FROM이 필요합니다."
      );
    }
    return ok("mailer_config", `${mailer.constructor.name} 설정 확인 완료.`);
  } catch (error) {
    if (process.env["NODE_ENV"] === "production") {
      return fail("mailer_config", formatError(error));
    }
    return warn("mailer_config", formatError(error));
  }
}

async function checkPurgeDryRun(): Promise<SmokeCheck> {
  const db = safeCreateDatabase();
  if (!db) return skipped("purge_dry_run", "DB 연결 정보가 없어 건너뜁니다.");
  try {
    const expired = await listExpiredCaseFiles(db, new Date());
    return ok("purge_dry_run", "만료 파일 dry-run 조회 성공.", {
      expiredCount: expired.length
    });
  } catch (error) {
    return fail("purge_dry_run", formatError(error));
  }
}

function safeCreateDatabase(): ReturnType<typeof createDatabase> | null {
  try {
    if (process.env["DEV_DB"] === "pglite" || process.env["DATABASE_URL"]) {
      return createDatabase(process.env["DATABASE_URL"]);
    }
  } catch {
    return null;
  }
  return null;
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

function warn(name: string, message: string): SmokeCheck {
  return { name, status: "warn", message };
}

function skipped(name: string, message: string): SmokeCheck {
  return { name, status: "skipped", message };
}

function fail(name: string, message: string): SmokeCheck {
  return { name, status: "fail", message };
}

function renderConsoleSummary(checks: SmokeCheck[]): string {
  return checks
    .map((check) => `${statusIcon(check.status)} ${check.name}: ${check.message}`)
    .join("\n");
}

function renderMarkdown(report: { generatedAt: string; checks: SmokeCheck[] }): string {
  const rows = report.checks
    .map(
      (check) =>
        `| ${statusIcon(check.status)} ${check.status} | ${check.name} | ${check.message.replace(/\|/gu, "\\|")} |`
    )
    .join("\n");
  return `# OPS Smoke Report

Generated: ${report.generatedAt}

| Status | Check | Message |
| --- | --- | --- |
${rows}
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

main().catch(async (error: unknown) => {
  mkdirSync(evidenceDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    checks: [fail("ops_smoke", formatError(error))]
  };
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownPath, renderMarkdown(report));
  await closeDevDatabase();
  process.exitCode = 1;
});
