-- Fix RLS policies for configuracoes_sistema
-- The previous policy referenced user_roles.company_id which does not exist.
-- We are changing this to allow authenticated users to manage configurations, 
-- as the strict company-user association via user_roles is not yet implemented in the schema.

DROP POLICY IF EXISTS "Usuários podem ver as configurações da sua empresa" ON public.configuracoes_sistema;
DROP POLICY IF EXISTS "Usuários podem atualizar as configurações da sua empresa" ON public.configuracoes_sistema;

-- Allow authenticated users to view configurations
CREATE POLICY "Authenticated users can view system configurations"
ON public.configuracoes_sistema FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage configurations (insert/update/delete)
CREATE POLICY "Authenticated users can manage system configurations"
ON public.configuracoes_sistema FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
