CREATE POLICY "Users can delete their own invoice requests"
ON public.invoice_requests
FOR DELETE
USING (auth.uid() = user_id);