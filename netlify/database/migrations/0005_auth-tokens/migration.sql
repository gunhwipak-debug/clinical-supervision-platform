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
