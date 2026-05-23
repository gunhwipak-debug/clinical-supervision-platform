import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  calendar,
  createDatabase,
  files,
  notifications,
  supervision,
  withUserContext
} from "@csp/db";
import { assertTransition } from "@csp/shared/supervision/status-machine";
import { drizzle } from "drizzle-orm/pglite";
import { sql, type SQL } from "drizzle-orm";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "../auth/current-user";
import { COMPLETION_RECORD_RESPONSIBILITY_NOTICE } from "./completion-record";

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
  "packages/db/drizzle/0013_document_workspace.sql",
  "packages/db/drizzle/0014_google_calendar.sql",
  "packages/db/drizzle/0016_add_zoom_meeting_url.sql"
] as const;

const superviseeId = "30000000-0000-0000-0000-000000000001";
const otherSuperviseeId = "30000000-0000-0000-0000-000000000002";
const supervisorId = "30000000-0000-0000-0000-000000000003";
const supervisorAsSuperviseeId = "30000000-0000-0000-0000-000000000005";
const adminId = "30000000-0000-0000-0000-000000000004";
const productId = "30000000-0000-4000-8000-000000000101";
const zoom90ProductId = "30000000-0000-4000-8000-000000000102";
const asyncProductId = "30000000-0000-4000-8000-000000000103";
const dockerDatabaseUrl =
  process.env["DOCKER_DATABASE_URL"] ??
  "postgres://postgres:postgres@127.0.0.1:54322/postgres";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

beforeEach(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  await applyMigrations((statement) => pg.query(statement), {
    removePgcryptoExtension: true
  });
  process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
  process.env["GOOGLE_CALENDAR_CLIENT_ID"] = "test-google-calendar-client-id";
  process.env["GOOGLE_CALENDAR_CLIENT_SECRET"] = "test-google-calendar-client-secret";
  await seedDomain(db);
});

afterEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await pg.close();
});

