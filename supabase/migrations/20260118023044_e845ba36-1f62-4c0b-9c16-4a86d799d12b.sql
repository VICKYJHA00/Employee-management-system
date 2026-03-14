-- Create admin_employee_data table with same fields as employees + lock status
CREATE TABLE public.admin_employee_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL UNIQUE REFERENCES public.admins(id) ON DELETE CASCADE,
    employee_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_joining DATE,
    date_of_birth DATE,
    department TEXT,
    designation TEXT,
    gender TEXT,
    marital_status TEXT,
    current_address TEXT,
    permanent_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    aadhar_number TEXT,
    pan_number TEXT,
    profile_image_url TEXT,
    aadhar_document_url TEXT,
    pan_document_url TEXT,
    offer_letter_url TEXT,
    bank_account_number TEXT,
    bank_name TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    notes TEXT,
    salary NUMERIC,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_employee_data ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage all admin employee data"
ON public.admin_employee_data
FOR ALL
USING (is_super_admin(auth.uid()));

-- Admins can view their own data
CREATE POLICY "Admins can view their own employee data"
ON public.admin_employee_data
FOR SELECT
USING (admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()));

-- Admins can insert their own data only if not exists
CREATE POLICY "Admins can insert their own employee data"
ON public.admin_employee_data
FOR INSERT
WITH CHECK (
    admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
    AND NOT EXISTS (SELECT 1 FROM admin_employee_data WHERE admin_id = (SELECT id FROM admins WHERE user_id = auth.uid()))
);

-- Admins can update their own data only if not locked
CREATE POLICY "Admins can update their own employee data if not locked"
ON public.admin_employee_data
FOR UPDATE
USING (
    admin_id = (SELECT id FROM admins WHERE user_id = auth.uid())
    AND is_locked = false
);

-- Trigger to update updated_at
CREATE TRIGGER update_admin_employee_data_updated_at
BEFORE UPDATE ON public.admin_employee_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();