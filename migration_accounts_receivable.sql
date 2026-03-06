-- Migration for Contas a Receber (BPO Module)

-- Customers (Sacados)
CREATE TABLE IF NOT EXISTS public.clientes_sacados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    nome TEXT NOT NULL,
    razao_social TEXT,
    doc_tipo TEXT NOT NULL CHECK (doc_tipo IN ('cnpj', 'cpf')),
    doc_numero TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    municipio TEXT,
    uf TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts Receivable Bills (Header)
CREATE TABLE IF NOT EXISTS public.ar_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    cliente_sacado_id UUID REFERENCES public.clientes_sacados(id),
    categoria_id UUID REFERENCES public.finance_categories(id),
    centro_custo_id UUID REFERENCES public.finance_cost_centers(id),
    descricao TEXT NOT NULL,
    competencia_mes INTEGER NOT NULL CHECK (competencia_mes BETWEEN 1 AND 12),
    competencia_year INTEGER NOT NULL,
    data_emissao DATE,
    vencimento DATE,
    forma_recebimento TEXT,
    bank_account_id UUID REFERENCES public.finance_bank_accounts(id),
    valor_bruto NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_descontos NUMERIC(18,2) DEFAULT 0,
    valor_liquido NUMERIC(18,2) DEFAULT 0,
    parcelado BOOLEAN DEFAULT false,
    qtd_parcelas INTEGER DEFAULT 1,
    vencimento_primeira_parcela DATE,
    status TEXT DEFAULT 'pendente',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AR Installments
CREATE TABLE IF NOT EXISTS public.ar_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    ar_bill_id UUID REFERENCES public.ar_bills(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    vencimento DATE NOT NULL,
    valor_bruto NUMERIC(18,2) NOT NULL,
    valor_liquido NUMERIC(18,2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_recebimento DATE,
    valor_recebido NUMERIC(18,2),
    id_transacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Public for dev as per project pattern)
ALTER TABLE public.clientes_sacados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Clientes Sacados View" ON public.clientes_sacados FOR SELECT USING (true);
CREATE POLICY "Public Clientes Sacados Insert" ON public.clientes_sacados FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Clientes Sacados Update" ON public.clientes_sacados FOR UPDATE USING (true);

ALTER TABLE public.ar_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public AR Bills View" ON public.ar_bills FOR SELECT USING (true);
CREATE POLICY "Public AR Bills Insert" ON public.ar_bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Public AR Bills Update" ON public.ar_bills FOR UPDATE USING (true);

ALTER TABLE public.ar_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public AR Installments View" ON public.ar_installments FOR SELECT USING (true);
CREATE POLICY "Public AR Installments Insert" ON public.ar_installments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public AR Installments Update" ON public.ar_installments FOR UPDATE USING (true);
