import { decryptPhi, encryptPhi } from "@csp/shared/crypto/phi";
import type { SupervisionStatus } from "@csp/shared/supervision/status-machine";
import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

export type SupervisionRequestInput = {
  serviceProductId: string;
  retentionDays: 7 | 30 | 90;
  urgency: "normal" | "urgent_24h" | null;
  desiredDeadline: string | null;
};

export type Booking = {
  id: string;
  supervisionRequestId: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  meetingUrl: string | null;
  status: string;
};

export type BookingBusyInterval = {
  start: Date | string;
  end: Date | string;
};

export type SessionReminderTarget = {
  requestId: string;
  superviseeId: string;
  supervisorId: string;
  productTitle: string | null;
  supervisorDisplayName: string | null;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
};

export type StaleBookingHoldTarget = {
  requestId: string;
  superviseeId: string;
  supervisorId: string | null;
  status: SupervisionStatus;
  createdAt: Date | string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  bookingStatus: string;
};

export type SupervisionRequestSummary = {
  id: string;
  superviseeId: string;
  supervisorId: string | null;
  serviceProductId: string | null;
  status: SupervisionStatus;
  retentionDays: number;
  retentionExpiresAt: Date | string | null;
  urgency: "normal" | "urgent_24h" | null;
  desiredDeadline: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  productTitle: string | null;
  productKind: string | null;
  serviceProductSupervisionType: "assessment" | "counseling";
  supervisorDisplayName: string | null;
  scheduledStart: Date | string | null;
  scheduledEnd: Date | string | null;
  meetingUrl: string | null;
  bookingStatus: string | null;
};

export type CasePacketInput = {
  title: string;
  purpose: string[];
  clientAgeBand: "6-12" | "13-18" | "19-39" | "40-64" | "65+" | null;
  clientGender: string | null;
  setting:
    | "hospital"
    | "counseling_center"
    | "community_center"
    | "school"
    | "other"
    | null;
  chiefComplaint: string;
  referralReason: string;
  testsUsed: string[];
  requestItems: string[];
  preferredMethod:
    | "async_comment"
    | "direct_edit"
    | "zoom"
    | "comment_plus_zoom"
    | null;
  needsCompletionRecord: boolean;
};

export type DeidentificationChecklistInput = {
  removedName: boolean;
  removedRrn: boolean;
  removedPhone: boolean;
  removedAddress: boolean;
  removedGuardianName: boolean;
  removedOrgName: boolean;
  removedChartNumber: boolean;
  filenameSafe: boolean;
  rawDataSafe: boolean;
  minimalInfo: boolean;
  clientConsentConfirmed: boolean;
  purposeUnderstood: boolean;
};

export type SupervisionRequestDetails = SupervisionRequestSummary & {
  casePacketId: string | null;
  title: string | null;
  purpose: string[] | null;
  clientAgeBand: string | null;
  clientGender: string | null;
  setting: string | null;
  chiefComplaint: string | null;
  referralReason: string | null;
  testsUsed: string[] | null;
  requestItems: string[] | null;
  preferredMethod: string | null;
  needsCompletionRecord: boolean | null;
  packetComplete: boolean;
  deidentificationComplete: boolean;
  feedbackSummary: string | null;
  feedbackRecommendations: string | null;
  feedbackSubmittedAt: Date | string | null;
};

export type CompletionRecord = {
  id: string;
  recordNo: string;
  reviewedMaterials: string[];
  scope: string[];
  limitations: string | null;
  responsibilityNotice: string | null;
  signatureStorageKey: string | null;
  signatureAttachedAt: Date | string | null;
  issuedAt: Date | string;
};

