
-- Reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number text NOT NULL,
  user_id uuid, -- null for external submissions
  
  -- Requester info
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  department text NOT NULL,
  role_title text NOT NULL,
  
  -- Expense details
  expense_date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  
  -- Payment info
  payment_method text NOT NULL DEFAULT 'pix',
  bank_name text,
  agency text,
  account_number text,
  cpf_holder text,
  pix_key text,
  
  -- Attachments
  receipt_url text,
  
  -- Approval
  status text NOT NULL DEFAULT 'aguardando_aprovacao',
  approver_name text,
  approval_notes text,
  rejection_reason text,
  scheduled_payment_date date,
  paid_at timestamp with time zone,
  paid_by text,
  
  -- Cost center for financial integration
  cost_center text NOT NULL DEFAULT 'operacoes',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view reimbursement requests"
  ON public.reimbursement_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reimbursement requests"
  ON public.reimbursement_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert reimbursement requests"
  ON public.reimbursement_requests FOR INSERT
  WITH CHECK (true);

-- Status history for audit log
CREATE TABLE public.reimbursement_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_id uuid NOT NULL REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL,
  justification text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reimbursement_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reimbursement status history"
  ON public.reimbursement_status_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reimbursement status history"
  ON public.reimbursement_status_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can insert initial status history"
  ON public.reimbursement_status_history FOR INSERT
  WITH CHECK (old_status IS NULL AND new_status = 'aguardando_aprovacao');

-- Reimbursement policies table
CREATE TABLE public.reimbursement_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  max_request_days integer NOT NULL DEFAULT 30,
  avg_payment_days integer NOT NULL DEFAULT 15,
  category_limits jsonb NOT NULL DEFAULT '{}',
  non_reimbursable_items text[] NOT NULL DEFAULT '{}',
  policy_document_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reimbursement_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reimbursement policies"
  ON public.reimbursement_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reimbursement policies"
  ON public.reimbursement_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reimbursement policies"
  ON public.reimbursement_policies FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for reimbursement attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('reimbursement-attachments', 'reimbursement-attachments', true);

CREATE POLICY "Anyone can upload reimbursement attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reimbursement-attachments');

CREATE POLICY "Anyone can view reimbursement attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reimbursement-attachments');

-- Sequence for protocol numbers
CREATE SEQUENCE public.reimbursement_protocol_seq START 1001;
