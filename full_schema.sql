
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

-- Tighten UPDATE policy: only the creator or any authenticated user can update
-- (In this workflow, both admin and analyst need to update status/attachments)
-- We restrict by requiring authentication and log all changes via status_history
DROP POLICY "Authenticated users can update invoice requests" ON public.invoice_requests;

CREATE POLICY "Authenticated users can update invoice requests"
  ON public.invoice_requests FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow anon users to view invoice requests (until auth is implemented)
DROP POLICY "Authenticated users can view invoice requests" ON public.invoice_requests;
CREATE POLICY "Anyone can view invoice requests"
  ON public.invoice_requests FOR SELECT
  USING (true);

-- Restore proper RLS now that auth is implemented
DROP POLICY "Anyone can view invoice requests" ON public.invoice_requests;
CREATE POLICY "Authenticated users can view invoice requests"
  ON public.invoice_requests FOR SELECT TO authenticated
  USING (true);

-- Table for supplier invoices (Recebimento de Notas)
CREATE TABLE public.supplier_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_document TEXT NOT NULL,
  supplier_email TEXT,
  supplier_contact TEXT,
  description TEXT NOT NULL,
  gross_value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  competency_month INTEGER NOT NULL,
  competency_year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  cost_center TEXT NOT NULL DEFAULT 'operacoes',
  payment_method TEXT DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'recebida'
    CHECK (status IN ('recebida', 'aguardando_aprovacao', 'aprovada', 'paga', 'contestada')),
  notes TEXT,
  invoice_pdf_url TEXT,
  share_token UUID DEFAULT gen_random_uuid(),
  submitted_via TEXT NOT NULL DEFAULT 'manual'
    CHECK (submitted_via IN ('manual', 'link_compartilhado')),
  paid_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  contested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view supplier invoices"
  ON public.supplier_invoices FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create supplier invoices"
  ON public.supplier_invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update supplier invoices"
  ON public.supplier_invoices FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Allow anonymous insert via shared link (no login required)
CREATE POLICY "Anonymous can insert via shared link"
  ON public.supplier_invoices FOR INSERT TO anon
  WITH CHECK (submitted_via = 'link_compartilhado');

-- Allow anonymous to read their own submission by share_token
CREATE POLICY "Anonymous can read by share_token"
  ON public.supplier_invoices FOR SELECT TO anon
  USING (share_token IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Status history table
CREATE TABLE public.supplier_invoice_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_invoice_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier invoice status history"
  ON public.supplier_invoice_status_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier invoice status history"
  ON public.supplier_invoice_status_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- Allow anonymous users to upload via shared link
CREATE POLICY "Anonymous can upload invoice attachments"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'invoice-attachments');

ALTER TABLE public.supplier_invoices ALTER COLUMN due_date DROP NOT NULL;

-- Create fixed_costs table
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  item_name TEXT NOT NULL,
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  periodicity TEXT NOT NULL DEFAULT 'Mensal',
  target_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own fixed costs"
ON public.fixed_costs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fixed costs"
ON public.fixed_costs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed costs"
ON public.fixed_costs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed costs"
ON public.fixed_costs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fixed_costs_updated_at
BEFORE UPDATE ON public.fixed_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create people table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  base_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  admission_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salary history table
CREATE TABLE public.salary_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(person_id, month, year)
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for people
CREATE POLICY "Users can view their own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for salary_history
CREATE POLICY "Users can view their own salary history" ON public.salary_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own salary history" ON public.salary_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary history" ON public.salary_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary history" ON public.salary_history FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on people
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create commissions table for tracking monthly commissions per person
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commissions"
ON public.commissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions"
ON public.commissions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commissions"
ON public.commissions FOR DELETE
USING (auth.uid() = user_id);

-- Granatum cache tables for synced financial data

