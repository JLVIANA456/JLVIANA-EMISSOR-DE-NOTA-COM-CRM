-- Migration for Contas a Pagar (BPO Module)

-- Multi-tenant support
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Extended companies
CREATE TABLE IF NOT EXISTS public.empresas_bpo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT NOT NULL,
    regime_tributario TEXT,
    municipio TEXT,
    uf TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    nome TEXT NOT NULL,
    doc_tipo TEXT NOT NULL CHECK (doc_tipo IN ('cnpj', 'cpf')),
    doc_numero TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    pix_chave TEXT,
    banco TEXT,
    agencia TEXT,
    conta TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Retention Templates
CREATE TABLE IF NOT EXISTS public.retention_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    nome TEXT NOT NULL,
    irrf_aliquota NUMERIC(9,6) DEFAULT 0.015,
    pis_aliquota NUMERIC(9,6) DEFAULT 0.0065,
    cofins_aliquota NUMERIC(9,6) DEFAULT 0.03,
    csll_aliquota NUMERIC(9,6) DEFAULT 0.01,
    usa_iss_manual BOOLEAN DEFAULT true,
    usa_inss_manual BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial Categories
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber', 'ambos')),
    parent_id UUID REFERENCES public.finance_categories(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS public.finance_cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    nome TEXT NOT NULL,
    codigo TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.finance_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    banco TEXT NOT NULL,
    agencia TEXT NOT NULL,
    conta TEXT NOT NULL,
    tipo TEXT DEFAULT 'corrente',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts Payable Bills (Header)
CREATE TABLE IF NOT EXISTS public.ap_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    categoria_id UUID REFERENCES public.finance_categories(id),
    centro_custo_id UUID REFERENCES public.finance_cost_centers(id),
    descricao TEXT NOT NULL,
    competencia_mes INTEGER NOT NULL CHECK (competencia_mes BETWEEN 1 AND 12),
    competencia_year INTEGER NOT NULL,
    data_emissao DATE,
    vencimento DATE,
    forma_pagamento TEXT,
    bank_account_id UUID REFERENCES public.finance_bank_accounts(id),
    possui_retencao BOOLEAN DEFAULT false,
    valor_bruto NUMERIC(18,2) NOT NULL DEFAULT 0,
    base_retencoes NUMERIC(18,2) DEFAULT 0,
    irrf_aliquota NUMERIC(9,6) DEFAULT 0,
    irrf_valor NUMERIC(18,2) DEFAULT 0,
    pis_aliquota NUMERIC(9,6) DEFAULT 0,
    pis_valor NUMERIC(18,2) DEFAULT 0,
    cofins_aliquota NUMERIC(9,6) DEFAULT 0,
    cofins_valor NUMERIC(18,2) DEFAULT 0,
    csll_aliquota NUMERIC(9,6) DEFAULT 0,
    csll_valor NUMERIC(18,2) DEFAULT 0,
    iss_retido_valor NUMERIC(18,2) DEFAULT 0,
    inss_retido_valor NUMERIC(18,2) DEFAULT 0,
    total_retencoes NUMERIC(18,2) DEFAULT 0,
    valor_liquido NUMERIC(18,2) DEFAULT 0,
    parcelado BOOLEAN DEFAULT false,
    qtd_parcelas INTEGER DEFAULT 1,
    vencimento_primeira_parcela DATE,
    parcelas_geradas BOOLEAN DEFAULT false,
    approval_required BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'rascunho',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Installments
CREATE TABLE IF NOT EXISTS public.ap_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    ap_bill_id UUID REFERENCES public.ap_bills(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    vencimento DATE NOT NULL,
    valor_bruto NUMERIC(18,2) NOT NULL,
    total_retencoes_aplicadas NUMERIC(18,2) DEFAULT 0,
    valor_liquido NUMERIC(18,2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_pagamento DATE,
    valor_pago NUMERIC(18,2),
    comprovante_url TEXT,
    id_transacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Approvals
CREATE TABLE IF NOT EXISTS public.ap_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    entity_type TEXT DEFAULT 'ap_bill',
    entity_id UUID NOT NULL,
    requested_by UUID,
    approver_user_id UUID,
    status TEXT DEFAULT 'pendente',
    comentario TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.ap_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    user_id UUID,
    summary TEXT,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and simple policies (public for now as requested for easy dev)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Tenant View" ON public.tenants FOR SELECT USING (true);

ALTER TABLE public.empresas_bpo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Empresa View" ON public.empresas_bpo FOR SELECT USING (true);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Fornecedor View" ON public.fornecedores FOR SELECT USING (true);

-- Repeat for others as needed or use a wildcard approach if possible (Supabase doesn't support wildcard policies easily)
