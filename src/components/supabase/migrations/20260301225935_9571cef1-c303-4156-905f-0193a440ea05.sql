
CREATE TABLE public.salary_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  old_value numeric NOT NULL DEFAULT 0,
  new_value numeric NOT NULL DEFAULT 0,
  change_percentage numeric NOT NULL DEFAULT 0,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own salary adjustments"
  ON public.salary_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salary adjustments"
  ON public.salary_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary adjustments"
  ON public.salary_adjustments FOR DELETE
  USING (auth.uid() = user_id);