describe("supervision request integration", () => {
  it("creates a draft request from a public approved service product", async () => {
    const request = await createDraft();

    expect(request?.status).toBe("draft");
    expect(request?.supervisorId).toBe(supervisorId);
    expect(request?.retentionDays).toBe(30);
  });

  it("requires a selected schedule before creating a request through the API", async () => {
    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(422);
    expect(body.error?.code).toBe("slot_required");
  });

  it("creates an async draft without holding a calendar slot", async () => {
    await connectGoogleCalendar();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        serviceProductId: asyncProductId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as {
      data?: {
        calendarSync?: string;
        request?: { id: string; productKind?: string; status: string };
      };
      error?: { code: string };
    };
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("not_required");
    expect(body.data?.request?.productKind).toBe("async_comment");
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    await expectNotificationKinds(body.data?.request?.id ?? "", [
      "supervision_request_draft_created_supervisee",
      "supervision_request_draft_created_supervisor"
    ]);
  });

  it("lets a supervisor act as a supervisee when requesting another supervisor", async () => {
    await connectGoogleCalendar();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
        .mockResolvedValueOnce(jsonResponse({ id: "google-event-supervisor-user" }))
    );
    const owner = currentUser(supervisorAsSuperviseeId, "supervisor");
    const createResponse = await callCreateRequestRoute(owner, {
      retentionDays: 30,
      selectedSlotEnd: "2026-06-01T14:00:00+09:00",
      selectedSlotStart: "2026-06-01T13:00:00+09:00",
      serviceProductId: productId,
      urgency: "normal"
    });
    const createBody = (await createResponse.json()) as {
      data?: { request?: { id: string; superviseeId: string; status: string } };
      error?: { code: string };
    };
    const requestId = createBody.data?.request?.id ?? "";

    expect(createResponse.status, JSON.stringify(createBody)).toBe(200);
    expect(createBody.data?.request?.superviseeId).toBe(supervisorAsSuperviseeId);

    const packetResponse = await callCasePacketRoute(
      owner,
      requestId,
      validCasePacket()
    );
    expect(packetResponse.status, await packetResponse.text()).toBe(200);

    const deidResponse = await callDeidRoute(owner, requestId, completeChecklist());
    expect(deidResponse.status, await deidResponse.text()).toBe(200);

    const submitResponse = await callSubmitRoute(owner, requestId);
    const submitBody = (await submitResponse.json()) as {
      data?: { request?: { status: string } };
      error?: { code: string };
    };
    expect(submitResponse.status, JSON.stringify(submitBody)).toBe(200);
    expect(submitBody.data?.request?.status).toBe("submitted");
  });

  it("rejects a supervisor trying to request their own supervision product", async () => {
    const response = await callCreateRequestRoute(
      currentUser(supervisorId, "supervisor"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(422);
    expect(body.error?.code).toBe("self_supervision_not_allowed");
  });

  it("rejects a selected slot that is already in the past", async () => {
    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2000-01-03T14:00:00+09:00",
        selectedSlotStart: "2000-01-03T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(422);
    expect(body.error?.code).toBe("past_slot");
  });

  it("succeeds timed booking with platform-only calendar when the supervisor has not connected Google Calendar", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("not_required");
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a booking and Google Calendar event when a selected slot is available", async () => {
    await connectGoogleCalendar();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          calendars: { primary: { busy: [] } }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          conferenceData: {
            entryPoints: [
              {
                entryPointType: "video",
                uri: "https://meet.google.com/abc-defg-hij"
              }
            ]
          },
          id: "google-event-created"
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as {
      data?: { request?: { id: string; status: string } };
      error?: { code: string };
    };

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.request?.status).toBe("draft");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/freeBusy"),
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events?sendUpdates=all&conferenceDataVersion=1"),
      expect.objectContaining({ method: "POST" })
    );
    const eventCall = fetchMock.mock.calls[1];
    const eventInit = eventCall?.[1] as RequestInit | undefined;
    const eventBody = typeof eventInit?.body === "string" ? eventInit.body : "{}";
    const eventPayload = JSON.parse(eventBody) as {
      attendees?: Array<{ email?: string }>;
      conferenceData?: { createRequest?: { requestId?: string } };
      description?: string;
      summary?: string;
    };
    expect(eventPayload.attendees).toEqual([{ email: "supervisee@example.com" }]);
    expect(eventPayload.conferenceData?.createRequest?.requestId).toMatch(
      /^[0-9a-f-]{36}$/u
    );
    expect(eventPayload.summary).toBe("ClinicFlow 슈퍼비전");
    expect(eventPayload.description).not.toContain("PT-");

    const linked = await db.execute<{ providerEventId: string }>(sql`
      select e.provider_event_id as "providerEventId"
      from external_calendar_events e
      join bookings b on b.id = e.booking_id
      where b.supervision_request_id = ${body.data?.request?.id ?? ""}
    `);
    expect(rowsOf(linked)[0]?.providerEventId).toBe("google-event-created");
    const detail = await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee", phiAccess: true },
      (tx) => supervision.getSupervisionRequestDetails(tx, body.data?.request?.id ?? "")
    );
    expect(detail?.meetingUrl).toBe("https://meet.google.com/abc-defg-hij");
    const createdNotifications = await db.execute<{
      kind: string;
      title: string;
      userId: string;
    }>(sql`
      select
        user_id as "userId",
        kind,
        payload->>'title' as title
      from notifications
      where payload->'metadata'->>'requestId' = ${body.data?.request?.id ?? ""}
      order by kind
    `);
    expect(rowsOf(createdNotifications)).toEqual([
      {
        kind: "supervision_request_scheduled_supervisee",
        title: "예약 초안이 생성되었습니다",
        userId: superviseeId
      },
      {
        kind: "supervision_request_scheduled_supervisor",
        title: "새 예약 시간이 확보되었습니다",
        userId: supervisorId
      }
    ]);
  });

  it("matches selected booking length to the chosen service product", async () => {
    await seedZoom90ProductAndAvailability();
    await connectGoogleCalendar();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
      .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
      .mockResolvedValueOnce(jsonResponse({ id: "google-event-zoom-90" }));
    vi.stubGlobal("fetch", fetchMock);

    const tooShortResponse = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T16:00:00+09:00",
        selectedSlotStart: "2026-06-01T15:00:00+09:00",
        serviceProductId: zoom90ProductId,
        urgency: "normal"
      }
    );
    const tooShortBody = (await tooShortResponse.json()) as ApiEnvelope;

    expect(tooShortResponse.status, JSON.stringify(tooShortBody)).toBe(409);
    expect(tooShortBody.error?.code).toBe("slot_unavailable");

    const validResponse = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T16:30:00+09:00",
        selectedSlotStart: "2026-06-01T15:00:00+09:00",
        serviceProductId: zoom90ProductId,
        urgency: "normal"
      }
    );
    const validBody = (await validResponse.json()) as {
      data?: { request?: { id: string; status: string } };
      error?: { code: string };
    };

    expect(validResponse.status, JSON.stringify(validBody)).toBe(200);
    expect(validBody.data?.request?.status).toBe("draft");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("completes the booking internally and removes the orphaned Google Calendar event if link persistence fails", async () => {
    const existingRequest = await createDraft();
    const existingBooking = await createBooking(existingRequest?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(existingBooking?.id ?? "", "google-event-duplicate");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
      .mockResolvedValueOnce(jsonResponse({ id: "google-event-duplicate" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("sync_failed");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events/google-event-duplicate"),
      expect.objectContaining({ method: "DELETE" })
    );
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(2);
  });

  it("rejects a selected slot that overlaps Google Calendar busy time", async () => {
    await connectGoogleCalendar();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        calendars: {
          primary: {
            busy: [
              {
                end: "2026-06-01T05:30:00.000Z",
                start: "2026-06-01T04:30:00.000Z"
              }
            ]
          }
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(409);
    expect(body.error?.code).toBe("slot_unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a selected slot outside the supervisor's configured availability", async () => {
    await connectGoogleCalendar();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        calendars: { primary: { busy: [] } }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T19:00:00+09:00",
        selectedSlotStart: "2026-06-01T18:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as ApiEnvelope;
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(409);
    expect(body.error?.code).toBe("slot_unavailable");
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(0);
  });

  it("succeeds timed booking with platform-only calendar when the platform Google Calendar OAuth config is missing", async () => {
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "");
    await connectGoogleCalendar();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("not_required");
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("succeeds timed booking with platform-only calendar when a connected Google Calendar needs reauth", async () => {
    await connectGoogleCalendar();
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor", phiAccess: true },
      (tx) =>
        calendar
          .getConnectionForUser(tx, supervisorId)
          .then((connection) =>
            connection
              ? calendar.markConnectionStatus(tx, connection.id, "needs_reauth")
              : undefined
          )
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCreateRequestRoute(
      currentUser(superviseeId, "supervisee"),
      {
        retentionDays: 30,
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00",
        serviceProductId: productId,
        urgency: "normal"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };
    const bookingCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from bookings
    `);

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("sync_failed");
    expect(rowsOf(bookingCount)[0]?.count ?? 0).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides disconnected Google Calendar connections from supervisor availability controls", async () => {
    await connectGoogleCalendar();
    await withUserContext(db, { userId: supervisorId, role: "supervisor" }, (tx) =>
      calendar.disconnectGoogleConnection(tx, supervisorId)
    );

    const summary = await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      (tx) => calendar.getConnectionSummaryForUser(tx, supervisorId)
    );

    expect(summary).toBeNull();
  });

  it("cancels active Google Calendar events before disconnecting the calendar", async () => {
    const request = await createDraft();
    const booking = await createBooking(request?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(booking?.id ?? "", "google-event-before-disconnect");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await callDisconnectGoogleCalendarRoute(
      currentUser(supervisorId, "supervisor")
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events/google-event-before-disconnect"),
      expect.objectContaining({ method: "DELETE" })
    );
    await expectGoogleEventCancelled(booking?.id ?? "");
  });

  it("returns packet_incomplete when submitting without a case packet", async () => {
    const request = await createDraft();

    const response = await callSubmitRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? ""
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(422);
    expect(body.error?.code).toBe("packet_incomplete");
  });

  it("submits once a case packet exists even when deidentification is incomplete", async () => {
    const request = await createDraft();
    await seedPlainPacket(request?.id ?? "");

    const deidResponse = await callDeidRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      { ...completeChecklist(), purposeUnderstood: false }
    );
    const deidBody = (await deidResponse.json()) as ApiEnvelope;
    expect(deidResponse.status).toBe(422);
    expect(deidBody.error?.code).toBe("deid_incomplete");

    const submitResponse = await callSubmitRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? ""
    );
    const submitBody = (await submitResponse.json()) as ApiEnvelope;
    expect(submitResponse.status).toBe(200);
    expect(submitBody.data?.request?.status).toBe("submitted");
  });

  it("rejects out-of-scope draft to accepted transitions", () => {
    expect(() => assertTransition("draft", "accepted", "supervisee")).toThrow(
      "Cannot transition"
    );
  });

  it("keeps another supervisee from selecting someone else's request under csp_app", async () => {
    const request = await createDraft();
    await pg.query("set role csp_app");
    await pg.query(
      `select set_config('app.current_user_id', '${otherSuperviseeId}', false)`
    );
    await pg.query("select set_config('app.current_user_role', 'supervisee', false)");

    const selected = await db.execute<{ id: string }>(sql`
      select id from supervision_requests where id = ${request?.id ?? ""}
    `);

    expect(rowsOf(selected)).toHaveLength(0);
    await pg.query("reset role");
  });

  it("returns 403 when a supervisor tries to edit the supervisee case packet", async () => {
    const request = await createDraft();

    const response = await callCasePacketRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      validCasePacket()
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(403);
    expect(body.error?.code).toBe("forbidden");
  });

  it("returns invalid_state when submitting a cancelled request", async () => {
    const request = await createDraft();
    await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "cancelled"
        );
      }
    );

    const response = await callSubmitRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? ""
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status).toBe(409);
    expect(body.error?.code).toBe("invalid_state");
  });

  it("cancels the local booking and Google Calendar event when a supervisee cancels", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(booking?.id ?? "", "google-event-1");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await callCancelRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? ""
    );
    const body = (await response.json()) as {
      data?: { calendarSync?: string; request?: { status: string } };
    };

    expect(response.status).toBe(200);
    expect(body.data?.request?.status).toBe("cancelled");
    expect(body.data?.calendarSync).toBe("cancelled");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events/google-event-1"),
      expect.objectContaining({ method: "DELETE" })
    );
    await expectBookingStatus(booking?.id ?? "", "cancelled");
    await expectGoogleEventCancelled(booking?.id ?? "");
  });

  it("keeps failed Google Calendar cancellations in a retryable queue", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(booking?.id ?? "", "google-event-pending-cancel");
    await withUserContext(
      db,
      { userId: adminId, role: "admin", phiAccess: true },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "cancelled"
        );
        await supervision.updateBookingsStatusForRequest(tx, {
          requestId: request?.id ?? "",
          status: "cancelled"
        });
      }
    );

    const pending = await withUserContext(
      db,
      { userId: adminId, role: "admin", phiAccess: true },
      (tx) => calendar.listGoogleEventsPendingCancellation(tx)
    );

    expect(pending).toHaveLength(1);
    expect(pending[0]?.providerEventId).toBe("google-event-pending-cancel");

    await withUserContext(db, { userId: adminId, role: "admin" }, (tx) =>
      calendar.markGoogleEventCancelled(tx, {
        bookingId: booking?.id ?? "",
        providerEventId: "google-event-pending-cancel"
      })
    );
    const after = await withUserContext(
      db,
      { userId: adminId, role: "admin", phiAccess: true },
      (tx) => calendar.listGoogleEventsPendingCancellation(tx)
    );
    expect(after).toHaveLength(0);
  });

  it("reschedules a booking and keeps Google Calendar in sync", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(booking?.id ?? "", "google-event-reschedule");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ calendars: { primary: { busy: [] } } }))
      .mockResolvedValueOnce(
        jsonResponse({
          hangoutLink: "https://meet.google.com/rescheduled",
          id: "google-event-reschedule"
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await callRescheduleRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      {
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00"
      }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/events/google-event-reschedule?sendUpdates=all"),
      expect.objectContaining({ method: "PATCH" })
    );
    const updateCall = fetchMock.mock.calls[1];
    const updateInit = updateCall?.[1] as RequestInit | undefined;
    const updateBody = typeof updateInit?.body === "string" ? updateInit.body : "{}";
    expect(JSON.parse(updateBody)).not.toHaveProperty("attendees");

    const detail = await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee", phiAccess: true },
      (tx) => supervision.getSupervisionRequestDetails(tx, request?.id ?? "")
    );
    expect(detail?.bookingStatus).toBe("rescheduled");
    expect(detail?.meetingUrl).toBe("https://meet.google.com/rescheduled");
    expect(new Date(detail?.scheduledStart ?? "").toISOString()).toBe(
      "2026-06-01T04:00:00.000Z"
    );
  });

  it("succeeds rescheduling with platform-only calendar when the supervisor calendar is not connected", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    expect(booking).toBeTruthy();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callRescheduleRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      {
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("not_required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("succeeds rescheduling with platform-only calendar when Google Calendar OAuth config is missing", async () => {
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "");
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    await connectGoogleCalendar();
    await linkGoogleEvent(booking?.id ?? "", "google-event-reschedule-no-config");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callRescheduleRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      {
        selectedSlotEnd: "2026-06-01T14:00:00+09:00",
        selectedSlotStart: "2026-06-01T13:00:00+09:00"
      }
    );
    const body = (await response.json()) as { data?: { calendarSync?: string }; error?: unknown };

    expect(response.status, JSON.stringify(body)).toBe(200);
    expect(body.data?.calendarSync).toBe("not_required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records supervisor session outcomes on the booking", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "", {
      scheduledEnd: new Date("2026-05-18T02:00:00.000Z"),
      scheduledStart: new Date("2026-05-18T01:00:00.000Z")
    });
    expect(booking).toBeTruthy();
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "accepted"
        );
      }
    );

    const response = await callSessionOutcomeRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      { outcome: "no_show_supervisee" }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(200);
    await expectBookingStatus(booking?.id ?? "", "no_show_supervisee");
    await expectNotificationKinds(request?.id ?? "", [
      "session_outcome_supervisee",
      "session_outcome_supervisor"
    ]);
  });

  it("blocks session outcome recording before the scheduled end time", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    expect(booking).toBeTruthy();
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "accepted"
        );
      }
    );

    const response = await callSessionOutcomeRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      { outcome: "completed" }
    );
    const body = (await response.json()) as ApiEnvelope;

    expect(response.status, JSON.stringify(body)).toBe(409);
    expect(body.error?.code).toBe("session_not_ended");
    await expectBookingStatus(booking?.id ?? "", "scheduled");
  });

  it("submits a draft after packet and deidentification gates pass", async () => {
    const request = await createDraft();
    await seedPlainPacket(request?.id ?? "");
    await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee" },
      async (tx) => {
        await supervision.upsertDeidentificationChecklist(
          tx,
          superviseeId,
          request?.id ?? "",
          completeChecklist()
        );
      }
    );

    const response = await callSubmitRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? ""
    );
    const body = (await response.json()) as {
      data?: { request?: { status: string } };
      error?: { code: string };
    };

    expect(response.status).toBe(200);
    expect(body.data?.request?.status).toBe("submitted");
  });

  it("requires feedback approval before issuing an assessment completion record and returning a stamp", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "in_review"
        );
      }
    );

    const feedback = await callFeedbackRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      {
        recommendations:
          "인지적 가설과 보호 요인을 분리하여 다음 회기 계획에 반영하세요.",
        summary:
          "제출 자료의 개입 흐름은 전반적으로 명확하며, 평가 결과와 상담 목표의 연결을 보강하면 좋겠습니다."
      }
    );
    const feedbackBody = (await feedback.json()) as ApiEnvelope;
    expect(feedback.status, JSON.stringify(feedbackBody)).toBe(200);
    expect(feedbackBody.data?.request?.status).toBe("feedback_submitted");
    await expectNotificationKinds(request?.id ?? "", ["feedback_submitted_supervisee"]);

    const blocked = await callCompletionRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      validCompletionRecord()
    );
    const blockedBody = (await blocked.json()) as ApiEnvelope;

    expect(blocked.status, JSON.stringify(blockedBody)).toBe(422);
    expect(blockedBody.error?.code).toBe("feedback_approval_required");

    const earlyStamp = await callStampRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      { note: "승인 전 파일 확인을 시도합니다." }
    );
    const earlyStampBody = (await earlyStamp.json()) as ApiEnvelope;

    expect(earlyStamp.status, JSON.stringify(earlyStampBody)).toBe(409);
    expect(earlyStampBody.error?.code).toBe("invalid_state");

    const approval = await callApprovalRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      { note: "피드백을 확인하고 승인합니다." }
    );
    const approvalBody = (await approval.json()) as ApiEnvelope;
    expect(approval.status, JSON.stringify(approvalBody)).toBe(200);
    await expectNotificationKinds(request?.id ?? "", [
      "feedback_approved_supervisor",
      "feedback_submitted_supervisee"
    ]);

    const issued = await callCompletionRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      validCompletionRecord()
    );
    const issuedBody = (await issued.json()) as ApiEnvelope;
    const recordCount = await db.execute<{ count: number }>(sql`
      select count(*)::int as count
      from completion_records
      where supervision_request_id = ${request?.id ?? ""}
    `);
    const completionRecord = await db.execute<{ responsibilityNotice: string }>(sql`
      select responsibility_notice as "responsibilityNotice"
      from completion_records
      where supervision_request_id = ${request?.id ?? ""}
      order by issued_at desc
      limit 1
    `);
    const latestReview = await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor", phiAccess: true },
      (tx) => files.latestDocumentReviewCycle(tx, request?.id ?? "")
    );

    expect(issued.status, JSON.stringify(issuedBody)).toBe(200);
    expect(issuedBody.data?.request?.status).toBe("completion_record_issued");
    expect(rowsOf(recordCount)[0]?.count ?? 0).toBe(1);
    expect(rowsOf(completionRecord)[0]?.responsibilityNotice).toContain(
      COMPLETION_RECORD_RESPONSIBILITY_NOTICE
    );
    expect(latestReview?.status).toBe("stamped_returned");
    await expectNotificationKinds(request?.id ?? "", [
      "completion_record_issued_supervisee",
      "feedback_approved_supervisor",
      "feedback_submitted_supervisee"
    ]);

    const returnedStamp = await callStampRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      { note: "완료기록 발급 후 파일 확인을 남깁니다." }
    );
    expect(returnedStamp.status, await returnedStamp.text()).toBe(200);
  });

  it("allows counseling completion to skip the assessment stamp transition", () => {
    expect(() =>
      assertTransition("feedback_submitted", "completed", "supervisee")
    ).not.toThrow();
  });

  it("shows submitted feedback and completes no-stamp requests through supervisee review", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee", phiAccess: true },
      async (tx) => {
        await supervision.upsertCasePacket(tx, superviseeId, request?.id ?? "", {
          ...validCasePacket(),
          needsCompletionRecord: false
        });
      }
    );
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "in_review"
        );
      }
    );

    const feedback = await callFeedbackRoute(
      currentUser(supervisorId, "supervisor"),
      request?.id ?? "",
      {
        recommendations:
          "보고서 결론과 권고를 평가 결과 순서에 맞춰 다시 정리해보세요.",
        summary:
          "제출 자료의 핵심 가설은 충분히 설명되어 있으며, 문장 구조를 조금 더 간결하게 다듬으면 좋겠습니다."
      }
    );
    expect(feedback.status, await feedback.text()).toBe(200);

    const detail = await withUserContext(
      db,
      { userId: superviseeId, role: "supervisee", phiAccess: true },
      (tx) =>
        supervision.getSupervisionRequestDetails(tx, request?.id ?? "", {
          includePhi: true
        })
    );
    expect(detail?.feedbackSummary).toContain("핵심 가설");
    expect(detail?.feedbackRecommendations).toContain("보고서 결론");

    const review = await callReviewRoute(
      currentUser(superviseeId, "supervisee"),
      request?.id ?? "",
      validReview()
    );
    const reviewBody = (await review.json()) as ApiEnvelope;

    expect(review.status, JSON.stringify(reviewBody)).toBe(200);
    expect(reviewBody.data?.request?.status).toBe("completed");
  });

  it("finds upcoming accepted bookings and deduplicates session reminders", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    expect(booking).toBeTruthy();
    await withUserContext(
      db,
      { userId: supervisorId, role: "supervisor" },
      async (tx) => {
        await supervision.updateSupervisionRequestStatus(
          tx,
          request?.id ?? "",
          "accepted"
        );
      }
    );

    const targets = await withUserContext(
      db,
      { adminReason: "session-reminder-test", role: "admin", userId: adminId },
      (tx) =>
        supervision.listUpcomingSessionReminderTargets(tx, {
          from: new Date("2026-06-01T00:00:00.000Z"),
          to: new Date("2026-06-01T03:00:00.000Z")
        })
    );
    expect(targets).toHaveLength(1);
    expect(targets[0]?.requestId).toBe(request?.id);
    expect(targets[0]?.superviseeId).toBe(superviseeId);
    expect(targets[0]?.supervisorId).toBe(supervisorId);

    const reminderKey = `${request?.id ?? ""}:${new Date(
      targets[0]?.scheduledStart ?? ""
    ).toISOString()}`;
    await withUserContext(
      db,
      { adminReason: "session-reminder-test", role: "admin", userId: adminId },
      (tx) =>
        notifications.createNotification(tx, {
          kind: "session_reminder_supervisee",
          payload: {
            body: "테스트 일정 알림",
            metadata: { reminderKey },
            title: "슈퍼비전 일정이 다가옵니다"
          },
          userId: superviseeId
        })
    );
    const exists = await withUserContext(
      db,
      { adminReason: "session-reminder-test", role: "admin", userId: adminId },
      (tx) =>
        notifications.hasNotificationWithMetadata(tx, {
          kind: "session_reminder_supervisee",
          metadataKey: "reminderKey",
          metadataValue: reminderKey,
          userId: superviseeId
        })
    );
    expect(exists).toBe(true);
  });

  it("finds stale unpaid booking holds that should expire", async () => {
    const request = await createDraft();
    expect(request).toBeTruthy();
    const booking = await createBooking(request?.id ?? "");
    expect(booking).toBeTruthy();
    await db.execute(sql`
      update supervision_requests
      set created_at = now() - interval '48 hours'
      where id = ${request?.id ?? ""}
    `);

    const targets = await withUserContext(
      db,
      { adminReason: "booking-hold-expiry-test", role: "admin", userId: adminId },
      (tx) =>
        supervision.listStaleBookingHoldTargets(tx, {
          cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000)
        })
    );
    expect(targets).toEqual([
      expect.objectContaining({
        bookingStatus: "scheduled",
        requestId: request?.id,
        status: "draft",
        superviseeId,
        supervisorId
      })
    ]);
  });
});

describe.skipIf(!process.env["DOCKER_PG"])(
  "supervision request pgcrypto integration",
  () => {
    let dockerDb: ReturnType<typeof createDatabase>;

    beforeEach(async () => {
      dockerDb = createDatabase(dockerDatabaseUrl);
      await resetDockerDatabase(dockerDb);
      await applyMigrations((statement) => dockerDb.execute(sql.raw(statement)));
      process.env["PHI_ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef";
      await seedDomain(dockerDb);
    });

    afterEach(async () => {
      await closeDockerDatabase(dockerDb);
    });

    it("round-trips encrypted case packet title through pgcrypto", async () => {
      const request = await createDockerDraft(dockerDb);
      const saved = await withUserContext(
        dockerDb,
        { userId: superviseeId, role: "supervisee", phiAccess: true },
        async (tx) =>
          supervision.upsertCasePacket(
            tx,
            superviseeId,
            request?.id ?? "",
            validCasePacket()
          )
      );

      expect(saved?.title).toBe("성인 평가 보고서 검토");
      expect(saved?.chiefComplaint).toBe(
        "진단 가설과 보고서 구성을 검토받고 싶습니다."
      );
    });

    it("rejects PHI in case packet title before encryption", async () => {
      const request = await createDockerDraft(dockerDb);
      mockRuntime(currentUser(superviseeId, "supervisee"), dockerDb);
      const { PUT } =
        await import("../../app/api/supervision-requests/[id]/case-packet/route");

      const response = await PUT(
        jsonRequest({ ...validCasePacket(), title: "010-1234-5678 관련 의뢰" }),
        {
          params: Promise.resolve({ id: request?.id ?? "" })
        }
      );
      const body = (await response.json()) as ApiEnvelope;

      expect(response.status).toBe(422);
      expect(body.error?.code).toBe("phi_detected");
    });
  }
);

type ApiEnvelope = {
  data: { request?: { status: string } } | null;
  error: { code: string } | null;
};

async function createDraft(): Promise<supervision.SupervisionRequestSummary | null> {
  return withUserContext(db, { userId: superviseeId, role: "supervisee" }, async (tx) =>
    supervision.createSupervisionRequest(tx, superviseeId, {
      serviceProductId: productId,
      retentionDays: 30,
      urgency: "normal",
      desiredDeadline: null
    })
  );
}

async function createDockerDraft(
  database: ReturnType<typeof createDatabase>
): Promise<supervision.SupervisionRequestSummary | null> {
  return withUserContext(
    database,
    { userId: superviseeId, role: "supervisee" },
    async (tx) =>
      supervision.createSupervisionRequest(tx, superviseeId, {
        serviceProductId: productId,
        retentionDays: 30,
        urgency: "normal",
        desiredDeadline: null
      })
  );
}

async function seedPlainPacket(requestId: string): Promise<void> {
  await db.execute(sql`
    insert into case_packets (
      supervision_request_id,
      title_enc,
      chief_complaint_enc,
      referral_reason_enc
    ) values (
      ${requestId},
      ${Buffer.from("title")},
      ${Buffer.from("chief")},
      ${Buffer.from("reason")}
    )
  `);
}

async function callSubmitRoute(
  current: CurrentUser,
  requestId: string
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } = await import("../../app/api/supervision-requests/[id]/submit/route");
  return POST(
    new NextRequest(`http://localhost/api/supervision-requests/${requestId}/submit`),
    {
      params: Promise.resolve({ id: requestId })
    }
  );
}

async function callCreateRequestRoute(
  current: CurrentUser,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } = await import("../../app/api/supervision-requests/route");
  return POST(jsonRequest(body, "http://localhost/api/supervision-requests"));
}

async function callCancelRoute(
  current: CurrentUser,
  requestId: string
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } = await import("../../app/api/supervision-requests/[id]/cancel/route");
  return POST(
    new NextRequest(`http://localhost/api/supervision-requests/${requestId}/cancel`, {
      method: "POST"
    }),
    {
      params: Promise.resolve({ id: requestId })
    }
  );
}

async function callDisconnectGoogleCalendarRoute(current: CurrentUser): Promise<Response> {
  mockRuntime(current, db);
  const { DELETE } = await import("../../app/api/me/google-calendar/route");
  return DELETE(new NextRequest("http://localhost/api/me/google-calendar", {
    method: "DELETE"
  }));
}

async function callRescheduleRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } =
    await import("../../app/api/supervision-requests/[id]/reschedule/route");
  return POST(
    new NextRequest(
      `http://localhost/api/supervision-requests/${requestId}/reschedule`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      }
    ),
    {
      params: Promise.resolve({ id: requestId })
    }
  );
}

async function callSessionOutcomeRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } =
    await import("../../app/api/supervision-requests/[id]/session-outcome/route");
  return POST(
    new NextRequest(
      `http://localhost/api/supervision-requests/${requestId}/session-outcome`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      }
    ),
    {
      params: Promise.resolve({ id: requestId })
    }
  );
}

