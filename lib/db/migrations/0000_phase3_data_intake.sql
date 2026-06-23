CREATE TYPE "public"."intake_source" AS ENUM('tag', 'screenshot', 'manual');--> statement-breakpoint
CREATE TYPE "public"."job_kind" AS ENUM('extraction', 'report_draft');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'drafting', 'awaiting_review', 'approved', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."report_tier" AS ENUM('free', 'basic', 'standard', 'pro', 'account_rescue', 'clan');--> statement-breakpoint
CREATE TYPE "public"."upload_kind" AS ENUM('screenshot', 'pdf', 'share_card');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('pending', 'stored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'coach', 'admin');--> statement-breakpoint
CREATE TABLE "account_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"snapshot_hash" text NOT NULL,
	"goal" text NOT NULL,
	"town_hall" integer NOT NULL,
	"normalized_account" jsonb NOT NULL,
	"provenance" jsonb NOT NULL,
	"engine_version" text NOT NULL,
	"reference_table_version" text NOT NULL,
	"knowledge_base_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"player_tag" text,
	"town_hall" integer NOT NULL,
	"source" "intake_source" NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"kind" "job_kind" NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"draft" jsonb,
	"confidence" real NOT NULL,
	"needs_human_review" boolean NOT NULL,
	"flags" jsonb NOT NULL,
	"attempts" integer NOT NULL,
	"reference_ready" boolean NOT NULL,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"goal" text NOT NULL,
	"tier" "report_tier" NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"overall" integer,
	"grade" text,
	"paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"account_id" uuid,
	"kind" "upload_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"status" "upload_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account_snapshots" ADD CONSTRAINT "account_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_snapshot_id_account_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."account_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_snapshot_id_account_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."account_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_snapshots_account_id_idx" ON "account_snapshots" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_snapshots_account_hash_uq" ON "account_snapshots" USING btree ("account_id","snapshot_hash");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_idempotency_key_uq" ON "jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "report_drafts_report_id_idx" ON "report_drafts" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "reports_account_id_idx" ON "reports" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uploads_storage_key_uq" ON "uploads" USING btree ("storage_key");