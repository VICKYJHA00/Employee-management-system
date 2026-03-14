-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for employee documents bucket
CREATE POLICY "Admins can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view employee documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update employee documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'employee-documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete employee documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-documents' 
  AND public.is_admin(auth.uid())
);

-- Add UPI ID column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Create employee_documents table for additional documents
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_documents
CREATE POLICY "Admins can view employee documents"
ON public.employee_documents
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage employee documents"
ON public.employee_documents
FOR ALL
USING (public.is_admin(auth.uid()));