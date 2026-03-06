
-- Create commissions table for tracking monthly commissions per person
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commissions"
ON public.commissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions"
ON public.commissions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commissions"
ON public.commissions FOR DELETE
USING (auth.uid() = user_id);
