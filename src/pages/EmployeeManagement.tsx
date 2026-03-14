import React, { useState, useEffect, useRef } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Search, Edit, Trash2, Eye, Upload, X, User, Mail, Phone, 
  MapPin, Calendar, Building, FileText, CreditCard, UserCircle, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string;
  date_of_joining: string;
  date_of_birth: string | null;
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
  documents: any[];
  status: string;
  salary: number;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  notes: string | null;
  created_at: string;
}

interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: string;
  document_url: string;
  created_at: string;
}

const EmployeeManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    date_of_joining: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    current_address: '',
    permanent_address: '',
    city: '',
    state: '',
    pincode: '',
    aadhar_number: '',
    pan_number: '',
    profile_image_url: '',
    aadhar_document_url: '',
    pan_document_url: '',
    offer_letter_url: '',
    status: 'active',
    salary: 0,
    bank_account_number: '',
    bank_name: '',
    ifsc_code: '',
    upi_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    notes: ''
  });
  const [additionalDocuments, setAdditionalDocuments] = useState<EmployeeDocument[]>([]);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentType, setNewDocumentType] = useState('certificate');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data || []) as Employee[]);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!file) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${fieldName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
      
      // Log file upload
      await logActivity(ActivityActions.UPLOAD_FILE, {
        file_name: file.name,
        file_type: fieldName,
        file_size: file.size
      });
      
      toast({
        title: "Upload Successful",
        description: "File uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalDocumentUpload = async (file: File) => {
    if (!file || !newDocumentName || !selectedEmployee) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedEmployee.id}/${Date.now()}_${newDocumentType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: selectedEmployee.id,
          document_name: newDocumentName,
          document_type: newDocumentType,
          document_url: publicUrl,
          uploaded_by: adminProfile?.id
        } as any);

      if (insertError) throw insertError;

      // Log document upload
      await logActivity(ActivityActions.UPLOAD_FILE, {
        document_name: newDocumentName,
        document_type: newDocumentType,
        employee_name: selectedEmployee.full_name,
        employee_id: selectedEmployee.employee_id
      });

      toast({
        title: "Document Uploaded",
        description: "Additional document uploaded successfully"
      });

      setNewDocumentName('');
      fetchEmployeeDocuments(selectedEmployee.id);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const fetchEmployeeDocuments = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdditionalDocuments((data || []) as EmployeeDocument[]);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      
      // Log document deletion
      await logActivity(ActivityActions.DELETE_FILE, {
        document_name: docName,
        employee_name: selectedEmployee?.full_name
      });
      
      toast({ title: "Document Deleted" });
      if (selectedEmployee) {
        fetchEmployeeDocuments(selectedEmployee.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.full_name || !formData.email || !formData.department || !formData.designation || !formData.date_of_joining) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const employeeData = {
        ...formData,
        salary: Number(formData.salary) || 0,
        created_by: adminProfile?.id
      };

      if (selectedEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData as any)
          .eq('id', selectedEmployee.id);

        if (error) throw error;
        
        // Log employee update
        await logActivity(ActivityActions.UPDATE_EMPLOYEE, {
          employee_id: formData.employee_id,
          employee_name: formData.full_name,
          department: formData.department
        });
        
        toast({ title: "Success", description: "Employee updated successfully" });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert(employeeData as any);

        if (error) throw error;
        
        // Log employee creation
        await logActivity(ActivityActions.CREATE_EMPLOYEE, {
          employee_id: formData.employee_id,
          employee_name: formData.full_name,
          department: formData.department,
          designation: formData.designation
        });
        
        toast({ title: "Success", description: "Employee added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save employee",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      designation: employee.designation,
      date_of_joining: employee.date_of_joining,
      date_of_birth: employee.date_of_birth || '',
      gender: employee.gender || '',
      marital_status: employee.marital_status || '',
      current_address: employee.current_address || '',
      permanent_address: employee.permanent_address || '',
      city: employee.city || '',
      state: employee.state || '',
      pincode: employee.pincode || '',
      aadhar_number: employee.aadhar_number || '',
      pan_number: employee.pan_number || '',
      profile_image_url: employee.profile_image_url || '',
      aadhar_document_url: employee.aadhar_document_url || '',
      pan_document_url: employee.pan_document_url || '',
      offer_letter_url: employee.offer_letter_url || '',
      status: employee.status,
      salary: employee.salary,
      bank_account_number: employee.bank_account_number || '',
      bank_name: employee.bank_name || '',
      ifsc_code: employee.ifsc_code || '',
      upi_id: employee.upi_id || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      emergency_contact_relation: employee.emergency_contact_relation || '',
      notes: employee.notes || ''
    });
    fetchEmployeeDocuments(employee.id);
    setIsDialogOpen(true);
  };

  const handleView = async (employee: Employee) => {
    setViewEmployee(employee);
    
    // Log view activity
    await logActivity(ActivityActions.VIEW_EMPLOYEE, {
      employee_id: employee.employee_id,
      employee_name: employee.full_name,
      department: employee.department,
      viewed_at: new Date().toISOString()
    });
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;
      
      // Log employee deletion
      await logActivity(ActivityActions.DELETE_EMPLOYEE, {
        employee_id: employee.employee_id,
        employee_name: employee.full_name,
        department: employee.department,
        deleted_at: new Date().toISOString()
      });
      
      toast({ title: "Success", description: "Employee deleted successfully" });
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setFormData({
      employee_id: '',
      full_name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      date_of_joining: '',
      date_of_birth: '',
      gender: '',
      marital_status: '',
      current_address: '',
      permanent_address: '',
      city: '',
      state: '',
      pincode: '',
      aadhar_number: '',
      pan_number: '',
      profile_image_url: '',
      aadhar_document_url: '',
      pan_document_url: '',
      offer_letter_url: '',
      status: 'active',
      salary: 0,
      bank_account_number: '',
      bank_name: '',
      ifsc_code: '',
      upi_id: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      notes: ''
    });
    setAdditionalDocuments([]);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
      on_leave: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      terminated: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || colors.active;
  };

  return (
    <ModuleLayout
      title="Employee Management"
      description="Manage employee records, documents, and details"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, department, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background border-border">
            <DialogHeader>
              <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="address">Address</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="bank">Bank & Emergency</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Employee ID *</Label>
                        <Input
                          value={formData.employee_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                          placeholder="EMP001"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="John Doe"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+91 9876543210"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Department *</Label>
                        <Select value={formData.department} onValueChange={(v) => setFormData(prev => ({ ...prev, department: v }))}>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="esports">eSports</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Designation *</Label>
                        <Input
                          value={formData.designation}
                          onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                          placeholder="Software Engineer"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Date of Joining *</Label>
                        <Input
                          type="date"
                          value={formData.date_of_joining}
                          onChange={(e) => setFormData(prev => ({ ...prev, date_of_joining: e.target.value }))}
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Marital Status</Label>
                        <Select value={formData.marital_status} onValueChange={(v) => setFormData(prev => ({ ...prev, marital_status: v }))}>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Salary (₹)</Label>
                        <Input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
                          placeholder="50000"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                          <SelectTrigger className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Current Address</Label>
                        <Textarea
                          value={formData.current_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, current_address: e.target.value }))}
                          placeholder="Enter current address"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Permanent Address</Label>
                        <Textarea
                          value={formData.permanent_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanent_address: e.target.value }))}
                          placeholder="Enter permanent address"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Mumbai"
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="Maharashtra"
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                        <div>
                          <Label>Pincode</Label>
                          <Input
                            value={formData.pincode}
                            onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                            placeholder="400001"
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Aadhar Number</Label>
                        <Input
                          value={formData.aadhar_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, aadhar_number: e.target.value }))}
                          placeholder="1234 5678 9012"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>PAN Number</Label>
                        <Input
                          value={formData.pan_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value }))}
                          placeholder="ABCDE1234F"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Profile Photo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile_image_url')}
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                          {formData.profile_image_url && (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={formData.profile_image_url} />
                              <AvatarFallback>IMG</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Aadhar Document</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'aadhar_document_url')}
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                        {formData.aadhar_document_url && (
                          <a href={formData.aadhar_document_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View Document</a>
                        )}
                      </div>
                      <div>
                        <Label>PAN Document</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pan_document_url')}
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                        {formData.pan_document_url && (
                          <a href={formData.pan_document_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View Document</a>
                        )}
                      </div>
                      <div>
                        <Label>Offer Letter</Label>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'offer_letter_url')}
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                        {formData.offer_letter_url && (
                          <a href={formData.offer_letter_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View Document</a>
                        )}
                      </div>
                    </div>

                    {/* Additional Documents - Only show when editing */}
                    {selectedEmployee && (
                      <div className="mt-6 space-y-4">
                        <h4 className="font-medium">Additional Documents</h4>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label>Document Name</Label>
                            <Input
                              value={newDocumentName}
                              onChange={(e) => setNewDocumentName(e.target.value)}
                              placeholder="Certificate name"
                              className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select value={newDocumentType} onValueChange={setNewDocumentType}>
                              <SelectTrigger className="w-32 bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="certificate">Certificate</SelectItem>
                                <SelectItem value="id_proof">ID Proof</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleAdditionalDocumentUpload(e.target.files[0])}
                            />
                            <Button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={!newDocumentName || uploading}
                            >
                              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                              Upload
                            </Button>
                          </div>
                        </div>

                        {additionalDocuments.length > 0 && (
                          <div className="space-y-2">
                            {additionalDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-white/10">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span className="text-sm">{doc.document_name}</span>
                                  <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a href={doc.document_url} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                  </a>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-400"
                                    onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={formData.bank_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                          placeholder="State Bank of India"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                          placeholder="12345678901234"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value }))}
                          placeholder="SBIN0001234"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                      <div>
                        <Label>UPI ID</Label>
                        <Input
                          value={formData.upi_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, upi_id: e.target.value }))}
                          placeholder="name@upi"
                          className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="font-medium mb-4">Emergency Contact</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={formData.emergency_contact_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                            placeholder="Contact name"
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={formData.emergency_contact_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                            placeholder="+91 9876543210"
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                        <div>
                          <Label>Relation</Label>
                          <Input
                            value={formData.emergency_contact_relation}
                            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_relation: e.target.value }))}
                            placeholder="Spouse, Parent, etc."
                            className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about the employee..."
                        className="bg-[rgba(0,0,0,0.6)] border-[rgba(255,255,255,0.15)]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedEmployee ? 'Update' : 'Add'} Employee
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <Card className="gradient-card border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No employees found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.profile_image_url || ''} />
                          <AvatarFallback>{employee.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell className="capitalize">{employee.department.replace('_', ' ')}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleView(employee)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(employee)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-3xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <ScrollArea className="max-h-[75vh]">
              <div className="space-y-6 pr-4">
                {/* Header with Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={viewEmployee.profile_image_url || ''} />
                    <AvatarFallback className="text-2xl">{viewEmployee.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{viewEmployee.full_name}</h3>
                    <p className="text-muted-foreground">{viewEmployee.designation}</p>
                    <Badge className={getStatusColor(viewEmployee.status)}>
                      {viewEmployee.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm"><strong>Employee ID:</strong> {viewEmployee.employee_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm"><strong>Email:</strong> {viewEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm"><strong>Phone:</strong> {viewEmployee.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize"><strong>Department:</strong> {viewEmployee.department.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm"><strong>Date of Joining:</strong> {new Date(viewEmployee.date_of_joining).toLocaleDateString()}</span>
                      </div>
                      {viewEmployee.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm"><strong>Date of Birth:</strong> {new Date(viewEmployee.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize"><strong>Gender:</strong> {viewEmployee.gender || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize"><strong>Marital Status:</strong> {viewEmployee.marital_status || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm"><strong>Salary:</strong> ₹{viewEmployee.salary?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Current Address:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.current_address || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Permanent Address:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.permanent_address || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm"><strong>City:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>State:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm"><strong>Pincode:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.pincode || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Identity Documents */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Identity Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Aadhar Number:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.aadhar_number || 'Not provided'}</p>
                      {viewEmployee.aadhar_document_url && (
                        <a href={viewEmployee.aadhar_document_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View Aadhar Document
                        </a>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>PAN Number:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.pan_number || 'Not provided'}</p>
                      {viewEmployee.pan_document_url && (
                        <a href={viewEmployee.pan_document_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View PAN Document
                        </a>
                      )}
                    </div>
                  </div>
                  {viewEmployee.offer_letter_url && (
                    <div className="mt-3">
                      <a href={viewEmployee.offer_letter_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <FileText className="h-3 w-3" /> View Offer Letter
                      </a>
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Bank Name:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.bank_name || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Account Number:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.bank_account_number || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>IFSC Code:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.ifsc_code || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>UPI ID:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.upi_id || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Name:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Phone:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Relation:</strong></p>
                      <p className="text-sm text-muted-foreground">{viewEmployee.emergency_contact_relation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewEmployee.notes && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground">{viewEmployee.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

export default EmployeeManagement;
