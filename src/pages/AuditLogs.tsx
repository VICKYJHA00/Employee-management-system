import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Shield, Award, Briefcase, User, LogIn, MapPin, Globe, 
  Send, Bell, Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_name: string;
  admin_email: string;
  details: string;
  timestamp: string;
  ip?: string;
  location?: string;
  isp?: string;
  rawDetails?: any;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

const AuditLogs: React.FC = () => {
  const { adminProfile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    todayActions: 0,
    totalLogs: 0,
    uniqueAdmins: 0,
    todayLogins: 0
  });
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [notifyAll, setNotifyAll] = useState(true);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  useEffect(() => {
    fetchAuditLogs();
    if (isSuperAdmin) {
      fetchAdmins();
    }
    
    // Real-time subscriptions
    const auditChannel = supabase
      .channel('audit-logs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => setTimeout(fetchAuditLogs, 500)
      )
      .subscribe();

    const paymentChannel = supabase
      .channel('audit-payments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_verifications' },
        () => setTimeout(fetchAuditLogs, 500)
      )
      .subscribe();

    const certificateChannel = supabase
      .channel('audit-certificates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'certificates' },
        () => setTimeout(fetchAuditLogs, 500)
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('audit-attendance')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' },
        () => setTimeout(fetchAuditLogs, 500)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(auditChannel);
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(certificateChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email')
        .eq('is_active', true);

      if (error) throw error;
      setAdmins((data || []) as Admin[]);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs: AuditLog[] = [];

      // Fetch login logs from audit_logs table
      const { data: loginLogs } = await supabase
        .from('audit_logs')
        .select('*, admin:admins!admin_id(name, email)')
        .eq('action', 'LOGIN')
        .order('created_at', { ascending: false });

      loginLogs?.forEach((log: any) => {
        const details = log.details || {};
        logs.push({
          id: `login-${log.id}`,
          action: 'LOGIN',
          entity_type: 'session',
          entity_id: log.id,
          admin_name: log.admin?.name || 'Unknown',
          admin_email: log.admin?.email || details.email || '',
          details: `Login from ${details.location || 'Unknown location'}`,
          timestamp: log.created_at,
          ip: details.ip,
          location: details.location,
          isp: details.isp,
          rawDetails: details
        });
      });

      // Fetch payment verification logs
      const { data: payments } = await supabase
        .from('payment_verifications')
        .select('*, verified_admin:admins!verified_by(name, email)')
        .order('created_at', { ascending: false });

      payments?.forEach((payment: any) => {
        if (payment.payment_received && payment.verified_admin) {
          logs.push({
            id: `payment-verify-${payment.id}`,
            action: 'VERIFY_PAYMENT',
            entity_type: 'payment',
            entity_id: payment.id,
            admin_name: payment.verified_admin?.name || 'Unknown Admin',
            admin_email: payment.verified_admin?.email || '',
            details: `Verified payment for ${payment.user_name} - ₹${payment.amount} (${payment.transaction_id})`,
            timestamp: payment.verified_at || payment.created_at
          });
        }
      });

      // Fetch certificate logs
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*, issued_admin:admins!issued_by(name, email)')
        .order('created_at', { ascending: false });

      certificates?.forEach((cert: any) => {
        logs.push({
          id: `cert-issue-${cert.id}`,
          action: 'ISSUE_CERTIFICATE',
          entity_type: 'certificate',
          entity_id: cert.id,
          admin_name: cert.issued_admin?.name || 'Unknown Admin',
          admin_email: cert.issued_admin?.email || '',
          details: `Certificate ${cert.certificate_id || cert.id} issued to ${cert.participant_name || cert.recipient_name}`,
          timestamp: cert.created_at
        });
      });

      // Fetch attendance logs
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, admin:admins!admin_id(name, email)')
        .order('created_at', { ascending: false });

      attendance?.forEach((att: any) => {
        logs.push({
          id: `attendance-mark-${att.id}`,
          action: 'MARK_ATTENDANCE',
          entity_type: 'attendance',
          entity_id: att.id,
          admin_name: att.admin?.name || 'Unknown Admin',
          admin_email: att.admin?.email || '',
          details: `${att.admin?.name || 'Admin'} marked ${att.status} for ${att.date}`,
          timestamp: att.marked_at || att.created_at
        });
      });

      // Sort by timestamp
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => log.timestamp.split('T')[0] === today);
      const todayLogins = todayLogs.filter(log => log.action === 'LOGIN').length;
      const uniqueAdmins = new Set(logs.map(log => log.admin_email).filter(email => email)).size;

      setAuditLogs(logs.slice(0, 100));
      setStats({
        todayActions: todayLogs.length,
        totalLogs: logs.length,
        uniqueAdmins,
        todayLogins
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const sendLoginNotification = async () => {
    if (!selectedLog || !adminProfile) return;

    try {
      const recipients = notifyAll ? [] : selectedAdmins;
      
      await supabase.from('admin_notifications').insert({
        title: 'Login Activity Alert',
        message: `${selectedLog.admin_name} logged in from ${selectedLog.location || 'Unknown'} (IP: ${selectedLog.ip || 'Unknown'}, ISP: ${selectedLog.isp || 'Unknown'})`,
        sender_id: adminProfile.id,
        recipient_type: notifyAll ? 'all' : 'selected',
        recipients,
        priority: 'high'
      });

      toast({
        title: 'Notification Sent',
        description: `Login details sent to ${notifyAll ? 'all admins' : `${selectedAdmins.length} admins`}`
      });

      setShowNotifyDialog(false);
      setSelectedLog(null);
      setSelectedAdmins([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <LogIn className="w-4 h-4 text-cyan-400" />;
      case 'VERIFY_PAYMENT':
      case 'CREATE_PAYMENT':
        return <Shield className="w-4 h-4 text-green-400" />;
      case 'ISSUE_CERTIFICATE':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'CREATE_INTERNSHIP':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'MARK_ATTENDANCE':
        return <User className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'VERIFY_PAYMENT':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'ISSUE_CERTIFICATE':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'MARK_ATTENDANCE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <ModuleLayout
      title="Audit Logs"
      description="Track all admin actions, login activity, and system events"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">{stats.todayActions}</p>
                <p className="text-sm text-muted-foreground">Today's Actions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.todayLogins}</p>
                <p className="text-sm text-muted-foreground">Today's Logins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.totalLogs}</p>
                <p className="text-sm text-muted-foreground">Total Logs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.uniqueAdmins}</p>
                <p className="text-sm text-muted-foreground">Active Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Activity Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No audit logs available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                    {isSuperAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.admin_name}</p>
                          <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{log.details}</p>
                      </TableCell>
                      <TableCell>
                        {log.action === 'LOGIN' && log.ip ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>{log.ip}</span>
                            </div>
                            {log.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{log.location}</span>
                              </div>
                            )}
                            {log.isp && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wifi className="w-3 h-3" />
                                <span>{log.isp}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          {log.action === 'LOGIN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedLog(log);
                                setShowNotifyDialog(true);
                              }}
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Notify
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Notify Dialog */}
        <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Send Login Alert</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-lg space-y-2">
                  <p className="font-medium">{selectedLog.admin_name}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>IP: {selectedLog.ip || 'Unknown'}</p>
                    <p>Location: {selectedLog.location || 'Unknown'}</p>
                    <p>ISP: {selectedLog.isp || 'Unknown'}</p>
                    <p>Time: {new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={notifyAll} 
                      onCheckedChange={(checked) => setNotifyAll(!!checked)} 
                    />
                    <span>Send to all admins</span>
                  </label>
                </div>

                {!notifyAll && (
                  <ScrollArea className="h-[150px] border border-white/10 rounded-md p-2">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          checked={selectedAdmins.includes(admin.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAdmins([...selectedAdmins, admin.id]);
                            } else {
                              setSelectedAdmins(selectedAdmins.filter(id => id !== admin.id));
                            }
                          }}
                        />
                        <span className="text-sm">{admin.name}</span>
                      </div>
                    ))}
                  </ScrollArea>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={sendLoginNotification} className="gradient-primary">
                    <Send className="w-4 h-4 mr-2" />
                    Send Alert
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
};

export default AuditLogs;
