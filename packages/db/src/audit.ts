import { sql, type SQL } from "drizzle-orm";

type Queryable = {
  execute: (query: SQL) => Promise<unknown>;
};

export type AuditLogRow = {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  context: unknown;
  createdAt: Date | string;
};

export type AccessLogRow = {
  id: string;
  userId: string;
  fileId: string;
  action: string;
  ipAddress: string | null;
  signedUrlId: string | null;
  createdAt: Date | string;
};

export async function listAuditLogs(
  db: Queryable,
  input: { limit?: number } = {}
): Promise<AuditLogRow[]> {
  const limit = boundedLimit(input.limit);
  const result = await db.execute(sql`
    select
      id,
      actor_user_id as "actorUserId",
      actor_role as "actorRole",
      action,
      target_type as "targetType",
      target_id as "targetId",
      reason,
      ip_address as "ipAddress",
      user_agent as "userAgent",
      context,
      created_at as "createdAt"
    from audit_logs
    order by created_at desc
    limit ${limit}
  `);
  return rowsOf<AuditLogRow>(result);
}

export async function listAccessLogs(
  db: Queryable,
  input: { limit?: number } = {}
): Promise<AccessLogRow[]> {
  const limit = boundedLimit(input.limit);
  const result = await db.execute(sql`
    select
      id,
      user_id as "userId",
      file_id as "fileId",
      action,
      ip_address as "ipAddress",
      signed_url_id as "signedUrlId",
      created_at as "createdAt"
    from access_logs
    order by created_at desc
    limit ${limit}
  `);
  return rowsOf<AccessLogRow>(result);
}

function boundedLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.trunc(limit), 1), 200);
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