type SupervisionDatabase = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function createSupervisionRequest(
  db: SupervisionDatabase,
  superviseeId: string,
  input: SupervisionRequestInput
): Promise<SupervisionRequestSummary | null> {
  const result = await db.execute(sql`
    insert into supervision_requests (
      supervisee_id,
      supervisor_id,
      service_product_id,
      status,
      retention_days,
      retention_expires_at,
      urgency,
      desired_deadline
    )
    select
      ${superviseeId},
      sp.user_id,
      p.id,
      'draft',
      ${input.retentionDays},
      now() + (${input.retentionDays}::text || ' days')::interval,
      ${input.urgency},
      ${input.desiredDeadline}
    from service_products p
    join supervisor_profiles sp on sp.id = p.supervisor_profile_id
    where p.id = ${input.serviceProductId}
      and p.active = true
      and sp.visibility = 'public'
      and sp.verification_status = 'approved'
    returning
      id,
      supervisee_id as "superviseeId",
      supervisor_id as "supervisorId",
      service_product_id as "serviceProductId",
      status,
      retention_days as "retentionDays",
      retention_expires_at as "retentionExpiresAt",
      urgency,
      desired_deadline as "desiredDeadline",
      created_at as "createdAt",
      updated_at as "updatedAt",
      null::text as "productTitle",
      (
        select p.kind::text
        from service_products p
        where p.id = service_product_id
      ) as "productKind",
      coalesce(
        (
          select to_jsonb(p)->>'supervision_type'
          from service_products p
          where p.id = service_product_id
        ),
        'assessment'
      ) as "serviceProductSupervisionType",
      null::text as "supervisorDisplayName",
      null::timestamptz as "scheduledStart",
      null::timestamptz as "scheduledEnd",
      null::text as "meetingUrl",
      null::text as "bookingStatus"
  `);

  return rowsOf<SupervisionRequestSummary>(result)[0] ?? null;
}

export async function createBookingForRequest(
  db: SupervisionDatabase,
  input: {
    requestId: string;
    superviseeId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }
): Promise<Booking | null> {
  const result = await db.execute(sql`
    insert into bookings (
      supervision_request_id,
      scheduled_start,
      scheduled_end,
      status
    )
	    select
	      sr.id,
	      ${input.scheduledStart.toISOString()},
	      ${input.scheduledEnd.toISOString()},
	      'scheduled'
	    from supervision_requests sr
	    join service_products p on p.id = sr.service_product_id
	    where sr.id = ${input.requestId}
	      and sr.supervisee_id = ${input.superviseeId}
	      and sr.supervisor_id is not null
        and p.kind in ('zoom_60', 'zoom_90')
	      and ${input.scheduledStart.toISOString()}::timestamptz < ${input.scheduledEnd.toISOString()}::timestamptz
	      and extract(epoch from (${input.scheduledEnd.toISOString()}::timestamptz - ${input.scheduledStart.toISOString()}::timestamptz)) / 60 =
	        case p.kind
	          when 'zoom_90' then 90
	          else 60
	        end
	      and exists (
	        select 1
	        from availability_slots a
	        join supervisor_profiles sp on sp.id = a.supervisor_profile_id
	        where sp.user_id = sr.supervisor_id
	          and sp.visibility = 'public'
	          and sp.verification_status = 'approved'
	          and extract(dow from ${input.scheduledStart.toISOString()}::timestamptz at time zone a.timezone)::int = a.weekday
	          and (${input.scheduledStart.toISOString()}::timestamptz at time zone a.timezone)::time >= a.start_time
	          and (${input.scheduledEnd.toISOString()}::timestamptz at time zone a.timezone)::time <= a.end_time
	      )
      and not exists (
        select 1
        from bookings b
        join supervision_requests other_sr on other_sr.id = b.supervision_request_id
        where other_sr.supervisor_id = sr.supervisor_id
          and b.status in ('scheduled', 'rescheduled')
          and b.scheduled_start < ${input.scheduledEnd.toISOString()}::timestamptz
          and ${input.scheduledStart.toISOString()}::timestamptz < b.scheduled_end
      )
    returning
      id,
      supervision_request_id as "supervisionRequestId",
      scheduled_start as "scheduledStart",
      scheduled_end as "scheduledEnd",
      null::text as "meetingUrl",
      status
  `);

  return rowsOf<Booking>(result)[0] ?? null;
}

export async function updateBookingsStatusForRequest(
  db: SupervisionDatabase,
  input: {
    requestId: string;
    status: "cancelled" | "completed";
  }
): Promise<Booking[]> {
  const result = await db.execute(sql`
    update bookings
    set status = ${input.status}
    where supervision_request_id = ${input.requestId}
      and status in ('scheduled', 'rescheduled')
    returning
      id,
      supervision_request_id as "supervisionRequestId",
      scheduled_start as "scheduledStart",
      scheduled_end as "scheduledEnd",
      ${decryptPhi(sql`meeting_url_enc`)} as "meetingUrl",
      status
  `);

  return rowsOf<Booking>(result);
}

