// FULL imports (keep ALL)
import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Lock, Edit, Eye, Upload, AlertTriangle, CheckCircle, Users, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// INTERFACE (FULL)
interface AdminEmployeeData {
  id: string;
  admin_id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  department: string | null;
  designation: string | null;
  gender: string | null;
  marital_status: string | null;
  current_address: string | null;
  permanent_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  aadhar_number: string | null;
  pan_number: string | null;
  profile_image_url: string | null;
  aadhar_document_url: string | null;
  pan_document_url: string | null;
  offer_letter_url: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  notes: string | null;
  salary: number | null;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

// INITIAL FORM DATA (FULL)
const initialFormData = { /* SAME AS YOUR ORIGINAL */ };

// COMPONENT START + STATES
const AdminEmployeeProfile: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [myData, setMyData] = useState<AdminEmployeeData | null>(null);
  const [allAdminsData, setAllAdminsData] = useState<any[]>([]);
  const [formData, setFormData] = useState(initialFormData);
