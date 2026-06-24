-- Row-Level Security for Phase 7 growth tables — deny-by-default.
--
-- Continues 0001/0003/0005/0007. Analytics + lifecycle are operational data
-- (elevated read only); a user sees their own experiment assignments, referral
-- code, and the referrals they made. All status-advancing / attribution writes
-- (assignment, referral qualification, lifecycle send) are service_role — the
-- growth services run server-side and bypass RLS.

ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "experiment_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "referral_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lifecycle_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- analytics_events: a client may insert its own event (own user_id, or anonymous);
-- only elevated roles read the raw stream (dashboards aggregate server-side).
CREATE POLICY "analytics_events_insert_own" ON "analytics_events" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);--> statement-breakpoint
CREATE POLICY "analytics_events_select_elevated" ON "analytics_events" FOR SELECT TO authenticated
  USING (public.current_user_has_elevated_role());--> statement-breakpoint

-- experiment_assignments: subject reads its own; elevated reads all. Writes are
-- service_role (no INSERT/UPDATE policy → denied for authenticated).
CREATE POLICY "experiment_assignments_select" ON "experiment_assignments" FOR SELECT TO authenticated
  USING (
    subject_id = auth.uid()::text OR public.current_user_has_elevated_role()
  );--> statement-breakpoint

-- referral_codes: owner reads + creates its own; elevated reads all.
CREATE POLICY "referral_codes_select" ON "referral_codes" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "referral_codes_insert_own" ON "referral_codes" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- referrals: the referrer reads its own; elevated reads all. Attribution +
-- reward writes are service_role.
CREATE POLICY "referrals_select" ON "referrals" FOR SELECT TO authenticated
  USING (
    referrer_user_id = auth.uid() OR public.current_user_has_elevated_role()
  );--> statement-breakpoint

-- lifecycle_messages: operational queue — elevated read only; writes service_role.
CREATE POLICY "lifecycle_messages_select_elevated" ON "lifecycle_messages" FOR SELECT TO authenticated
  USING (public.current_user_has_elevated_role());
