-- Migração para corrigir permissões de RLS nas tabelas do módulo Financeiro

-- 1. Fornecedores
-- Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fornecedores;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fornecedores;

-- Cria novas políticas permissivas para usuários autenticados
CREATE POLICY "Enable insert for authenticated users" ON public.fornecedores 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.fornecedores 
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.fornecedores 
    FOR DELETE TO authenticated USING (true);


-- 2. Empresas BPO (Clientes)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.empresas_bpo;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.empresas_bpo;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.empresas_bpo;

CREATE POLICY "Enable insert for authenticated users" ON public.empresas_bpo 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.empresas_bpo 
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.empresas_bpo 
    FOR DELETE TO authenticated USING (true);


-- 3. Habilitar RLS e Políticas para as demais tabelas que estavam incompletas
ALTER TABLE public.ap_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.ap_bills;
CREATE POLICY "Enable all for authenticated users" ON public.ap_bills 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.ap_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.ap_installments;
CREATE POLICY "Enable all for authenticated users" ON public.ap_installments 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.finance_categories;
CREATE POLICY "Enable all for authenticated users" ON public.finance_categories 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.finance_cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.finance_cost_centers;
CREATE POLICY "Enable all for authenticated users" ON public.finance_cost_centers 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.finance_bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.finance_bank_accounts;
CREATE POLICY "Enable all for authenticated users" ON public.finance_bank_accounts 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.retention_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.retention_templates;
CREATE POLICY "Enable all for authenticated users" ON public.retention_templates 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
