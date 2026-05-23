import { calendar, profiles, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  getGoogleCalendarConfig,
  googleCalendarBlockReason,
  intervalsOverlap,
  listBusyIntervalsForConnection,
  updateGoogleCalendarEvent
} from "@/lib/google-calendar";
import { sendManyNotifications } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";

export const runtime = "nodejs";

const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  selectedSlotEnd: z.iso.datetime({ offset: true }),
  selectedSlotStart: z.iso.datetime({ offset: true })
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (current.session.role !== "supervisee" && current.session.role !== "supervisor") {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }

  const parsedParams = paramsSchema.safeParse(await context.params);
  const parsedBody = bodySchema.safeParse(await parseJson(request));
  if (!parsedParams.success || !parsedBody.success) {
    return envelope(
      null,
      apiError("invalid_request", "일정 변경 요청 형식이 올바르지 않습니다."),
      422
    );
  }

  const selectedSlotStart = new Date(parsedBody.data.selectedSlotStart);
  const selectedSlotEnd = new Date(parsedBody.data.selectedSlotEnd);
  if (selectedSlotStart.getTime() >= selectedSlotEnd.getTime()) {
    return envelope(
      null,
      apiError("invalid_slot", "선택한 일정이 올바르지 않습니다."),
      422
    );
  }
  if (selectedSlotStart.getTime() <= Date.now()) {
    return envelope(
      null,
      apiError("past_slot", "지난 시간대는 선택할 수 없습니다."),
      422
    );
  }

  const db = createRuntimeDatabase();
  const detail = await withUserContext(
    db,
    contextFor(current, request, { phiAccess: true }),
    (tx) =>
      supervision.getSupervisionRequestDetails(tx, parsedParams.data.id, {
        includePhi: true
      })
  );

  if (!detail)
    return envelope(
      null,
      apiError("not_found", "요청한 항목을 찾을 수 없습니다."),
      404
    );
  if (!isParticipant(current.session.userId, detail)) {
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);
  }
  if (!detail.supervisorId || !detail.scheduledStart || !detail.scheduledEnd) {
    return envelope(
      null,
      apiError("booking_not_found", "변경할 예약 일정을 찾을 수 없습니다."),
      404
    );
  }
  if (!canRescheduleStatus(detail.status)) {
    return envelope(
      null,
      apiError("invalid_state", "현재 상태에서는 일정을 변경할 수 없습니다."),
      409
    );
  }

  const previousStart = new Date(detail.scheduledStart);
  const previousEnd = new Date(detail.scheduledEnd);
  if (previousStart.getTime() - Date.now() < RESCHEDULE_CUTOFF_MS) {
    return envelope(
      null,
      apiError(
        "reschedule_cutoff",
        "세션 시작 24시간 전부터는 일정 변경 대신 관리자 문의가 필요합니다."
      ),
      409
    );
  }
  if (
    previousStart.getTime() === selectedSlotStart.getTime() &&
    previousEnd.getTime() === selectedSlotEnd.getTime()
  ) {
    return envelope({ request: detail }, null, 200);
  }

  let calendarSync: "not_required" | "synced" | "sync_failed" = "not_required";
  const config = getGoogleCalendarConfig(new URL(request.url).origin);
  const connection = await withUserContext(
    db,
    { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
    (tx) => calendar.getConnectionForUser(tx, detail.supervisorId ?? "")
  );

  let isGoogleCheckEligible = false;
  if (connection && config) {
    const calendarBlock = googleCalendarBlockReason(connection, config);
    if (!calendarBlock) {
      isGoogleCheckEligible = true;
    } else {
      calendarSync = "sync_failed";
    }
  } else {
    calendarSync = "not_required";
  }

  // 1. 구글 캘린더 연동이 정상인 경우에만 구글 바쁜 일정(FreeBusy) 확인
  if (isGoogleCheckEligible && connection) {
    try {
      const busy = await withUserContext(
        db,
        { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
        (tx) =>
          listBusyIntervalsForConnection(
            tx,
            connection,
            config,
            selectedSlotStart,
            selectedSlotEnd
          )
      );
      if (
        busy.some((interval) =>
          intervalsOverlap(
            selectedSlotStart,
            selectedSlotEnd,
            interval.start,
            interval.end
          )
        )
      ) {
        return envelope(
          null,
          apiError("slot_unavailable", "이미 예약되었거나 선택할 수 없는 시간입니다."),
          409
        );
      }
    } catch (error) {
      calendarSync = "sync_failed";
      await withUserContext(
        db,
        { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
        (tx) =>
          calendar.markConnectionStatus(
            tx,
            connection.id,
            isGoogleCalendarAuthProblem(error) ? "needs_reauth" : "error"
          )
      ).catch(() => undefined);
    }
  }

  // 2. 플랫폼 내부 로컬 DB 예약 일정 변경 (구글 연동 여부와 관계없이 핵심 성공 기준)
  const updatedBooking = await withUserContext(db, contextFor(current), (tx) =>
    supervision.updateBookingScheduleForRequest(tx, {
      requestId: detail.id,
      scheduledEnd: selectedSlotEnd,
      scheduledStart: selectedSlotStart,
      status: "rescheduled"
    })
  );
  if (!updatedBooking) {
    return envelope(
      null,
      apiError("slot_unavailable", "이미 예약되었거나 선택할 수 없는 시간입니다."),
      409
    );
  }

  // 만약 슈퍼바이저가 수동 화상회의 링크(zoomMeetingUrl)를 등록한 상태라면 예약의 기본 화상회의 주소로 적용해줍니다.
  if (detail.supervisorId) {
    const supervisorProfile = await withUserContext(
      db,
      { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
      (tx) => profiles.getSupervisorProfileByUserId(tx, detail.supervisorId ?? "")
    );
    if (supervisorProfile?.zoomMeetingUrl) {
      await withUserContext(db, contextFor(current), (tx) =>
        supervision.updateBookingMeetingUrl(tx, {
          bookingId: updatedBooking.id,
          meetingUrl: supervisorProfile.zoomMeetingUrl
        })
      );
    }
  }

  // 3. 구글 연동이 유효한 경우에만 구글 이벤트 생성/업데이트 시도
  if (isGoogleCheckEligible && connection) {
    const activeEvent = await withUserContext(
      db,
      { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
      (tx) => calendar.getActiveGoogleEventForRequest(tx, detail.id)
    );
    let createdEventId: string | null = null;
    try {
      const calendarEvent = activeEvent
        ? await withUserContext(
            db,
            { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
            (tx) =>
              updateGoogleCalendarEvent(tx, activeEvent.connection, config, {
                description:
                  "ClinicFlow 슈퍼비전 예약입니다. 환자 정보는 캘린더에 저장하지 않습니다.",
                end: selectedSlotEnd,
                providerEventId: activeEvent.providerEventId,
                start: selectedSlotStart,
                title: "ClinicFlow 슈퍼비전"
              })
          )
        : await withUserContext(
            db,
            { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
            (tx) =>
              createGoogleCalendarEvent(tx, connection, config, {
                attendeeEmails:
                  current.session.role === "supervisee" ? [current.user.email] : [],
                conferenceRequestId: updatedBooking.id,
                description:
                  "ClinicFlow 슈퍼비전 예약입니다. 환자 정보는 캘린더에 저장하지 않습니다.",
                end: selectedSlotEnd,
                start: selectedSlotStart,
                title: "ClinicFlow 슈퍼비전"
              })
          );

      if (!activeEvent) {
        createdEventId = calendarEvent.eventId;
        await withUserContext(db, contextFor(current), (tx) =>
          calendar.createCalendarEventLink(tx, {
            bookingId: updatedBooking.id,
            providerEventId: calendarEvent.eventId
          })
        );
      }
      if (calendarEvent.meetingUrl) {
        await withUserContext(db, contextFor(current), (tx) =>
          supervision.updateBookingMeetingUrl(tx, {
            bookingId: updatedBooking.id,
            meetingUrl: calendarEvent.meetingUrl
          })
        );
      }
      calendarSync = "synced";
    } catch (error) {
      if (createdEventId) {
        await withUserContext(
          db,
          { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
          (tx) => cancelGoogleCalendarEvent(tx, connection, config, createdEventId ?? "")
        ).catch(() => undefined);
      }
      calendarSync = "sync_failed";
      await withUserContext(
        db,
        { userId: detail.supervisorId, role: "supervisor", phiAccess: true },
        (tx) =>
          calendar.markConnectionStatus(
            tx,
            connection.id,
            isGoogleCalendarAuthProblem(error) ? "needs_reauth" : "error"
          )
      ).catch(() => undefined);
    }
  }

  const updated = await withUserContext(db, contextFor(current), (tx) =>
    supervision.getSupervisionRequestDetails(tx, detail.id)
  );
  await sendManyNotifications(db, [
    {
      body: `${formatKoreanDateTime(selectedSlotStart)} 일정으로 슈퍼비전 예약이 변경되었습니다.`,
      href: `/requests/${detail.id}`,
      kind: "booking_rescheduled_supervisee",
      metadata: { requestId: detail.id },
      origin: new URL(request.url).origin,
      target: { role: "supervisee", userId: detail.superviseeId },
      title: "예약 일정이 변경되었습니다"
    },
    ...(detail.supervisorId
      ? [
          {
            body: `${formatKoreanDateTime(selectedSlotStart)} 일정으로 슈퍼비전 예약이 변경되었습니다.`,
            href: `/supervisor/requests/${detail.id}`,
            kind: "booking_rescheduled_supervisor",
            metadata: { requestId: detail.id },
            origin: new URL(request.url).origin,
            target: { role: "supervisor" as const, userId: detail.supervisorId },
            title: "예약 일정이 변경되었습니다"
          }
        ]
      : [])
  ]);

  return envelope({ calendarSync, request: updated }, null, 200);
}

function isParticipant(
  userId: string,
  detail: supervision.SupervisionRequestDetails
): boolean {
  return detail.superviseeId === userId || detail.supervisorId === userId;
}

function canRescheduleStatus(status: string): boolean {
  return [
    "draft",
    "submitted",
    "awaiting_payment",
    "paid",
    "awaiting_supervisor_review",
    "accepted",
    "in_review",
    "meeting_scheduled"
  ].includes(status);
}

function formatKoreanDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(date);
}

function isGoogleCalendarAuthProblem(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return (
    message === "google_calendar_reauth_required" ||
    message === "google_calendar_refresh_failed" ||
    message === "invalid_grant"
  );
}
