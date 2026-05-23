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
