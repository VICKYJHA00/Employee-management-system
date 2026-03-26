
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, AlertTriangle, RefreshCw, Play, ShieldCheck, Settings, Save,
  ChevronDown, ChevronUp, Search, BarChart3, Download, Filter, Trash2,
  UserCheck, UserX, Eye, MessageSquare, Clock, TrendingUp, Calendar,
  CheckSquare, XSquare, Info, FileText, Moon, Sun, Award, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateForDB } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 25;
const AUTO_REFRESH_INTERVAL = 30_000; // 30s

const ROLE_LABELS: Record<string, string> = {
  tech: 'Tech',
  content: 'Content',
  design: 'Design',
  moderator: 'Moderator',
  super_admin: 'Super Admin',
};

const ATTENDANCE_COLORS = {
  present: '#22c55e',
  late: '#f59e0b',
  absent: '#ef4444',
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Admin {
  id: string;
  name: string;
  role: string;
  status: string;
  email?: string;
}

interface AttendanceRecord {
  admin_id: string;
  date: string;
  status: 'present' | 'late' | 'absent';
}

interface LiveStat {
  admin_id: string;
  name: string;
  role: string;
  status: string;
  present: number;
  late: number;
  absent: number;
  workingDays: number;
  score: number;
  percentage: number;
  streak: number;
  atRisk: boolean;
}

interface Review {
  id: string;
  admin_id: string;
  month: number;
  year: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  total_working_days: number;
  is_suspended: boolean;
  suspension_start: string | null;
  suspension_end: string | null;
  notes?: string;
}

interface WorkLog {
  id: string;
  admin_id: string;
  title: string;
  status: string;
  created_at: string;
  log_type: 'Tech' | 'Content';
  description?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  target_admin_id: string;
  details: string;
  created_at: string;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
function exportToCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatRole(role: string) {
  return ROLE_LABELS[role] ?? role.replace('_', ' ');
}

function computeCurrentStreak(records: AttendanceRecord[], adminId: string): number {
  const sorted = [...records]
    .filter(r => r.admin_id === adminId)
    .sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const rec of sorted) {
    if (rec.status === 'present' || rec.status === 'late') streak++;
    else break;
  }
  return streak;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact inline percentage bar */
const AttendanceBar: React.FC<{ present: number; late: number; absent: number; total: number }> = ({
  present, late, absent, total,
}) => {
  if (!total) return <span className="text-gray-500 text-xs">—</span>;
  const pPct = Math.round((present / total) * 100);
  const lPct = Math.round((late / total) * 100);
  const aPct = 100 - pPct - lPct;
  return (
    <div className="flex h-2 w-24 rounded overflow-hidden gap-px">
      <div style={{ width: `${pPct}%`, background: ATTENDANCE_COLORS.present }} title={`Present: ${present}`} />
      <div style={{ width: `${lPct}%`, background: ATTENDANCE_COLORS.late }} title={`Late: ${late}`} />
      <div style={{ width: `${Math.max(0, aPct)}%`, background: ATTENDANCE_COLORS.absent }} title={`Absent: ${absent}`} />
    </div>
  );
};

/** Pagination controls */
const Pagination: React.FC<{
  page: number; total: number; count: number; label: string;
  onPrev: () => void; onNext: () => void;
}> = ({ page, total, count, label, onPrev, onNext }) => (
  <div className="flex items-center justify-between mt-4">
    <p className="text-sm text-muted-foreground">
      Page {page} of {total} ({count} {label})
    </p>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={onPrev}>Previous</Button>
      <Button size="sm" variant="outline" disabled={page >= total} onClick={onNext}>Next</Button>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const SuperAdminReviewPanel: React.FC = () => {
  // ── Core data ──
  const [reviews, setReviews] = useState<Review[]>([]);
  const [workLogs, setWorkLogs] = useState<{ tech: WorkLog[]; content: WorkLog[] }>({ tech: [], content: [] });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // ── Settings ──
  const [minDaysThreshold, setMinDaysThreshold] = useState(20);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editThreshold, setEditThreshold] = useState(20);
  const [editSuspensionDays, setEditSuspensionDays] = useState(7);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Actions ──
  const [triggeringReview, setTriggeringReview] = useState(false);

  // ── Live attendance ──
  const [liveAttendanceStats, setLiveAttendanceStats] = useState<LiveStat[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [rawAttendance, setRawAttendance] = useState<AttendanceRecord[]>([]);

  // ── Collapsible panels ──
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [liveStatsOpen, setLiveStatsOpen] = useState(false);
  const [workLogsOpen, setWorkLogsOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // ── Search / filter ──
  const [reviewSearch, setReviewSearch] = useState('');
  const [liveStatsSearch, setLiveStatsSearch] = useState('');
  const [workLogSearch, setWorkLogSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'suspended' | 'ok'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [workLogTypeFilter, setWorkLogTypeFilter] = useState<'all' | 'Tech' | 'Content'>('all');
  const [workLogStatusFilter, setWorkLogStatusFilter] = useState<string>('all');
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  // ── Pagination ──
  const [reviewPage, setReviewPage] = useState(1);
  const [liveStatsPage, setLiveStatsPage] = useState(1);
  const [workLogPage, setWorkLogPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // ── Bulk selection ──
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [bulkActivating, setBulkActivating] = useState(false);

  // ── Note dialog ──
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; reviewId: string; adminName: string; current: string }>({
    open: false, reviewId: '', adminName: '', current: '',
  });
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // ── Detail dialog ──
  const [detailAdmin, setDetailAdmin] = useState<LiveStat | null>(null);

  // ── Dark/light UI toggle (local only) ──
  const [darkMode] = useState(true); // stays dark by default for admin panel

  // ── Refs ──
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
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
        supabase.from('admins').select('id, name, role, status, email').eq('is_active', true),
        supabase.from('tech_work_logs').select('*').gte('created_at', monthStart).lte('created_at', today + 'T23:59:59').order('created_at', { ascending: false }),
        supabase.from('content_work_logs').select('*').gte('created_at', monthStart).lte('created_at', today + 'T23:59:59').order('created_at', { ascending: false }),
        supabase.from('attendance_settings' as any).select('*').limit(1).single(),
        supabase.from('holidays').select('date').gte('date', monthStart).lte('date', today),
        supabase.from('attendance').select('*').gte('date', monthStart).lte('date', today),
      ]);

      const safeAdmins: Admin[] = adminsData || [];
      const safeAttendance: AttendanceRecord[] = attendanceData || [];

      setReviews(reviewsData || []);
      setAdmins(safeAdmins);
      setWorkLogs({
        tech: (techData || []).map((l: any) => ({ ...l, log_type: 'Tech' as const })),
        content: (contentData || []).map((l: any) => ({ ...l, log_type: 'Content' as const })),
      });
      setRawAttendance(safeAttendance);
      setHolidays((holidaysData || []).map((h: any) => h.date));

      if (settingsData) {
        const s = settingsData as any;
        setMinDaysThreshold(s.min_days_threshold);
        setSuspensionDays(s.suspension_days);
        setSettingsId(s.id);
        setEditThreshold(s.min_days_threshold);
        setEditSuspensionDays(s.suspension_days);
      }

      // Compute working days
      const holidaySet = new Set((holidaysData || []).map((h: any) => h.date));
      const currentDay = now.getDate();
      let workingDays = 0;
      for (let day = 1; day <= currentDay; day++) {
        const d = new Date(year, month - 1, day);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6 && !holidaySet.has(formatDateForDB(d))) workingDays++;
      }

      // Build live stats with streaks and at-risk flag
      const liveStats: LiveStat[] = safeAdmins
        .filter((a) => a.role !== 'super_admin')
        .map((admin) => {
          const adminAtt = safeAttendance.filter((a) => a.admin_id === admin.id);
          const present = adminAtt.filter((a) => a.status === 'present').length;
          const late = adminAtt.filter((a) => a.status === 'late').length;
          const absent = adminAtt.filter((a) => a.status === 'absent').length;
          const score = present + late * 0.5;
          const percentage = workingDays > 0 ? Math.min(100, Math.round((score / workingDays) * 100)) : 0;
          const streak = computeCurrentStreak(safeAttendance, admin.id);
          const atRisk = score < minDaysThreshold && workingDays > 0;
          return { admin_id: admin.id, name: admin.name, role: admin.role, status: admin.status, present, late, absent, workingDays, score, percentage, streak, atRisk };
        });

      setLiveAttendanceStats(liveStats);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching review data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [minDaysThreshold]);

  // Reset pages on search changes
  useEffect(() => { setReviewPage(1); }, [reviewSearch, reviewStatusFilter, roleFilter]);
  useEffect(() => { setLiveStatsPage(1); }, [liveStatsSearch, roleFilter, atRiskOnly]);
  useEffect(() => { setWorkLogPage(1); }, [workLogSearch, workLogTypeFilter, workLogStatusFilter]);
  useEffect(() => { setAuditPage(1); }, [auditSearch]);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Realtime subscription for attendance changes
  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_attendance_reviews' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ─── Actions ────────────────────────────────────────────────────────────────
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
      toast.success(`Settings updated — threshold: ${editThreshold} days, suspension: ${editSuspensionDays} days`);
      addLocalAuditEntry('Settings Updated', `Threshold → ${editThreshold} days, Suspension → ${editSuspensionDays} days`);
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
        body: { min_days_threshold: minDaysThreshold, suspension_days: suspensionDays, review_current_month: true },
      });
      if (error) throw error;
      toast.success('Monthly attendance review completed');
      addLocalAuditEntry('Manual Review Triggered', `Threshold: ${minDaysThreshold} days`);
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
      const { error: reviewError } = await supabase
        .from('monthly_attendance_reviews')
        .update({ is_suspended: false, suspension_start: null, suspension_end: null })
        .eq('id', reviewId);
      if (reviewError) throw reviewError;
      toast.success('Suspension overridden — admin is now active');
      addLocalAuditEntry('Suspension Overridden', `Admin: ${getAdminName(adminId)}`);
      setSelectedReviewIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to override: ' + (error.message || 'Unknown error'));
    }
  };

  const bulkActivate = async () => {
    if (!selectedReviewIds.size) return;
    setBulkActivating(true);
    let success = 0;
    for (const reviewId of selectedReviewIds) {
      const review = reviews.find(r => r.id === reviewId);
      if (!review || !review.is_suspended) continue;
      try {
        await overrideSuspensionToActive(reviewId, review.admin_id);
        success++;
      } catch { /* individual errors already toasted */ }
    }
    setBulkActivating(false);
    setSelectedReviewIds(new Set());
    if (success) toast.success(`Bulk activated ${success} admin(s)`);
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('monthly_attendance_reviews')
        .update({ notes: noteText } as any)
        .eq('id', noteDialog.reviewId);
      if (error) throw error;
      setReviews(prev => prev.map(r => r.id === noteDialog.reviewId ? { ...r, notes: noteText } : r));
      toast.success('Note saved');
      addLocalAuditEntry('Note Added', `Review for ${noteDialog.adminName}`);
      setNoteDialog(prev => ({ ...prev, open: false }));
    } catch (error: any) {
      toast.error('Failed to save note: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingNote(false);
    }
  };

  /** Push a local-only audit entry (would ideally write to Supabase) */
  const addLocalAuditEntry = (action: string, details: string) => {
    setAuditLog(prev => [
      {
        id: crypto.randomUUID(),
        action,
        performed_by: 'Super Admin',
        target_admin_id: '',
        details,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // ─── Lookups ────────────────────────────────────────────────────────────────
  const getAdminName = (id: string) => admins.find(a => a.id === id)?.name || 'Unknown';
  const getAdminRole = (id: string) => admins.find(a => a.id === id)?.role || '';

  // ─── Derived / memoised ──────────────────────────────────────────────────────
  const now = new Date();
  const currentMonthLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
  const suspendedReviews = reviews.filter(r => r.is_suspended);
  const atRiskAdmins = liveAttendanceStats.filter(s => s.atRisk);

  const allWorkLogs: WorkLog[] = useMemo(() =>
    [
      ...workLogs.tech,
      ...workLogs.content,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [workLogs]
  );

  const uniqueWorkLogStatuses = useMemo(() =>
    Array.from(new Set(allWorkLogs.map(l => l.status).filter(Boolean))),
    [allWorkLogs]
  );

  const uniqueRoles = useMemo(() =>
    Array.from(new Set(admins.map(a => a.role).filter(r => r !== 'super_admin'))),
    [admins]
  );

  // Filtered / paginated: Live Stats
  const filteredLiveStats = useMemo(() => liveAttendanceStats.filter(s => {
    if (atRiskOnly && !s.atRisk) return false;
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (!liveStatsSearch) return true;
    const q = liveStatsSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  }), [liveAttendanceStats, liveStatsSearch, roleFilter, atRiskOnly]);

  const liveStatsTotalPages = Math.max(1, Math.ceil(filteredLiveStats.length / ITEMS_PER_PAGE));
  const paginatedLiveStats = filteredLiveStats.slice((liveStatsPage - 1) * ITEMS_PER_PAGE, liveStatsPage * ITEMS_PER_PAGE);

  // Filtered / paginated: Reviews
  const filteredReviews = useMemo(() => reviews.filter(r => {
    if (reviewStatusFilter === 'suspended' && !r.is_suspended) return false;
    if (reviewStatusFilter === 'ok' && r.is_suspended) return false;
    if (roleFilter !== 'all' && getAdminRole(r.admin_id) !== roleFilter) return false;
    if (!reviewSearch) return true;
    const q = reviewSearch.toLowerCase();
    return getAdminName(r.admin_id).toLowerCase().includes(q) || getAdminRole(r.admin_id).toLowerCase().includes(q);
  }), [reviews, reviewSearch, reviewStatusFilter, roleFilter, admins]);

  const reviewTotalPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE);

  // Filtered / paginated: Work Logs
  const filteredWorkLogs = useMemo(() => allWorkLogs.filter(log => {
    if (workLogTypeFilter !== 'all' && log.log_type !== workLogTypeFilter) return false;
    if (workLogStatusFilter !== 'all' && log.status !== workLogStatusFilter) return false;
    if (!workLogSearch) return true;
    const q = workLogSearch.toLowerCase();
    return (
      getAdminName(log.admin_id).toLowerCase().includes(q) ||
      (log.title || '').toLowerCase().includes(q) ||
      log.log_type.toLowerCase().includes(q) ||
      (log.status || '').toLowerCase().includes(q)
    );
  }), [allWorkLogs, workLogSearch, workLogTypeFilter, workLogStatusFilter, admins]);

  const workLogTotalPages = Math.max(1, Math.ceil(filteredWorkLogs.length / ITEMS_PER_PAGE));
  const paginatedWorkLogs = filteredWorkLogs.slice((workLogPage - 1) * ITEMS_PER_PAGE, workLogPage * ITEMS_PER_PAGE);

  // Filtered / paginated: Audit Log
  const filteredAuditLog = useMemo(() => auditLog.filter(e => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return e.action.toLowerCase().includes(q) || e.details.toLowerCase().includes(q);
  }), [auditLog, auditSearch]);

  const auditTotalPages = Math.max(1, Math.ceil(filteredAuditLog.length / ITEMS_PER_PAGE));
  const paginatedAuditLog = filteredAuditLog.slice((auditPage - 1) * ITEMS_PER_PAGE, auditPage * ITEMS_PER_PAGE);

  // Analytics chart data
  const attendanceChartData = useMemo(() => liveAttendanceStats.map(s => ({
    name: s.name.split(' ')[0],
    Present: s.present,
    Late: s.late,
    Absent: s.absent,
    Score: parseFloat(s.score.toFixed(1)),
  })), [liveAttendanceStats]);

  const pieData = useMemo(() => {
    const totals = liveAttendanceStats.reduce((acc, s) => {
      acc.present += s.present;
      acc.late += s.late;
      acc.absent += s.absent;
      return acc;
    }, { present: 0, late: 0, absent: 0 });
    return [
      { name: 'Present', value: totals.present },
      { name: 'Late', value: totals.late },
      { name: 'Absent', value: totals.absent },
    ];
  }, [liveAttendanceStats]);

  const percentageDistribution = useMemo(() => {
    const buckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
    liveAttendanceStats.forEach(s => {
      if (s.percentage <= 25) buckets['0-25']++;
      else if (s.percentage <= 50) buckets['26-50']++;
      else if (s.percentage <= 75) buckets['51-75']++;
      else buckets['76-100']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [liveAttendanceStats]);

  // Export helpers
  const exportLiveStats = () => exportToCSV(filteredLiveStats.map(s => ({
    Name: s.name, Role: formatRole(s.role), Present: s.present, Late: s.late,
    Absent: s.absent, WorkingDays: s.workingDays, Score: s.score, Percentage: s.percentage + '%', Status: s.status,
  })), `live-stats-${currentMonthLabel.replace(' ', '-')}.csv`);

  const exportReviews = () => exportToCSV(filteredReviews.map(r => ({
    Admin: getAdminName(r.admin_id), Role: formatRole(getAdminRole(r.admin_id)),
    Month: r.month, Year: r.year, Present: r.present_days, Late: r.late_days,
    Absent: r.absent_days, WorkingDays: r.total_working_days,
    Suspended: r.is_suspended ? 'Yes' : 'No',
    SuspensionStart: r.suspension_start || '', SuspensionEnd: r.suspension_end || '',
    Notes: r.notes || '',
  })), `reviews-${currentMonthLabel.replace(' ', '-')}.csv`);

  const exportWorkLogs = () => exportToCSV(filteredWorkLogs.map(l => ({
    Admin: getAdminName(l.admin_id), Type: l.log_type, Title: l.title,
    Status: l.status, Date: new Date(l.created_at).toLocaleDateString(),
  })), `work-logs-${currentMonthLabel.replace(' ', '-')}.csv`);

  // Loading state
  if (loading && !liveAttendanceStats.length) {
    return (
      <Card className="border-white/10">
        <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400 text-sm">Loading attendance data…</p>
        </CardContent>
      </Card>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="space-y-6">

        {/* ── Global Header Bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Super Admin Review Panel</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {lastRefreshed ? `Last refreshed ${lastRefreshed.toLocaleTimeString()}` : 'Loading…'}
              {loading && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {atRiskAdmins.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {atRiskAdmins.length} At Risk
              </Badge>
            )}
            {suspendedReviews.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <UserX className="w-3 h-3" />
                {suspendedReviews.length} Suspended
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={triggerManualReview} disabled={triggeringReview}>
              {triggeringReview ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Run Review
            </Button>
          </div>
        </div>

        {/* ── Quick KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: 'Total Admins', value: liveAttendanceStats.length,
              color: 'text-white', icon: <UserCheck className="w-4 h-4 text-blue-400" />,
            },
            {
              label: 'At Risk', value: atRiskAdmins.length,
              color: 'text-red-400', icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
            },
            {
              label: 'Suspended', value: suspendedReviews.length,
              color: 'text-orange-400', icon: <UserX className="w-4 h-4 text-orange-400" />,
            },
            {
              label: 'Avg Score', value: liveAttendanceStats.length
                ? (liveAttendanceStats.reduce((s, a) => s + a.score, 0) / liveAttendanceStats.length).toFixed(1)
                : '—',
              color: 'text-green-400', icon: <Award className="w-4 h-4 text-green-400" />,
            },
            {
              label: 'Work Logs', value: allWorkLogs.length,
              color: 'text-purple-400', icon: <FileText className="w-4 h-4 text-purple-400" />,
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{kpi.label}</span>
                {kpi.icon}
              </div>
              <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* ── Shared Role Filter (affects Live Stats + Reviews together) ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Filter by role:</span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-40 bg-white/5 border-white/10 text-sm">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(r => (
                <SelectItem key={r} value={r}>{formatRole(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PANEL 1 — Live Attendance Stats
        ════════════════════════════════════════════════════════════ */}
        <Collapsible open={liveStatsOpen} onOpenChange={setLiveStatsOpen}>
          <Card className="border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Live Attendance Stats — {currentMonthLabel}
                  <Badge variant="outline" className="ml-2">{filteredLiveStats.length} admins</Badge>
                  {atRiskAdmins.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{atRiskAdmins.length} at risk</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); exportLiveStats(); }}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                  {liveStatsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-gray-400">Working Days</p>
                    <p className="text-2xl font-bold text-white">{liveAttendanceStats[0]?.workingDays || 0}</p>
                    <p className="text-xs text-gray-500">excl. weekends & holidays</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-gray-400">Holidays This Month</p>
                    <p className="text-2xl font-bold text-orange-400">{holidays.length}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 cursor-pointer hover:border-blue-500/30" onClick={() => setShowSettingsDialog(true)}>
                    <p className="text-xs text-gray-400">Suspension Threshold</p>
                    <p className="text-2xl font-bold text-white">{minDaysThreshold} days</p>
                    <p className="text-xs text-blue-400">Click to edit</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-gray-400">Avg Attendance %</p>
                    <p className="text-2xl font-bold text-green-400">
                      {liveAttendanceStats.length > 0
                        ? Math.round(liveAttendanceStats.reduce((s, a) => s + a.percentage, 0) / liveAttendanceStats.length)
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Filters row */}
                <div className="flex gap-3 mb-4 flex-wrap items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search admin or role…"
                      value={liveStatsSearch}
                      onChange={e => setLiveStatsSearch(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                    <Checkbox checked={atRiskOnly} onCheckedChange={v => setAtRiskOnly(!!v)} />
                    At-risk only
                  </label>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Breakdown</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Absent</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Streak</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLiveStats.map(stat => (
                        <TableRow key={stat.admin_id} className={stat.atRisk ? 'bg-red-950/20' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              {stat.atRisk && (
                                <Tooltip>
                                  <TooltipTrigger><AlertTriangle className="w-3 h-3 text-red-400" /></TooltipTrigger>
                                  <TooltipContent>Below threshold — at risk of suspension</TooltipContent>
                                </Tooltip>
                              )}
                              {stat.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">{formatRole(stat.role)}</TableCell>
                          <TableCell>
                            <AttendanceBar
                              present={stat.present} late={stat.late}
                              absent={stat.absent} total={stat.workingDays}
                            />
                          </TableCell>
                          <TableCell className="text-green-400">{stat.present}</TableCell>
                          <TableCell className="text-yellow-400">{stat.late}</TableCell>
                          <TableCell className="text-red-400">{stat.absent}</TableCell>
                          <TableCell>{stat.workingDays}</TableCell>
                          <TableCell className="font-medium">{stat.score.toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <Progress value={stat.percentage} className="h-1.5 w-14" />
                              <Badge variant={stat.percentage >= 80 ? 'default' : stat.percentage >= 50 ? 'secondary' : 'destructive'}>
                                {stat.percentage}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="flex items-center gap-1 text-sm">
                                  <TrendingUp className="w-3 h-3 text-blue-400" />
                                  {stat.streak}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{stat.streak} day consecutive streak</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stat.status === 'active' ? 'default' : 'destructive'}>
                              {stat.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setDetailAdmin(stat)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!paginatedLiveStats.length && (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center text-gray-500 py-6">
                            No results match your filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filteredLiveStats.length > ITEMS_PER_PAGE && (
                  <Pagination
                    page={liveStatsPage} total={liveStatsTotalPages}
                    count={filteredLiveStats.length} label="admins"
                    onPrev={() => setLiveStatsPage(p => p - 1)}
                    onNext={() => setLiveStatsPage(p => p + 1)}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ════════════════════════════════════════════════════════════
            PANEL 2 — Analytics
        ════════════════════════════════════════════════════════════ */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Card className="border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Analytics — {currentMonthLabel}
                </CardTitle>
                {analyticsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <Tabs defaultValue="bar">
                  <TabsList className="bg-white/5 mb-4">
                    <TabsTrigger value="bar">Attendance Breakdown</TabsTrigger>
                    <TabsTrigger value="pie">Distribution</TabsTrigger>
                    <TabsTrigger value="score">Score Comparison</TabsTrigger>
                    <TabsTrigger value="bucket">% Buckets</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bar">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                        <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="Present" fill={ATTENDANCE_COLORS.present} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Late" fill={ATTENDANCE_COLORS.late} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Absent" fill={ATTENDANCE_COLORS.absent} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="pie">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="score">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                        <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="Score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="bucket">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={percentageDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="range" stroke="#888" tick={{ fontSize: 11 }} label={{ value: 'Attendance %', position: 'insideBottom', offset: -2, fill: '#888', fontSize: 11 }} />
                        <YAxis stroke="#888" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-500 mt-2 text-center">Number of admins per attendance percentage bucket</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ════════════════════════════════════════════════════════════
            PANEL 3 — Formal Reviews
        ════════════════════════════════════════════════════════════ */}
        <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
          <Card className="border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer hover:bg-white/5 transition-colors">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Formal Reviews — {currentMonthLabel}
                  <Badge variant="outline" className="ml-2">{filteredReviews.length}</Badge>
                  {suspendedReviews.length > 0 && (
                    <Badge variant="destructive" className="ml-1">{suspendedReviews.length} suspended</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); exportReviews(); }}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                  {reviewsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-3 mb-4 flex-wrap items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search admin or role…"
                      value={reviewSearch}
                      onChange={e => setReviewSearch(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <Select value={reviewStatusFilter} onValueChange={v => setReviewStatusFilter(v as any)}>
                    <SelectTrigger className="h-9 w-36 bg-white/5 border-white/10 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="ok">OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk action bar */}
                {selectedReviewIds.size > 0 && (
                  <div className="flex items-center gap-3 mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <span className="text-sm text-blue-300">{selectedReviewIds.size} selected</span>
                    <Button size="sm" variant="outline" className="text-green-400 border-green-500/30" onClick={bulkActivate} disabled={bulkActivating}>
                      {bulkActivating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <UserCheck className="w-3 h-3 mr-1" />}
                      Bulk Activate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedReviewIds(new Set())}>
                      Clear
                    </Button>
                  </div>
                )}

                {paginatedReviews.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={
                                  paginatedReviews.filter(r => r.is_suspended).length > 0 &&
                                  paginatedReviews.filter(r => r.is_suspended).every(r => selectedReviewIds.has(r.id))
                                }
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setSelectedReviewIds(prev => {
                                      const n = new Set(prev);
                                      paginatedReviews.filter(r => r.is_suspended).forEach(r => n.add(r.id));
                                      return n;
                                    });
                                  } else {
                                    setSelectedReviewIds(prev => {
                                      const n = new Set(prev);
                                      paginatedReviews.forEach(r => n.delete(r.id));
                                      return n;
                                    });
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Present</TableHead>
                            <TableHead>Late</TableHead>
                            <TableHead>Absent</TableHead>
                            <TableHead>Working Days</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Suspension Period</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedReviews.map(review => (
                            <TableRow key={review.id} className={review.is_suspended ? 'bg-red-950/20' : ''}>
                              <TableCell>
                                {review.is_suspended && (
                                  <Checkbox
                                    checked={selectedReviewIds.has(review.id)}
                                    onCheckedChange={checked => {
                                      setSelectedReviewIds(prev => {
                                        const n = new Set(prev);
                                        checked ? n.add(review.id) : n.delete(review.id);
                                        return n;
                                      });
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{getAdminName(review.admin_id)}</TableCell>
                              <TableCell className="text-gray-400">{formatRole(getAdminRole(review.admin_id))}</TableCell>
                              <TableCell>{review.month}/{review.year}</TableCell>
                              <TableCell className="text-green-400">{review.present_days}</TableCell>
                              <TableCell className="text-yellow-400">{review.late_days}</TableCell>
                              <TableCell className="text-red-400">{review.absent_days}</TableCell>
                              <TableCell>{review.total_working_days}</TableCell>
                              <TableCell>
                                <Badge variant={review.is_suspended ? 'destructive' : 'default'}>
                                  {review.is_suspended ? 'Suspended' : 'OK'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-400">
                                {review.suspension_start && review.suspension_end
                                  ? `${review.suspension_start} → ${review.suspension_end}`
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      size="sm" variant="ghost"
                                      onClick={() => {
                                        setNoteDialog({ open: true, reviewId: review.id, adminName: getAdminName(review.admin_id), current: review.notes || '' });
                                        setNoteText(review.notes || '');
                                      }}
                                    >
                                      <MessageSquare className={`w-3 h-3 ${review.notes ? 'text-blue-400' : 'text-gray-500'}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{review.notes ? review.notes.slice(0, 60) : 'Add note'}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                {review.is_suspended && (
                                  <Button
                                    size="sm" variant="outline"
                                    className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                    onClick={() => overrideSuspensionToActive(review.id, review.admin_id)}
                                  >
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
                      <Pagination
                        page={reviewPage} total={reviewTotalPages}
                        count={filteredReviews.length} label="reviews"
                        onPrev={() => setReviewPage(p => p - 1)}
                        onNext={() => setReviewPage(p => p + 1)}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-6">
                    {reviewSearch || reviewStatusFilter !== 'all'
                      ? 'No matching reviews found.'
                      : `No formal reviews for ${currentMonthLabel}. Click "Run Review" to generate.`}
                  </p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ════════════════════════════════════════════════════════════
            PANEL 4 — Work Logs
        ════════════════════════════════════════════════════════════ */}
        <Collapsible open={workLogsOpen} onOpenChange={setWorkLogsOpen}>
          <Card className="border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Recent Work Logs — {currentMonthLabel}
                    <Badge variant="outline" className="ml-2">{allWorkLogs.length}</Badge>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); exportWorkLogs(); }}>
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                    {workLogsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-3 mb-4 flex-wrap items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, title, type, status…"
                      value={workLogSearch}
                      onChange={e => setWorkLogSearch(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <Select value={workLogTypeFilter} onValueChange={v => setWorkLogTypeFilter(v as any)}>
                    <SelectTrigger className="h-9 w-32 bg-white/5 border-white/10 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Tech">Tech</SelectItem>
                      <SelectItem value="Content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                  {uniqueWorkLogStatuses.length > 0 && (
                    <Select value={workLogStatusFilter} onValueChange={setWorkLogStatusFilter}>
                      <SelectTrigger className="h-9 w-36 bg-white/5 border-white/10 text-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueWorkLogStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
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
                          {paginatedWorkLogs.map(log => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">{getAdminName(log.admin_id)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={log.log_type === 'Tech' ? 'border-blue-500/40 text-blue-300' : 'border-purple-500/40 text-purple-300'}>
                                  {log.log_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[240px] truncate">{log.title}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{log.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(log.created_at).toLocaleDateString()}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {filteredWorkLogs.length > ITEMS_PER_PAGE && (
                      <Pagination
                        page={workLogPage} total={workLogTotalPages}
                        count={filteredWorkLogs.length} label="logs"
                        onPrev={() => setWorkLogPage(p => p - 1)}
                        onNext={() => setWorkLogPage(p => p + 1)}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-6">No work logs found.</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ════════════════════════════════════════════════════════════
            PANEL 5 — Audit Log
        ════════════════════════════════════════════════════════════ */}
        <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
          <Card className="border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-gray-400" />
                    Session Audit Log
                    <Badge variant="outline" className="ml-2">{auditLog.length}</Badge>
                  </span>
                  {auditOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter audit entries…"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10"
                  />
                </div>
                {paginatedAuditLog.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {paginatedAuditLog.map(entry => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                          <Clock className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-white">{entry.action}</span>
                              <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredAuditLog.length > ITEMS_PER_PAGE && (
                      <Pagination
                        page={auditPage} total={auditTotalPages}
                        count={filteredAuditLog.length} label="entries"
                        onPrev={() => setAuditPage(p => p - 1)}
                        onNext={() => setAuditPage(p => p + 1)}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-6">No actions performed this session.</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ════════════════════════════════════════════════════════════
            DIALOGS
        ════════════════════════════════════════════════════════════ */}

        {/* Settings Dialog */}








        
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Attendance Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <Label className="text-gray-300">Minimum Attendance Threshold (days)</Label>
                <Input
                  type="number" value={editThreshold}
                  onChange={e => setEditThreshold(Number(e.target.value))}
                  min={1} max={31}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Admins scoring below this will be flagged and suspended after review</p>
              </div>
              <div>
                <Label className="text-gray-300">Suspension Duration (days)</Label>
                <Input
                  type="number" value={editSuspensionDays}
                  onChange={e => setEditSuspensionDays(Number(e.target.value))}
                  min={1} max={90}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Duration of suspension when triggered by a review</p>
              </div>










              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Changes apply to the <strong>next run</strong> of the review function. Existing suspensions are unaffected.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)} className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button onClick={saveSettings} disabled={savingSettings} className="bg-blue-600 hover:bg-blue-700">
                {savingSettings ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Note Dialog */}
        <Dialog open={noteDialog.open} onOpenChange={open => setNoteDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Note — {noteDialog.adminName}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this review…"
              className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialog(prev => ({ ...prev, open: false }))} className="border-gray-600 text-gray-300">
                Cancel
              </Button>
              <Button onClick={saveNote} disabled={savingNote} className="bg-blue-600 hover:bg-blue-700">
                {savingNote ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin Detail Dialog */}
        <Dialog open={!!detailAdmin} onOpenChange={open => { if (!open) setDetailAdmin(null); }}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
            {detailAdmin && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    {detailAdmin.name}
                    <Badge variant="outline" className="ml-1 text-xs">{formatRole(detailAdmin.role)}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Present', value: detailAdmin.present, color: 'text-green-400' },
                      { label: 'Late', value: detailAdmin.late, color: 'text-yellow-400' },
                      { label: 'Absent', value: detailAdmin.absent, color: 'text-red-400' },
                      { label: 'Working Days', value: detailAdmin.workingDays, color: 'text-white' },
                      { label: 'Score', value: detailAdmin.score.toFixed(1), color: 'text-blue-400' },
                      { label: 'Streak', value: `${detailAdmin.streak} days`, color: 'text-purple-400' },
                    ].map(item => (
                      <div key={item.label} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                      </div>















                      
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Attendance ({detailAdmin.percentage}%)</p>
                    <Progress value={detailAdmin.percentage} className="h-3" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Account status</span>
                    <Badge variant={detailAdmin.status === 'active' ? 'default' : 'destructive'}>
                      {detailAdmin.status}
                    </Badge>
                  </div>
                  {detailAdmin.atRisk && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      This admin is below the suspension threshold and at risk of being suspended in the next review.
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailAdmin(null)} className="border-gray-600 text-gray-300">Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default SuperAdminReviewPanel;
