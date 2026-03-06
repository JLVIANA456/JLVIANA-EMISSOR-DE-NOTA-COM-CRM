
-- Granatum cache tables for synced financial data

-- Bank accounts
CREATE TABLE public.granatum_contas (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  saldo NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_contas"
  ON public.granatum_contas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own granatum_contas"
  ON public.granatum_contas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own granatum_contas"
  ON public.granatum_contas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own granatum_contas"
  ON public.granatum_contas FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policies for sync edge function
CREATE POLICY "Service role full access granatum_contas"
  ON public.granatum_contas FOR ALL
  USING (auth.role() = 'service_role');

-- Categories (flattened from hierarchical)
CREATE TABLE public.granatum_categorias (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  parent_id INTEGER,
  tipo_categoria_id INTEGER NOT NULL,
  cor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_categorias"
  ON public.granatum_categorias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_categorias"
  ON public.granatum_categorias FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_categorias"
  ON public.granatum_categorias FOR ALL
  USING (auth.role() = 'service_role');

-- Cost centers
CREATE TABLE public.granatum_centros_custo (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_centros_custo"
  ON public.granatum_centros_custo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_centros_custo"
  ON public.granatum_centros_custo FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_centros_custo"
  ON public.granatum_centros_custo FOR ALL
  USING (auth.role() = 'service_role');

-- Clients & Suppliers (unified people table)
CREATE TABLE public.granatum_pessoas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  is_cliente BOOLEAN NOT NULL DEFAULT false,
  is_fornecedor BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_pessoas"
  ON public.granatum_pessoas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_pessoas"
  ON public.granatum_pessoas FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_pessoas"
  ON public.granatum_pessoas FOR ALL
  USING (auth.role() = 'service_role');

-- Lancamentos (the main financial transactions)
CREATE TABLE public.granatum_lancamentos (
  id INTEGER PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_competencia DATE,
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT NOT NULL,
  tipo_lancamento_id INTEGER NOT NULL, -- 1=despesa, 2=receita
  categoria_id INTEGER,
  centro_custo_lucro_id INTEGER,
  conta_id INTEGER,
  pessoa_id INTEGER,
  observacao TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

ALTER TABLE public.granatum_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own granatum_lancamentos"
  ON public.granatum_lancamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own granatum_lancamentos"
  ON public.granatum_lancamentos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_lancamentos"
  ON public.granatum_lancamentos FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_granatum_lancamentos_data ON public.granatum_lancamentos(data_competencia);
CREATE INDEX idx_granatum_lancamentos_tipo ON public.granatum_lancamentos(tipo_lancamento_id);
CREATE INDEX idx_granatum_lancamentos_categoria ON public.granatum_lancamentos(categoria_id);
CREATE INDEX idx_granatum_lancamentos_user ON public.granatum_lancamentos(user_id);
CREATE INDEX idx_granatum_lancamentos_conta ON public.granatum_lancamentos(conta_id);

-- Sync metadata table to track last sync times
CREATE TABLE public.granatum_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  records_synced INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.granatum_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON public.granatum_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access granatum_sync_log"
  ON public.granatum_sync_log FOR ALL
  USING (auth.role() = 'service_role');
