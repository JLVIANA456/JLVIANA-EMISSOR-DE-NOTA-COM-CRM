
-- Allow anon users to view invoice requests (until auth is implemented)
DROP POLICY "Authenticated users can view invoice requests" ON public.invoice_requests;
CREATE POLICY "Anyone can view invoice requests"
  ON public.invoice_requests FOR SELECT
  USING (true);
