
-- Create cash_flow_projects table for project/client cash flow projections
CREATE TABLE public.cash_flow_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  project_type TEXT NOT NULL DEFAULT 'recorrente',
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_flow_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own projects" ON public.cash_flow_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.cash_flow_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.cash_flow_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.cash_flow_projects FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cash_flow_projects_updated_at
BEFORE UPDATE ON public.cash_flow_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