export async function updateBookingScheduleForRequest(
  db: SupervisionDatabase,
  input: {
    requestId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status: "scheduled" | "rescheduled";
  }
): Promise<Booking | null> {
  const result = await db.execute(sql`
    update bookings b
    set
      scheduled_start = ${input.scheduledStart.toISOString()},
      scheduled_end = ${input.scheduledEnd.toISOString()},
      status = ${input.status}
    from supervision_requests sr
    join service_products p on p.id = sr.service_product_id
    where b.id = (
        select latest.id
        from bookings latest
        where latest.supervision_request_id = sr.id
        order by latest.created_at desc
        limit 1
      )
      and b.supervision_request_id = sr.id
      and sr.id = ${input.requestId}
      and sr.supervisor_id is not null
      and b.status in ('scheduled', 'rescheduled')
      and p.kind in ('zoom_60', 'zoom_90')
      and ${input.scheduledStart.toISOString()}::timestamptz < ${input.scheduledEnd.toISOString()}::timestamptz
      and extract(epoch from (${input.scheduledEnd.toISOString()}::timestamptz - ${input.scheduledStart.toISOString()}::timestamptz)) / 60 =
        case p.kind
          when 'zoom_90' then 90
          else 60
        end
      and exists (
        select 1
        from availability_slots a
        join supervisor_profiles sp on sp.id = a.supervisor_profile_id
        where sp.user_id = sr.supervisor_id
          and sp.visibility = 'public'
          and sp.verification_status = 'approved'
          and extract(dow from ${input.scheduledStart.toISOString()}::timestamptz at time zone a.timezone)::int = a.weekday
          and (${input.scheduledStart.toISOString()}::timestamptz at time zone a.timezone)::time >= a.start_time
          and (${input.scheduledEnd.toISOString()}::timestamptz at time zone a.timezone)::time <= a.end_time
      )
      and not exists (
        select 1
        from bookings other_b
        join supervision_requests other_sr on other_sr.id = other_b.supervision_request_id
        where other_sr.supervisor_id = sr.supervisor_id
          and other_sr.id <> sr.id
          and other_b.status in ('scheduled', 'rescheduled')
          and other_b.scheduled_start < ${input.scheduledEnd.toISOString()}::timestamptz
          and ${input.scheduledStart.toISOString()}::timestamptz < other_b.scheduled_end
      )
    returning
      b.id,
      b.supervision_request_id as "supervisionRequestId",
      b.scheduled_start as "scheduledStart",
      b.scheduled_end as "scheduledEnd",
      ${decryptPhi(sql`b.meeting_url_enc`)} as "meetingUrl",
      b.status
  `);

  return rowsOf<Booking>(result)[0] ?? null;
}

export async function updateBookingMeetingUrl(
  db: SupervisionDatabase,
  input: { bookingId: string; meetingUrl: string | null }
): Promise<void> {
  await db.execute(sql`
    update bookings
    set meeting_url_enc = ${input.meetingUrl ? encryptPhi(input.meetingUrl) : null}
    where id = ${input.bookingId}
  `);
}

export async function updateBookingOutcomeForRequest(
  db: SupervisionDatabase,
  input: {
    requestId: string;
    status: "completed" | "no_show_supervisee" | "no_show_supervisor";
  }
): Promise<Booking | null> {
  const result = await db.execute(sql`
    update bookings b
    set status = ${input.status}
    where b.id = (
        select latest.id
        from bookings latest
        where latest.supervision_request_id = ${input.requestId}
          and latest.status in ('scheduled', 'rescheduled')
        order by latest.created_at desc
        limit 1
      )
    returning
      id,
      supervision_request_id as "supervisionRequestId",
      scheduled_start as "scheduledStart",
      scheduled_end as "scheduledEnd",
      ${decryptPhi(sql`meeting_url_enc`)} as "meetingUrl",
      status
  `);

  return rowsOf<Booking>(result)[0] ?? null;
}

