
-- Create enum for invoice request status workflow
CREATE TYPE public.invoice_request_status AS ENUM (
  'rascunho',
  'enviada_analista',
  'emissao_andamento',
  'emitida',
  'enviada_cliente',
  'pagamento_confirmado',
  'cancelada'
);

-- Create enum for revenue type
CREATE TYPE public.revenue_type AS ENUM (
  'consultoria_rh',
  'rh_as_a_service',
  'marketing_digital',
  'treinamentos_workshops',
  'comunicacao_interna',
  'parceria_co_branding',
  'outro'
);

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM (
  'transferencia',
  'pix',
  'boleto',
  'outro'
);

-- Create enum for financial category
CREATE TYPE public.financial_category AS ENUM (
  'receita_servico',
  'receita_parceria',
  'receita_treinamento'
);

-- Create enum for cost center
CREATE TYPE public.cost_center AS ENUM (
  'operacoes',
  'comercial',
  'marketing'
);

-- Main table: Invoice Requests
CREATE TABLE public.invoice_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Client data
  client_name TEXT NOT NULL,
  client_document TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_contact TEXT,
  
  -- Invoice info
  revenue_type public.revenue_type NOT NULL,
  description TEXT NOT NULL,
  competency_month INTEGER NOT NULL CHECK (competency_month BETWEEN 1 AND 12),
  competency_year INTEGER NOT NULL CHECK (competency_year BETWEEN 2020 AND 2099),
  desired_issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  gross_value NUMERIC(12,2) NOT NULL CHECK (gross_value > 0),
  
  -- Payment conditions
  payment_method public.payment_method NOT NULL,
  show_bank_details BOOLEAN NOT NULL DEFAULT false,
  
  -- Financial classification
  financial_category public.financial_category NOT NULL,
  cost_center public.cost_center NOT NULL,
  tags TEXT[],
  
  -- Operational control
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_day INTEGER CHECK (recurring_day BETWEEN 1 AND 31),
  recurring_end_date DATE,
  contract_attachment_url TEXT,
  analyst_notes TEXT,
  
  -- Workflow
  status public.invoice_request_status NOT NULL DEFAULT 'rascunho',
  
  -- Attachments after emission
  invoice_pdf_url TEXT,
  invoice_xml_url TEXT,
  
  -- Tracking dates
  sent_to_analyst_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  sent_to_client_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can manage their org's requests
CREATE POLICY "Authenticated users can view invoice requests"
  ON public.invoice_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invoice requests"
  ON public.invoice_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update invoice requests"
  ON public.invoice_requests FOR UPDATE TO authenticated
  USING (true);

-- Status history for audit trail
CREATE TABLE public.invoice_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_request_id UUID NOT NULL REFERENCES public.invoice_requests(id) ON DELETE CASCADE,
  old_status public.invoice_request_status,
  new_status public.invoice_request_status NOT NULL,
  changed_by UUID NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view status history"
  ON public.invoice_status_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert status history"
  ON public.invoice_status_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- Comments on invoice requests
CREATE TABLE public.invoice_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_request_id UUID NOT NULL REFERENCES public.invoice_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.invoice_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.invoice_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_invoice_requests_updated_at
  BEFORE UPDATE ON public.invoice_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for invoice attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-attachments', 'invoice-attachments', false);

CREATE POLICY "Authenticated users can upload invoice attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoice-attachments');

CREATE POLICY "Authenticated users can view invoice attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'invoice-attachments');

CREATE POLICY "Authenticated users can update invoice attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'invoice-attachments');
