
-- Add share token to payroll_items for public NF submission links
ALTER TABLE public.payroll_items 
ADD COLUMN nf_share_token uuid DEFAULT gen_random_uuid();

-- Create unique index on share token
CREATE UNIQUE INDEX idx_payroll_items_nf_share_token ON public.payroll_items (nf_share_token);

-- Allow anonymous users to read payroll_items by share token (to display form)
CREATE POLICY "Anonymous can read by nf_share_token"
ON public.payroll_items
FOR SELECT
USING (nf_share_token IS NOT NULL);

-- Allow anonymous users to update nf_url and nf_status via share token
CREATE POLICY "Anonymous can update NF via share token"
ON public.payroll_items
FOR UPDATE
USING (nf_share_token IS NOT NULL)
WITH CHECK (nf_share_token IS NOT NULL);

-- Allow anonymous to read people by id (for displaying name on public form)
CREATE POLICY "Anonymous can read people for NF form"
ON public.people
FOR SELECT
USING (true);

-- Create storage bucket for payroll NF uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payroll-nf', 'payroll-nf', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payroll NF uploads
CREATE POLICY "Anyone can upload payroll NFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payroll-nf');

CREATE POLICY "Anyone can read payroll NFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payroll-nf');
