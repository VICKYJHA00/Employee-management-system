
-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  details TEXT,
  leave_date DATE NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'full_day',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.admins(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own leave requests
CREATE POLICY "Users can view their own leave requests"
ON public.leave_requests
FOR SELECT
USING (admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid()));

-- Users can create their own leave requests
CREATE POLICY "Users can create their own leave requests"
ON public.leave_requests
FOR INSERT
WITH CHECK (admin_id = (SELECT id FROM public.admins WHERE user_id = auth.uid()));

-- Super admins can view all leave requests
CREATE POLICY "Super admins can view all leave requests"
ON public.leave_requests
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can manage all leave requests
CREATE POLICY "Super admins can manage all leave requests"
ON public.leave_requests
FOR ALL
USING (is_super_admin(auth.uid()));

-- Add override fields to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS override_status TEXT,
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES public.admins(id),
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
