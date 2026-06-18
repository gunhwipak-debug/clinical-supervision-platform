CREATE TABLE IF NOT EXISTS "availability_exceptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "supervisor_profile_id" uuid NOT NULL REFERENCES "public"."supervisor_profiles"("id"),
  "exception_date" date NOT NULL,
  "mode" text NOT NULL,
  "ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "timezone" text DEFAULT 'Asia/Seoul' NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "availability_exceptions_profile_date_unique"
  ON "availability_exceptions" USING btree ("supervisor_profile_id", "exception_date");--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'availability_exceptions_mode_allowed'
  ) THEN
    ALTER TABLE "availability_exceptions"
      ADD CONSTRAINT "availability_exceptions_mode_allowed"
      CHECK ("mode" in ('unavailable', 'custom'));
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'availability_exceptions_timezone_seoul'
  ) THEN
    ALTER TABLE "availability_exceptions"
      ADD CONSTRAINT "availability_exceptions_timezone_seoul"
      CHECK ("timezone" = 'Asia/Seoul');
  END IF;
END $$;--> statement-breakpoint

ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE availability_exceptions FORCE ROW LEVEL SECURITY;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_exceptions'
      AND policyname = 'availability_exceptions_owner_or_public_select'
  ) THEN
    CREATE POLICY availability_exceptions_owner_or_public_select
    ON availability_exceptions FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM supervisor_profiles sp
        WHERE sp.id = availability_exceptions.supervisor_profile_id
          AND (
            (sp.visibility = 'public' AND sp.verification_status = 'approved')
            OR sp.user_id = app.current_user_id()
            OR app.current_user_role() = 'admin'
          )
      )
    );
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_exceptions'
      AND policyname = 'availability_exceptions_owner_all'
  ) THEN
    CREATE POLICY availability_exceptions_owner_all
    ON availability_exceptions FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM supervisor_profiles sp
        WHERE sp.id = availability_exceptions.supervisor_profile_id
          AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM supervisor_profiles sp
        WHERE sp.id = availability_exceptions.supervisor_profile_id
          AND (sp.user_id = app.current_user_id() OR app.current_user_role() = 'admin')
      )
    );
  END IF;
END $$;--> statement-breakpoint