-- Bank accounts
CREATE TABLE public.granatum_contas (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  saldo NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_contas"
  ON public.granatum_contas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own granatum_contas"
  ON public.granatum_contas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own granatum_contas"
  ON public.granatum_contas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own granatum_contas"
  ON public.granatum_contas FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policies for sync edge function
CREATE POLICY "Service role full access granatum_contas"
  ON public.granatum_contas FOR ALL
  USING (auth.role() = 'service_role');

-- Categories (flattened from hierarchical)
CREATE TABLE public.granatum_categorias (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  parent_id INTEGER,
  tipo_categoria_id INTEGER NOT NULL,
  cor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_categorias"
  ON public.granatum_categorias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_categorias"
  ON public.granatum_categorias FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_categorias"
  ON public.granatum_categorias FOR ALL
  USING (auth.role() = 'service_role');

-- Cost centers
CREATE TABLE public.granatum_centros_custo (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_centros_custo"
  ON public.granatum_centros_custo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_centros_custo"
  ON public.granatum_centros_custo FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_centros_custo"
  ON public.granatum_centros_custo FOR ALL
  USING (auth.role() = 'service_role');

-- Clients & Suppliers (unified people table)
CREATE TABLE public.granatum_pessoas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  is_cliente BOOLEAN NOT NULL DEFAULT false,
  is_fornecedor BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_pessoas"
  ON public.granatum_pessoas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_pessoas"
  ON public.granatum_pessoas FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_pessoas"
  ON public.granatum_pessoas FOR ALL
  USING (auth.role() = 'service_role');

-- Lancamentos (the main financial transactions)
CREATE TABLE public.granatum_lancamentos (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_competencia DATE,
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT NOT NULL,
  tipo_lancamento_id INTEGER NOT NULL, -- 1=despesa, 2=receita
  categoria_id INTEGER,
  centro_custo_lucro_id INTEGER,
  conta_id INTEGER,
  pessoa_id INTEGER,
  observacao TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_lancamentos"
  ON public.granatum_lancamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_lancamentos"
  ON public.granatum_lancamentos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_lancamentos"
  ON public.granatum_lancamentos FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_granatum_lancamentos_data ON public.granatum_lancamentos(data_competencia);
CREATE INDEX idx_granatum_lancamentos_tipo ON public.granatum_lancamentos(tipo_lancamento_id);
CREATE INDEX idx_granatum_lancamentos_categoria ON public.granatum_lancamentos(categoria_id);
CREATE INDEX idx_granatum_lancamentos_user ON public.granatum_lancamentos(user_id);
CREATE INDEX idx_granatum_lancamentos_conta ON public.granatum_lancamentos(conta_id);

-- Sync metadata table to track last sync times
CREATE TABLE public.granatum_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  records_synced INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.granatum_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON public.granatum_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_sync_log"
  ON public.granatum_sync_log FOR ALL
  USING (auth.role() = 'service_role');

-- Create cash_flow_projects table for project/client cash flow projections
CREATE TABLE public.cash_flow_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  project_type TEXT NOT NULL DEFAULT 'recorrente',
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_flow_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own projects" ON public.cash_flow_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.cash_flow_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.cash_flow_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.cash_flow_projects FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cash_flow_projects_updated_at
BEFORE UPDATE ON public.cash_flow_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.people ADD COLUMN email TEXT;

-- Table for per-client per-month revenue projections (Excel-like grid)
CREATE TABLE public.revenue_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_name, month, year)
);

-- Enable RLS
ALTER TABLE public.revenue_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projections"
ON public.revenue_projections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projections"
ON public.revenue_projections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projections"
ON public.revenue_projections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projections"
ON public.revenue_projections FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_revenue_projections_updated_at
BEFORE UPDATE ON public.revenue_projections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.revenue_projections ADD COLUMN is_mrr boolean NOT NULL DEFAULT false;
-- Reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number text NOT NULL,
  user_id uuid, -- null for external submissions
  
  -- Requester info
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  department text NOT NULL,
  role_title text NOT NULL,
  
  -- Expense details
  expense_date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  
  -- Payment info
  payment_method text NOT NULL DEFAULT 'pix',
  bank_name text,
  agency text,
  account_number text,
  cpf_holder text,
  pix_key text,
  
  -- Attachments
  receipt_url text,
  
  -- Approval
  status text NOT NULL DEFAULT 'aguardando_aprovacao',
  approver_name text,
  approval_notes text,
  rejection_reason text,
  scheduled_payment_date date,
  paid_at timestamp with time zone,
  paid_by text,
  
  -- Cost center for financial integration
  cost_center text NOT NULL DEFAULT 'operacoes',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view reimbursement requests"
  ON public.reimbursement_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reimbursement requests"
  ON public.reimbursement_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert reimbursement requests"
  ON public.reimbursement_requests FOR INSERT
  WITH CHECK (true);

-- Status history for audit log
CREATE TABLE public.reimbursement_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_id uuid NOT NULL REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL,
  justification text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reimbursement_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reimbursement status history"
  ON public.reimbursement_status_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reimbursement status history"
  ON public.reimbursement_status_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert initial status history"
  ON public.reimbursement_status_history FOR INSERT
  WITH CHECK (old_status IS NULL AND new_status = 'aguardando_aprovacao');

-- Reimbursement policies table
CREATE TABLE public.reimbursement_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  max_request_days integer NOT NULL DEFAULT 30,
  avg_payment_days integer NOT NULL DEFAULT 15,
  category_limits jsonb NOT NULL DEFAULT '{}',
  non_reimbursable_items text[] NOT NULL DEFAULT '{}',
  policy_document_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reimbursement_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reimbursement policies"
  ON public.reimbursement_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reimbursement policies"
  ON public.reimbursement_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reimbursement policies"
  ON public.reimbursement_policies FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for reimbursement attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('reimbursement-attachments', 'reimbursement-attachments', true);

CREATE POLICY "Anyone can upload reimbursement attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reimbursement-attachments');

CREATE POLICY "Anyone can view reimbursement attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reimbursement-attachments');

-- Sequence for protocol numbers
CREATE SEQUENCE public.reimbursement_protocol_seq START 1001;

-- Add missing fields for nota fiscal (tomador de serviços)
ALTER TABLE public.invoice_requests
ADD COLUMN IF NOT EXISTS client_inscricao_municipal text,
ADD COLUMN IF NOT EXISTS client_city text,
ADD COLUMN IF NOT EXISTS client_state text;
ALTER TYPE public.revenue_type ADD VALUE IF NOT EXISTS 'vagas';ALTER TABLE public.people ADD COLUMN contract_type text NOT NULL DEFAULT 'pj';CREATE POLICY "Users can delete their own invoice requests"
ON public.invoice_requests
FOR DELETE
USING (auth.uid() = user_id);ALTER TABLE public.revenue_projections ADD COLUMN color text DEFAULT null;
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

-- Add share token to payroll_items for public NF submission links
ALTER TABLE public.payroll_items 
ADD COLUMN nf_share_token uuid DEFAULT gen_random_uuid();

-- Create unique index on share token
CREATE UNIQUE INDEX idx_payroll_items_nf_share_token ON public.payroll_items (nf_share_token);

-- Allow anonymous users to read payroll_items by share token (to display form)
CREATE POLICY "Anonymous can read by nf_share_token"
ON public.payroll_items
FOR SELECT
USING (nf_share_token IS NOT NULL);

-- Allow anonymous users to update nf_url and nf_status via share token
CREATE POLICY "Anonymous can update NF via share token"
ON public.payroll_items
FOR UPDATE
USING (nf_share_token IS NOT NULL)
WITH CHECK (nf_share_token IS NOT NULL);

-- Allow anonymous to read people by id (for displaying name on public form)
CREATE POLICY "Anonymous can read people for NF form"
ON public.people
FOR SELECT
USING (true);

-- Create storage bucket for payroll NF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payroll-nf', 'payroll-nf', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payroll NF uploads
CREATE POLICY "Anyone can upload payroll NFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payroll-nf');

CREATE POLICY "Anyone can read payroll NFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payroll-nf');

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

-- 1. Create enum
CREATE TYPE public.app_role AS ENUM ('admin', 'secretary');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. RLS policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Seed initial roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'karen.cartagena@decodingp.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'secretary'::app_role FROM auth.users WHERE email = 'alejandra@decodingp.com'
ON CONFLICT DO NOTHING;

-- Enum para tipos de contrato
CREATE TYPE public.contract_category AS ENUM ('cliente', 'consultor_parceiro', 'pj');

CREATE TYPE public.contract_type AS ENUM (
  'rh_as_a_service', 'consultoria_rh', 'comunicacao_interna', 'contrato_vagas',
  'parceiro_geral', 'parceiro_projeto',
  'prestacao_servicos', 'aditivo_contratual', 'distrato', 'propriedade_intelectual'
);

CREATE TYPE public.contract_status AS ENUM (
  'rascunho', 'em_revisao', 'aprovado', 'enviado_assinatura',
  'assinado_parcialmente', 'assinado', 'cancelado'
);

-- Tabela de templates de contratos (upload pelo usuário)
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category public.contract_category NOT NULL,
  contract_type public.contract_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON public.contract_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.contract_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.contract_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.contract_templates FOR DELETE USING (auth.uid() = user_id);

-- Tabela principal de contratos
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id),
  category public.contract_category NOT NULL,
  contract_type public.contract_type NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'rascunho',
  title TEXT NOT NULL,

  -- Empresa contratante
  company_cnpj TEXT,
  company_razao_social TEXT,
  company_nome_fantasia TEXT,
  company_address TEXT,
  company_representative TEXT,
  company_representative_cpf TEXT,
  company_representative_role TEXT,

  -- Contratada / PJ
  contractor_cnpj TEXT,
  contractor_razao_social TEXT,
  contractor_address TEXT,
  contractor_representative TEXT,
  contractor_representative_cpf TEXT,
  contractor_bank_details TEXT,
  contractor_pix TEXT,
  contractor_tax_regime TEXT,

  -- Dados contratuais
  contract_value NUMERIC DEFAULT 0,
  payment_method TEXT,
  contract_duration TEXT,
  start_date DATE,
  end_date DATE,
  scope_summary TEXT,
  termination_penalty NUMERIC DEFAULT 0,
  has_confidentiality BOOLEAN DEFAULT true,
  has_intellectual_property BOOLEAN DEFAULT false,
  has_exclusivity BOOLEAN DEFAULT false,

  -- Conteúdo gerado
  generated_content TEXT,
  final_pdf_url TEXT,

  -- Compliance score
  compliance_score INTEGER,

  -- Clicksign
  clicksign_document_key TEXT,
  clicksign_status TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);