async function callFeedbackRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } =
    await import("../../app/api/supervision-requests/[id]/feedback/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callApprovalRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } =
    await import("../../app/api/supervision-requests/[id]/approval/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callCompletionRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } =
    await import("../../app/api/supervision-requests/[id]/completion/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callReviewRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } = await import("../../app/api/supervision-requests/[id]/review/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callStampRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { POST } = await import("../../app/api/supervision-requests/[id]/stamp/route");
  return POST(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callDeidRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, boolean>
): Promise<Response> {
  mockRuntime(current, db);
  const { PUT } =
    await import("../../app/api/supervision-requests/[id]/deidentification/route");
  return PUT(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

async function callCasePacketRoute(
  current: CurrentUser,
  requestId: string,
  body: Record<string, unknown>
): Promise<Response> {
  mockRuntime(current, db);
  const { PUT } =
    await import("../../app/api/supervision-requests/[id]/case-packet/route");
  return PUT(jsonRequest(body), { params: Promise.resolve({ id: requestId }) });
}

function mockRuntime(
  current: CurrentUser,
  database: typeof db | ReturnType<typeof createDatabase>
): void {
  vi.resetModules();
  vi.doMock("@/lib/auth/current-user", () => ({
    getCurrentUser: () => Promise.resolve(current)
  }));
  vi.doMock("@/lib/auth/database", () => ({
    createRuntimeDatabase: () => database
  }));
}

function jsonRequest(
  body: unknown,
  url = "http://localhost/api/supervision-requests/test"
): NextRequest {
  return new NextRequest(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status
  });
}

async function createBooking(
  requestId: string,
  input: {
    scheduledEnd?: Date;
    scheduledStart?: Date;
  } = {}
): Promise<supervision.Booking | null> {
  return withUserContext(db, { userId: superviseeId, role: "supervisee" }, async (tx) =>
    supervision.createBookingForRequest(tx, {
      requestId,
      scheduledEnd: input.scheduledEnd ?? new Date("2026-06-01T02:00:00.000Z"),
      scheduledStart: input.scheduledStart ?? new Date("2026-06-01T01:00:00.000Z"),
      superviseeId
    })
  );
}

async function connectGoogleCalendar(
  input: { accessTokenExpiresAt?: Date } = {}
): Promise<void> {
  await withUserContext(
    db,
    { userId: supervisorId, role: "supervisor", phiAccess: true },
    async (tx) =>
      calendar.upsertGoogleConnection(tx, {
        accessToken: "google-access-token",
        accessTokenExpiresAt:
          input.accessTokenExpiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
        calendarId: "primary",
        providerAccountEmail: "supervisor@example.com",
        refreshToken: "google-refresh-token",
        userId: supervisorId
      })
  );
}

async function linkGoogleEvent(
  bookingId: string,
  providerEventId: string
): Promise<void> {
  await withUserContext(db, { userId: superviseeId, role: "supervisee" }, async (tx) =>
    calendar.createCalendarEventLink(tx, { bookingId, providerEventId })
  );
}

async function expectBookingStatus(bookingId: string, status: string): Promise<void> {
  const result = await db.execute<{ status: string }>(sql`
    select status from bookings where id = ${bookingId}
  `);
  expect(rowsOf(result)[0]?.status).toBe(status);
}

async function expectGoogleEventCancelled(bookingId: string): Promise<void> {
  const result = await db.execute<{ cancelledAt: Date | string | null }>(sql`
    select cancelled_at as "cancelledAt"
    from external_calendar_events
    where booking_id = ${bookingId}
  `);
  expect(rowsOf(result)[0]?.cancelledAt).toBeTruthy();
}

async function expectNotificationKinds(
  requestId: string,
  expectedKinds: string[]
): Promise<void> {
  const result = await db.execute<{ kind: string }>(sql`
    select kind
    from notifications
    where payload->'metadata'->>'requestId' = ${requestId}
    order by kind
  `);
  expect(rowsOf(result).map((row) => row.kind)).toEqual([...expectedKinds].sort());
}

function currentUser(
  userId: string,
  role: "supervisee" | "supervisor" | "admin"
): CurrentUser {
  return {
    session: {
      userId,
      role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
      sessionId: "test"
    },
    user: {
      id: userId,
      email: `${role}@example.com`,
      role,
      status: "active",
      totpSecretEnc: null,
      totpEnabled: role === "admin",
      passwordChangedAt: null
    }
  };
}

function validCasePacket(): supervision.CasePacketInput {
  return {
    title: "성인 평가 보고서 검토",
    purpose: ["report_quality"],
    clientAgeBand: "19-39",
    clientGender: "비식별",
    setting: "hospital",
    chiefComplaint: "진단 가설과 보고서 구성을 검토받고 싶습니다.",
    referralReason: "검사 결과 통합과 문장 표현을 점검받고 싶습니다.",
    testsUsed: ["MMPI-2", "K-WAIS-IV"],
    requestItems: ["diagnostic_hypothesis_review"],
    preferredMethod: "async_comment",
    needsCompletionRecord: true
  };
}

function validCompletionRecord(): Record<string, unknown> {
  return {
    reviewedMaterials: ["사례보고서 초안", "심리검사 결과 요약본"],
    scope: ["검사 해석의 논리성", "보고서 구조와 피드백 반영 여부"],
    limitations: "비식별 자료와 제출된 문서 범위 안에서만 검토했습니다.",
    responsibilityNotice:
      "최종 임상 판단과 외부 제출 문서의 책임은 담당 임상가에게 있습니다."
  };
}

function validReview(): Record<string, unknown> {
  return {
    educational: 5,
    ethics: 5,
    expertise: 5,
    freeText: "피드백 내용과 권고를 확인했습니다.",
    helpfulness: 5,
    onTime: 5,
    responseSpeed: 5,
    reuseIntent: 5,
    specificity: 5
  };
}

function completeChecklist(): supervision.DeidentificationChecklistInput {
  return {
    removedName: true,
    removedRrn: true,
    removedPhone: true,
    removedAddress: true,
    removedGuardianName: true,
    removedOrgName: true,
    removedChartNumber: true,
    filenameSafe: true,
    rawDataSafe: true,
    minimalInfo: true,
    clientConsentConfirmed: true,
    purposeUnderstood: true
  };
}

async function applyMigrations(
  execute: (statement: string) => Promise<unknown>,
  options: { removePgcryptoExtension?: boolean } = {}
): Promise<void> {
  for (const migration of migrations) {
    const source = readFileSync(migration, "utf8");
    const migrationSql =
      options.removePgcryptoExtension === true
        ? source.replace(
            /CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint\n?/u,
            ""
          )
        : source;
    const statements = migrationSql
      .split(/--> statement-breakpoint/g)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await execute(statement);
    }
  }

  if (options.removePgcryptoExtension === true) {
    await execute(`
      create or replace function pgp_sym_encrypt(data text, key text, options text)
      returns bytea
      language sql
      immutable
      as $$ select convert_to(data, 'UTF8') $$
    `);
    await execute(`
      create or replace function pgp_sym_decrypt(data bytea, key text, options text)
      returns text
      language sql
      immutable
      as $$ select convert_from(data, 'UTF8') $$
    `);
  }
}

async function seedDomain(database: {
  execute: (query: SQL) => Promise<unknown>;
}): Promise<void> {
  await database.execute(sql`
    insert into users (id, email, role, password_hash, totp_enabled)
    values
      (${superviseeId}, 'supervisee-epic4@example.com', 'supervisee', 'hash', false),
      (${otherSuperviseeId}, 'other-supervisee-epic4@example.com', 'supervisee', 'hash', false),
      (${supervisorId}, 'supervisor-epic4@example.com', 'supervisor', 'hash', true),
      (${supervisorAsSuperviseeId}, 'supervisor-owner-epic4@example.com', 'supervisor', 'hash', true),
      (${adminId}, 'admin-epic4@example.com', 'admin', 'hash', true)
  `);
  await database.execute(sql`
    insert into supervisor_profiles (
      id,
      user_id,
      display_name,
      verification_status,
      visibility
    ) values (
      '30000000-0000-0000-0000-000000000100',
      ${supervisorId},
      'EPIC4 슈퍼바이저',
      'approved',
      'public'
    )
  `);
  await database.execute(sql`
    insert into service_products (
      id,
      supervisor_profile_id,
      kind,
      title,
      price_krw,
      active
    ) values (
      ${productId},
      '30000000-0000-0000-0000-000000000100',
      'zoom_60',
      '60분 화상 슈퍼비전',
      120000,
      true
    ), (
      ${asyncProductId},
      '30000000-0000-0000-0000-000000000100',
      'async_comment',
      '보고서 코멘트',
      120000,
      true
    )
  `);
  await database.execute(sql`
    insert into availability_slots (
      supervisor_profile_id,
      weekday,
      start_time,
      end_time,
      timezone
    ) values
      (
        '30000000-0000-0000-0000-000000000100',
        1,
        '10:00',
        '11:00',
        'Asia/Seoul'
      ),
      (
        '30000000-0000-0000-0000-000000000100',
        1,
        '13:00',
        '14:00',
        'Asia/Seoul'
      )
  `);
}

async function seedZoom90ProductAndAvailability(): Promise<void> {
  await db.execute(sql`
    insert into service_products (
      id,
      supervisor_profile_id,
      kind,
      title,
      price_krw,
      active
    ) values (
      ${zoom90ProductId},
      '30000000-0000-0000-0000-000000000100',
      'zoom_90',
      '90분 화상 슈퍼비전',
      180000,
      true
    )
  `);
  await db.execute(sql`
    insert into availability_slots (
      supervisor_profile_id,
      weekday,
      start_time,
      end_time,
      timezone
    ) values (
      '30000000-0000-0000-0000-000000000100',
      1,
      '15:00',
      '17:00',
      'Asia/Seoul'
    )
  `);
}

async function resetDockerDatabase(
  database: ReturnType<typeof createDatabase>
): Promise<void> {
  await database.execute(sql`drop schema if exists public cascade`);
  await database.execute(sql`drop schema if exists app cascade`);
  await database.execute(sql`create schema public`);
  await database.execute(sql`grant all on schema public to postgres`);
  await database.execute(sql`grant all on schema public to public`);
}

async function closeDockerDatabase(
  database: ReturnType<typeof createDatabase>
): Promise<void> {
  await (
    database as unknown as { $client: { end: () => Promise<void> } }
  ).$client.end();
}

function rowsOf<TRow>(result: TRow[] | { rows: TRow[] }): TRow[] {
  return Array.isArray(result) ? result : result.rows;
}
