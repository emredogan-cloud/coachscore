-- Row-Level Security — deny-by-default (Phase 3).
--
-- Mirrors lib/auth/policy.ts so the same rules are enforced at the database.
-- Targets Supabase: auth.uid() is the authenticated user's UUID, `authenticated`
-- and `service_role` are Supabase Postgres roles, and the service_role key
-- (server-side only) BYPASSES RLS for trusted writes. Enabling RLS with no
-- matching policy denies access — that is the default posture here.

-- Helper: does the current user hold an elevated (coach/admin) role?
CREATE OR REPLACE FUNCTION public.current_user_has_elevated_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('coach', 'admin')
  );
$$;
--> statement-breakpoint

-- Enable (and, for server-only tables, FORCE) RLS.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "report_drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "uploads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- users: read/update only your own row; elevated roles may read all.
CREATE POLICY "users_select_self" ON "users" FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "users_update_self" ON "users" FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());--> statement-breakpoint

-- accounts: owner full CRUD; elevated roles may read all.
CREATE POLICY "accounts_select_own" ON "accounts" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "accounts_insert_own" ON "accounts" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "accounts_update_own" ON "accounts" FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "accounts_delete_own" ON "accounts" FOR DELETE TO authenticated
  USING (user_id = auth.uid());--> statement-breakpoint

-- account_snapshots: access derived from parent account ownership; immutable
-- (no UPDATE/DELETE policy → denied for everyone but service_role).
CREATE POLICY "snapshots_select_via_account" ON "account_snapshots" FOR SELECT TO authenticated
  USING (
    public.current_user_has_elevated_role() OR EXISTS (
      SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
    )
  );--> statement-breakpoint
CREATE POLICY "snapshots_insert_via_account" ON "account_snapshots" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
  ));--> statement-breakpoint

-- reports: owner reads own (via account), elevated roles read all + may update
-- (review/deliver); owner may create.
CREATE POLICY "reports_select" ON "reports" FOR SELECT TO authenticated
  USING (
    public.current_user_has_elevated_role() OR EXISTS (
      SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
    )
  );--> statement-breakpoint
CREATE POLICY "reports_insert_own" ON "reports" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
  ));--> statement-breakpoint
CREATE POLICY "reports_update_elevated" ON "reports" FOR UPDATE TO authenticated
  USING (public.current_user_has_elevated_role())
  WITH CHECK (public.current_user_has_elevated_role());--> statement-breakpoint

-- report_drafts: readable by elevated roles and the owning user (report→account);
-- written only by the server (service_role) → no INSERT/UPDATE policy.
CREATE POLICY "report_drafts_select" ON "report_drafts" FOR SELECT TO authenticated
  USING (
    public.current_user_has_elevated_role() OR EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.accounts a ON a.id = r.account_id
      WHERE r.id = report_id AND a.user_id = auth.uid()
    )
  );--> statement-breakpoint

-- uploads: owner CRUD by user_id; elevated roles may read.
CREATE POLICY "uploads_select_own" ON "uploads" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "uploads_insert_own" ON "uploads" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "uploads_delete_own" ON "uploads" FOR DELETE TO authenticated
  USING (user_id = auth.uid());--> statement-breakpoint

-- jobs + audit_logs: NO authenticated policies → fully denied. Only the
-- service_role key (server-side) may read/write them (it bypasses RLS).
