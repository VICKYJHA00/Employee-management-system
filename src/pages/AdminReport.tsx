import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, FileText, User, Calendar, Briefcase } from 'lucide-react';

const AdminReport: React.FC = () => {
  const { adminProfile } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const reportRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const todayStr = now.toISOString().split('T')[0];

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data } = await supabase.from('admins').select('id, name, role, email, is_active');
      setAdmins(data || []);
    };
    fetchAdmins();
  }, []);

  const generateReport = async (adminId: string) => {
    setLoading(true);
    setSelectedAdmin(adminId);
    
    const admin = admins.find(a => a.id === adminId);
    const [{ data: attendance }, { data: techLogs }, { data: contentLogs }, { data: leaves }, { data: empData }] = await Promise.all([
      supabase.from('attendance').select('*').eq('admin_id', adminId).gte('date', monthStart).lte('date', todayStr).order('date'),
      supabase.from('tech_work_logs').select('*').eq('admin_id', adminId).gte('created_at', monthStart).order('created_at', { ascending: false }),
      supabase.from('content_work_logs').select('*').eq('admin_id', adminId).gte('created_at', monthStart).order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*').eq('admin_id', adminId).gte('leave_date', monthStart),
      supabase.from('admin_employee_data' as any).select('*').eq('admin_id', adminId).maybeSingle()
    ]);

    const presentDays = attendance?.filter(a => a.status === 'present').length || 0;
    const lateDays = attendance?.filter(a => a.status === 'late').length || 0;
    const absentDays = attendance?.filter(a => a.status === 'absent').length || 0;

    setReportData({
      admin, empData, attendance: attendance || [], techLogs: techLogs || [], contentLogs: contentLogs || [],
      leaves: leaves || [], presentDays, lateDays, absentDays,
      totalWorkLogs: (techLogs?.length || 0) + (contentLogs?.length || 0),
      totalHours: techLogs?.reduce((s: number, l: any) => s + (l.hours_spent || 0), 0) || 0
    });
    setLoading(false);
  };

  const exportCSV = () => {
    if (!reportData) return;
    const rows = [
      ['Admin Report', reportData.admin?.name, reportData.admin?.role, `Month: ${currentMonth}/${currentYear}`],
      [],
      ['Attendance Summary'],
      ['Present', 'Late', 'Absent', 'Total Days'],
      [reportData.presentDays, reportData.lateDays, reportData.absentDays, reportData.attendance.length],
      [],
      ['Work Logs'],
      ['Date', 'Title', 'Type', 'Status', 'Hours'],
      ...reportData.techLogs.map((l: any) => [new Date(l.created_at).toLocaleDateString(), l.title, l.work_type, l.status, l.hours_spent]),
      ...reportData.contentLogs.map((l: any) => [new Date(l.created_at).toLocaleDateString(), l.title, l.content_type, l.status, '-']),
      [],
      ['Leave Requests'],
      ['Date', 'Subject', 'Type', 'Status'],
      ...reportData.leaves.map((l: any) => [l.leave_date, l.subject, l.leave_type, l.status])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${reportData.admin?.name}_report_${currentMonth}_${currentYear}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filteredAdmins = admins.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.role?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Admin Reports" description="Generate detailed admin reports with attendance, work logs, and leave data"
        actions={reportData ? <Button onClick={exportCSV} size="sm"><Download className="w-4 h-4 mr-1" /> Export CSV</Button> : undefined}>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search admin..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {!selectedAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAdmins.map(admin => (
              <Card key={admin.id} className="border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => generateReport(admin.id)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {admin.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{admin.name}</h3>
                    <p className="text-xs text-gray-500">{admin.role?.replace('_', ' ')} • {admin.email}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading && <p className="text-gray-400 text-center py-8">Generating report...</p>}

        {reportData && !loading && (
          <div ref={reportRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => { setSelectedAdmin(''); setReportData(null); }}>← Back</Button>
              <h2 className="text-lg font-bold text-white">{reportData.admin?.name} — {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}</h2>
            </div>

            {/* Profile Summary */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Name</p><p className="text-white">{reportData.admin?.name}</p></div>
                <div><p className="text-xs text-gray-400">Role</p><p className="text-white">{reportData.admin?.role?.replace('_', ' ')}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="text-white">{reportData.admin?.email}</p></div>
                <div><p className="text-xs text-gray-400">Department</p><p className="text-white">{(reportData.empData as any)?.department || '-'}</p></div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Attendance</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-green-500/10 rounded p-3 text-center"><p className="text-2xl font-bold text-green-400">{reportData.presentDays}</p><p className="text-xs text-gray-400">Present</p></div>
                  <div className="bg-yellow-500/10 rounded p-3 text-center"><p className="text-2xl font-bold text-yellow-400">{reportData.lateDays}</p><p className="text-xs text-gray-400">Late</p></div>
                  <div className="bg-red-500/10 rounded p-3 text-center"><p className="text-2xl font-bold text-red-400">{reportData.absentDays}</p><p className="text-xs text-gray-400">Absent</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Work Logs */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Briefcase className="w-4 h-4" /> Work Logs ({reportData.totalWorkLogs})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...reportData.techLogs.map((l: any) => ({ ...l, logType: 'Tech' })), ...reportData.contentLogs.map((l: any) => ({ ...l, logType: 'Content' }))]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                        <div>
                          <span className="text-white">{log.title}</span>
                          <Badge variant="secondary" className="ml-2 text-[10px]">{log.logType}</Badge>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  {reportData.totalWorkLogs === 0 && <p className="text-gray-500 text-sm">No work logs this month</p>}
                </div>
              </CardContent>
            </Card>

            {/* Leaves */}
            {reportData.leaves.length > 0 && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Leave Requests</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.leaves.map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                        <div>
                          <span className="text-white">{l.subject}</span>
                          <Badge variant="secondary" className="ml-2 text-[10px]">{l.status}</Badge>
                        </div>
                        <span className="text-xs text-gray-500">{l.leave_date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default AdminReport;
