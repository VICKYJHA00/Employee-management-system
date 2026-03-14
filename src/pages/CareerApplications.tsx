import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Eye, FileText, Download, Calendar, Mail, Phone, MapPin, 
  Briefcase, User, Clock, CheckCircle, XCircle, AlertCircle, X,
  Loader2, RefreshCw
} from 'lucide-react';

interface CareerApplication {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  full_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  role_applied_for: string;
  years_of_experience: string | null;
  skills: string | null;
  why_join_thrylos: string | null;
  additional_notes: string | null;
  resume_url: string | null;
  aadhar_url: string | null;
  additional_documents: string[];
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Document Preview Component
const DocumentsSection: React.FC<{ application: CareerApplication }> = ({ application }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const getFileType = (url: string): 'image' | 'pdf' | 'other' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (extension === 'pdf') return 'pdf';
    return 'other';
  };

  const openPreview = (url: string, title: string) => {
    const type = getFileType(url);
    if (type === 'other') {
      // For unsupported types, open in new tab
      window.open(url, '_blank');
      return;
    }
    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewTitle('');
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-white">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.resume_url && (
              <button
                onClick={() => openPreview(application.resume_url!, 'Resume / CV')}
                className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all text-left"
              >
                <FileText className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">Resume / CV</p>
                  <p className="text-sm text-muted-foreground">Click to preview</p>
                </div>
                <Eye className="w-4 h-4 text-blue-400" />
              </button>
            )}
            
            {application.aadhar_url && (
              <button
                onClick={() => openPreview(application.aadhar_url!, 'Aadhar Card')}
                className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all text-left"
              >
                <FileText className="w-6 h-6 text-purple-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">Aadhar Card</p>
                  <p className="text-sm text-muted-foreground">Click to preview</p>
                </div>
                <Eye className="w-4 h-4 text-purple-400" />
              </button>
            )}
          </div>
          
          {application.additional_documents && application.additional_documents.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Additional Documents:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {application.additional_documents.map((doc, index) => (
                  <button
                    key={index}
                    onClick={() => openPreview(doc, `Document ${index + 1}`)}
                    className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-left"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-white text-sm">Document {index + 1}</span>
                    <Eye className="w-3 h-3 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {!application.resume_url && !application.aadhar_url && 
           (!application.additional_documents || application.additional_documents.length === 0) && (
            <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={closePreview}>
          <DialogContent className="max-w-5xl max-h-[90vh] bg-black/95 border-white/20 p-0">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <DialogTitle className="text-white">{previewTitle}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePreview}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewType === 'image' && (
                <img 
                  src={previewUrl} 
                  alt={previewTitle}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              )}
              {previewType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg"
                  title={previewTitle}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

const CareerApplications: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('career_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion for additional_documents
      const typedData = (data || []).map(app => ({
        ...app,
        additional_documents: Array.isArray(app.additional_documents) 
          ? app.additional_documents as string[]
          : []
      }));
      
      setApplications(typedData);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch career applications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('career_applications')
        .update({ 
          status,
          reviewed_by: adminProfile?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Application status changed to ${status}`,
      });

      fetchApplications();
      if (selectedApplication?.id === id) {
        setSelectedApplication(prev => prev ? { ...prev, status } : null);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400"><Eye className="w-3 h-3 mr-1" />Reviewed</Badge>;
      case 'shortlisted':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Shortlisted</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'hired':
        return <Badge variant="secondary" className="bg-purple-500/20 text-purple-400"><Briefcase className="w-3 h-3 mr-1" />Hired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    hired: applications.filter(a => a.status === 'hired').length,
  };

  if (adminProfile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">Only super admins can view career applications.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Career Applications</h1>
              <p className="text-muted-foreground">Manage and review job applications</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchApplications} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/50 border-white/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-white/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <p className="text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-white/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">{stats.shortlisted}</div>
              <p className="text-muted-foreground">Shortlisted</p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 border-white/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-400">{stats.hired}</div>
              <p className="text-muted-foreground">Hired</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-muted-foreground">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-black/50 border-white/20">
              <SelectValue placeholder="All Applications" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20">
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Table */}
        <Card className="bg-black/50 border-white/10">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No applications found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Applicant</TableHead>
                    <TableHead className="text-white">Role</TableHead>
                    <TableHead className="text-white">Experience</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Applied On</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className="border-white/10">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{app.role_applied_for}</TableCell>
                      <TableCell className="text-muted-foreground">{app.years_of_experience || 'Not specified'}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(app)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Application Detail Dialog */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white flex items-center gap-3">
                <User className="w-6 h-6" />
                {selectedApplication?.full_name}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh] pr-4">
              {selectedApplication && (
                <div className="space-y-6">
                  {/* Status & Actions */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">Current Status:</span>
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                    <Select 
                      value={selectedApplication.status} 
                      onValueChange={(value) => updateApplicationStatus(selectedApplication.id, value)}
                    >
                      <SelectTrigger className="w-[180px] bg-black border-white/20">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/20">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Personal Details */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-white">{selectedApplication.mobile_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-white">{selectedApplication.email}</span>
                      </div>
                      {selectedApplication.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">DOB: {new Date(selectedApplication.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                      {(selectedApplication.city || selectedApplication.state) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">
                            {[selectedApplication.city, selectedApplication.state, selectedApplication.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {selectedApplication.full_address && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Full Address:</p>
                          <p className="text-white">{selectedApplication.full_address}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Professional Details */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">Role: {selectedApplication.role_applied_for}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-white">Experience: {selectedApplication.years_of_experience || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      {selectedApplication.skills && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Skills:</p>
                          <p className="text-white bg-white/5 p-3 rounded-lg">{selectedApplication.skills}</p>
                        </div>
                      )}
                      
                      {selectedApplication.why_join_thrylos && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Why join THRYLOS?</p>
                          <p className="text-white bg-white/5 p-3 rounded-lg">{selectedApplication.why_join_thrylos}</p>
                        </div>
                      )}
                      
                      {selectedApplication.additional_notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Additional Notes:</p>
                          <p className="text-white bg-white/5 p-3 rounded-lg">{selectedApplication.additional_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents with Preview */}
                  <DocumentsSection application={selectedApplication} />

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-white/5 rounded-lg">
                    <span>Applied: {new Date(selectedApplication.created_at).toLocaleString()}</span>
                    {selectedApplication.reviewed_at && (
                      <span>Last reviewed: {new Date(selectedApplication.reviewed_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CareerApplications;