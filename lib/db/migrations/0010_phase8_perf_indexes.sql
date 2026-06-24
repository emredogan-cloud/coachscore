-- Phase 8 performance indexes — composite + hot-path indexes for the queries
-- the app actually runs (webhook lookups, funnel aggregation, due-message scans,
-- entitlement checks). `IF NOT EXISTS` keeps this idempotent and safe to re-run.

-- Order fulfillment: webhook resolves by session id; users list their orders.
CREATE INDEX IF NOT EXISTS "orders_stripe_session_idx"
  ON "orders" ("stripe_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_status_idx"
  ON "orders" ("user_id", "status");--> statement-breakpoint

-- Entitlement checks on the read path: (user, report) and (user, product).
CREATE INDEX IF NOT EXISTS "entitlements_user_report_idx"
  ON "entitlements" ("user_id", "report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entitlements_user_product_idx"
  ON "entitlements" ("user_id", "product_sku");--> statement-breakpoint

-- Growth funnel aggregation scans events by (name, time).
CREATE INDEX IF NOT EXISTS "analytics_events_name_occurred_idx"
  ON "analytics_events" ("name", "occurred_at");--> statement-breakpoint

-- Referral attribution: find a referee's pending referral fast.
CREATE INDEX IF NOT EXISTS "referrals_referee_status_idx"
  ON "referrals" ("referee_user_id", "status");--> statement-breakpoint

-- Lifecycle dispatch scans scheduled messages whose time has come.
CREATE INDEX IF NOT EXISTS "lifecycle_status_scheduled_idx"
  ON "lifecycle_messages" ("status", "scheduled_for");--> statement-breakpoint

-- Queue: dead-letter inspection + idempotency lookups by status.
CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs" ("status");--> statement-breakpoint

-- Reports listing by account is on the dashboard read path.
CREATE INDEX IF NOT EXISTS "reports_account_idx" ON "reports" ("account_id");
