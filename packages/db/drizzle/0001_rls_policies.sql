-- Custom SQL migration file, put your code below! --
CREATE SCHEMA IF NOT EXISTS app;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.current_user_role', true), '');
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.admin_reason()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(nullif(current_setting('app.admin_reason', true), ''), '');
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_admin_with_reason()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.current_user_role() = 'admin' AND length(app.admin_reason()) >= 10;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_supervision_participant(request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.supervision_requests sr
    WHERE sr.id = request_id
      AND (
        sr.supervisee_id = app.current_user_id()
        OR sr.supervisor_id = app.current_user_id()
      )
  ) OR app.is_admin_with_reason();
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_access_case_packet(packet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.case_packets cp
    WHERE cp.id = packet_id
      AND app.is_supervision_participant(cp.supervision_request_id)
  );
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.can_access_case_file(file_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.case_files cf
    WHERE cf.id = file_id
      AND cf.deleted_at IS NULL
      AND app.can_access_case_packet(cf.case_packet_id)
  );
$$;--> statement-breakpoint

ALTER TABLE users ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE users FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervisor_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervisor_profiles FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE qualifications FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE specialty_catalog ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE specialty_catalog FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervisor_specialties ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervisor_specialties FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE service_products FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE availability_slots FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervision_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervision_requests FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_packets ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_packets FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE case_files FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE deidentification_checklists ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE deidentification_checklists FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE terms_versions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE terms_versions FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE payments FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE refunds FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE payouts FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE feedbacks FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE inline_comments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE inline_comments FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE completion_records ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE completion_records FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE access_logs FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE disputes FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE reports FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE deletion_requests FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY users_self_or_admin_select
ON users FOR SELECT
USING (id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY users_self_update
ON users FOR UPDATE
USING (id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY supervisor_profiles_public_or_owner_select
ON supervisor_profiles FOR SELECT
USING (
  (visibility = 'public' AND verification_status = 'approved')
  OR user_id = app.current_user_id()
  OR app.current_user_role() = 'admin'
);--> statement-breakpoint

CREATE POLICY supervisor_profiles_owner_insert
ON supervisor_profiles FOR INSERT
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY supervisor_profiles_owner_update
ON supervisor_profiles FOR UPDATE
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY qualifications_owner_or_admin_all
ON qualifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = qualifications.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = qualifications.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY specialty_catalog_read_active
ON specialty_catalog FOR SELECT
USING (active = true OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY specialty_catalog_admin_all
ON specialty_catalog FOR ALL
USING (app.current_user_role() = 'admin')
WITH CHECK (app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY supervisor_specialties_public_or_owner_select
ON supervisor_specialties FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM supervisor_profiles sp
    WHERE sp.id = supervisor_specialties.supervisor_profile_id
      AND (
        (sp.visibility = 'public' AND sp.verification_status = 'approved')
        OR sp.user_id = app.current_user_id()
        OR app.current_user_role() = 'admin'
      )
  )
);--> statement-breakpoint

CREATE POLICY supervisor_specialties_owner_all
ON supervisor_specialties FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = supervisor_specialties.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = supervisor_specialties.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY service_products_public_or_owner_select
ON service_products FOR SELECT
USING (
  active = true
  AND EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = service_products.supervisor_profile_id
      AND sp.visibility = 'public'
      AND sp.verification_status = 'approved'
  )
  OR EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = service_products.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY service_products_owner_all
ON service_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = service_products.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = service_products.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY availability_slots_owner_or_public_select
ON availability_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = availability_slots.supervisor_profile_id
      AND (
        (sp.visibility = 'public' AND sp.verification_status = 'approved')
        OR sp.user_id = app.current_user_id()
        OR app.current_user_role() = 'admin'
      )
  )
);--> statement-breakpoint

CREATE POLICY availability_slots_owner_all
ON availability_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = availability_slots.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supervisor_profiles sp
    WHERE sp.id = availability_slots.supervisor_profile_id
      AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
  )
);--> statement-breakpoint

CREATE POLICY supervision_requests_participant_select
ON supervision_requests FOR SELECT
USING (
  supervisee_id = app.current_user_id()
  OR supervisor_id = app.current_user_id()
  OR app.is_admin_with_reason()
);--> statement-breakpoint

CREATE POLICY supervision_requests_supervisee_insert
ON supervision_requests FOR INSERT
WITH CHECK (supervisee_id = app.current_user_id() OR app.is_admin_with_reason());--> statement-breakpoint