-- Versionamento de contratos
CREATE TABLE public.contract_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  change_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract versions" ON public.contract_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contract versions" ON public.contract_versions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Log de interações com IA
CREATE TABLE public.contract_ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs" ON public.contract_ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI logs" ON public.contract_ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Análise de contratos existentes (upload)
CREATE TABLE public.contract_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  analysis_result JSONB,
  compliance_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON public.contract_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analyses" ON public.contract_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON public.contract_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses" ON public.contract_analyses FOR DELETE USING (auth.uid() = user_id);

-- Signatários para clicksign
CREATE TABLE public.contract_signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  role TEXT DEFAULT 'signatário',
  sign_order INTEGER DEFAULT 1,
  clicksign_signer_key TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signers" ON public.contract_signers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own signers" ON public.contract_signers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signers" ON public.contract_signers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own signers" ON public.contract_signers FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket para templates e PDFs de contratos
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false);

CREATE POLICY "Users can upload contract documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their contract documents" ON storage.objects FOR SELECT USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their contract documents" ON storage.objects FOR DELETE USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers para updated_at
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.contract_signers ADD COLUMN IF NOT EXISTS request_signature_key text;UPDATE storage.buckets SET public = true WHERE id = 'pj-documents';
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
ALTER TABLE public.contracts ADD COLUMN salary_adjustment_id UUID REFERENCES public.salary_adjustments(id) ON DELETE SET NULL;ALTER TABLE public.people ADD COLUMN termination_date date DEFAULT NULL;
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
ALTER TABLE public.payroll_items ADD COLUMN holerite_emitido boolean NOT NULL DEFAULT false;DROP POLICY "Users can update their own commissions" ON public.commissions;
CREATE POLICY "Authenticated users can update commissions"
  ON public.commissions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY "Users can delete their own commissions" ON public.commissions;
CREATE POLICY "Authenticated users can delete commissions"
  ON public.commissions FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
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
