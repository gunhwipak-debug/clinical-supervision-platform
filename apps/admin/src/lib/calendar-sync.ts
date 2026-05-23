import { calendar, supervision } from "@csp/db";
import type { SQL } from "drizzle-orm";
import { cancelGoogleCalendarEvent } from "./google-calendar";

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
  requestId: string
): Promise<CalendarCancelResult> {
  const event = await calendar.getActiveGoogleEventForRequest(db, requestId);
  let result: CalendarCancelResult = "no_event";

  if (event) {
    try {
      const cancelled = await cancelGoogleCalendarEvent(
        db,
        event.connection,
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
    } catch {
      result = "failed";
    }
  }

  await supervision.updateBookingsStatusForRequest(db, {
    requestId,
    status: "cancelled"
  });

  return result;
}
