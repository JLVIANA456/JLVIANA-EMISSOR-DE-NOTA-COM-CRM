
-- Create fixed_costs table
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  item_name TEXT NOT NULL,
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  periodicity TEXT NOT NULL DEFAULT 'Mensal',
  target_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own fixed costs"
ON public.fixed_costs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fixed costs"
ON public.fixed_costs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed costs"
ON public.fixed_costs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed costs"
ON public.fixed_costs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fixed_costs_updated_at
BEFORE UPDATE ON public.fixed_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
