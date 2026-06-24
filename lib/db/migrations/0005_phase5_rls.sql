-- Row-Level Security for Phase 5 marketplace tables — deny-by-default.
--
-- Continues 0001/0003. Owner-scoped reads (a coach sees their own coach row,
-- assignments, payouts; a user sees their own application/ratings/disputes/
-- notifications); active coach profiles are publicly readable; moderation is
-- elevated-only. All state-advancing writes are service_role (the marketplace
-- service), except the user-initiated inserts (apply, rate, raise a dispute).

-- Helper: the coach row id owned by the current user (NULL if not a coach).
CREATE OR REPLACE FUNCTION public.current_coach_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id FROM public.coaches c WHERE c.user_id = auth.uid() LIMIT 1;
$$;
--> statement-breakpoint

ALTER TABLE "coaches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coach_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "review_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "moderations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "moderations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coach_ratings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payout_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "disputes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- coaches: read own / active (public profile) / elevated; update own profile.
CREATE POLICY "coaches_select" ON "coaches" FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR status = 'active'
    OR public.current_user_has_elevated_role()
  );--> statement-breakpoint
CREATE POLICY "coaches_update_own" ON "coaches" FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- coach_applications: applicant reads + inserts own; elevated reads all.
CREATE POLICY "coach_applications_select" ON "coach_applications" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "coach_applications_insert_own" ON "coach_applications" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- review_assignments: the assigned coach reads own; elevated reads all; writes service_role.
CREATE POLICY "review_assignments_select" ON "review_assignments" FOR SELECT TO authenticated
  USING (
    coach_id = public.current_coach_id()
    OR public.current_user_has_elevated_role()
  );--> statement-breakpoint

-- moderations: elevated only (FORCE RLS; otherwise service_role).
CREATE POLICY "moderations_select_elevated" ON "moderations" FOR SELECT TO authenticated
  USING (public.current_user_has_elevated_role());--> statement-breakpoint

-- coach_ratings: visible ratings are public; rater reads own; insert own.
CREATE POLICY "coach_ratings_select" ON "coach_ratings" FOR SELECT TO authenticated
  USING (
    moderation = 'visible'
    OR rater_user_id = auth.uid()
    OR public.current_user_has_elevated_role()
  );--> statement-breakpoint
CREATE POLICY "coach_ratings_insert_own" ON "coach_ratings" FOR INSERT TO authenticated
  WITH CHECK (rater_user_id = auth.uid());--> statement-breakpoint

-- payout_accounts + payouts: the owning coach reads own; writes service_role.
CREATE POLICY "payout_accounts_select_own" ON "payout_accounts" FOR SELECT TO authenticated
  USING (
    coach_id = public.current_coach_id()
    OR public.current_user_has_elevated_role()
  );--> statement-breakpoint
CREATE POLICY "payouts_select_own" ON "payouts" FOR SELECT TO authenticated
  USING (
    coach_id = public.current_coach_id()
    OR public.current_user_has_elevated_role()
  );--> statement-breakpoint

-- disputes: raiser reads + inserts own; elevated reads all.
CREATE POLICY "disputes_select" ON "disputes" FOR SELECT TO authenticated
  USING (raised_by_user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "disputes_insert_own" ON "disputes" FOR INSERT TO authenticated
  WITH CHECK (raised_by_user_id = auth.uid());--> statement-breakpoint

-- notifications: recipient reads own; writes service_role.
CREATE POLICY "notifications_select_own" ON "notifications" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());
