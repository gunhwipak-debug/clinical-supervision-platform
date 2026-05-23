-- Custom SQL migration file, put your code below! --
-- EPIC 0 hardening patch: app runtime role, stricter RLS checks, immutable issued records.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'csp_app') THEN
    CREATE ROLE csp_app
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint

ALTER ROLE csp_app
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOREPLICATION
  NOBYPASSRLS;--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO csp_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO csp_app;--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO csp_app;--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO csp_app;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_admin_with_reason()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.current_user_role() = 'admin' AND length(app.admin_reason()) >= 30;
$$;--> statement-breakpoint

DROP INDEX IF EXISTS case_files_retention_expires_at_idx;--> statement-breakpoint
CREATE INDEX case_files_retention_expires_at_idx
ON case_files (retention_expires_at)
WHERE deleted_at IS NULL;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.prevent_log_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'log tables are append-only and cannot be truncated';
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate
BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION app.prevent_log_truncate();--> statement-breakpoint

DROP TRIGGER IF EXISTS access_logs_no_truncate ON access_logs;--> statement-breakpoint
CREATE TRIGGER access_logs_no_truncate
BEFORE TRUNCATE ON access_logs
FOR EACH STATEMENT EXECUTE FUNCTION app.prevent_log_truncate();--> statement-breakpoint

DROP POLICY IF EXISTS completion_records_participant_all ON completion_records;--> statement-breakpoint

CREATE POLICY completion_records_participant_select
ON completion_records FOR SELECT
USING (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

CREATE POLICY completion_records_supervisor_insert
ON completion_records FOR INSERT
WITH CHECK (
  supervisor_id = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
);--> statement-breakpoint

CREATE POLICY completion_records_supervisor_update
ON completion_records FOR UPDATE
USING (
  supervisor_id = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
)
WITH CHECK (
  supervisor_id = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
);--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.prevent_issued_completion_record_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.issued_at IS NOT NULL THEN
    RAISE EXCEPTION 'issued completion_records are immutable';
  END IF;

  RETURN OLD;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS completion_records_no_update_after_issue ON completion_records;--> statement-breakpoint
CREATE TRIGGER completion_records_no_update_after_issue
BEFORE UPDATE ON completion_records
FOR EACH ROW EXECUTE FUNCTION app.prevent_issued_completion_record_mutation();--> statement-breakpoint

DROP TRIGGER IF EXISTS completion_records_no_delete_after_issue ON completion_records;--> statement-breakpoint
CREATE TRIGGER completion_records_no_delete_after_issue
BEFORE DELETE ON completion_records
FOR EACH ROW EXECUTE FUNCTION app.prevent_issued_completion_record_mutation();--> statement-breakpoint

DROP POLICY IF EXISTS reviews_supervisee_insert ON reviews;--> statement-breakpoint

CREATE POLICY reviews_supervisee_insert
ON reviews FOR INSERT
WITH CHECK (
  supervisee_id = app.current_user_id()
  AND EXISTS (
    SELECT 1
    FROM supervision_requests sr
    WHERE sr.id = reviews.supervision_request_id
      AND sr.supervisee_id = app.current_user_id()
      AND sr.supervisor_id = reviews.supervisor_id
  )
);--> statement-breakpoint

CREATE POLICY users_context_insert
ON users FOR INSERT
WITH CHECK (
  app.current_user_id() IS NOT NULL
  AND (
    id = app.current_user_id()
    OR app.current_user_role() = 'admin'
  )
);
