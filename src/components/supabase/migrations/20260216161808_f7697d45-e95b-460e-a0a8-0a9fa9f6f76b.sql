
-- Create people table
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  base_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  admission_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create salary history table
CREATE TABLE public.salary_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(person_id, month, year)
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for people
CREATE POLICY "Users can view their own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for salary_history
CREATE POLICY "Users can view their own salary history" ON public.salary_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own salary history" ON public.salary_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own salary history" ON public.salary_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own salary history" ON public.salary_history FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on people
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
