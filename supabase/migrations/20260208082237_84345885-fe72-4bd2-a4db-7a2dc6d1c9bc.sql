-- First migration: Add hr_admin to enum
ALTER TYPE admin_role ADD VALUE IF NOT EXISTS 'hr_admin';