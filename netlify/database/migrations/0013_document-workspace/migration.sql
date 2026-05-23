ALTER TABLE service_products
  ADD COLUMN IF NOT EXISTS supervision_type text NOT NULL DEFAULT 'assessment';--> statement-breakpoint
ALTER TABLE service_products
  ADD CONSTRAINT service_products_supervision_type_allowed
  CHECK (supervision_type IN ('assessment', 'counseling'));--> statement-breakpoint

ALTER TABLE case_files
  ADD COLUMN IF NOT EXISTS parent_file_id uuid REFERENCES case_files(id);--> statement-breakpoint
ALTER TABLE case_files
  ADD COLUMN IF NOT EXISTS version_no integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE case_files
  ADD COLUMN IF NOT EXISTS is_final_return boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE case_files
  ADD CONSTRAINT case_files_version_no_positive CHECK (version_no > 0);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS case_files_parent_file_id_idx
  ON case_files(parent_file_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS case_files_case_packet_version_idx
  ON case_files(case_packet_id, original_filename, version_no);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS case_file_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_file_id uuid NOT NULL REFERENCES case_files(id),
  status text NOT NULL DEFAULT 'pending',
  preview_storage_key text,
  preview_mime_type text,
  page_count integer,
  error_code text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT case_file_previews_status_allowed
    CHECK (status IN ('pending', 'ready', 'failed')),
  CONSTRAINT case_file_previews_page_count_positive
    CHECK (page_count IS NULL OR page_count > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS case_file_previews_case_file_unique
  ON case_file_previews(case_file_id);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS case_file_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_file_id uuid NOT NULL REFERENCES case_files(id),
  author_user_id uuid NOT NULL REFERENCES users(id),
  page_number integer NOT NULL,
  x_pct numeric(6,3) NOT NULL,
  y_pct numeric(6,3) NOT NULL,
  width_pct numeric(6,3) NOT NULL DEFAULT 0,
  height_pct numeric(6,3) NOT NULL DEFAULT 0,
  body_enc bytea NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT case_file_annotations_status_allowed
    CHECK (status IN ('active', 'resolved')),
  CONSTRAINT case_file_annotations_page_positive
    CHECK (page_number > 0),
  CONSTRAINT case_file_annotations_bounds
    CHECK (
      x_pct >= 0 AND x_pct <= 100
      AND y_pct >= 0 AND y_pct <= 100
      AND width_pct >= 0 AND width_pct <= 100
      AND height_pct >= 0 AND height_pct <= 100
    )
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS case_file_annotations_file_status_idx
  ON case_file_annotations(case_file_id, status, created_at);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS document_review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_request_id uuid NOT NULL REFERENCES supervision_requests(id),
  actor_user_id uuid NOT NULL REFERENCES users(id),
  target_file_id uuid REFERENCES case_files(id),
  status text NOT NULL,
  note_enc bytea,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT document_review_cycles_status_allowed
    CHECK (
      status IN (
        'revision_requested',
        'revision_uploaded',
        'feedback_approved',
        'stamped_returned'
      )
    )
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS document_review_cycles_request_status_idx
  ON document_review_cycles(supervision_request_id, status, created_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS document_review_cycles_target_file_idx
  ON document_review_cycles(target_file_id);--> statement-breakpoint

ALTER TABLE case_file_previews ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_file_previews FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_file_annotations ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_file_annotations FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE document_review_cycles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE document_review_cycles FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY case_file_previews_participant_select
ON case_file_previews FOR SELECT
USING (app.can_access_case_file(case_file_id));--> statement-breakpoint
CREATE POLICY case_file_previews_participant_insert
ON case_file_previews FOR INSERT
WITH CHECK (app.can_access_case_file(case_file_id));--> statement-breakpoint
CREATE POLICY case_file_previews_participant_update
ON case_file_previews FOR UPDATE
USING (app.can_access_case_file(case_file_id))
WITH CHECK (app.can_access_case_file(case_file_id));--> statement-breakpoint

CREATE POLICY case_file_annotations_participant_select
ON case_file_annotations FOR SELECT
USING (app.can_access_case_file(case_file_id));--> statement-breakpoint
CREATE POLICY case_file_annotations_supervisor_insert
ON case_file_annotations FOR INSERT
WITH CHECK (
  author_user_id = app.current_user_id()
  AND EXISTS (
    SELECT 1
    FROM case_files cf
    JOIN case_packets cp ON cp.id = cf.case_packet_id
    JOIN supervision_requests sr ON sr.id = cp.supervision_request_id
    WHERE cf.id = case_file_annotations.case_file_id
      AND sr.supervisor_id = app.current_user_id()
      AND app.current_user_role() = 'supervisor'
  )
);--> statement-breakpoint
CREATE POLICY case_file_annotations_author_update
ON case_file_annotations FOR UPDATE
USING (author_user_id = app.current_user_id() OR app.is_admin_with_reason())
WITH CHECK (author_user_id = app.current_user_id() OR app.is_admin_with_reason());--> statement-breakpoint

CREATE POLICY document_review_cycles_participant_select
ON document_review_cycles FOR SELECT
USING (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint
CREATE POLICY document_review_cycles_participant_insert
ON document_review_cycles FOR INSERT
WITH CHECK (
  actor_user_id = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
);--> statement-breakpoint
CREATE POLICY document_review_cycles_participant_update
ON document_review_cycles FOR UPDATE
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON case_file_previews TO csp_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON case_file_annotations TO csp_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON document_review_cycles TO csp_app;
