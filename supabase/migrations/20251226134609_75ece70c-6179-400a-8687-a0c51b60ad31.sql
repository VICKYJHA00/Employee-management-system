-- Create a table for career applications
CREATE TABLE public.career_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  full_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  date_of_birth DATE,
  role_applied_for TEXT NOT NULL,
  years_of_experience TEXT,
  skills TEXT,
  why_join_thrylos TEXT,
  additional_notes TEXT,
  resume_url TEXT,
  aadhar_url TEXT,
  additional_documents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.admins(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (anyone can apply)
CREATE POLICY "Anyone can submit a career application" 
ON public.career_applications 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view applications
CREATE POLICY "Admins can view career applications" 
ON public.career_applications 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policy for super admins to manage applications
CREATE POLICY "Super admins can manage career applications" 
ON public.career_applications 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_career_applications_updated_at
BEFORE UPDATE ON public.career_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for career documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('career-documents', 'career-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for career documents
CREATE POLICY "Anyone can upload career documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'career-documents');

CREATE POLICY "Anyone can view career documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'career-documents');

CREATE POLICY "Admins can delete career documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'career-documents' AND is_admin(auth.uid()));