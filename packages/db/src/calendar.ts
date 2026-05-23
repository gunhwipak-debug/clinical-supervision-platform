import { decryptPhi, encryptPhi } from "@csp/shared/crypto/phi";
import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

export type ExternalCalendarConnection = {
  id: string;
  supervisorProfileId: string;
  provider: "google";
  providerAccountEmail: string | null;
  calendarId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date | string | null;
  syncStatus: "connected" | "needs_reauth" | "error" | "disconnected";
  lastSyncAt: Date | string | null;
  disconnectedAt: Date | string | null;
};

export type ExternalCalendarConnectionSummary = Omit<
  ExternalCalendarConnection,
  "accessToken" | "refreshToken"
>;

export type ExternalCalendarEventForRequest = {
  bookingId: string;
  providerEventId: string;
  connection: ExternalCalendarConnection;
};

export type ExternalCalendarCancellationTarget = ExternalCalendarEventForRequest & {
  requestId: string;
};

export type ExternalCalendarEventLink = {
  bookingId: string;
  providerEventId: string;
};

type CalendarDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function getConnectionForUser(
  db: CalendarDatabase,
  userId: string
): Promise<ExternalCalendarConnection | null> {
  const result = await db.execute(connectionSelect(sql`sp.user_id = ${userId}`));
  return rowsOf<ExternalCalendarConnection>(result)[0] ?? null;
}

export async function getConnectionSummaryForUser(
  db: CalendarDatabase,
  userId: string
): Promise<ExternalCalendarConnectionSummary | null> {
  const result = await db.execute(sql`
    select
      ecc.id,
      ecc.supervisor_profile_id as "supervisorProfileId",
      ecc.provider,
      ecc.provider_account_email as "providerAccountEmail",
      ecc.calendar_id as "calendarId",
      ecc.access_token_expires_at as "accessTokenExpiresAt",
      ecc.sync_status as "syncStatus",
      ecc.last_sync_at as "lastSyncAt",
      ecc.disconnected_at as "disconnectedAt"
    from external_calendar_connections ecc
    join supervisor_profiles sp on sp.id = ecc.supervisor_profile_id
    where sp.user_id = ${userId}
      and ecc.provider = 'google'
      and ecc.sync_status <> 'disconnected'
    limit 1
  `);

  return rowsOf<ExternalCalendarConnectionSummary>(result)[0] ?? null;
}

export async function getConnectionForSupervisorProfile(
  db: CalendarDatabase,
  supervisorProfileId: string
): Promise<ExternalCalendarConnection | null> {
  const result = await db.execute(
    connectionSelect(sql`ecc.supervisor_profile_id = ${supervisorProfileId}`)
  );
  return rowsOf<ExternalCalendarConnection>(result)[0] ?? null;
}

export async function upsertGoogleConnection(
  db: CalendarDatabase,
  input: {
    userId: string;
    providerAccountEmail: string | null;
    calendarId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date | null;
  }
): Promise<void> {
  await db.execute(sql`
    insert into external_calendar_connections (
      supervisor_profile_id,
      provider,
      provider_account_email,
      calendar_id,
      access_token_enc,
      refresh_token_enc,
      access_token_expires_at,
      sync_status,
      last_sync_at,
      disconnected_at
    )
    select
      sp.id,
      'google',
      ${input.providerAccountEmail},
      ${input.calendarId},
      ${encryptPhi(input.accessToken)},
      ${encryptPhi(input.refreshToken)},
      ${input.accessTokenExpiresAt?.toISOString() ?? null},
      'connected',
      now(),
      null
    from supervisor_profiles sp
    where sp.user_id = ${input.userId}
    on conflict (supervisor_profile_id, provider) do update
    set
      provider_account_email = excluded.provider_account_email,
      calendar_id = excluded.calendar_id,
      access_token_enc = excluded.access_token_enc,
      refresh_token_enc = excluded.refresh_token_enc,
      access_token_expires_at = excluded.access_token_expires_at,
      sync_status = 'connected',
      last_sync_at = now(),
      disconnected_at = null,
      updated_at = now()
  `);
}

