import { sql, type SQL } from "drizzle-orm";

export type NotificationPayload = {
  body: string;
  href?: string;
  metadata?: Record<string, string>;
  title: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  kind: string;
  payload: NotificationPayload;
  readAt: Date | string | null;
  createdAt: Date | string;
};

type NotificationDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function createNotification(
  db: NotificationDatabase,
  input: {
    userId: string;
    kind: string;
    payload: NotificationPayload;
  }
): Promise<NotificationRecord | null> {
  const result = await db.execute(sql`
    insert into notifications (user_id, kind, payload)
    values (
      ${input.userId},
      ${input.kind},
      ${JSON.stringify(input.payload)}::jsonb
    )
    returning
      id,
      user_id as "userId",
      kind,
      payload,
      read_at as "readAt",
      created_at as "createdAt"
  `);

  return rowsOf<NotificationRecord>(result)[0] ?? null;
}

export async function listNotifications(
  db: NotificationDatabase,
  userId: string,
  limit = 50
): Promise<NotificationRecord[]> {
  const result = await db.execute(sql`
    select
      id,
      user_id as "userId",
      kind,
      payload,
      read_at as "readAt",
      created_at as "createdAt"
    from notifications
    where user_id = ${userId}
    order by created_at desc
    limit ${limit}
  `);

  return rowsOf<NotificationRecord>(result);
}

export async function countUnreadNotifications(
  db: NotificationDatabase,
  userId: string
): Promise<number> {
  const result = await db.execute(sql`
    select count(*)::int as count
    from notifications
    where user_id = ${userId}
      and read_at is null
  `);

  return rowsOf<{ count: number }>(result)[0]?.count ?? 0;
}

export async function hasNotificationWithMetadata(
  db: NotificationDatabase,
  input: {
    userId: string;
    kind: string;
    metadataKey: string;
    metadataValue: string;
  }
): Promise<boolean> {
  const result = await db.execute(sql`
    select 1 as found
    from notifications
    where user_id = ${input.userId}
      and kind = ${input.kind}
      and payload->'metadata'->>${input.metadataKey} = ${input.metadataValue}
    limit 1
  `);

  return rowsOf<{ found: number }>(result).length > 0;
}

function rowsOf<TRow>(result: unknown): TRow[] {
  if (Array.isArray(result)) {
    return result as TRow[];
  }

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
