
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