CREATE POLICY supervision_requests_participant_update
ON supervision_requests FOR UPDATE
USING (
  supervisee_id = app.current_user_id()
  OR supervisor_id = app.current_user_id()
  OR app.is_admin_with_reason()
)
WITH CHECK (
  supervisee_id = app.current_user_id()
  OR supervisor_id = app.current_user_id()
  OR app.is_admin_with_reason()
);--> statement-breakpoint

CREATE POLICY case_packets_participant_all
ON case_packets FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

CREATE POLICY case_files_participant_all
ON case_files FOR ALL
USING (
  deleted_at IS NULL
  AND app.can_access_case_packet(case_packet_id)
)
WITH CHECK (
  uploaded_by = app.current_user_id()
  AND app.can_access_case_packet(case_packet_id)
);--> statement-breakpoint

CREATE POLICY deidentification_checklists_participant_all
ON deidentification_checklists FOR ALL
USING (app.can_access_case_packet(case_packet_id))
WITH CHECK (app.can_access_case_packet(case_packet_id));--> statement-breakpoint

CREATE POLICY terms_versions_read_active
ON terms_versions FOR SELECT
USING (is_active = true OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY terms_versions_admin_all
ON terms_versions FOR ALL
USING (app.current_user_role() = 'admin')
WITH CHECK (app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY consent_records_owner_or_admin_all
ON consent_records FOR ALL
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY payments_participant_all
ON payments FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

CREATE POLICY refunds_payment_participant_all
ON refunds FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM payments p
    WHERE p.id = refunds.payment_id
      AND app.is_supervision_participant(p.supervision_request_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM payments p
    WHERE p.id = refunds.payment_id
      AND app.is_supervision_participant(p.supervision_request_id)
  )
);--> statement-breakpoint

CREATE POLICY payouts_supervisor_or_admin_select
ON payouts FOR SELECT
USING (supervisor_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY payouts_admin_all
ON payouts FOR ALL
USING (app.current_user_role() = 'admin')
WITH CHECK (app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY bookings_participant_all
ON bookings FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

CREATE POLICY feedbacks_participant_all
ON feedbacks FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (
  supervisor_id = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
);--> statement-breakpoint

CREATE POLICY inline_comments_feedback_participant_all
ON inline_comments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM feedbacks f
    WHERE f.id = inline_comments.feedback_id
      AND app.is_supervision_participant(f.supervision_request_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM feedbacks f
    WHERE f.id = inline_comments.feedback_id
      AND app.is_supervision_participant(f.supervision_request_id)
  )
);--> statement-breakpoint

CREATE POLICY completion_records_participant_all
ON completion_records FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (app.is_supervision_participant(supervision_request_id));--> statement-breakpoint

CREATE POLICY reviews_visible_or_participant_select
ON reviews FOR SELECT
USING (
  status = 'visible'
  OR supervisor_id = app.current_user_id()
  OR supervisee_id = app.current_user_id()
  OR app.current_user_role() = 'admin'
);--> statement-breakpoint

CREATE POLICY reviews_supervisee_insert
ON reviews FOR INSERT
WITH CHECK (supervisee_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY reviews_owner_or_admin_update
ON reviews FOR UPDATE
USING (supervisee_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (supervisee_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY notifications_owner_all
ON notifications FOR ALL
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY audit_logs_admin_select
ON audit_logs FOR SELECT
USING (app.is_admin_with_reason());--> statement-breakpoint

CREATE POLICY audit_logs_authenticated_insert
ON audit_logs FOR INSERT
WITH CHECK (
  actor_user_id = app.current_user_id()
  OR app.current_user_role() = 'admin'
);--> statement-breakpoint

CREATE POLICY access_logs_owner_or_admin_select
ON access_logs FOR SELECT
USING (user_id = app.current_user_id() OR app.is_admin_with_reason());--> statement-breakpoint

CREATE POLICY access_logs_authenticated_insert
ON access_logs FOR INSERT
WITH CHECK (
  user_id = app.current_user_id()
  AND app.can_access_case_file(file_id)
);--> statement-breakpoint

CREATE POLICY disputes_participant_all
ON disputes FOR ALL
USING (app.is_supervision_participant(supervision_request_id))
WITH CHECK (
  raised_by = app.current_user_id()
  AND app.is_supervision_participant(supervision_request_id)
);--> statement-breakpoint

CREATE POLICY reports_reporter_or_admin_all
ON reports FOR ALL
USING (reporter_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (reporter_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY deletion_requests_requester_or_admin_all
ON deletion_requests FOR ALL
USING (requested_by = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (requested_by = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only';
END;
$$;--> statement-breakpoint

CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION app.prevent_audit_log_mutation();--> statement-breakpoint

CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION app.prevent_audit_log_mutation();
