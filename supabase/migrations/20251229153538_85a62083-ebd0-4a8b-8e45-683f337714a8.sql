-- Add new admin roles to the enum
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'tech_admin';
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'content_admin';