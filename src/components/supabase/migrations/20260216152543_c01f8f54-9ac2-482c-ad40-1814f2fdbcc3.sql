
-- Table for supplier invoices (Recebimento de Notas)
CREATE TABLE public.supplier_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_document TEXT NOT NULL,
  supplier_email TEXT,
  supplier_contact TEXT,
  description TEXT NOT NULL,
  gross_value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  competency_month INTEGER NOT NULL,
  competency_year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  cost_center TEXT NOT NULL DEFAULT 'operacoes',
  payment_method TEXT DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'recebida'
    CHECK (status IN ('recebida', 'aguardando_aprovacao', 'aprovada', 'paga', 'contestada')),
  notes TEXT,
  invoice_pdf_url TEXT,
  share_token UUID DEFAULT gen_random_uuid(),
  submitted_via TEXT NOT NULL DEFAULT 'manual'
    CHECK (submitted_via IN ('manual', 'link_compartilhado')),
  paid_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  contested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view supplier invoices"
  ON public.supplier_invoices FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create supplier invoices"
  ON public.supplier_invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update supplier invoices"
  ON public.supplier_invoices FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Allow anonymous insert via shared link (no login required)
CREATE POLICY "Anonymous can insert via shared link"
  ON public.supplier_invoices FOR INSERT TO anon
  WITH CHECK (submitted_via = 'link_compartilhado');

-- Allow anonymous to read their own submission by share_token
CREATE POLICY "Anonymous can read by share_token"
  ON public.supplier_invoices FOR SELECT TO anon
  USING (share_token IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Status history table
CREATE TABLE public.supplier_invoice_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_invoice_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier invoice status history"
  ON public.supplier_invoice_status_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier invoice status history"
  ON public.supplier_invoice_status_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = changed_by);
