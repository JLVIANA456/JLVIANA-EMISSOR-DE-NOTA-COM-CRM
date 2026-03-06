
-- Add granular fiscal and address fields to invoice_requests for SP Municipal compliance
ALTER TABLE public.invoice_requests
ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'J',
ADD COLUMN IF NOT EXISTS client_address_number text,
ADD COLUMN IF NOT EXISTS client_address_complement text,
ADD COLUMN IF NOT EXISTS client_neighborhood text,
ADD COLUMN IF NOT EXISTS client_zip_code text,
ADD COLUMN IF NOT EXISTS client_country text DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS client_phone text,
ADD COLUMN IF NOT EXISTS service_code text,
ADD COLUMN IF NOT EXISTS service_code_municipal text,
ADD COLUMN IF NOT EXISTS iss_retained boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS iss_aliq numeric(5,2),
ADD COLUMN IF NOT EXISTS nature_operation text DEFAULT '1',
ADD COLUMN IF NOT EXISTS deductions_value numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) DEFAULT 0;

-- Optional: Update comment for documentation
COMMENT ON COLUMN public.invoice_requests.client_type IS 'F - Pessoa Física, J - Pessoa Jurídica, E - Estrangeiro';
COMMENT ON COLUMN public.invoice_requests.nature_operation IS '1-Exigível, 2-Não Incidência, 3-Isenção... (SP patterns)';
