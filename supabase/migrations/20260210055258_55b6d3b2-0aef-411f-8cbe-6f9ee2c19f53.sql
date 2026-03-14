
-- Create attendance_settings table for editable threshold and suspension days
CREATE TABLE public.attendance_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_days_threshold integer NOT NULL DEFAULT 20,
  suspension_days integer NOT NULL DEFAULT 7,
  updated_by uuid REFERENCES public.admins(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- All admins can view settings
CREATE POLICY "Admins can view attendance settings"
ON public.attendance_settings
FOR SELECT
USING (is_admin(auth.uid()));

-- Only super admins can manage
CREATE POLICY "Super admins can manage attendance settings"
ON public.attendance_settings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Insert default row
INSERT INTO public.attendance_settings (min_days_threshold, suspension_days) VALUES (20, 7);
