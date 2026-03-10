
-- Add missing fields for nota fiscal (tomador de serviços)
ALTER TABLE public.invoice_requests
ADD COLUMN IF NOT EXISTS client_inscricao_municipal text,
ADD COLUMN IF NOT EXISTS client_city text,
ADD COLUMN IF NOT EXISTS client_state text;
