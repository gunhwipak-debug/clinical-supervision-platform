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