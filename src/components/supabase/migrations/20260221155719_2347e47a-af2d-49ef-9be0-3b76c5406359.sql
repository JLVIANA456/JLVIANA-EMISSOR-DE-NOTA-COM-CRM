
-- Add rejection_reason to payroll_sheets
ALTER TABLE public.payroll_sheets ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create payroll status history for audit trail
CREATE TABLE public.payroll_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES public.payroll_sheets(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payroll status history"
ON public.payroll_status_history
FOR SELECT
USING (changed_by = auth.uid());

CREATE POLICY "Users can insert payroll status history"
ON public.payroll_status_history
FOR INSERT
WITH CHECK (changed_by = auth.uid());

-- Create NF validations table
CREATE TABLE public.payroll_nf_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_item_id UUID NOT NULL REFERENCES public.payroll_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT,
  extracted_cnpj TEXT,
  extracted_value NUMERIC,
  extracted_date DATE,
  expected_value NUMERIC,
  validation_status TEXT NOT NULL DEFAULT 'pendente',
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_nf_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nf validations"
ON public.payroll_nf_validations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert nf validations"
ON public.payroll_nf_validations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nf validations"
ON public.payroll_nf_validations
FOR UPDATE
USING (auth.uid() = user_id);
