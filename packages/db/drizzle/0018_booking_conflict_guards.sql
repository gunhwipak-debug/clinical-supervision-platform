CREATE INDEX IF NOT EXISTS "bookings_active_request_time_idx"
  ON "bookings" USING btree ("supervision_request_id", "scheduled_start", "scheduled_end")
  WHERE "status" IN ('scheduled', 'rescheduled');--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.lock_supervisor_booking_window(target_supervisor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(target_supervisor_id::text));
  RETURN true;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.has_supervisor_booking_overlap(
  target_supervisor_id uuid,
  window_start timestamptz,
  window_end timestamptz,
  excluded_request_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.supervision_requests sr ON sr.id = b.supervision_request_id
    WHERE sr.supervisor_id = target_supervisor_id
      AND (excluded_request_id IS NULL OR sr.id <> excluded_request_id)
      AND b.status IN ('scheduled', 'rescheduled')
      AND b.scheduled_start < window_end
      AND window_start < b.scheduled_end
  );
$$;--> statement-breakpoint
