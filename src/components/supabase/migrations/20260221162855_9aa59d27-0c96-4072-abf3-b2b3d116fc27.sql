
-- Table to link PJ auth users to their people record
CREATE TABLE public.pj_portal_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_portal_profiles ENABLE ROW LEVEL SECURITY;

-- PJ can read their own profile
CREATE POLICY "PJ can read own portal profile"
  ON public.pj_portal_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Service role can manage all
CREATE POLICY "Service role manages portal profiles"
  ON public.pj_portal_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Allow insert during signup (user creates their own)
CREATE POLICY "PJ can create own portal profile"
  ON public.pj_portal_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Helper function: get person_id for current PJ user
CREATE OR REPLACE FUNCTION public.get_pj_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT person_id FROM public.pj_portal_profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- PJ can view their own payroll items
CREATE POLICY "PJ can view own payroll items"
  ON public.payroll_items FOR SELECT
  USING (person_id = public.get_pj_person_id());

-- PJ can update NF fields on their own payroll items
CREATE POLICY "PJ can update own NF"
  ON public.payroll_items FOR UPDATE
  USING (person_id = public.get_pj_person_id())
  WITH CHECK (person_id = public.get_pj_person_id());

-- PJ can view payroll sheets that contain their items
CREATE POLICY "PJ can view own payroll sheets"
  ON public.payroll_sheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_items pi
      WHERE pi.payroll_id = id
        AND pi.person_id = public.get_pj_person_id()
    )
  );

-- PJ can view their own reimbursement requests (by email match)
CREATE POLICY "PJ can view own reimbursements"
  ON public.reimbursement_requests FOR SELECT
  USING (
    requester_email = (
      SELECT p.email FROM public.people p WHERE p.id = public.get_pj_person_id()
    )
  );

-- PJ can create their own absences
CREATE POLICY "PJ can create own absences"
  ON public.pj_absences FOR INSERT
  WITH CHECK (person_id = public.get_pj_person_id());

-- PJ can view their own absences
CREATE POLICY "PJ can view own absences"
  ON public.pj_absences FOR SELECT
  USING (person_id = public.get_pj_person_id());

-- PJ can view their own contracts
CREATE POLICY "PJ can view own contracts"
  ON public.pj_contracts FOR SELECT
  USING (person_id = public.get_pj_person_id());

-- PJ can view their own people record
CREATE POLICY "PJ can view own people record"
  ON public.people FOR SELECT
  USING (id = public.get_pj_person_id());
