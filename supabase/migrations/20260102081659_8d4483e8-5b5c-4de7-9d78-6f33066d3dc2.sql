-- First, update any existing admins with betting_admin or trading_admin roles to social_admin
UPDATE public.admins SET role = 'social_admin' WHERE role IN ('betting_admin', 'trading_admin');

-- Drop the tables related to betting and trading
DROP TABLE IF EXISTS public.betting_events CASCADE;
DROP TABLE IF EXISTS public.trading_users CASCADE;

-- Drop the dependent function with CASCADE (will also drop dependent policies)
DROP FUNCTION IF EXISTS public.has_admin_role(uuid, admin_role) CASCADE;

-- Create new enum without betting and trading roles
CREATE TYPE public.admin_role_new AS ENUM (
  'super_admin',
  'social_admin',
  'esports_admin',
  'tech_admin',
  'content_admin'
);

-- Drop the default first
ALTER TABLE public.admins ALTER COLUMN role DROP DEFAULT;

-- Update the admins table to use the new enum
ALTER TABLE public.admins 
  ALTER COLUMN role TYPE public.admin_role_new 
  USING role::text::public.admin_role_new;

-- Set new default
ALTER TABLE public.admins ALTER COLUMN role SET DEFAULT 'social_admin'::public.admin_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.admin_role;
ALTER TYPE public.admin_role_new RENAME TO admin_role;

-- Recreate the helper function with new enum
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role admin_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Recreate the RLS policies for esports_players
CREATE POLICY "Esports admins can manage esports players"
ON public.esports_players
FOR ALL
USING (has_admin_role(auth.uid(), 'esports_admin') OR is_super_admin(auth.uid()));

-- Recreate the RLS policies for social_media_orders
CREATE POLICY "Social admins can manage social media orders"
ON public.social_media_orders
FOR ALL
USING (has_admin_role(auth.uid(), 'social_admin') OR is_super_admin(auth.uid()));

-- Recreate the RLS policies for social_media_analytics
CREATE POLICY "Social admins can manage social media analytics"
ON public.social_media_analytics
FOR ALL
USING (has_admin_role(auth.uid(), 'social_admin') OR is_super_admin(auth.uid()));