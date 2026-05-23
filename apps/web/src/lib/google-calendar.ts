import { calendar } from "@csp/db";
import type { SQL } from "drizzle-orm";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_FREE_BUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";
const CALENDAR_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy"
].join(" ");

export type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type BusyInterval = {
  start: Date;
  end: Date;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

type GoogleUserInfo = {
  email?: string;
};

type GoogleFreeBusyResponse = {
  calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  error?: { message?: string };
};

type GoogleEventResponse = {
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
  hangoutLink?: string;
  id?: string;
  error?: { message?: string };
};

export type GoogleCalendarEventResult = {
  eventId: string;
  meetingUrl: string | null;
};

export type GoogleCalendarBlockReason =
  | "calendar_config_required"
  | "calendar_reauth_required"
  | "calendar_sync_failed";

type CalendarTokenDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export function getGoogleCalendarConfig(origin: string): GoogleCalendarConfig | null {
  const clientId = process.env["GOOGLE_CALENDAR_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CALENDAR_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri:
      process.env["GOOGLE_CALENDAR_REDIRECT_URI"] ??
      `${origin}/api/me/google-calendar/callback`
  };
}

export function buildGoogleCalendarAuthUrl(
  config: GoogleCalendarConfig,
  state: string
): string {
  const params = new URLSearchParams({
    access_type: "offline",
    client_id: config.clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPES,
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function googleCalendarBlockReason(
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null
): GoogleCalendarBlockReason | null {
  if (!config) return "calendar_config_required";
  if (connection.syncStatus === "needs_reauth") return "calendar_reauth_required";
  if (connection.syncStatus === "error") return "calendar_sync_failed";
  return null;
}

export async function exchangeGoogleCalendarCode(
  config: GoogleCalendarConfig,
  code: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date | null;
}> {
  const body = await tokenRequest({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri
  });

  if (!body.access_token || !body.refresh_token) {
    throw new Error(body.error ?? "google_calendar_token_missing");
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    accessTokenExpiresAt: expiresAt(body.expires_in)
  };
}

export async function getGoogleCalendarEmail(
  accessToken: string
): Promise<string | null> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return null;
  const body = (await response.json()) as GoogleUserInfo;
  return body.email ?? null;
}

export async function listBusyIntervalsForConnection(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null,
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  const accessToken = await ensureAccessToken(db, connection, config);

  const response = await fetch(GOOGLE_FREE_BUSY_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      calendarExpansionMax: 1,
      items: [{ id: connection.calendarId }],
      timeMax: timeMax.toISOString(),
      timeMin: timeMin.toISOString(),
      timeZone: "Asia/Seoul"
    })
  });
  const body = (await response.json()) as GoogleFreeBusyResponse;

  if (!response.ok) {
    await calendar.markConnectionStatus(db, connection.id, "error");
    throw new Error(body.error?.message ?? "google_calendar_freebusy_failed");
  }

  const busy = body.calendars?.[connection.calendarId]?.busy ?? [];
  await calendar.markConnectionStatus(db, connection.id, "connected");
  return busy.map((item) => ({
    end: new Date(item.end),
    start: new Date(item.start)
  }));
}

export async function createGoogleCalendarEvent(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null,
  input: {
    title: string;
    description: string;
    start: Date;
    end: Date;
    attendeeEmails?: string[];
    conferenceRequestId?: string;
  }
): Promise<GoogleCalendarEventResult> {
  const accessToken = await ensureAccessToken(db, connection, config);

  const calendarId = encodeURIComponent(connection.calendarId);
  const params = new URLSearchParams();
  if (input.attendeeEmails && input.attendeeEmails.length > 0) {
    params.set("sendUpdates", "all");
  }
  if (input.conferenceRequestId) {
    params.set("conferenceDataVersion", "1");
  }
  const eventUrl = `${GOOGLE_CALENDAR_API}/${calendarId}/events${
    params.size > 0 ? `?${params.toString()}` : ""
  }`;
  const conferenceData = input.conferenceRequestId
    ? {
        createRequest: {
          requestId: input.conferenceRequestId
        }
      }
    : undefined;
  const response = await fetch(eventUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      attendees: uniqueEmails(input.attendeeEmails).map((email) => ({ email })),
      ...(conferenceData ? { conferenceData } : {}),
      description: input.description,
      end: { dateTime: input.end.toISOString(), timeZone: "Asia/Seoul" },
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: true,
      start: { dateTime: input.start.toISOString(), timeZone: "Asia/Seoul" },
      summary: input.title
    })
  });
  const body = (await response.json()) as GoogleEventResponse;

  if (!response.ok || !body.id) {
    await calendar.markConnectionStatus(db, connection.id, "error");
    throw new Error(body.error?.message ?? "google_calendar_event_failed");
  }

  await calendar.markConnectionStatus(db, connection.id, "connected");
  return { eventId: body.id, meetingUrl: extractMeetingUrl(body) };
}

