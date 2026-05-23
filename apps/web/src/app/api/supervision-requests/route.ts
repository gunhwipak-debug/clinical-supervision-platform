import { calendar, profiles, supervision, withUserContext } from "@csp/db";
import type { NextRequest } from "next/server";
import { apiError, envelope } from "@/lib/api/envelope";
import { parseJson } from "@/lib/api/request";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRuntimeDatabase } from "@/lib/auth/database";
import { isSupervisee } from "@/lib/auth/guards";
import {
  cancelGoogleCalendarEvent,
  createGoogleCalendarEvent,
  getGoogleCalendarConfig,
  googleCalendarBlockReason,
  intervalsOverlap,
  listBusyIntervalsForConnection
} from "@/lib/google-calendar";
import { sendManyNotifications } from "@/lib/notifications";
import { contextFor } from "@/lib/supervision/authz";
import { createSupervisionRequestSchema, nullable } from "@/lib/supervision/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);

  const db = createRuntimeDatabase();
  const requests = await withUserContext(db, contextFor(current, request), (tx) =>
    supervision.listSupervisionRequests(tx)
  );

  return envelope({ requests }, null, 200);
}

export async function POST(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current)
    return envelope(null, apiError("unauthorized", "로그인이 필요합니다."), 401);
  if (!isSupervisee(current))
    return envelope(null, apiError("forbidden", "권한이 없습니다."), 403);

  const parsed = createSupervisionRequestSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return envelope(
      null,
      apiError("invalid_request", "요청 형식이 올바르지 않습니다."),
      422
    );
  }
  const selectedSlotStart = parseDate(parsed.data.selectedSlotStart);
  const selectedSlotEnd = parseDate(parsed.data.selectedSlotEnd);

  const db = createRuntimeDatabase();
  const created = await withUserContext(db, contextFor(current), (tx) =>
    supervision.createSupervisionRequest(tx, current.session.userId, {
      serviceProductId: parsed.data.serviceProductId,
      retentionDays: parsed.data.retentionDays,
      urgency: nullable(parsed.data.urgency),
      desiredDeadline: nullable(parsed.data.desiredDeadline)
    })
  );

  if (!created) {
    return envelope(
      null,
      apiError("product_unavailable", "선택한 상품을 이용할 수 없습니다."),
      422
    );
  }

  if (created.supervisorId === current.session.userId) {
    await withUserContext(db, contextFor(current), (tx) =>
      supervision.deleteDraftSupervisionRequest(tx, current.session.userId, created.id)
    );
    return envelope(
      null,
      apiError(
        "self_supervision_not_allowed",
        "본인이 운영하는 슈퍼비전 상품은 직접 의뢰할 수 없습니다."
      ),
      422
    );
  }

  const requiresBooking = isTimedBookingProduct(created.productKind);
  const deleteDraft = () =>
    withUserContext(db, contextFor(current), (tx) =>
      supervision.deleteDraftSupervisionRequest(tx, current.session.userId, created.id)
    );

  if (requiresBooking && (!selectedSlotStart || !selectedSlotEnd)) {
    await deleteDraft();
    return envelope(
      null,
      apiError("slot_required", "희망 일정을 먼저 선택해주세요."),
      422
    );
  }
  if (
    requiresBooking &&
    selectedSlotStart &&
    selectedSlotEnd &&
    selectedSlotStart.getTime() >= selectedSlotEnd.getTime()
  ) {
    await deleteDraft();
    return envelope(
      null,
      apiError("invalid_slot", "선택한 일정이 올바르지 않습니다."),
      422
    );
  }
  if (
    requiresBooking &&
    selectedSlotStart &&
    selectedSlotStart.getTime() <= Date.now()
  ) {
    await deleteDraft();
    return envelope(
      null,
      apiError("past_slot", "지난 시간대는 선택할 수 없습니다."),
      422
    );
  }

  let calendarSync: "not_required" | "synced" | "sync_failed" = "not_required";

  if (requiresBooking && created.supervisorId && selectedSlotStart && selectedSlotEnd) {
    const config = getGoogleCalendarConfig(new URL(request.url).origin);
    const connection = await withUserContext(
      db,
      {
        userId: created.supervisorId,
        role: "supervisor",
        phiAccess: true
      },
      (tx) => calendar.getConnectionForUser(tx, created.supervisorId ?? "")
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
          {
            userId: created.supervisorId,
            role: "supervisor",
            phiAccess: true
          },
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
          await deleteDraft();
          return envelope(
            null,
            apiError("slot_unavailable", "이미 예약되었거나 선택할 수 없는 시간입니다."),
            409
          );
        }
      } catch (error) {
        // 구글 FreeBusy 확인 실패 시, 마크만 하고 중단 없이 플랫폼 단독 예약 진행을 위해 패스
        calendarSync = "sync_failed";
        await withUserContext(
          db,
          {
            userId: created.supervisorId,
            role: "supervisor",
            phiAccess: true
          },
          (tx) =>
            calendar.markConnectionStatus(
              tx,
              connection.id,
              isGoogleCalendarAuthProblem(error) ? "needs_reauth" : "error"
            )
        ).catch(() => undefined);
      }
    }

    // 2. 플랫폼 내부 로컬 DB 예약 생성 (구글 연동 여부와 관계없이 핵심 성공 기준)
    const booking = await withUserContext(db, contextFor(current), (tx) =>
      supervision.createBookingForRequest(tx, {
        requestId: created.id,
        scheduledEnd: selectedSlotEnd,
        scheduledStart: selectedSlotStart,
        superviseeId: current.session.userId
      })
    );

    if (!booking) {
      await deleteDraft();
      return envelope(
        null,
        apiError("slot_unavailable", "이미 예약되었거나 선택할 수 없는 시간입니다."),
        409
      );
    }

    if (created.supervisorId) {
      const supervisorProfile = await withUserContext(
        db,
        { userId: created.supervisorId, role: "supervisor", phiAccess: true },
        (tx) => profiles.getSupervisorProfileByUserId(tx, created.supervisorId ?? "")
      );
      if (supervisorProfile?.zoomMeetingUrl) {
        await withUserContext(db, contextFor(current), (tx) =>
          supervision.updateBookingMeetingUrl(tx, {
            bookingId: booking.id,
            meetingUrl: supervisorProfile.zoomMeetingUrl
          })
        );
      }
    }

    // 3. 구글 연동이 유효한 경우에만 구글 이벤트 생성 시도
    if (isGoogleCheckEligible && connection) {
      let createdGoogleEventId: string | null = null;
      try {
        const event = await withUserContext(
          db,
          {
            userId: created.supervisorId,
            role: "supervisor",
            phiAccess: true
          },
          (tx) =>
            createGoogleCalendarEvent(tx, connection, config, {
              attendeeEmails: [current.user.email],
              conferenceRequestId: booking.id,
              description:
                "ClinicFlow 슈퍼비전 예약입니다. 환자 정보는 캘린더에 저장하지 않습니다.",
              end: selectedSlotEnd,
              start: selectedSlotStart,
              title: "ClinicFlow 슈퍼비전"
            })
        );
        createdGoogleEventId = event.eventId;
        await withUserContext(db, contextFor(current), (tx) =>
          calendar.createCalendarEventLink(tx, {
            bookingId: booking.id,
            providerEventId: event.eventId
          })
        );
        if (event.meetingUrl) {
          await withUserContext(db, contextFor(current), (tx) =>
            supervision.updateBookingMeetingUrl(tx, {
              bookingId: booking.id,
              meetingUrl: event.meetingUrl
            })
          );
        }
        calendarSync = "synced";
      } catch (error) {
        // 구글 이벤트 생성 실패 시, 전체 예약을 롤백하지 않고 구글 연동 오류 마크 후 200 OK 진행
        calendarSync = "sync_failed";
        if (createdGoogleEventId) {
          await withUserContext(
            db,
            {
              userId: created.supervisorId,
              role: "supervisor",
              phiAccess: true
            },
            (tx) =>
              cancelGoogleCalendarEvent(
                tx,
                connection,
                config,
                createdGoogleEventId ?? ""
              )
          ).catch(() => undefined);
        }
        await withUserContext(
          db,
          {
            userId: created.supervisorId,
            role: "supervisor",
            phiAccess: true
          },
          (tx) =>
            calendar.markConnectionStatus(
              tx,
              connection.id,
              isGoogleCalendarAuthProblem(error) ? "needs_reauth" : "error"
            )
        ).catch(() => undefined);
      }
    }
  }

  if (created.supervisorId) {
    const origin = new URL(request.url).origin;
    if (requiresBooking && selectedSlotStart) {
      const scheduledText = formatKoreanDateTime(selectedSlotStart);
      await sendManyNotifications(db, [
        {
          body: `${scheduledText} 일정으로 슈퍼비전 초안이 생성되었습니다. 자료 작성과 결제를 이어서 진행해주세요.`,
          href: `/requests/${created.id}`,
          kind: "supervision_request_scheduled_supervisee",
          metadata: { requestId: created.id },
          origin,
          target: { role: "supervisee", userId: current.session.userId },
          title: "예약 초안이 생성되었습니다"
        },
        {
          body: `${scheduledText} 일정으로 새 슈퍼비전 의뢰 초안이 생성되었습니다. 결제 완료 후 검토 대기열에 표시됩니다.`,
          href: "/supervisor/requests",
          kind: "supervision_request_scheduled_supervisor",
          metadata: { requestId: created.id },
          origin,
          target: { role: "supervisor", userId: created.supervisorId },
          title: "새 예약 시간이 확보되었습니다"
        }
      ]);
    } else {
      await sendManyNotifications(db, [
        {
          body: "비동기 슈퍼비전 초안이 생성되었습니다. 사례 패킷과 첨부자료를 이어서 작성해주세요.",
          href: `/requests/${created.id}`,
          kind: "supervision_request_draft_created_supervisee",
          metadata: { requestId: created.id },
          origin,
          target: { role: "supervisee", userId: current.session.userId },
          title: "의뢰 초안이 생성되었습니다"
        },
        {
          body: "새 비동기 슈퍼비전 의뢰 초안이 생성되었습니다. 결제 완료 후 검토 대기열에 표시됩니다.",
          href: "/supervisor/requests",
          kind: "supervision_request_draft_created_supervisor",
          metadata: { requestId: created.id },
          origin,
          target: { role: "supervisor", userId: created.supervisorId },
          title: "새 의뢰 초안이 생성되었습니다"
        }
      ]);
    }
  }

  return envelope({ calendarSync, request: created }, null, 200);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTimedBookingProduct(kind: string | null | undefined): boolean {
  return kind === "zoom_60" || kind === "zoom_90";
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
