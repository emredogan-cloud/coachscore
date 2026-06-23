-- Row-Level Security for Phase 4 tables — deny-by-default.
--
-- Continues lib/db/migrations/0001_rls_policies.sql. Orders + entitlements are
-- readable only by their owner (or elevated coach/admin) and are written ONLY by
-- the server (service_role bypasses RLS) — payment state must never be advanced
-- by a client. email_deliveries is server-only.

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entitlements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_deliveries" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- orders: owner (or elevated) may READ; no client write policy → writes are
-- service_role only (Stripe webhook + checkout creation).
CREATE POLICY "orders_select_own" ON "orders" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint

-- entitlements: owner (or elevated) may READ; writes are service_role only
-- (granted by the webhook on a paid order).
CREATE POLICY "entitlements_select_own" ON "entitlements" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint

-- email_deliveries: no authenticated policy → fully denied; service_role only.
