CREATE TYPE "public"."product_report_status" AS ENUM('pending', 'awaiting_review', 'in_review', 'approved', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_sku" AS ENUM('replay_doctor', 'base_doctor', 'war_plan');--> statement-breakpoint
CREATE TYPE "public"."product_submission_status" AS ENUM('received', 'analyzing', 'analyzed', 'failed');--> statement-breakpoint
CREATE TABLE "product_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"sku" "product_sku" NOT NULL,
	"analysis" jsonb NOT NULL,
	"score_label" text,
	"score_value" integer,
	"confidence" real DEFAULT 1 NOT NULL,
	"status" "product_report_status" DEFAULT 'pending' NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"sku" "product_sku" NOT NULL,
	"context" text,
	"input" jsonb NOT NULL,
	"upload_keys" jsonb,
	"status" "product_submission_status" DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "sku" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "tier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "review_assignments" ALTER COLUMN "report_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "product_sku" "product_sku";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_sku" "product_sku";--> statement-breakpoint
ALTER TABLE "review_assignments" ADD COLUMN "product_report_id" uuid;--> statement-breakpoint
ALTER TABLE "product_reports" ADD CONSTRAINT "product_reports_submission_id_product_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."product_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_submissions" ADD CONSTRAINT "product_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_reports_submission_idx" ON "product_reports" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "product_submissions_user_id_idx" ON "product_submissions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_product_report_id_product_reports_id_fk" FOREIGN KEY ("product_report_id") REFERENCES "public"."product_reports"("id") ON DELETE cascade ON UPDATE no action;