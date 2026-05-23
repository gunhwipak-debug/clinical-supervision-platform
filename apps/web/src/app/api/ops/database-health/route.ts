import { createDatabase } from "@csp/db";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type StepResult =
  | { ok: true }
  | { ok: false; error: { name: string; message: string } };

type ValueResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; error: { name: string; message: string } };

export async function GET(request: NextRequest) {
  const token = process.env["OPS_HEALTH_TOKEN"];
  const provided = request.headers.get("x-ops-health-token");

  if (!token || provided !== token) {
    return Response.json({ ok: false }, { status: 404 });
  }

  const env = {
    hasDatabaseUrl: Boolean(process.env["DATABASE_URL"]),
    hasNetlifyDbUrl: Boolean(process.env["NETLIFY_DB_URL"]),
    hasServiceDatabaseUrl: Boolean(process.env["SERVICE_DATABASE_URL"])
  };

  const connection = captureValue(() => createDatabase());

  const selectOne = connection.ok
    ? await captureAsync(async () => {
        await connection.value.execute(sql`select 1 as ok`);
      })
    : skipped();

  const termsVersions = connection.ok
    ? await captureAsync(async () => {
        await connection.value.execute(sql`select count(*) from terms_versions`);
      })
    : skipped();

  return Response.json({
    ok: connection.ok && selectOne.ok && termsVersions.ok,
    env,
    checks: {
      connection: stepResult(connection),
      selectOne,
      termsVersions
    }
  });
}

function captureValue<TValue>(operation: () => TValue): ValueResult<TValue> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return { ok: false, error: sanitizeError(error) };
  }
}

async function captureAsync(operation: () => Promise<void>): Promise<StepResult> {
  try {
    await operation();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: sanitizeError(error) };
  }
}

function skipped(): StepResult {
  return { ok: false, error: { name: "Skipped", message: "No database client" } };
}

function stepResult<TValue>(result: ValueResult<TValue>): StepResult {
  if (result.ok) return { ok: true };
  return result;
}

function sanitizeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.slice(0, 240)
    };
  }

  return {
    name: "UnknownError",
    message: String(error).slice(0, 240)
  };
}
