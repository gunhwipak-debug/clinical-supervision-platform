import { createDatabase } from "@csp/db";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { manualMigrations } from "@/lib/ops/netlify-migrations.generated";

export const runtime = "nodejs";

type AppliedMigration = {
  name: string;
};

export async function POST(request: NextRequest) {
  const token = process.env["OPS_HEALTH_TOKEN"];
  const provided = request.headers.get("x-ops-health-token");

  if (!token || provided !== token) {
    return Response.json({ ok: false }, { status: 404 });
  }

  try {
    const db = createDatabase();
    await db.execute(sql`
      create table if not exists csp_manual_migrations (
        name text primary key,
        applied_at timestamp with time zone default now() not null
      )
    `);

    const appliedResult = await db.execute(sql`
      select name
      from csp_manual_migrations
      order by name
    `);
    const applied = new Set(rowsOf<AppliedMigration>(appliedResult).map((row) => row.name));
    const requestedName = request.nextUrl.searchParams.get("name");
    const migration = requestedName
      ? manualMigrations.find((candidate) => candidate.name === requestedName)
      : manualMigrations.find((candidate) => !applied.has(candidate.name));

    if (!migration) {
      return Response.json({
        ok: true,
        done: true,
        applied: [...applied].sort()
      });
    }

    if (applied.has(migration.name)) {
      return Response.json({
        ok: true,
        skipped: migration.name,
        applied: [...applied].sort()
      });
    }

    const statements = splitMigration(migration.sql);
    await db.transaction(async (tx) => {
      for (const statement of statements) {
        await tx.execute(sql.raw(statement));
      }

      await tx.execute(sql`
        insert into csp_manual_migrations (name)
        values (${migration.name})
      `);
    });

    return Response.json({
      ok: true,
      applied: migration.name,
      statementCount: statements.length
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}

function splitMigration(migrationSql: string): string[] {
  return migrationSql
    .split(/-->\s*statement-breakpoint/u)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) return result as TRow[];
  if (result && typeof result === "object" && "rows" in result) {
    const rows = result.rows;
    if (Array.isArray(rows)) return rows as TRow[];
  }

  return [];
}

function sanitizeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message.slice(0, 400)
    };
  }

  return {
    name: "UnknownError",
    message: String(error).slice(0, 400)
  };
}
