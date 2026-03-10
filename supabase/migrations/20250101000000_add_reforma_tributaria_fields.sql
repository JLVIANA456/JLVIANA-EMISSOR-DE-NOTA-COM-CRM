ALTER TABLE public.invoice_requests 
ADD COLUMN IF NOT EXISTS "cClassTrib" text,
ADD COLUMN IF NOT EXISTS "cIndOp" text,
ADD COLUMN IF NOT EXISTS "indFinal" text DEFAULT '0',
ADD COLUMN IF NOT EXISTS "indDest" text DEFAULT '0';
