--- Migração da tabela fixed_costs para a nova estrutura

-- 1. Renomear colunas existentes para o novo padrão
ALTER TABLE public.fixed_costs RENAME COLUMN item_name TO descricao;
ALTER TABLE public.fixed_costs RENAME COLUMN monthly_value TO valor;
ALTER TABLE public.fixed_costs RENAME COLUMN periodicity TO frequencia;
ALTER TABLE public.fixed_costs RENAME COLUMN is_active TO ativo;

-- 2. Adicionar as novas colunas
ALTER TABLE public.fixed_costs ADD COLUMN dia_vencimento INTEGER;
ALTER TABLE public.fixed_costs ADD COLUMN conta_bancari-id UUID;
ALTER TABLE public.fixed_costs ADD COLUMN centro_custo_id UUID;

-- Adicionar constraints de chave estrangeira (opcional, mas recomendado)
-- ALTER TABLE public.fixed_costs ADD CONSTRAINT fk_conta_bancaria FOREIGN KEY (conta_bancari-id) REFERENCES public.contas_bancarias(id);
-- ALTER TABLE public.fixed_costs ADD CONSTRAINT fk_centro_custo FOREIGN KEY (centro_custo_id) REFERENCES public.centros_custo(id);

-- 3. Modificar a coluna frequencia para usar um ENUM
CREATE TYPE public.cost_frequency AS ENUM ('Mensal', 'Trimestral', 'Anual');
ALTER TABLE public.fixed_costs ALTER COLUMN frequencia TYPE public.cost_frequency USING frequencia::public.cost_frequency;

-- 4. Remover colunas não utilizadas
ALTER TABLE public.fixed_costs DROP COLUMN subcategory;
ALTER TABLE public.fixed_costs DROP COLUMN target_value;
ALTER TABLE public.fixed_costs DROP COLUMN status;

-- 5. Adicionar a coluna category_id e remover a antiga 'category'
ALTER TABLE public.fixed_costs ADD COLUMN categori-id UUID;
ALTER TABLE public.fixed_costs DROP COLUMN category;

-- Adicionar constraint de chave estrangeira para categori-id
-- ALTER TABLE public.fixed_costs ADD CONSTRAINT fk_categoria FOREIGN KEY (categori-id) REFERENCES public.categorias(id);

-- Adicionar a coluna company_id
ALTER TABLE public.fixed_costs ADD COLUMN company_id UUID;
ALTER TABLE public.fixed_costs ADD COLUMN gerar_ap BOOLEAN DEFAULT false;

-- Populando company_id com base no user_id existente (ajustar conforme a lógica de negócio)
UPDATE public.fixed_costs SET company_id = user_id;

-- Tornar company_id NOT NULL
ALTER TABLE public.fixed_costs ALTER COLUMN company_id SET NOT NULL;
