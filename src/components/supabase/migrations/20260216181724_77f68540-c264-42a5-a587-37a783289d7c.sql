
-- Table for per-client per-month revenue projections (Excel-like grid)
CREATE TABLE public.revenue_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_name, month, year)
);

-- Enable RLS
ALTER TABLE public.revenue_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projections"
ON public.revenue_projections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projections"
ON public.revenue_projections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projections"
ON public.revenue_projections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projections"
ON public.revenue_projections FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_revenue_projections_updated_at
BEFORE UPDATE ON public.revenue_projections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
