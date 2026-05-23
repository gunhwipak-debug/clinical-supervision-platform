CREATE TABLE IF NOT EXISTS "external_calendar_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "supervisor_profile_id" uuid NOT NULL,
  "provider" text DEFAULT 'google' NOT NULL,
  "provider_account_email" text,
  "calendar_id" text DEFAULT 'primary' NOT NULL,
  "access_token_enc" bytea NOT NULL,
  "refresh_token_enc" bytea NOT NULL,
  "access_token_expires_at" timestamp with time zone,
  "sync_status" text DEFAULT 'connected' NOT NULL,
  "last_sync_at" timestamp with time zone,
  "disconnected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "external_calendar_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL,
  "provider" text DEFAULT 'google' NOT NULL,
  "provider_event_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "cancelled_at" timestamp with time zone
);--> statement-breakpoint

ALTER TABLE "external_calendar_connections"
  ADD CONSTRAINT "external_calendar_connections_supervisor_profile_id_supervisor_profiles_id_fk"
  FOREIGN KEY ("supervisor_profile_id")
  REFERENCES "public"."supervisor_profiles"("id")
  ON DELETE no action
  ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "external_calendar_events"
  ADD CONSTRAINT "external_calendar_events_booking_id_bookings_id_fk"
  FOREIGN KEY ("booking_id")
  REFERENCES "public"."bookings"("id")
  ON DELETE no action
  ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "external_calendar_connections_profile_provider_unique"
  ON "external_calendar_connections" USING btree ("supervisor_profile_id", "provider");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "external_calendar_connections_profile_status_idx"
  ON "external_calendar_connections" USING btree ("supervisor_profile_id", "sync_status");--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "external_calendar_events_booking_provider_unique"
  ON "external_calendar_events" USING btree ("booking_id", "provider");--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "external_calendar_events_provider_event_unique"
  ON "external_calendar_events" USING btree ("provider", "provider_event_id");--> statement-breakpoint

ALTER TABLE "external_calendar_connections"
  ADD CONSTRAINT "external_calendar_connections_provider_google"
  CHECK ("provider" = 'google');--> statement-breakpoint

ALTER TABLE "external_calendar_connections"
  ADD CONSTRAINT "external_calendar_connections_status_allowed"
  CHECK ("sync_status" in ('connected', 'needs_reauth', 'error', 'disconnected'));--> statement-breakpoint

ALTER TABLE "external_calendar_events"
  ADD CONSTRAINT "external_calendar_events_provider_google"
  CHECK ("provider" = 'google');--> statement-breakpoint

ALTER TABLE external_calendar_connections ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE external_calendar_connections FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE external_calendar_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE external_calendar_events FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY external_calendar_connections_owner_all
ON external_calendar_connections FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = external_calendar_connections.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = external_calendar_connections.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY external_calendar_connections_public_supervisor_select
ON external_calendar_connections FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = external_calendar_connections.supervisor_profile_id
      AND sp.visibility = 'public'
      AND sp.verification_status = 'approved'
  )
);--> statement-breakpoint

CREATE POLICY external_calendar_events_participant_all
ON external_calendar_events FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.id = external_calendar_events.booking_id
      AND app.is_supervision_participant(b.supervision_request_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.id = external_calendar_events.booking_id
      AND app.is_supervision_participant(b.supervision_request_id)
  )
);
