-- Adiciona a coluna parent_id na tabela finance_categories caso ela não exista
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance_categories' AND column_name = 'parent_id') THEN
        ALTER TABLE public.finance_categories ADD COLUMN parent_id UUID REFERENCES public.finance_categories(id);
    END IF;
END $$;

-- Garante que RLS está habilitado e políticas estão corretas
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.finance_categories;
CREATE POLICY "Enable all for authenticated users" ON public.finance_categories 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
