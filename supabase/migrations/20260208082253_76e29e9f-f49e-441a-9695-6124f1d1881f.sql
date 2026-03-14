-- Create holidays table for holiday calendar
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on holidays
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Policies for holidays table
CREATE POLICY "All admins can view holidays" 
ON public.holidays 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins and HR can manage holidays" 
ON public.holidays 
FOR ALL 
USING (is_super_admin(auth.uid()) OR has_admin_role(auth.uid(), 'hr_admin'::admin_role));

-- Create admin_settings table for sound/haptic preferences
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE UNIQUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  haptic_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_sound_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Policies for admin_settings
CREATE POLICY "Admins can view their own settings" 
ON public.admin_settings 
FOR SELECT 
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update their own settings" 
ON public.admin_settings 
FOR UPDATE 
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert their own settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can manage all settings" 
ON public.admin_settings 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Create monthly_attendance_reviews table for month-end suspension tracking
CREATE TABLE IF NOT EXISTS public.monthly_attendance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  present_days INTEGER NOT NULL DEFAULT 0,
  late_days INTEGER NOT NULL DEFAULT 0,
  absent_days INTEGER NOT NULL DEFAULT 0,
  total_working_days INTEGER NOT NULL DEFAULT 0,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_start DATE,
  suspension_end DATE,
  reviewed_by UUID REFERENCES public.admins(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, year, month)
);

-- Enable RLS on monthly_attendance_reviews
ALTER TABLE public.monthly_attendance_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for monthly_attendance_reviews
CREATE POLICY "Admins can view their own reviews" 
ON public.monthly_attendance_reviews 
FOR SELECT 
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can manage all reviews" 
ON public.monthly_attendance_reviews 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if a user has HR role
CREATE OR REPLACE FUNCTION public.is_hr_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND role = 'hr_admin'
      AND is_active = true
  )
$$;