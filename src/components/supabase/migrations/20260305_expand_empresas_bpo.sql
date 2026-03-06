-- Migration: Expand empresas_bpo with full company profile fields

ALTER TABLE public.empresas_bpo
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS telefone TEXT,
    ADD COLUMN IF NOT EXISTS logradouro TEXT,
    ADD COLUMN IF NOT EXISTS numero TEXT,
    ADD COLUMN IF NOT EXISTS complemento TEXT,
    ADD COLUMN IF NOT EXISTS bairro TEXT,
    ADD COLUMN IF NOT EXISTS cep TEXT,
    ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
    ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT,
    ADD COLUMN IF NOT EXISTS natureza_juridica TEXT,
    ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
    ADD COLUMN IF NOT EXISTS status_bpo TEXT DEFAULT 'Ativo';