export async function updateAccessToken(
  db: CalendarDatabase,
  input: {
    connectionId: string;
    accessToken: string;
    accessTokenExpiresAt: Date | null;
  }
): Promise<void> {
  await db.execute(sql`
    update external_calendar_connections
    set
      access_token_enc = ${encryptPhi(input.accessToken)},
      access_token_expires_at = ${input.accessTokenExpiresAt?.toISOString() ?? null},
      sync_status = 'connected',
      last_sync_at = now(),
      updated_at = now()
    where id = ${input.connectionId}
  `);
}

export async function markConnectionStatus(
  db: CalendarDatabase,
  connectionId: string,
  status: ExternalCalendarConnection["syncStatus"]
): Promise<void> {
  await db.execute(sql`
    update external_calendar_connections
    set sync_status = ${status}, updated_at = now()
    where id = ${connectionId}
  `);
}

export async function disconnectGoogleConnection(
  db: CalendarDatabase,
  userId: string
): Promise<void> {
  await db.execute(sql`
    update external_calendar_connections ecc
    set
      sync_status = 'disconnected',
      disconnected_at = now(),
      updated_at = now()
    from supervisor_profiles sp
    where sp.id = ecc.supervisor_profile_id
      and sp.user_id = ${userId}
      and ecc.provider = 'google'
  `);
}

export async function createCalendarEventLink(
  db: CalendarDatabase,
  input: { bookingId: string; providerEventId: string }
): Promise<void> {
  await db.execute(sql`
    insert into external_calendar_events (
      booking_id,
      provider,
      provider_event_id
    ) values (
      ${input.bookingId},
      'google',
      ${input.providerEventId}
    )
    on conflict (booking_id, provider) do update
    set provider_event_id = excluded.provider_event_id,
        cancelled_at = null
  `);
}

export async function getActiveGoogleEventForRequest(
  db: CalendarDatabase,
  requestId: string
): Promise<ExternalCalendarEventForRequest | null> {
  const result = await db.execute(sql`
    select
      b.id as "bookingId",
      e.provider_event_id as "providerEventId",
      ecc.id as "connectionId",
      ecc.supervisor_profile_id as "supervisorProfileId",
      ecc.provider,
      ecc.provider_account_email as "providerAccountEmail",
      ecc.calendar_id as "calendarId",
      ${decryptPhi(sql`ecc.access_token_enc`)} as "accessToken",
      ${decryptPhi(sql`ecc.refresh_token_enc`)} as "refreshToken",
      ecc.access_token_expires_at as "accessTokenExpiresAt",
      ecc.sync_status as "syncStatus",
      ecc.last_sync_at as "lastSyncAt",
      ecc.disconnected_at as "disconnectedAt"
    from external_calendar_events e
    join bookings b on b.id = e.booking_id
    join supervision_requests sr on sr.id = b.supervision_request_id
    join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    join external_calendar_connections ecc
      on ecc.supervisor_profile_id = sp.id
     and ecc.provider = e.provider
    where sr.id = ${requestId}
      and e.provider = 'google'
      and e.cancelled_at is null
      and ecc.sync_status <> 'disconnected'
    order by b.created_at desc
    limit 1
  `);

  const row =
    rowsOf<
      {
        bookingId: string;
        providerEventId: string;
        connectionId: string;
      } & Omit<ExternalCalendarConnection, "id">
    >(result)[0] ?? null;

  if (!row) return null;

  return {
    bookingId: row.bookingId,
    providerEventId: row.providerEventId,
    connection: {
      accessToken: row.accessToken,
      accessTokenExpiresAt: row.accessTokenExpiresAt,
      calendarId: row.calendarId,
      disconnectedAt: row.disconnectedAt,
      id: row.connectionId,
      lastSyncAt: row.lastSyncAt,
      provider: row.provider,
      providerAccountEmail: row.providerAccountEmail,
      refreshToken: row.refreshToken,
      supervisorProfileId: row.supervisorProfileId,
      syncStatus: row.syncStatus
    }
  };
}