export async function listBusyBookingIntervalsForSupervisor(
  db: SupervisionDatabase,
  input: { supervisorId: string; timeMin: Date; timeMax: Date }
): Promise<BookingBusyInterval[]> {
  const result = await db.execute(sql`
    select
      b.scheduled_start as start,
      b.scheduled_end as end
    from bookings b
    join supervision_requests sr on sr.id = b.supervision_request_id
    where sr.supervisor_id = ${input.supervisorId}
      and b.status in ('scheduled', 'rescheduled')
      and b.scheduled_start < ${input.timeMax.toISOString()}::timestamptz
      and ${input.timeMin.toISOString()}::timestamptz < b.scheduled_end
    order by b.scheduled_start
  `);

  return rowsOf<BookingBusyInterval>(result);
}

export async function listUpcomingSessionReminderTargets(
  db: SupervisionDatabase,
  input: { from: Date; to: Date }
): Promise<SessionReminderTarget[]> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      p.title as "productTitle",
      sp.display_name as "supervisorDisplayName",
      b.scheduled_start as "scheduledStart",
      b.scheduled_end as "scheduledEnd"
    from bookings b
    join supervision_requests sr on sr.id = b.supervision_request_id
    left join service_products p on p.id = sr.service_product_id
    left join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    where b.status in ('scheduled', 'rescheduled')
      and sr.supervisor_id is not null
      and sr.status in (
        'accepted',
        'in_review',
        'feedback_submitted',
        'meeting_scheduled',
        'meeting_completed',
        'completion_record_issued'
      )
      and b.scheduled_start >= ${input.from.toISOString()}::timestamptz
      and b.scheduled_start < ${input.to.toISOString()}::timestamptz
    order by b.scheduled_start asc
  `);

  return rowsOf<SessionReminderTarget>(result);
}

export async function listStaleBookingHoldTargets(
  db: SupervisionDatabase,
  input: { cutoff: Date }
): Promise<StaleBookingHoldTarget[]> {
  const result = await db.execute(sql`
    select
      sr.id as "requestId",
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.status,
      sr.created_at as "createdAt",
      b.scheduled_start as "scheduledStart",
      b.scheduled_end as "scheduledEnd",
      b.status as "bookingStatus"
    from supervision_requests sr
    join bookings b on b.supervision_request_id = sr.id
    where sr.status in ('draft', 'submitted', 'awaiting_payment')
      and b.status in ('scheduled', 'rescheduled')
      and sr.created_at < ${input.cutoff.toISOString()}::timestamptz
    order by sr.created_at asc
  `);

  return rowsOf<StaleBookingHoldTarget>(result);
}

export async function listSupervisionRequests(
  db: SupervisionDatabase
): Promise<SupervisionRequestSummary[]> {
  const result = await db.execute(sql`
    select
      sr.id,
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.service_product_id as "serviceProductId",
      sr.status,
      sr.retention_days as "retentionDays",
      sr.retention_expires_at as "retentionExpiresAt",
      sr.urgency,
      sr.desired_deadline as "desiredDeadline",
      sr.created_at as "createdAt",
      sr.updated_at as "updatedAt",
      p.title as "productTitle",
      p.kind::text as "productKind",
      coalesce(to_jsonb(p)->>'supervision_type', 'assessment') as "serviceProductSupervisionType",
      sp.display_name as "supervisorDisplayName",
      b.scheduled_start as "scheduledStart",
      b.scheduled_end as "scheduledEnd",
      b.meeting_url as "meetingUrl",
      b.status as "bookingStatus"
    from supervision_requests sr
    left join service_products p on p.id = sr.service_product_id
    left join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    left join lateral (
      select
        scheduled_start,
        scheduled_end,
        ${decryptPhi(sql`meeting_url_enc`)} as meeting_url,
        status
      from bookings
      where supervision_request_id = sr.id
      order by created_at desc
      limit 1
    ) b on true
    order by sr.created_at desc
  `);

  return rowsOf<SupervisionRequestSummary>(result);
}

export async function getSupervisionRequestDetails(
  db: SupervisionDatabase,
  requestId: string,
  options: { includePhi?: boolean } = {}
): Promise<SupervisionRequestDetails | null> {
  const title = options.includePhi
    ? decryptPhi(sql`cp.title_enc`)
    : sql<string | null>`null`;
  const chiefComplaint = options.includePhi
    ? nullableDecrypt(sql`cp.chief_complaint_enc`)
    : sql<string | null>`null`;
  const referralReason = options.includePhi
    ? nullableDecrypt(sql`cp.referral_reason_enc`)
    : sql<string | null>`null`;
  const feedbackSummary = options.includePhi
    ? nullableDecrypt(sql`fb.summary_enc`)
    : sql<string | null>`null`;
  const feedbackRecommendations = options.includePhi
    ? nullableDecrypt(sql`fb.recommendations_enc`)
    : sql<string | null>`null`;

  const result = await db.execute(sql`
    select
      sr.id,
      sr.supervisee_id as "superviseeId",
      sr.supervisor_id as "supervisorId",
      sr.service_product_id as "serviceProductId",
      sr.status,
      sr.retention_days as "retentionDays",
      sr.retention_expires_at as "retentionExpiresAt",
      sr.urgency,
      sr.desired_deadline as "desiredDeadline",
      sr.created_at as "createdAt",
      sr.updated_at as "updatedAt",
      p.title as "productTitle",
      p.kind::text as "productKind",
      coalesce(to_jsonb(p)->>'supervision_type', 'assessment') as "serviceProductSupervisionType",
      sp.display_name as "supervisorDisplayName",
      b.scheduled_start as "scheduledStart",
      b.scheduled_end as "scheduledEnd",
      b.meeting_url as "meetingUrl",
      b.status as "bookingStatus",
      cp.id as "casePacketId",
      ${title} as title,
      cp.purpose,
      cp.client_age_band as "clientAgeBand",
      cp.client_gender as "clientGender",
      cp.setting,
      ${chiefComplaint} as "chiefComplaint",
      ${referralReason} as "referralReason",
      cp.tests_used as "testsUsed",
      cp.request_items as "requestItems",
      cp.preferred_method as "preferredMethod",
      cp.needs_completion_record as "needsCompletionRecord",
      ${feedbackSummary} as "feedbackSummary",
      ${feedbackRecommendations} as "feedbackRecommendations",
      fb.submitted_at as "feedbackSubmittedAt",
      (
        cp.id is not null
        and cp.title_enc is not null
        and cp.chief_complaint_enc is not null
        and cp.referral_reason_enc is not null
      ) as "packetComplete",
      coalesce(
        dc.removed_name
        and dc.removed_rrn
        and dc.removed_phone
        and dc.removed_address
        and dc.removed_guardian_name
        and dc.removed_org_name
        and dc.removed_chart_number
        and dc.filename_safe
        and dc.raw_data_safe
        and dc.minimal_info
        and dc.client_consent_confirmed
        and dc.purpose_understood,
        false
      ) as "deidentificationComplete"
    from supervision_requests sr
    left join service_products p on p.id = sr.service_product_id
    left join supervisor_profiles sp on sp.user_id = sr.supervisor_id
    left join lateral (
      select
        scheduled_start,
        scheduled_end,
        ${decryptPhi(sql`meeting_url_enc`)} as meeting_url,
        status
      from bookings
      where supervision_request_id = sr.id
      order by created_at desc
      limit 1
    ) b on true
    left join case_packets cp on cp.supervision_request_id = sr.id
    left join deidentification_checklists dc on dc.case_packet_id = cp.id
    left join lateral (
      select summary_enc, recommendations_enc, submitted_at
      from feedbacks
      where supervision_request_id = sr.id
      order by submitted_at desc nulls last
      limit 1
    ) fb on true
    where sr.id = ${requestId}
    limit 1
  `);

  return rowsOf<SupervisionRequestDetails>(result)[0] ?? null;
}

export async function upsertCasePacket(
  db: SupervisionDatabase,
  superviseeId: string,
  requestId: string,
  input: CasePacketInput
): Promise<SupervisionRequestDetails | null> {
  await db.execute(sql`
    with updated as (
      update case_packets cp
      set
        title_enc = ${encryptPhi(input.title)},
        purpose = ${jsonb(input.purpose)},
        client_age_band = ${input.clientAgeBand},
        client_gender = ${input.clientGender},
        setting = ${input.setting},
        chief_complaint_enc = ${encryptPhi(input.chiefComplaint)},
        referral_reason_enc = ${encryptPhi(input.referralReason)},
        tests_used = ${jsonb(input.testsUsed)},
        request_items = ${jsonb(input.requestItems)},
        preferred_method = ${input.preferredMethod},
        needs_completion_record = ${input.needsCompletionRecord}
      from supervision_requests sr
      where cp.supervision_request_id = sr.id
        and sr.id = ${requestId}
        and sr.supervisee_id = ${superviseeId}
        and sr.status = 'draft'
      returning cp.id
    )
    insert into case_packets (
      supervision_request_id,
      title_enc,
      purpose,
      client_age_band,
      client_gender,
      setting,
      chief_complaint_enc,
      referral_reason_enc,
      tests_used,
      request_items,
      preferred_method,
      needs_completion_record
    )
    select
      sr.id,
      ${encryptPhi(input.title)},
      ${jsonb(input.purpose)},
      ${input.clientAgeBand},
      ${input.clientGender},
      ${input.setting},
      ${encryptPhi(input.chiefComplaint)},
      ${encryptPhi(input.referralReason)},
      ${jsonb(input.testsUsed)},
      ${jsonb(input.requestItems)},
      ${input.preferredMethod},
      ${input.needsCompletionRecord}
    from supervision_requests sr
    where sr.id = ${requestId}
      and sr.supervisee_id = ${superviseeId}
      and sr.status = 'draft'
      and not exists (select 1 from updated)
  `);

  return getSupervisionRequestDetails(db, requestId, { includePhi: true });
}

export async function upsertDeidentificationChecklist(
  db: SupervisionDatabase,
  superviseeId: string,
  requestId: string,
  input: DeidentificationChecklistInput
): Promise<boolean> {
  const result = await db.execute(sql`
    insert into deidentification_checklists (
      case_packet_id,
      removed_name,
      removed_rrn,
      removed_phone,
      removed_address,
      removed_guardian_name,
      removed_org_name,
      removed_chart_number,
      filename_safe,
      raw_data_safe,
      minimal_info,
      client_consent_confirmed,
      purpose_understood,
      acknowledged_by
    )
    select
      cp.id,
      ${input.removedName},
      ${input.removedRrn},
      ${input.removedPhone},
      ${input.removedAddress},
      ${input.removedGuardianName},
      ${input.removedOrgName},
      ${input.removedChartNumber},
      ${input.filenameSafe},
      ${input.rawDataSafe},
      ${input.minimalInfo},
      ${input.clientConsentConfirmed},
      ${input.purposeUnderstood},
      ${superviseeId}
    from case_packets cp
    join supervision_requests sr on sr.id = cp.supervision_request_id
    where sr.id = ${requestId}
      and sr.supervisee_id = ${superviseeId}
      and sr.status = 'draft'
    on conflict (case_packet_id) do update
    set
      removed_name = excluded.removed_name,
      removed_rrn = excluded.removed_rrn,
      removed_phone = excluded.removed_phone,
      removed_address = excluded.removed_address,
      removed_guardian_name = excluded.removed_guardian_name,
      removed_org_name = excluded.removed_org_name,
      removed_chart_number = excluded.removed_chart_number,
      filename_safe = excluded.filename_safe,
      raw_data_safe = excluded.raw_data_safe,
      minimal_info = excluded.minimal_info,
      client_consent_confirmed = excluded.client_consent_confirmed,
      purpose_understood = excluded.purpose_understood,
      acknowledged_at = now(),
      acknowledged_by = excluded.acknowledged_by
    returning id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function updateSupervisionRequestStatus(
  db: SupervisionDatabase,
  requestId: string,
  status: SupervisionStatus,
  expectedFromStatus?: SupervisionStatus | SupervisionStatus[]
): Promise<SupervisionRequestSummary | null> {
  const expectedPredicate = expectedFromStatus
    ? statusPredicate(expectedFromStatus)
    : sql`true`;
  const result = await db.execute(sql`
    update supervision_requests
    set status = ${status}, updated_at = now()
    where id = ${requestId}
      and ${expectedPredicate}
    returning
      id,
      supervisee_id as "superviseeId",
      supervisor_id as "supervisorId",
      service_product_id as "serviceProductId",
      status,
      retention_days as "retentionDays",
      retention_expires_at as "retentionExpiresAt",
      urgency,
      desired_deadline as "desiredDeadline",
      created_at as "createdAt",
      updated_at as "updatedAt",
      null::text as "productTitle",
      (
        select p.kind::text
        from service_products p
        where p.id = service_product_id
      ) as "productKind",
      coalesce(
        (
          select to_jsonb(p)->>'supervision_type'
          from service_products p
          where p.id = service_product_id
        ),
        'assessment'
      ) as "serviceProductSupervisionType",
      null::text as "supervisorDisplayName",
      null::timestamptz as "scheduledStart",
      null::timestamptz as "scheduledEnd",
      null::text as "meetingUrl",
      null::text as "bookingStatus"
  `);

  return rowsOf<SupervisionRequestSummary>(result)[0] ?? null;
}

