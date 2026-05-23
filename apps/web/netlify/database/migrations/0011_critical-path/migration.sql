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
