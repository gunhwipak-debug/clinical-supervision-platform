import { calendar, supervision } from "@csp/db";
import type { SQL } from "drizzle-orm";
import {
  cancelGoogleCalendarEvent,
  getGoogleCalendarConfig
} from "@/lib/google-calendar";

type CalendarSyncDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export type CalendarCancelResult =
  | "no_event"
  | "cancelled"
  | "needs_reauth_or_config"
  | "failed";

export async function cancelRequestBookingAndGoogleEvent(
  db: CalendarSyncDatabase,
  input: { requestId: string; origin: string }
): Promise<CalendarCancelResult> {
  const event = await calendar.getActiveGoogleEventForRequest(db, input.requestId);
  let result: CalendarCancelResult = "no_event";

  if (event) {
    try {
      const cancelled = await cancelGoogleCalendarEvent(
        db,
        event.connection,
        getGoogleCalendarConfig(input.origin),
        event.providerEventId
      );
      if (cancelled) {
        await calendar.markGoogleEventCancelled(db, {
          bookingId: event.bookingId,
          providerEventId: event.providerEventId
        });
        result = "cancelled";
      } else {
        result = "needs_reauth_or_config";
      }
    } catch (error) {
      result = isCalendarAuthProblem(error) ? "needs_reauth_or_config" : "failed";
    }
  }

  await supervision.updateBookingsStatusForRequest(db, {
    requestId: input.requestId,
    status: "cancelled"
  });

  return result;
}

function isCalendarAuthProblem(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return (
    message === "google_calendar_reauth_required" ||
    message === "google_calendar_refresh_failed" ||
    message === "invalid_grant"
  );
}