function statusPredicate(status: SupervisionStatus | SupervisionStatus[]): SQL {
  if (Array.isArray(status)) {
    return sql`status in (${sql.join(
      status.map((item) => sql`${item}`),
      sql`, `
    )})`;
  }

  return sql`status = ${status}`;
}

export async function deleteDraftSupervisionRequest(
  db: SupervisionDatabase,
  superviseeId: string,
  requestId: string
): Promise<boolean> {
  const result = await db.execute(sql`
    with packet as (
      select cp.id
      from case_packets cp
      join supervision_requests sr on sr.id = cp.supervision_request_id
      where sr.id = ${requestId}
        and sr.supervisee_id = ${superviseeId}
        and sr.status = 'draft'
    ),
    deleted_checklist as (
      delete from deidentification_checklists dc
      using packet
      where dc.case_packet_id = packet.id
      returning dc.id
    ),
    deleted_calendar_events as (
      delete from external_calendar_events e
      using bookings b, supervision_requests sr
      where e.booking_id = b.id
        and b.supervision_request_id = ${requestId}
        and sr.id = b.supervision_request_id
        and sr.supervisee_id = ${superviseeId}
        and sr.status = 'draft'
      returning e.id
    ),
    deleted_bookings as (
      delete from bookings b
      using supervision_requests sr
      where b.supervision_request_id = sr.id
        and sr.id = ${requestId}
        and sr.supervisee_id = ${superviseeId}
        and sr.status = 'draft'
      returning b.id
    ),
    deleted_packet as (
      delete from case_packets cp
      using packet
      where cp.id = packet.id
      returning cp.id
    ),
    deleted_request as (
      delete from supervision_requests sr
      where sr.id = ${requestId}
        and sr.supervisee_id = ${superviseeId}
        and sr.status = 'draft'
      returning sr.id
    )
    select count(*)::int as count from deleted_request
  `);

  return (rowsOf<{ count: number }>(result)[0]?.count ?? 0) === 1;
}

