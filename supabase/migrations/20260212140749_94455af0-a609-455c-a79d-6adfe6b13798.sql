
-- Allow all admins to update is_read_by on their own notifications
CREATE POLICY "Admins can mark notifications as read"
ON public.admin_notifications
FOR UPDATE
USING (
  is_admin(auth.uid()) AND 
  (recipient_type = 'all' OR (SELECT admins.id FROM admins WHERE admins.user_id = auth.uid()) = ANY(recipients))
)
WITH CHECK (
  is_admin(auth.uid()) AND 
  (recipient_type = 'all' OR (SELECT admins.id FROM admins WHERE admins.user_id = auth.uid()) = ANY(recipients))
);
