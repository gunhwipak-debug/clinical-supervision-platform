-- ==== 0000_initial_schema.sql ====
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('scheduled', 'rescheduled', 'cancelled', 'completed', 'no_show_supervisee', 'no_show_supervisor');--> statement-breakpoint
CREATE TYPE "public"."case_file_kind" AS ENUM('report_draft', 'test_result', 'scoring_sheet', 'response_sheet', 'behavioral_observation', 'interview_summary', 'other', 'direct_edit_revision');--> statement-breakpoint
CREATE TYPE "public"."comment_severity" AS ENUM('info', 'suggestion', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('tos', 'privacy', 'sensitive', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."deletion_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."deletion_target_type" AS ENUM('user', 'case_file', 'case_packet', 'supervision_request');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'investigating', 'resolved_refund', 'resolved_partial', 'resolved_denied', 'closed');--> statement-breakpoint
CREATE TYPE "public"."file_access_action" AS ENUM('view', 'download', 'upload', 'delete');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'partially_refunded', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('scheduled', 'held', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."phi_scan_status" AS ENUM('pending', 'clean', 'suspicious');--> statement-breakpoint
CREATE TYPE "public"."preferred_method" AS ENUM('async_comment', 'direct_edit', 'zoom', 'comment_plus_zoom');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('hidden', 'public', 'private');--> statement-breakpoint
CREATE TYPE "public"."qualification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('requested', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('visible', 'hidden', 'reported');--> statement-breakpoint
CREATE TYPE "public"."service_product_kind" AS ENUM('async_comment', 'async_direct_edit', 'zoom_60', 'zoom_90', 'urgent_24h');--> statement-breakpoint
CREATE TYPE "public"."supervision_status" AS ENUM('draft', 'submitted', 'awaiting_payment', 'paid', 'awaiting_supervisor_review', 'accepted', 'rejected', 'additional_info_requested', 'in_review', 'feedback_submitted', 'meeting_scheduled', 'meeting_completed', 'completion_record_issued', 'completed', 'cancelled', 'refunded', 'expired', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."terms_kind" AS ENUM('tos', 'privacy', 'sensitive', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('normal', 'urgent_24h');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('supervisee', 'supervisor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."virus_scan_status" AS ENUM('pending', 'clean', 'infected', 'error');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"action" "file_access_action" NOT NULL,
	"ip_address" text,
	"signed_url_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_profile_id" uuid NOT NULL,
	"weekday" smallint,
	"start_time" time,
	"end_time" time,
	"timezone" text DEFAULT 'Asia/Seoul' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"meeting_url_enc" "bytea",
	"status" "booking_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_packet_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"kind" "case_file_kind" NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text NOT NULL,
	"kms_key_id" text,
	"checksum_sha256" text,
	"virus_scan_status" "virus_scan_status" DEFAULT 'pending' NOT NULL,
	"phi_scan_status" "phi_scan_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"title_enc" "bytea" NOT NULL,
	"purpose" jsonb,
	"client_age_band" text,
	"client_gender" text,
	"setting" text,
	"chief_complaint_enc" "bytea",
	"referral_reason_enc" "bytea",
	"tests_used" jsonb,
	"request_items" jsonb,
	"preferred_method" "preferred_method",
	"needs_completion_record" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completion_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"record_no" text NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"supervisee_id" uuid NOT NULL,
	"supervisor_qualification_snapshot" jsonb,
	"reviewed_materials" jsonb,
	"scope" jsonb,
	"limitations_enc" "bytea",
	"responsibility_notice" text,
	"signature_storage_key" text,
	"signature_attached_at" timestamp with time zone,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_storage_key" text
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"terms_version_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"consented" boolean NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "deidentification_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_packet_id" uuid NOT NULL,
	"removed_name" boolean NOT NULL,
	"removed_rrn" boolean NOT NULL,
	"removed_phone" boolean NOT NULL,
	"removed_address" boolean NOT NULL,
	"removed_guardian_name" boolean NOT NULL,
	"removed_org_name" boolean NOT NULL,
	"removed_chart_number" boolean NOT NULL,
	"filename_safe" boolean NOT NULL,
	"raw_data_safe" boolean NOT NULL,
	"minimal_info" boolean NOT NULL,
	"client_consent_confirmed" boolean NOT NULL,
	"purpose_understood" boolean NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_by" uuid
);
--> statement-breakpoint
CREATE TABLE "deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by" uuid,
	"target_type" "deletion_target_type",
	"target_id" uuid,
	"reason" text,
	"status" "deletion_status" DEFAULT 'pending' NOT NULL,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"raised_by" uuid NOT NULL,
	"reason" text,
	"description_enc" "bytea",
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"summary_enc" "bytea",
	"recommendations_enc" "bytea",
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inline_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"target_file_id" uuid,
	"anchor" jsonb,
	"comment_enc" "bytea",
	"severity" "comment_severity",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"amount_krw" integer NOT NULL,
	"platform_fee_krw" integer NOT NULL,
	"supervisor_net_krw" integer NOT NULL,
	"pg_provider" text DEFAULT 'toss' NOT NULL,
	"pg_payment_key" text,
	"pg_order_id" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"period_start" date,
	"period_end" date,
	"gross_krw" integer,
	"platform_fee_krw" integer,
	"net_krw" integer,
	"status" "payout_status",
	"scheduled_at" date,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"number_enc" "bytea",
	"issuing_body" text,
	"issued_at" date,
	"expires_at" date,
	"evidence_file_id" uuid,
	"verification_note" text,
	"status" "qualification_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_krw" integer NOT NULL,
	"reason" text,
	"initiated_by" uuid,
	"status" "refund_status" DEFAULT 'requested' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid,
	"target_type" text,
	"target_id" uuid,
	"reason" text,
	"description" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervision_request_id" uuid NOT NULL,
	"supervisor_id" uuid NOT NULL,
	"supervisee_id" uuid NOT NULL,
	"expertise" smallint,
	"specificity" smallint,
	"helpfulness" smallint,
	"ethics" smallint,
	"response_speed" smallint,
	"on_time" smallint,
	"educational" smallint,
	"reuse_intent" smallint,
	"free_text" text,
	"status" "review_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisor_profile_id" uuid NOT NULL,
	"kind" "service_product_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price_krw" integer NOT NULL,
	"turnaround_hours" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialty_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label_ko" text NOT NULL,
	"parent_id" uuid,
	"display_order" integer,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervision_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supervisee_id" uuid NOT NULL,
	"supervisor_id" uuid,
	"service_product_id" uuid,
	"status" "supervision_status" DEFAULT 'draft' NOT NULL,
	"retention_days" integer NOT NULL,
	"retention_expires_at" timestamp with time zone,
	"urgency" "urgency",
	"desired_deadline" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervisor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"photo_url" text,
	"headline" text,
	"bio" text,
	"years_of_experience" integer,
	"signature_storage_key" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"visibility" "profile_visibility" DEFAULT 'hidden' NOT NULL,
	"avg_response_minutes" integer,
	"accept_rate" numeric(4, 3),
	"total_completed" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supervisor_specialties" (
	"supervisor_profile_id" uuid NOT NULL,
	"specialty_id" uuid NOT NULL,
	CONSTRAINT "supervisor_specialties_supervisor_profile_id_specialty_id_pk" PRIMARY KEY("supervisor_profile_id","specialty_id")
);
--> statement-breakpoint
CREATE TABLE "terms_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "terms_kind" NOT NULL,
	"version" text NOT NULL,
	"content_md" text,
	"effective_from" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"role" "user_role" NOT NULL,
	"display_name_enc" "bytea",
	"phone_enc" "bytea",
	"totp_secret_enc" "bytea",
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_supervisor_profile_id_supervisor_profiles_id_fk" FOREIGN KEY ("supervisor_profile_id") REFERENCES "public"."supervisor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_case_packet_id_case_packets_id_fk" FOREIGN KEY ("case_packet_id") REFERENCES "public"."case_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_packets" ADD CONSTRAINT "case_packets_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_records" ADD CONSTRAINT "completion_records_supervisee_id_users_id_fk" FOREIGN KEY ("supervisee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_terms_version_id_terms_versions_id_fk" FOREIGN KEY ("terms_version_id") REFERENCES "public"."terms_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deidentification_checklists" ADD CONSTRAINT "deidentification_checklists_case_packet_id_case_packets_id_fk" FOREIGN KEY ("case_packet_id") REFERENCES "public"."case_packets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deidentification_checklists" ADD CONSTRAINT "deidentification_checklists_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inline_comments" ADD CONSTRAINT "inline_comments_feedback_id_feedbacks_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inline_comments" ADD CONSTRAINT "inline_comments_target_file_id_case_files_id_fk" FOREIGN KEY ("target_file_id") REFERENCES "public"."case_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_supervisor_profile_id_supervisor_profiles_id_fk" FOREIGN KEY ("supervisor_profile_id") REFERENCES "public"."supervisor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_supervision_request_id_supervision_requests_id_fk" FOREIGN KEY ("supervision_request_id") REFERENCES "public"."supervision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_supervisee_id_users_id_fk" FOREIGN KEY ("supervisee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_supervisor_profile_id_supervisor_profiles_id_fk" FOREIGN KEY ("supervisor_profile_id") REFERENCES "public"."supervisor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialty_catalog" ADD CONSTRAINT "specialty_catalog_parent_id_specialty_catalog_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specialty_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_requests" ADD CONSTRAINT "supervision_requests_supervisee_id_users_id_fk" FOREIGN KEY ("supervisee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_requests" ADD CONSTRAINT "supervision_requests_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervision_requests" ADD CONSTRAINT "supervision_requests_service_product_id_service_products_id_fk" FOREIGN KEY ("service_product_id") REFERENCES "public"."service_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_profiles" ADD CONSTRAINT "supervisor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_specialties" ADD CONSTRAINT "supervisor_specialties_supervisor_profile_id_supervisor_profiles_id_fk" FOREIGN KEY ("supervisor_profile_id") REFERENCES "public"."supervisor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supervisor_specialties" ADD CONSTRAINT "supervisor_specialties_specialty_id_specialty_catalog_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialty_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_file_created_at_idx" ON "access_logs" USING btree ("file_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "case_files_case_packet_id_idx" ON "case_files" USING btree ("case_packet_id");--> statement-breakpoint
CREATE INDEX "case_files_retention_expires_at_idx" ON "case_files" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "completion_records_request_unique" ON "completion_records" USING btree ("supervision_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "completion_records_record_no_unique" ON "completion_records" USING btree ("record_no");--> statement-breakpoint
CREATE INDEX "consent_records_user_type_idx" ON "consent_records" USING btree ("user_id","consent_type");--> statement-breakpoint
CREATE UNIQUE INDEX "deidentification_checklists_case_packet_unique" ON "deidentification_checklists" USING btree ("case_packet_id");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_supervision_request_status_idx" ON "payments" USING btree ("supervision_request_id","status");--> statement-breakpoint
CREATE INDEX "qualifications_supervisor_profile_status_idx" ON "qualifications" USING btree ("supervisor_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_supervision_request_unique" ON "reviews" USING btree ("supervision_request_id");--> statement-breakpoint
CREATE INDEX "service_products_supervisor_active_idx" ON "service_products" USING btree ("supervisor_profile_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "specialty_catalog_code_unique" ON "specialty_catalog" USING btree ("code");--> statement-breakpoint
CREATE INDEX "supervision_requests_supervisee_status_idx" ON "supervision_requests" USING btree ("supervisee_id","status");--> statement-breakpoint
CREATE INDEX "supervision_requests_supervisor_status_idx" ON "supervision_requests" USING btree ("supervisor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "supervisor_profiles_user_id_unique" ON "supervisor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "supervisor_profiles_visibility_verification_idx" ON "supervisor_profiles" USING btree ("visibility","verification_status");--> statement-breakpoint
CREATE INDEX "supervisor_specialties_specialty_id_idx" ON "supervisor_specialties" USING btree ("specialty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");

-- ==== 0001_rls_policies.sql ====
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

-- ==== 0002_app_role_and_fixes.sql ====
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

-- ==== 0003_default_privileges.sql ====
-- Custom SQL migration file, put your code below! --
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO csp_app;--> statement-breakpoint

ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT EXECUTE ON FUNCTIONS TO csp_app;

-- ==== 0004_auth_columns.sql ====
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;
-- ==== 0005_auth_tokens.sql ====
CREATE TYPE "public"."auth_token_kind" AS ENUM('email_verify', 'password_reset');--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "auth_token_kind" NOT NULL,
	"token_hash" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip" text
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_token_hash_unique" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_kind_idx" ON "auth_tokens" USING btree ("user_id","kind");--> statement-breakpoint
CREATE INDEX "auth_tokens_lookup_idx" ON "auth_tokens" USING btree ("kind","token_hash","expires_at");--> statement-breakpoint

ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE auth_tokens FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY auth_tokens_owner_or_admin_all
ON auth_tokens FOR ALL
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');

-- ==== 0006_totp_recovery_codes.sql ====
CREATE TABLE "totp_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "totp_recovery_codes" ADD CONSTRAINT "totp_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "totp_recovery_codes_code_hash_unique" ON "totp_recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "totp_recovery_codes_user_active_idx" ON "totp_recovery_codes" USING btree ("user_id","consumed_at");--> statement-breakpoint

ALTER TABLE totp_recovery_codes ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE totp_recovery_codes FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY totp_recovery_codes_owner_or_admin_all
ON totp_recovery_codes FOR ALL
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');

-- ==== 0007_specialty_catalog_seed.sql ====
INSERT INTO specialty_catalog (code, label_ko, display_order, active)
VALUES
  ('adult_psychopathology', '성인 정신병리', 10, true),
  ('child_psychopathology', '아동·청소년 정신병리', 20, true),
  ('neuropsych', '신경심리평가', 30, true),
  ('personality_assessment', '성격평가', 40, true),
  ('cognitive_assessment', '인지평가', 50, true),
  ('projective', '투사검사', 60, true),
  ('forensic', '법정·감정 평가', 70, true),
  ('geriatric', '노인심리평가', 80, true),
  ('trauma', '외상·PTSD', 90, true),
  ('addiction', '중독', 100, true),
  ('autism', '자폐스펙트럼', 110, true),
  ('learning_disorder', '학습장애', 120, true)
ON CONFLICT (code) DO NOTHING;

-- ==== 0008_profile_constraints.sql ====
ALTER TABLE service_products
  ADD CONSTRAINT service_products_price_krw_min CHECK (price_krw >= 10000);--> statement-breakpoint

ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_weekday_range CHECK (weekday BETWEEN 0 AND 6);--> statement-breakpoint

ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_time_order CHECK (start_time < end_time);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS supervisor_specialties_profile_idx
  ON supervisor_specialties (supervisor_profile_id);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS supervisee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  display_name text NOT NULL,
  headline text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS supervisee_profiles_user_id_unique
  ON supervisee_profiles (user_id);--> statement-breakpoint

ALTER TABLE supervisee_profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE supervisee_profiles FORCE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY supervisee_profiles_owner_or_admin_select
ON supervisee_profiles FOR SELECT
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY supervisee_profiles_owner_insert
ON supervisee_profiles FOR INSERT
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

CREATE POLICY supervisee_profiles_owner_update
ON supervisee_profiles FOR UPDATE
USING (user_id = app.current_user_id() OR app.current_user_role() = 'admin')
WITH CHECK (user_id = app.current_user_id() OR app.current_user_role() = 'admin');--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON supervisee_profiles TO csp_app;

-- ==== 0009_supervision_request_constraints.sql ====
ALTER TABLE "case_packets" ADD CONSTRAINT "case_packets_client_age_band_allowed" CHECK ("case_packets"."client_age_band" is null or "case_packets"."client_age_band" in ('6-12', '13-18', '19-39', '40-64', '65+'));--> statement-breakpoint
ALTER TABLE "case_packets" ADD CONSTRAINT "case_packets_setting_allowed" CHECK ("case_packets"."setting" is null or "case_packets"."setting" in ('hospital', 'counseling_center', 'community_center', 'school', 'other'));--> statement-breakpoint
ALTER TABLE "supervision_requests" ADD CONSTRAINT "supervision_requests_retention_days_allowed" CHECK ("supervision_requests"."retention_days" in (7, 30, 90));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supervision_requests_supervisee_status_idx" ON "supervision_requests" USING btree ("supervisee_id","status");

-- ==== 0010_payments_constraints.sql ====
ALTER TABLE "payouts" ALTER COLUMN "period_start" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "period_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "gross_krw" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "platform_fee_krw" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "net_krw" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_pg_order_id_unique" ON "payments" USING btree ("pg_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_pg_payment_key_unique" ON "payments" USING btree ("pg_payment_key") WHERE "payments"."pg_payment_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_supervisor_period_unique" ON "payouts" USING btree ("supervisor_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_krw_min" CHECK ("payments"."amount_krw" >= 1000);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_platform_fee_non_negative" CHECK ("payments"."platform_fee_krw" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supervisor_net_non_negative" CHECK ("payments"."supervisor_net_krw" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_net_matches_amount_minus_fee" CHECK ("payments"."supervisor_net_krw" = "payments"."amount_krw" - "payments"."platform_fee_krw");--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_gross_krw_non_negative" CHECK ("payouts"."gross_krw" >= 0);--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_platform_fee_krw_non_negative" CHECK ("payouts"."platform_fee_krw" >= 0);--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_net_krw_non_negative" CHECK ("payouts"."net_krw" >= 0);--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_krw_positive" CHECK ("refunds"."amount_krw" > 0);
-- ==== 0011_critical_path.sql ====
CREATE UNIQUE INDEX IF NOT EXISTS "feedbacks_supervision_request_unique"
ON "feedbacks" USING btree ("supervision_request_id");--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_scores_range'
  ) THEN
    ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_scores_range"
    CHECK (
      (expertise is null or expertise between 1 and 5)
      and (specificity is null or specificity between 1 and 5)
      and (helpfulness is null or helpfulness between 1 and 5)
      and (ethics is null or ethics between 1 and 5)
      and (response_speed is null or response_speed between 1 and 5)
      and (on_time is null or on_time between 1 and 5)
      and (educational is null or educational between 1 and 5)
      and (reuse_intent is null or reuse_intent between 1 and 5)
    );
  END IF;
END $$;

-- ==== 0012_case_files_security.sql ====
ALTER TABLE case_files
  ADD CONSTRAINT case_files_size_positive CHECK (size_bytes > 0);--> statement-breakpoint
ALTER TABLE case_files
  ADD CONSTRAINT case_files_checksum_sha256_format
  CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-f0-9]{64}$');--> statement-breakpoint
CREATE UNIQUE INDEX case_files_storage_key_unique
ON case_files (storage_key);--> statement-breakpoint

-- ==== 0013_document_workspace.sql ====
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

-- ==== 0014_google_calendar.sql ====
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

-- ==== 0015_qualification_evidence.sql ====
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



-- ==== seed: terms_versions (운영 필수) ====
INSERT INTO terms_versions (kind, version, content_md, effective_from, is_active)
VALUES
  ('tos',       'v1', '서비스 이용약관 v1 (운영 임시 본문 — 추후 교체)',  current_date, true),
  ('privacy',   'v1', '개인정보 처리방침 v1 (운영 임시 본문 — 추후 교체)', current_date, true),
  ('sensitive', 'v1', '민감정보 처리 동의 v1 (운영 임시 본문 — 추후 교체)', current_date, true)
ON CONFLICT DO NOTHING;