export type FeedbackInput = {
  summary: string;
  recommendations: string;
};

export type CompletionInput = {
  reviewedMaterials: string[];
  scope: string[];
  limitations: string;
  responsibilityNotice: string;
};

export type ReviewInput = {
  expertise: number;
  specificity: number;
  helpfulness: number;
  ethics: number;
  responseSpeed: number;
  onTime: number;
  educational: number;
  reuseIntent: number;
  freeText: string | null;
};

export async function createFeedback(
  db: SupervisionDatabase,
  supervisorId: string,
  requestId: string,
  input: FeedbackInput
): Promise<boolean> {
  const result = await db.execute(sql`
    with updated as (
      update feedbacks f
      set summary_enc = ${encryptPhi(input.summary)},
          recommendations_enc = ${encryptPhi(input.recommendations)},
          submitted_at = now()
      from supervision_requests sr
      where f.supervision_request_id = sr.id
        and sr.id = ${requestId}
        and sr.supervisor_id = ${supervisorId}
        and sr.status in ('accepted', 'in_review')
      returning f.id
    ),
    inserted as (
      insert into feedbacks (
        supervision_request_id,
        supervisor_id,
        summary_enc,
        recommendations_enc,
        submitted_at
      )
      select
        sr.id,
        ${supervisorId},
        ${encryptPhi(input.summary)},
        ${encryptPhi(input.recommendations)},
        now()
      from supervision_requests sr
      where sr.id = ${requestId}
        and sr.supervisor_id = ${supervisorId}
        and sr.status in ('accepted', 'in_review')
        and not exists (select 1 from updated)
      returning id
    )
    select id from updated
    union all
    select id from inserted
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function issueCompletionRecord(
  db: SupervisionDatabase,
  supervisorId: string,
  requestId: string,
  input: CompletionInput
): Promise<boolean> {
  const recordNo = `CF-${String(new Date().getFullYear())}-${requestId.slice(0, 8)}`;
  const result = await db.execute(sql`
    insert into completion_records (
      supervision_request_id,
      record_no,
      supervisor_id,
      supervisee_id,
      reviewed_materials,
      scope,
      limitations_enc,
      responsibility_notice,
      signature_storage_key,
      signature_attached_at,
      issued_at
    )
    select
      sr.id,
      ${recordNo},
      ${supervisorId},
      sr.supervisee_id,
      ${jsonb(input.reviewedMaterials)},
      ${jsonb(input.scope)},
      ${encryptPhi(input.limitations)},
      ${input.responsibilityNotice},
      'supervision-confirmation',
      now(),
      now()
    from supervision_requests sr
    left join service_products p on p.id = sr.service_product_id
    where sr.id = ${requestId}
      and sr.supervisor_id = ${supervisorId}
      and sr.status = 'feedback_submitted'
      and coalesce(to_jsonb(p)->>'supervision_type', 'assessment') = 'assessment'
      and exists (
        select 1
        from document_review_cycles drc
        where drc.supervision_request_id = sr.id
          and drc.status = 'feedback_approved'
      )
    on conflict (supervision_request_id) do nothing
    returning id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

export async function getCompletionRecordForRequest(
  db: SupervisionDatabase,
  requestId: string
): Promise<CompletionRecord | null> {
  const result = await db.execute(sql`
    select
      id,
      record_no as "recordNo",
      coalesce(reviewed_materials, '[]'::jsonb) as "reviewedMaterials",
      coalesce(scope, '[]'::jsonb) as scope,
      ${decryptPhi(sql`limitations_enc`)} as "limitations",
      responsibility_notice as "responsibilityNotice",
      signature_storage_key as "signatureStorageKey",
      signature_attached_at as "signatureAttachedAt",
      issued_at as "issuedAt"
    from completion_records
    where supervision_request_id = ${requestId}
    order by issued_at desc
    limit 1
  `);

  return rowsOf<CompletionRecord>(result)[0] ?? null;
}

export async function createReview(
  db: SupervisionDatabase,
  superviseeId: string,
  requestId: string,
  input: ReviewInput
): Promise<boolean> {
  const result = await db.execute(sql`
    insert into reviews (
      supervision_request_id,
      supervisor_id,
      supervisee_id,
      expertise,
      specificity,
      helpfulness,
      ethics,
      response_speed,
      on_time,
      educational,
      reuse_intent,
      free_text
    )
    select
      sr.id,
      sr.supervisor_id,
      ${superviseeId},
      ${input.expertise},
      ${input.specificity},
      ${input.helpfulness},
      ${input.ethics},
      ${input.responseSpeed},
      ${input.onTime},
      ${input.educational},
      ${input.reuseIntent},
      ${input.freeText}
    from supervision_requests sr
    left join service_products p on p.id = sr.service_product_id
    left join case_packets cp on cp.supervision_request_id = sr.id
    where sr.id = ${requestId}
      and sr.supervisee_id = ${superviseeId}
      and (
        sr.status = 'completion_record_issued'
        or (
          sr.status = 'feedback_submitted'
          and (
            coalesce(to_jsonb(p)->>'supervision_type', 'assessment') = 'counseling'
            or cp.needs_completion_record = false
          )
        )
      )
      and sr.supervisor_id is not null
    on conflict (supervision_request_id) do nothing
    returning id
  `);

  return rowsOf<{ id: string }>(result).length === 1;
}

function nullableDecrypt(ciphertext: SQLWrapper): SQL<string | null> {
  return sql<
    string | null
  >`case when ${ciphertext} is null then null else ${decryptPhi(ciphertext)} end`;
}

function jsonb(value: string[]): SQL<string[]> {
  return sql<string[]>`${JSON.stringify(value)}::jsonb`;
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
