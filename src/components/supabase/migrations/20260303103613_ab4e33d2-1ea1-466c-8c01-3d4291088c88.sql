
-- Fix people table: allow any authenticated user to update/delete
DROP POLICY "Users can delete their own people" ON public.people;
CREATE POLICY "Authenticated users can delete people"
  ON public.people FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY "Users can update their own people" ON public.people;
CREATE POLICY "Authenticated users can update people"
  ON public.people FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix salary_history table
DROP POLICY IF EXISTS "Users can update their own salary history" ON public.salary_history;
DROP POLICY IF EXISTS "Users can delete their own salary history" ON public.salary_history;
CREATE POLICY "Authenticated users can update salary_history"
  ON public.salary_history FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete salary_history"
  ON public.salary_history FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix salary_adjustments table
DROP POLICY IF EXISTS "Users can update their own salary adjustments" ON public.salary_adjustments;
DROP POLICY IF EXISTS "Users can delete their own salary adjustments" ON public.salary_adjustments;
CREATE POLICY "Authenticated users can update salary_adjustments"
  ON public.salary_adjustments FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete salary_adjustments"
  ON public.salary_adjustments FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix payroll_items table
DROP POLICY "Users can delete their own payroll items" ON public.payroll_items;
CREATE POLICY "Authenticated users can delete payroll_items"
  ON public.payroll_items FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY "Users can update their own payroll items" ON public.payroll_items;
CREATE POLICY "Authenticated users can update payroll_items"
  ON public.payroll_items FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix payroll_sheets table
DROP POLICY "Users can delete their own payroll sheets" ON public.payroll_sheets;
CREATE POLICY "Authenticated users can delete payroll_sheets"
  ON public.payroll_sheets FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY "Users can update their own payroll sheets" ON public.payroll_sheets;
CREATE POLICY "Authenticated users can update payroll_sheets"
  ON public.payroll_sheets FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);
