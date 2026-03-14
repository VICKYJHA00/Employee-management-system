-- Create table for tech admin work logs
CREATE TABLE public.tech_work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    work_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    hours_spent NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for content admin work logs
CREATE TABLE public.content_work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    platform TEXT,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.tech_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_work_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tech_work_logs
CREATE POLICY "Admins can view tech work logs"
ON public.tech_work_logs
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Tech admins can manage their own work logs"
ON public.tech_work_logs
FOR ALL
USING (
    admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid())
    OR is_super_admin(auth.uid())
);

-- RLS policies for content_work_logs
CREATE POLICY "Admins can view content work logs"
ON public.content_work_logs
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Content admins can manage their own work logs"
ON public.content_work_logs
FOR ALL
USING (
    admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid())
    OR is_super_admin(auth.uid())
);

-- Add triggers for updated_at
CREATE TRIGGER update_tech_work_logs_updated_at
BEFORE UPDATE ON public.tech_work_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_work_logs_updated_at
BEFORE UPDATE ON public.content_work_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();