-- Row-Level Security for Phase 6 product tables — deny-by-default.
--
-- Continues 0001/0003/0005. A user reads + creates their own product
-- submissions and reads the reports derived from them; elevated coach/admin
-- roles read all (for review/moderation). All status-advancing writes are
-- service_role (the product service / coach-review path).

ALTER TABLE "product_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- product_submissions: owner reads + inserts own; elevated reads all.
CREATE POLICY "product_submissions_select" ON "product_submissions" FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_has_elevated_role());--> statement-breakpoint
CREATE POLICY "product_submissions_insert_own" ON "product_submissions" FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- product_reports: visible to the owning user (via the submission) and to
-- elevated roles; writes are service_role only.
CREATE POLICY "product_reports_select" ON "product_reports" FOR SELECT TO authenticated
  USING (
    public.current_user_has_elevated_role() OR EXISTS (
      SELECT 1 FROM public.product_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );
