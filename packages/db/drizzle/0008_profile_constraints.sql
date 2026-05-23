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
