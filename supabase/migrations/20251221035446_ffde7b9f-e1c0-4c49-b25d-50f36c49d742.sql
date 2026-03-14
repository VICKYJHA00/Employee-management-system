-- Create admin_activity_logs table for activity summaries
CREATE TABLE public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for activity logs
CREATE POLICY "Admins can view their own activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (
  admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Admins can insert their own activity logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

-- Create admin_todos table for daily task management
CREATE TABLE public.admin_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_todos ENABLE ROW LEVEL SECURITY;

-- Policies for todos
CREATE POLICY "Admins can view their own todos"
ON public.admin_todos
FOR SELECT
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage their own todos"
ON public.admin_todos
FOR ALL
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_todos_updated_at
BEFORE UPDATE ON public.admin_todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();