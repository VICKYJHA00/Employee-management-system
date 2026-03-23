import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Certificate {
  id: string;
  certificate_id: string | null;
  recipient_name: string;
  certificate_type: string;
  issue_date: string;
  issued_by: string | null;
  certificate_url: string | null;
  participant_name: string | null;
  participant_email: string | null;
  course_name: string | null;
  created_at: string;
  updated_at: string;
}

const CertificateManager: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    certificate_id: '',
    participant_name: '',
    participant_email: '',
    course_name: ''
  });

  return (
    <ModuleLayout
      title="Certificate Manager"
      description="Issue certificates and manage verification system"
    >
      <div className="space-y-6"></div>
    </ModuleLayout>
  );
};

export default CertificateManager;
useEffect(() => {
  fetchCertificates();

  const channel = supabase
    .channel('certificate-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'certificates' },
      () => fetchCertificates()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

const fetchCertificates = async () => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCertificates((data || []) as Certificate[]);
  } catch (error) {
    console.error('Error fetching certificates:', error);
  } finally {
    setIsLoading(false);
  }
};
const filteredCertificates = certificates.filter(cert =>
  (cert.participant_name || cert.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (cert.certificate_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  (cert.course_name || cert.certificate_type || '').toLowerCase().includes(searchTerm.toLowerCase())
);

const generateCertificateId = () => {
  const random6Digits = Math.floor(100000 + Math.random() * 900000);
  return `MU${random6Digits}`;
};