export async function listActiveGoogleEventsForConnection(
  db: CalendarDatabase,
  connectionId: string
): Promise<ExternalCalendarEventLink[]> {
  const result = await db.execute(sql`
    select
      e.booking_id as "bookingId",
      e.provider_event_id as "providerEventId"
    from external_calendar_events e
    join bookings b on b.id = e.booking_id
    join supervision_requests sr on sr.id = b.supervision_request_id
    join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    join external_calendar_connections ecc
      on ecc.supervisor_profile_id = sp.id
     and ecc.provider = e.provider
    where ecc.id = ${connectionId}
      and e.provider = 'google'
      and e.cancelled_at is null
      and b.status in ('scheduled', 'rescheduled')
  `);

  return rowsOf<ExternalCalendarEventLink>(result);
}

export async function listGoogleEventsPendingCancellation(
  db: CalendarDatabase,
  input: { limit?: number } = {}
): Promise<ExternalCalendarCancellationTarget[]> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      b.id as "bookingId",
      e.provider_event_id as "providerEventId",
      ecc.id as "connectionId",
      ecc.supervisor_profile_id as "supervisorProfileId",
      ecc.provider,
      ecc.provider_account_email as "providerAccountEmail",
      ecc.calendar_id as "calendarId",
      ${decryptPhi(sql`ecc.access_token_enc`)} as "accessToken",
      ${decryptPhi(sql`ecc.refresh_token_enc`)} as "refreshToken",
      ecc.access_token_expires_at as "accessTokenExpiresAt",
      ecc.sync_status as "syncStatus",
      ecc.last_sync_at as "lastSyncAt",
      ecc.disconnected_at as "disconnectedAt"
    from external_calendar_events e
    join bookings b on b.id = e.booking_id
    join supervision_requests sr on sr.id = b.supervision_request_id
    join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    join external_calendar_connections ecc
      on ecc.supervisor_profile_id = sp.id
     and ecc.provider = e.provider
    where e.provider = 'google'
      and e.cancelled_at is null
      and b.status = 'cancelled'
      and sr.status in ('cancelled', 'expired', 'rejected')
      and ecc.sync_status <> 'disconnected'
    order by b.scheduled_start asc
    limit ${input.limit ?? 50}
  `);

  return rowsOf<
    {
      requestId: string;
      bookingId: string;
      providerEventId: string;
      connectionId: string;
    } & Omit<ExternalCalendarConnection, "id">
  >(result).map((row) => ({
    bookingId: row.bookingId,
    providerEventId: row.providerEventId,
    requestId: row.requestId,
    connection: {
      accessToken: row.accessToken,
      accessTokenExpiresAt: row.accessTokenExpiresAt,
      calendarId: row.calendarId,
      disconnectedAt: row.disconnectedAt,
      id: row.connectionId,
      lastSyncAt: row.lastSyncAt,
      provider: row.provider,
      providerAccountEmail: row.providerAccountEmail,
      refreshToken: row.refreshToken,
      supervisorProfileId: row.supervisorProfileId,
      syncStatus: row.syncStatus
    }
  }));
}

export async function markGoogleEventCancelled(
  db: CalendarDatabase,
  input: { bookingId: string; providerEventId: string }
): Promise<void> {
  await db.execute(sql`
    update external_calendar_events
    set cancelled_at = coalesce(cancelled_at, now())
    where booking_id = ${input.bookingId}
      and provider = 'google'
      and provider_event_id = ${input.providerEventId}
  `);
}

function connectionSelect(predicate: SQLWrapper): SQL {
  return sql`
    select
      ecc.id,
      ecc.supervisor_profile_id as "supervisorProfileId",
      ecc.provider,
      ecc.provider_account_email as "providerAccountEmail",
      ecc.calendar_id as "calendarId",
      ${decryptPhi(sql`ecc.access_token_enc`)} as "accessToken",
      ${decryptPhi(sql`ecc.refresh_token_enc`)} as "refreshToken",
      ecc.access_token_expires_at as "accessTokenExpiresAt",
      ecc.sync_status as "syncStatus",
      ecc.last_sync_at as "lastSyncAt",
      ecc.disconnected_at as "disconnectedAt"
    from external_calendar_connections ecc
    join supervisor_profiles sp on sp.id = ecc.supervisor_profile_id
    where ${predicate}
      and ecc.provider = 'google'
      and ecc.sync_status <> 'disconnected'
    limit 1
  `;
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
