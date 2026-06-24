CREATE TYPE "public"."analytics_source" AS ENUM('web', 'server');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_kind" AS ENUM('onboarding_reminder', 'abandoned_checkout', 'retention', 'winback');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_status" AS ENUM('scheduled', 'sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'qualified', 'rewarded', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"name" text NOT NULL,
	"source" "analytics_source" DEFAULT 'server' NOT NULL,
	"properties" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" text NOT NULL,
	"experiment_key" text NOT NULL,
	"variant" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lifecycle_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text,
	"kind" "lifecycle_kind" NOT NULL,
	"status" "lifecycle_status" DEFAULT 'scheduled' NOT NULL,
	"dedupe_key" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lifecycle_messages_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referee_user_id" uuid,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"reward_cents" integer DEFAULT 0 NOT NULL,
	"attributed_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"qualified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lifecycle_messages" ADD CONSTRAINT "lifecycle_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_code_id_referral_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_user_id_users_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_attributed_order_id_orders_id_fk" FOREIGN KEY ("attributed_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "experiment_assignments_subject_key_idx" ON "experiment_assignments" USING btree ("subject_id","experiment_key");--> statement-breakpoint
CREATE INDEX "lifecycle_messages_status_idx" ON "lifecycle_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lifecycle_messages_scheduled_idx" ON "lifecycle_messages" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "lifecycle_messages_user_idx" ON "lifecycle_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referral_codes_user_idx" ON "referral_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "referrals_code_idx" ON "referrals" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "referrals_referee_idx" ON "referrals" USING btree ("referee_user_id");