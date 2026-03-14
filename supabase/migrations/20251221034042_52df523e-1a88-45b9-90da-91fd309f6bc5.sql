-- Add status column to admins table for leave/suspended tracking
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create admin_notifications table for custom notifications from super admin
CREATE TABLE public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  sender_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  recipient_type text NOT NULL DEFAULT 'all', -- 'all', 'selected'
  recipients uuid[] DEFAULT '{}', -- Array of admin IDs for selected recipients
  priority text NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read_by uuid[] DEFAULT '{}', -- Array of admin IDs who have read
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for admin_notifications
CREATE POLICY "Super admins can manage all notifications"
ON public.admin_notifications
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their notifications"
ON public.admin_notifications
FOR SELECT
USING (
  is_admin(auth.uid()) AND (
    recipient_type = 'all' OR 
    (SELECT id FROM public.admins WHERE user_id = auth.uid()) = ANY(recipients)
  )
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;