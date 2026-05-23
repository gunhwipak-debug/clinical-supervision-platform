CREATE TABLE IF NOT EXISTS qualification_evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_profile_id uuid NOT NULL REFERENCES supervisor_profiles(id),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_key text NOT NULL,
  checksum_sha256 text,
  virus_scan_status virus_scan_status NOT NULL DEFAULT 'clean',
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT qualification_evidence_files_size_positive CHECK (size_bytes > 0)
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS qualification_evidence_files_storage_key_unique
  ON qualification_evidence_files(storage_key);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS qualification_evidence_files_profile_idx
  ON qualification_evidence_files(supervisor_profile_id, uploaded_at DESC);--> statement-breakpoint

ALTER TABLE qualifications
  DROP CONSTRAINT IF EXISTS qualifications_evidence_file_id_fk;--> statement-breakpoint
ALTER TABLE qualifications
  ADD CONSTRAINT qualifications_evidence_file_id_fk
  FOREIGN KEY (evidence_file_id)
  REFERENCES qualification_evidence_files(id);--> statement-breakpoint

ALTER TABLE qualification_evidence_files ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE qualification_evidence_files FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY qualification_evidence_files_owner_or_admin_select
ON qualification_evidence_files FOR SELECT
USING (
  app.current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = qualification_evidence_files.supervisor_profile_id
      AND sp.user_id = app.current_user_id()
  )
);--> statement-breakpoint

CREATE POLICY qualification_evidence_files_owner_insert
ON qualification_evidence_files FOR INSERT
WITH CHECK (
  uploaded_by = app.current_user_id()
  AND EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = qualification_evidence_files.supervisor_profile_id
      AND sp.user_id = app.current_user_id()
  )
);--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON qualification_evidence_files TO csp_app;
