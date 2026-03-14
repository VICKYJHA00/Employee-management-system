import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, UserPlus, Coffee, Ban, CheckCircle, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { roleNames } from '@/types/auth';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

type AdminProfile = Database['public']['Tables']['admins']['Row'] & { status?: string };

const AdminManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp_email: '',
    role: 'social_admin' as 'super_admin' | 'social_admin' | 'esports_admin' | 'tech_admin' | 'content_admin',
    password: '',
    avatar: '',
    avatarFile: null as File | null
  });

  useEffect(() => {
    fetchAdmins();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admins' },
        () => fetchAdmins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


export default EmployeeManagement;