export async function updateGoogleCalendarEvent(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null,
  input: {
    providerEventId: string;
    title: string;
    description: string;
    start: Date;
    end: Date;
    attendeeEmails?: string[];
  }
): Promise<GoogleCalendarEventResult> {
  const accessToken = await ensureAccessToken(db, connection, config);

  const calendarId = encodeURIComponent(connection.calendarId);
  const eventId = encodeURIComponent(input.providerEventId);
  const params = new URLSearchParams({ sendUpdates: "all" });
  const attendeePatch = input.attendeeEmails
    ? { attendees: uniqueEmails(input.attendeeEmails).map((email) => ({ email })) }
    : {};
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/${calendarId}/events/${eventId}?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        ...attendeePatch,
        description: input.description,
        end: { dateTime: input.end.toISOString(), timeZone: "Asia/Seoul" },
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: true,
        start: { dateTime: input.start.toISOString(), timeZone: "Asia/Seoul" },
        summary: input.title
      })
    }
  );
  const body = (await response.json()) as GoogleEventResponse;

  if (!response.ok || !body.id) {
    await calendar.markConnectionStatus(db, connection.id, "error");
    throw new Error(body.error?.message ?? "google_calendar_event_update_failed");
  }

  await calendar.markConnectionStatus(db, connection.id, "connected");
  return { eventId: body.id, meetingUrl: extractMeetingUrl(body) };
}

export async function cancelGoogleCalendarEvent(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null,
  providerEventId: string
): Promise<boolean> {
  const accessToken = await ensureAccessToken(db, connection, config);

  const calendarId = encodeURIComponent(connection.calendarId);
  const eventId = encodeURIComponent(providerEventId);
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/${calendarId}/events/${eventId}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` }
    }
  );

  if (response.ok || response.status === 404 || response.status === 410) {
    await calendar.markConnectionStatus(db, connection.id, "connected");
    return true;
  }

  await calendar.markConnectionStatus(db, connection.id, "error");
  throw new Error("google_calendar_event_cancel_failed");
}

export async function revokeGoogleCalendarConnection(
  connection: calendar.ExternalCalendarConnection
): Promise<boolean> {
  const token = connection.refreshToken || connection.accessToken;
  if (!token) return false;

  const response = await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString()
  });

  return response.ok;
}

export function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

async function ensureAccessToken(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  config: GoogleCalendarConfig | null
): Promise<string> {
  const expiresAtMs = connection.accessTokenExpiresAt
    ? new Date(connection.accessTokenExpiresAt).getTime()
    : 0;
  if (expiresAtMs > Date.now() + 60_000) {
    return connection.accessToken;
  }

  if (!config) {
    await calendar.markConnectionStatus(db, connection.id, "needs_reauth");
    throw new Error("google_calendar_reauth_required");
  }

  const body = await tokenRequest({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken
  });

  if (!body.access_token) {
    await calendar.markConnectionStatus(db, connection.id, "needs_reauth");
    throw new Error(body.error ?? "google_calendar_refresh_failed");
  }

  await calendar.updateAccessToken(db, {
    accessToken: body.access_token,
    accessTokenExpiresAt: expiresAt(body.expires_in),
    connectionId: connection.id
  });

  return body.access_token;
}

async function tokenRequest(
  params: Record<string, string>
): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  });
  return (await response.json()) as GoogleTokenResponse;
}

function expiresAt(expiresIn: number | undefined): Date | null {
  return typeof expiresIn === "number" ? new Date(Date.now() + expiresIn * 1000) : null;
}

function uniqueEmails(value: string[] | undefined): string[] {
  const seen = new Set<string>();
  for (const email of value ?? []) {
    const normalized = email.trim().toLowerCase();
    if (normalized) seen.add(normalized);
  }
  return Array.from(seen);
}

function extractMeetingUrl(event: GoogleEventResponse): string | null {
  const videoUrl = event.conferenceData?.entryPoints?.find(
    (entryPoint) => entryPoint.entryPointType === "video" && entryPoint.uri
  )?.uri;
  return videoUrl ?? event.hangoutLink ?? null;
}
