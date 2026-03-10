
-- Restore proper RLS now that auth is implemented
DROP POLICY "Anyone can view invoice requests" ON public.invoice_requests;
CREATE POLICY "Authenticated users can view invoice requests"
  ON public.invoice_requests FOR SELECT TO authenticated
  USING (true);
