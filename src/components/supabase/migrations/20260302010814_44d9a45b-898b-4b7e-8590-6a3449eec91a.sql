
-- Fase 1: Ajustar RLS SELECT para sistema interno (não multi-tenant)

-- fixed_costs
DROP POLICY IF EXISTS "Users can view their own fixed costs" ON public.fixed_costs;
CREATE POLICY "Authenticated users can view fixed costs"
  ON public.fixed_costs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- commissions
DROP POLICY IF EXISTS "Users can view their own commissions" ON public.commissions;
CREATE POLICY "Authenticated users can view commissions"
  ON public.commissions FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- pj_contracts
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.pj_contracts;
CREATE POLICY "Authenticated users can view pj contracts"
  ON public.pj_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- pj_absences
DROP POLICY IF EXISTS "Users can view their own absences" ON public.pj_absences;
CREATE POLICY "Authenticated users can view absences"
  ON public.pj_absences FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- salary_history
DROP POLICY IF EXISTS "Users can view their own salary history" ON public.salary_history;
CREATE POLICY "Authenticated users can view salary history"
  ON public.salary_history FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- salary_adjustments
DROP POLICY IF EXISTS "Users can view their own salary adjustments" ON public.salary_adjustments;
CREATE POLICY "Authenticated users can view salary adjustments"
  ON public.salary_adjustments FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- cash_flow_projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.cash_flow_projects;
CREATE POLICY "Authenticated users can view projects"
  ON public.cash_flow_projects FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
