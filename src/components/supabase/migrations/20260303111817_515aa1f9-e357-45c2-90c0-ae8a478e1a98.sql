
DROP POLICY "PJ can view own payroll sheets" ON public.payroll_sheets;
CREATE POLICY "PJ can view own payroll sheets"
  ON public.payroll_sheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payroll_items pi
      WHERE pi.payroll_id = payroll_sheets.id
        AND pi.person_id = get_pj_person_id()
    )
  );
