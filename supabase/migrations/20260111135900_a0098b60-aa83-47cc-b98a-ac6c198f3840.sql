-- Create leave_balances table to track annual leave limits
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  sick_leave_total INTEGER NOT NULL DEFAULT 12,
  sick_leave_used INTEGER NOT NULL DEFAULT 0,
  casual_leave_total INTEGER NOT NULL DEFAULT 12,
  casual_leave_used INTEGER NOT NULL DEFAULT 0,
  vacation_leave_total INTEGER NOT NULL DEFAULT 15,
  vacation_leave_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, year)
);

-- Enable RLS
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own balances
CREATE POLICY "Users can view their own leave balances"
ON public.leave_balances
FOR SELECT
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

-- Super admins can view all balances
CREATE POLICY "Super admins can view all leave balances"
ON public.leave_balances
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can manage all balances
CREATE POLICY "Super admins can manage leave balances"
ON public.leave_balances
FOR ALL
USING (is_super_admin(auth.uid()));

-- Add leave_category column to leave_requests if not exists
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_category TEXT DEFAULT 'casual';

-- Create trigger for updated_at
CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();