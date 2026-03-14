
-- Add the missing uploaded_files table that some components are trying to access
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for uploaded_files
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for uploaded_files
CREATE POLICY "Authenticated users can view uploaded files" ON public.uploaded_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert uploaded files" ON public.uploaded_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update uploaded files" ON public.uploaded_files FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete uploaded files" ON public.uploaded_files FOR DELETE TO authenticated USING (true);

-- Enable real-time for uploaded_files
ALTER TABLE public.uploaded_files REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.uploaded_files;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON public.uploaded_files(created_at);
