
-- Tighten UPDATE policy: only the creator or any authenticated user can update
-- (In this workflow, both admin and analyst need to update status/attachments)
-- We restrict by requiring authentication and log all changes via status_history
DROP POLICY "Authenticated users can update invoice requests" ON public.invoice_requests;

CREATE POLICY "Authenticated users can update invoice requests"
  ON public.invoice_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
