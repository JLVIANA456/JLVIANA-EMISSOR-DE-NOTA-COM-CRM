
-- Fase 1: Adicionar colunas à tabela people (todas nullable)
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS nome_fantasia text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS tax_regime text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS status_justification text;

-- Fase 2: Tabela pj_contracts
CREATE TABLE public.pj_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contract_type text NOT NULL DEFAULT 'original',
  start_date date NOT NULL,
  end_date date,
  monthly_value numeric NOT NULL DEFAULT 0,
  file_url text,
  status text NOT NULL DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts" ON public.pj_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.pj_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.pj_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.pj_contracts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pj_contracts_updated_at BEFORE UPDATE ON public.pj_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 3: Tabela pj_absences
CREATE TABLE public.pj_absences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  absence_type text NOT NULL DEFAULT 'ferias',
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'solicitada',
  approved_by text,
  days_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own absences" ON public.pj_absences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own absences" ON public.pj_absences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own absences" ON public.pj_absences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own absences" ON public.pj_absences FOR DELETE USING (auth.uid() = user_id);

-- Fase 4: Tabela payroll_sheets
CREATE TABLE public.payroll_sheets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  approved_by text,
  approved_at timestamptz,
  paid_at timestamptz,
  total_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payroll sheets" ON public.payroll_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payroll sheets" ON public.payroll_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payroll sheets" ON public.payroll_sheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payroll sheets" ON public.payroll_sheets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_payroll_sheets_updated_at BEFORE UPDATE ON public.payroll_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 4: Tabela payroll_items
CREATE TABLE public.payroll_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id uuid NOT NULL REFERENCES public.payroll_sheets(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  base_value numeric NOT NULL DEFAULT 0,
  adjustments numeric NOT NULL DEFAULT 0,
  adjustment_reason text,
  reimbursements numeric NOT NULL DEFAULT 0,
  bonus numeric NOT NULL DEFAULT 0,
  bonus_reason text,
  debit_note boolean NOT NULL DEFAULT false,
  debit_note_reason text,
  nf_status text NOT NULL DEFAULT 'pendente',
  nf_url text,
  total_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payroll items" ON public.payroll_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payroll items" ON public.payroll_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payroll items" ON public.payroll_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payroll items" ON public.payroll_items FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket para documentos PJ
INSERT INTO storage.buckets (id, name, public) VALUES ('pj-documents', 'pj-documents', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload pj documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pj-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view pj documents" ON storage.objects FOR SELECT USING (bucket_id = 'pj-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete pj documents" ON storage.objects FOR DELETE USING (bucket_id = 'pj-documents' AND auth.uid() IS NOT NULL);
