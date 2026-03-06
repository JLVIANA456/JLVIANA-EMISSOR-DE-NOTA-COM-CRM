-- Migration: Create finance_transactions table for unified cash flow management
CREATE TABLE IF NOT EXISTS public.finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    empresa_id UUID REFERENCES public.empresas_bpo(id),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
    categoria_id UUID REFERENCES public.finance_categories(id),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'efetivado')),
    bank_account_id UUID REFERENCES public.finance_bank_accounts(id),
    documento_url TEXT,
    ia_analise JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_finance_transactions_empresa ON public.finance_transactions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_data ON public.finance_transactions(data);

-- Enable RLS
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy (allowing authenticated users access for now as per previous patterns)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.finance_transactions;
CREATE POLICY "Enable all for authenticated users" ON public.finance_transactions 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
