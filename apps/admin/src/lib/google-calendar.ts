import { calendar } from "@csp/db";
import type { SQL } from "drizzle-orm";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";

type CalendarTokenDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
};

export async function cancelGoogleCalendarEvent(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection,
  providerEventId: string
): Promise<boolean> {
  const accessToken = await ensureAccessToken(db, connection);
  if (!accessToken) return false;

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/${encodeURIComponent(
      connection.calendarId
    )}/events/${encodeURIComponent(providerEventId)}?sendUpdates=all`,
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

async function ensureAccessToken(
  db: CalendarTokenDatabase,
  connection: calendar.ExternalCalendarConnection
): Promise<string | null> {
  const expiresAtMs = connection.accessTokenExpiresAt
    ? new Date(connection.accessTokenExpiresAt).getTime()
    : 0;
  if (expiresAtMs > Date.now() + 60_000) {
    return connection.accessToken;
  }

  const config = getGoogleCalendarConfig();
  if (!config) {
    await calendar.markConnectionStatus(db, connection.id, "needs_reauth");
    return null;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken
    }).toString()
  });
  const body = (await response.json()) as GoogleTokenResponse;

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

function getGoogleCalendarConfig(): GoogleCalendarConfig | null {
  const clientId = process.env["GOOGLE_CALENDAR_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CALENDAR_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function expiresAt(expiresIn: number | undefined): Date | null {
  return typeof expiresIn === "number" ? new Date(Date.now() + expiresIn * 1000) : null;
}
