-- Create employees table for employee management
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    date_of_joining DATE NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    marital_status TEXT,
    
    -- Address details
    current_address TEXT,
    permanent_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    
    -- Identity documents
    aadhar_number TEXT,
    pan_number TEXT,
    
    -- Image and documents (store URLs from storage)
    profile_image_url TEXT,
    aadhar_document_url TEXT,
    pan_document_url TEXT,
    offer_letter_url TEXT,
    
    -- Additional documents stored as JSON array of {name, url, type}
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Status and metadata
    status TEXT NOT NULL DEFAULT 'active',
    salary NUMERIC DEFAULT 0,
    bank_account_number TEXT,
    bank_name TEXT,
    ifsc_code TEXT,
    
    -- Emergency contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.admins(id)
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view employees" 
ON public.employees 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage employees" 
ON public.employees 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();