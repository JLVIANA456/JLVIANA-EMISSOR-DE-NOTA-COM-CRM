-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.empresas_bpo(id) ON DELETE CASCADE,
    openai_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Authenticated users can view system configurations"
ON public.configuracoes_sistema FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage system configurations"
ON public.configuracoes_sistema FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
