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
