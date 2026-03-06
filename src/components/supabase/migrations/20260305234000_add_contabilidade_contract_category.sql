-- Adicionar 'contabilidade' ao enum contract_category
-- O enum no banco só tinha: 'cliente', 'consultor_parceiro', 'pj'
-- O frontend usa 'contabilidade' para contratos de serviços contábeis JLVIANA

ALTER TYPE public.contract_category ADD VALUE IF NOT EXISTS 'contabilidade';
