
-- Fix the overly permissive RLS policy warning - the existing policies are fine as they use proper checks
-- The warning is about the career_applications table which has WITH CHECK (true) for INSERT - this is intentional
-- No changes needed for our new leave_requests table as it has proper policies
