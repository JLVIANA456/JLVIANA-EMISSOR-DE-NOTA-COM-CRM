DROP POLICY "Users can update their own commissions" ON public.commissions;
CREATE POLICY "Authenticated users can update commissions"
  ON public.commissions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY "Users can delete their own commissions" ON public.commissions;
CREATE POLICY "Authenticated users can delete commissions"
  ON public.commissions FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);