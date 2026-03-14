import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, RefreshCw, Play, ShieldCheck, Settings, Save, ChevronDown, ChevronUp, Search, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateForDB } from '@/lib/utils';

const ITEMS_PER_PAGE = 25;

const SuperAdminReviewPanel: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<{ tech: any[]; content: any[] }>({ tech: [], content: [] });
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringReview, setTriggeringReview] = useState(false);

  const [minDaysThreshold, setMinDaysThreshold] = useState(20);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editThreshold, setEditThreshold] = useState(20);
  const [editSuspensionDays, setEditSuspensionDays] = useState(7);
  const [savingSettings, setSavingSettings] = useState(false);

  // Live attendance stats
  const [liveAttendanceStats, setLiveAttendanceStats] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);

  // Collapsible states
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [liveStatsOpen, setLiveStatsOpen] = useState(false);
  const [workLogsOpen, setWorkLogsOpen] = useState(false);

  // Search states
  const [reviewSearch, setReviewSearch] = useState('');
  const [liveStatsSearch, setLiveStatsSearch] = useState('');
  const [workLogSearch, setWorkLogSearch] = useState('');

  // Pagination states
  const [reviewPage, setReviewPage] = useState(1);
  const [liveStatsPage, setLiveStatsPage] = useState(1);
  const [workLogPage, setWorkLogPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const today = formatDateForDB(now);

      const [
        { data: reviewsData },
        { data: adminsData },
        { data: techData },
        { data: contentData },
        { data: settingsData },
        { data: holidaysData },
        { data: attendanceData },
      ] = await Promise.all([
        supabase.from('monthly_attendance_reviews').select('*').eq('month', month).eq('year', year).order('created_at', { ascending: false }),
        supabase.from('admins').select('id, name, role, status').eq('is_active', true),
        supabase.from('tech_work_logs').select('*').gte('created_at', monthStart).lte('created_at', today + 'T23:59:59').order('created_at', { ascending: false }),
        supabase.from('content_work_logs').select('*').gte('created_at', monthStart).lte('created_at', today + 'T23:59:59').order('created_at', { ascending: false }),
        supabase.from('attendance_settings' as any).select('*').limit(1).single(),
        supabase.from('holidays').select('date').gte('date', monthStart).lte('date', today),
        supabase.from('attendance').select('*').gte('date', monthStart).lte('date', today),
      ]);

      setReviews(reviewsData || []);
      setAdmins(adminsData || []);
      setWorkLogs({ tech: techData || [], content: contentData || [] });
      setHolidays((holidaysData || []).map((h: any) => h.date));

      if (settingsData) {
        const s = settingsData as any;
        setMinDaysThreshold(s.min_days_threshold);
        setSuspensionDays(s.suspension_days);
        setSettingsId(s.id);
        setEditThreshold(s.min_days_threshold);
        setEditSuspensionDays(s.suspension_days);
      }

      // Compute live attendance stats per admin
      const holidaySet = new Set((holidaysData || []).map((h: any) => h.date));
      const currentDay = now.getDate();
      let workingDays = 0;
      for (let day = 1; day <= currentDay; day++) {
        const d = new Date(year, month - 1, day);
        const dayOfWeek = d.getDay();
        const dateStr = formatDateForDB(d);
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
          workingDays++;
        }
      }

      const liveStats = (adminsData || [])
        .filter((a: any) => a.role !== 'super_admin')
        .map((admin: any) => {
          const adminAttendance = (attendanceData || []).filter((a: any) => a.admin_id === admin.id);
          const present = adminAttendance.filter((a: any) => a.status === 'present').length;
          const late = adminAttendance.filter((a: any) => a.status === 'late').length;
          const absent = adminAttendance.filter((a: any) => a.status === 'absent').length;
          const score = present + (late * 0.5);
          const percentage = workingDays > 0 ? Math.min(100, Math.round((score / workingDays) * 100)) : 0;

          return {
            admin_id: admin.id,
            name: admin.name,
            role: admin.role,
            status: admin.status,
            present,
            late,
            absent,
            workingDays,
            score,
            percentage,
          };
        });

      setLiveAttendanceStats(liveStats);
    } catch (error) {
      console.error('Error fetching review data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset page when search changes
  useEffect(() => { setReviewPage(1); }, [reviewSearch]);
  useEffect(() => { setLiveStatsPage(1); }, [liveStatsSearch]);
  useEffect(() => { setWorkLogPage(1); }, [workLogSearch]);

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from('attendance_settings' as any)
          .update({ min_days_threshold: editThreshold, suspension_days: editSuspensionDays, updated_at: new Date().toISOString() } as any)
          .eq('id', settingsId);
        if (error) throw error;
      }
      setMinDaysThreshold(editThreshold);
      setSuspensionDays(editSuspensionDays);
      setShowSettingsDialog(false);
      toast.success(`Settings updated: ${editThreshold} day threshold, ${editSuspensionDays} day suspension`);
    } catch (error: any) {
      toast.error('Failed to save settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingSettings(false);
    }
  };

  const triggerManualReview = async () => {
    setTriggeringReview(true);
    try {
      const { data, error } = await supabase.functions.invoke('monthly-attendance-review', {
        body: { min_days_threshold: minDaysThreshold, suspension_days: suspensionDays, review_current_month: true }
      });
      if (error) throw error;
      toast.success('Monthly attendance review completed for current month');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to run review: ' + (error.message || 'Unknown error'));
    } finally {
      setTriggeringReview(false);
    }
  };

  const overrideSuspensionToActive = async (reviewId: string, adminId: string) => {
    try {
      const { error: adminError } = await supabase.from('admins').update({ status: 'active' }).eq('id', adminId);
      if (adminError) throw adminError;
      const { error: reviewError } = await supabase.from('monthly_attendance_reviews').update({ is_suspended: false, suspension_start: null, suspension_end: null }).eq('id', reviewId);
      if (reviewError) throw reviewError;
      toast.success('Suspension overridden — admin is now active');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to override: ' + (error.message || 'Unknown error'));
    }
  };

  const getAdminName = (id: string) => admins.find(a => a.id === id)?.name || 'Unknown';
  const getAdminRole = (id: string) => admins.find(a => a.id === id)?.role || '';

  if (loading) {
    return (
      <Card className="border-white/10">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  const suspendedReviews = reviews.filter(r => r.is_suspended);
  const now = new Date();
  const currentMonthLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

  // Filter live stats
  const filteredLiveStats = liveAttendanceStats.filter(s => {
    if (!liveStatsSearch) return true;
    const q = liveStatsSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const liveStatsTotalPages = Math.max(1, Math.ceil(filteredLiveStats.length / ITEMS_PER_PAGE));
  const paginatedLiveStats = filteredLiveStats.slice((liveStatsPage - 1) * ITEMS_PER_PAGE, liveStatsPage * ITEMS_PER_PAGE);

  // Filter reviews by search
  const filteredReviews = reviews.filter(r => {
    if (!reviewSearch) return true;
    const q = reviewSearch.toLowerCase();
    const name = getAdminName(r.admin_id).toLowerCase();
    const role = getAdminRole(r.admin_id).toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  const reviewTotalPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE);

  // All work logs combined
  const allWorkLogs = [
    ...workLogs.tech.map(l => ({ ...l, log_type: 'Tech' })),
    ...workLogs.content.map(l => ({ ...l, log_type: 'Content' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredWorkLogs = allWorkLogs.filter(log => {
    if (!workLogSearch) return true;
    const q = workLogSearch.toLowerCase();
    const name = getAdminName(log.admin_id).toLowerCase();
    return name.includes(q) || log.title?.toLowerCase().includes(q) || log.log_type.toLowerCase().includes(q) || log.status?.toLowerCase().includes(q);
  });

  const workLogTotalPages = Math.max(1, Math.ceil(filteredWorkLogs.length / ITEMS_PER_PAGE));
  const paginatedWorkLogs = filteredWorkLogs.slice((workLogPage - 1) * ITEMS_PER_PAGE, workLogPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Attendance Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Minimum Attendance Threshold (days)</Label>
              <Input type="number" value={editThreshold} onChange={(e) => setEditThreshold(Number(e.target.value))} min={1} max={31} className="bg-gray-800 border-gray-700 text-white mt-1" />
              <p className="text-xs text-gray-500 mt-1">Admins below this will be suspended</p>
            </div>
            <div>
              <Label className="text-gray-300">Suspension Duration (days)</Label>
              <Input type="number" value={editSuspensionDays} onChange={(e) => setEditSuspensionDays(Number(e.target.value))} min={1} max={90} className="bg-gray-800 border-gray-700 text-white mt-1" />
              <p className="text-xs text-gray-500 mt-1">How many days the suspension lasts</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="border-gray-600 text-gray-300">Cancel</Button>
            <Button onClick={saveSettings} disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700">
              {savingSettings ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Attendance Stats — Always shows real-time data */}
      <Collapsible open={liveStatsOpen} onOpenChange={setLiveStatsOpen}>
        <Card className="border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Live Attendance Stats — {currentMonthLabel}
                <Badge variant="outline" className="ml-2">{filteredLiveStats.length} admins</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {liveStatsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Working Days (excl. holidays)</p>
                  <p className="text-2xl font-bold text-white">{liveAttendanceStats[0]?.workingDays || 0}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Holidays This Month</p>
                  <p className="text-2xl font-bold text-orange-400">{holidays.length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 cursor-pointer hover:border-blue-500/30" onClick={() => setShowSettingsDialog(true)}>
                  <p className="text-xs text-gray-400">Threshold</p>
                  <p className="text-2xl font-bold text-white">{minDaysThreshold} days</p>
                  <p className="text-xs text-blue-400">Click to edit</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400">Avg Attendance %</p>
                  <p className="text-2xl font-bold text-green-400">
                    {liveAttendanceStats.length > 0 ? Math.round(liveAttendanceStats.reduce((s, a) => s + a.percentage, 0) / liveAttendanceStats.length) : 0}%
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin name or role..."
                  value={liveStatsSearch}
                  onChange={(e) => setLiveStatsSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Working Days</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLiveStats.map((stat) => (
                      <TableRow key={stat.admin_id}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-gray-400">{stat.role?.replace('_', ' ')}</TableCell>
                        <TableCell className="text-blue-400">{stat.present}</TableCell>
                        <TableCell className="text-gray-400">{stat.late}</TableCell>
                        <TableCell className="text-red-400">{stat.absent}</TableCell>
                        <TableCell>{stat.workingDays}</TableCell>
                        <TableCell className="font-medium">{stat.score.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge variant={stat.percentage >= 80 ? "default" : stat.percentage >= 50 ? "secondary" : "destructive"}>
                            {stat.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stat.status === 'active' ? "default" : "destructive"}>
                            {stat.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLiveStats.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {liveStatsPage} of {liveStatsTotalPages} ({filteredLiveStats.length} admins)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={liveStatsPage <= 1} onClick={() => setLiveStatsPage(p => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={liveStatsPage >= liveStatsTotalPages} onClick={() => setLiveStatsPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Attendance Reviews (from Run Review) */}
      <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
        <Card className="border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Formal Reviews — {currentMonthLabel}
                <Badge variant="outline" className="ml-2">{filteredReviews.length}</Badge>
                {suspendedReviews.length > 0 && <Badge variant="destructive" className="ml-1">{suspendedReviews.length} suspended</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {reviewsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap mb-4">
                <Button size="sm" variant="outline" onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="w-4 h-4 mr-1" /> Settings
                </Button>
                <Button size="sm" variant="outline" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button size="sm" onClick={triggerManualReview} disabled={triggeringReview}>
                  {triggeringReview ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  Run Review
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin name or role..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              {paginatedReviews.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Working Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Suspension</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="font-medium">{getAdminName(review.admin_id)}</TableCell>
                            <TableCell>{review.month}/{review.year}</TableCell>
                            <TableCell>{review.present_days}</TableCell>
                            <TableCell>{review.late_days}</TableCell>
                            <TableCell>{review.absent_days}</TableCell>
                            <TableCell>{review.total_working_days}</TableCell>
                            <TableCell>
                              <Badge variant={review.is_suspended ? "destructive" : "default"}>
                                {review.is_suspended ? 'Suspended' : 'OK'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-400">
                              {review.suspension_start && review.suspension_end
                                ? `${review.suspension_start} → ${review.suspension_end}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {review.is_suspended && (
                                <Button size="sm" variant="outline" className="text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => overrideSuspensionToActive(review.id, review.admin_id)}>
                                  <ShieldCheck className="w-3 h-3 mr-1" /> Activate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredReviews.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {reviewPage} of {reviewTotalPages} ({filteredReviews.length} items)</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">
                  {reviewSearch ? 'No matching reviews found.' : `No formal reviews for ${currentMonthLabel}. Click "Run Review" to generate.`}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recent Work Logs - Collapsible Card */}
      <Collapsible open={workLogsOpen} onOpenChange={setWorkLogsOpen}>
        <Card className="border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Recent Work Logs — {currentMonthLabel}
                  <Badge variant="outline" className="ml-2">{allWorkLogs.length}</Badge>
                </span>
                {workLogsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, type, status..."
                  value={workLogSearch}
                  onChange={(e) => setWorkLogSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>

              {paginatedWorkLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedWorkLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{getAdminName(log.admin_id)}</TableCell>
                            <TableCell><Badge variant="outline">{log.log_type}</Badge></TableCell>
                            <TableCell className="max-w-[200px] truncate">{log.title}</TableCell>
                            <TableCell><Badge variant="secondary">{log.status}</Badge></TableCell>
                            <TableCell className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredWorkLogs.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">Page {workLogPage} of {workLogTotalPages} ({filteredWorkLogs.length} items)</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={workLogPage <= 1} onClick={() => setWorkLogPage(p => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={workLogPage >= workLogTotalPages} onClick={() => setWorkLogPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No work logs this month.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SuperAdminReviewPanel;
