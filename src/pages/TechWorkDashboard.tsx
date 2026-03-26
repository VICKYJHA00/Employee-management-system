
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Plus, Edit, Trash2, Code, Bug, Globe, Wrench, Loader2,
  Search, Filter, Download, X, ChevronDown, ChevronUp, Target,
  TrendingUp, Clock, BarChart3,
} from 'lucide-react';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { useAutoAttendance } from '@/hooks/useAutoAttendance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechWorkLog {
  id: string;
  admin_id: string;
  work_type: string;
  title: string;
  description: string | null;
  url: string | null;
  hours_spent: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  work_type: string;
  title: string;
  description: string;
  url: string;
  hours_spent: number;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  work_type: '', title: '', description: '', url: '', hours_spent: 0, status: 'completed',
};

const DEFAULT_WEEKLY_GOAL = 40; // hours per week

const WORK_TYPES = [
  { value: 'page_created',  label: 'Page Created',   icon: Globe,   color: '#22c55e' },
  { value: 'page_fixed',    label: 'Page Fixed',     icon: Wrench,  color: '#3b82f6' },
  { value: 'bug_fixed',     label: 'Bug Fixed',      icon: Bug,     color: '#ef4444' },
  { value: 'feature_added', label: 'Feature Added',  icon: Code,    color: '#a855f7' },
  { value: 'other',         label: 'Other',          icon: Code,    color: '#f59e0b' },
];

const STATUS_OPTIONS = [
  { value: 'completed',       label: 'Completed',       variant: 'default'    as const },
  { value: 'in_progress',     label: 'In Progress',     variant: 'secondary'  as const },
  { value: 'pending_review',  label: 'Pending Review',  variant: 'outline'    as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportToCSV(logs: TechWorkLog[], filename: string) {
  const headers = ['Title', 'Work Type', 'Hours', 'Status', 'URL', 'Description', 'Date'];
  const rows = logs.map(l => [
    `"${l.title}"`,
    WORK_TYPES.find(w => w.value === l.work_type)?.label ?? l.work_type,
    l.hours_spent,
    l.status.replace(/_/g, ' '),
    l.url ?? '',
    `"${(l.description ?? '').replace(/"/g, "'")}"`,
    new Date(l.created_at).toLocaleDateString('en-IN'),
  ].join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function getWorkTypeMeta(type: string) {
  return WORK_TYPES.find(w => w.value === type) ?? WORK_TYPES[WORK_TYPES.length - 1];
}

/** ISO week label "Week N" from a date string */
function isoWeekLabel(dateStr: string): string {
  const d   = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `W${week}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const WorkTypeIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
  const meta = getWorkTypeMeta(type);
  const Icon = meta.icon;
  return <Icon className={className} style={{ color: meta.color }} />;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  return (
    <Badge variant={opt?.variant ?? 'outline'}>
      {(opt?.label ?? status).replace(/_/g, ' ')}
    </Badge>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TechWorkDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { toast }        = useToast();
  const { logActivity }  = useActivityLogger();
  const { markAttendanceAsPresent } = useAutoAttendance();

  // ── Data ──
  const [workLogs, setWorkLogs]     = useState<TechWorkLog[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form ──
  const [showForm, setShowForm]     = useState(false);
  const [editingLog, setEditingLog] = useState<TechWorkLog | null>(null);
  const [formData, setFormData]     = useState<FormData>(EMPTY_FORM);

  // ── Delete dialog ──
  const [deleteTarget, setDeleteTarget] = useState<TechWorkLog | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // ── Filters ──
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [filtersOpen, setFiltersOpen]   = useState(false);

  // ── Analytics panel ──
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // ── Goal ──
  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_WEEKLY_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput]   = useState(String(DEFAULT_WEEKLY_GOAL));

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchWorkLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tech_work_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWorkLogs(data || []);
    } catch (err) {
      console.error('Error fetching work logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkLogs();
    const interval = setInterval(fetchWorkLogs, 30_000);
    return () => clearInterval(interval);
  }, [fetchWorkLogs]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingLog) {
      setFormData({
        work_type:   editingLog.work_type,
        title:       editingLog.title,
        description: editingLog.description || '',
        url:         editingLog.url || '',
        hours_spent: editingLog.hours_spent,
        status:      editingLog.status,
      });
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingLog]);

  // ─── Stats (memoised) ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total       = workLogs.length;
    const pagesCreated  = workLogs.filter(l => l.work_type === 'page_created').length;
    const pagesFixed    = workLogs.filter(l => l.work_type === 'page_fixed').length;
    const bugsFixed     = workLogs.filter(l => l.work_type === 'bug_fixed').length;
    const featuresAdded = workLogs.filter(l => l.work_type === 'feature_added').length;
    const totalHours    = workLogs.reduce((s, l) => s + (l.hours_spent || 0), 0);

    // This week's hours
    const now       = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday    = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekHours = workLogs
      .filter(l => new Date(l.created_at) >= monday)
      .reduce((s, l) => s + (l.hours_spent || 0), 0);

    return { total, pagesCreated, pagesFixed, bugsFixed, featuresAdded, totalHours, weekHours };
  }, [workLogs]);

  // ─── Filtered logs ────────────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    return workLogs.filter(log => {
      if (typeFilter !== 'all' && log.work_type !== typeFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (dateFrom && log.created_at < dateFrom) return false;
      if (dateTo   && log.created_at > dateTo + 'T23:59:59') return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.title.toLowerCase().includes(q) ||
          (log.description || '').toLowerCase().includes(q) ||
          (log.url || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workLogs, search, typeFilter, statusFilter, dateFrom, dateTo]);

  const hasActiveFilters = search || typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setStatusFilter('all');
    setDateFrom(''); setDateTo('');
  };

  // ─── Chart data ───────────────────────────────────────────────────────────

  const hoursByTypeData = useMemo(() =>
    WORK_TYPES.map(wt => ({
      name:  wt.label,
      hours: workLogs.filter(l => l.work_type === wt.value)
                     .reduce((s, l) => s + (l.hours_spent || 0), 0),
      color: wt.color,
    })).filter(d => d.hours > 0),
    [workLogs]
  );

  const weeklyTrendData = useMemo(() => {
    const byWeek: Record<string, number> = {};
    workLogs.forEach(l => {
      const wk = isoWeekLabel(l.created_at);
      byWeek[wk] = (byWeek[wk] || 0) + (l.hours_spent || 0);
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, hours]) => ({ week, hours }));
  }, [workLogs]);

  const logsByTypeData = useMemo(() =>
    WORK_TYPES.map(wt => ({
      name:  wt.label,
      count: workLogs.filter(l => l.work_type === wt.value).length,
      color: wt.color,
    })).filter(d => d.count > 0),
    [workLogs]
  );

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.id) return;
    if (!formData.work_type) {
      toast({ title: 'Please select a work type', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, hours_spent: Number(formData.hours_spent) };
      if (editingLog) {
        const { error } = await supabase.from('tech_work_logs').update(payload).eq('id', editingLog.id);
        if (error) throw error;
        await logActivity(ActivityActions.UPDATE_TECH_WORK, { title: formData.title, work_type: formData.work_type });
        toast({ title: 'Work log updated' });
      } else {
        const { error } = await supabase.from('tech_work_logs').insert({ ...payload, admin_id: adminProfile.id });
        if (error) throw error;
        await logActivity(ActivityActions.CREATE_TECH_WORK, { title: formData.title, work_type: formData.work_type });
        await markAttendanceAsPresent();
        toast({ title: 'Work log added' });
      }
      setFormData(EMPTY_FORM);
      setEditingLog(null);
      setShowForm(false);
      fetchWorkLogs();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('tech_work_logs').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      await logActivity(ActivityActions.DELETE_TECH_WORK, { title: deleteTarget.title, work_type: deleteTarget.work_type });
      toast({ title: 'Work log deleted' });
      setDeleteTarget(null);
      fetchWorkLogs();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  const weeklyPct = Math.min(100, Math.round((stats.weekHours / weeklyGoal) * 100));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Tech Work Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => exportToCSV(filteredLogs, `tech-logs-${Date.now()}.csv`)}
              className="border-white/20"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export {filteredLogs.length > 0 && filteredLogs.length !== workLogs.length ? `(${filteredLogs.length})` : 'CSV'}
            </Button>
            {!showForm && (
              <Button className="gradient-primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Work Log
              </Button>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Work',      value: stats.total,          color: 'text-gradient' },
            { label: 'Pages Created',   value: stats.pagesCreated,   color: 'text-green-400' },
            { label: 'Pages Fixed',     value: stats.pagesFixed,     color: 'text-blue-400' },
            { label: 'Bugs Fixed',      value: stats.bugsFixed,      color: 'text-red-400' },
            { label: 'Features Added',  value: stats.featuresAdded,  color: 'text-purple-400' },
            { label: 'Total Hours',     value: `${stats.totalHours}h`, color: 'text-yellow-400' },
          ].map(s => (
            <Card key={s.label} className="gradient-card border-white/10">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Weekly hours goal tracker ── */}
        <Card className="gradient-card border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">This Week's Hours</span>
                <span className="text-sm text-gray-400">
                  {stats.weekHours}h / {weeklyGoal}h goal
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${weeklyPct >= 100 ? 'border-green-500/40 text-green-400' : weeklyPct >= 60 ? 'border-yellow-500/40 text-yellow-400' : 'border-red-500/40 text-red-400'}`}
                >
                  {weeklyPct}%
                </Badge>
              </div>
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min="1" max="168"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    className="w-20 h-7 text-sm bg-white/5 border-white/10"
                  />
                  <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => {
                    const g = Math.max(1, Math.min(168, Number(goalInput)));
                    setWeeklyGoal(g); setGoalInput(String(g)); setEditingGoal(false);
                  }}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingGoal(false)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400 hover:text-white" onClick={() => setEditingGoal(true)}>
                  Edit goal
                </Button>
              )}
            </div>
            <Progress
              value={weeklyPct}
              className="h-2"
            />
            {weeklyPct >= 100 && (
              <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                🎉 Weekly goal reached! Great work.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Analytics collapsible ── */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Card className="gradient-card border-white/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Analytics
                  </span>
                  {analyticsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Hours by type */}
                  <div>
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Hours by Type</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hoursByTypeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                        <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }} />
                        <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                          {hoursByTypeData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Weekly trend */}
                  <div>
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Weekly Hours Trend</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={weeklyTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                        <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }} />
                        <Line
                          type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Logs by type */}
                  <div>
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">Log Count by Type</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={logsByTypeData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#888' }} width={80} />
                        <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }} />
                        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                          {logsByTypeData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ── Add / Edit form ── */}
        {showForm && (
          <Card className="gradient-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{editingLog ? 'Edit Work Log' : 'Add New Work Log'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Work Type <span className="text-red-400">*</span></Label>
                    <Select value={formData.work_type} onValueChange={v => setFormData(p => ({ ...p, work_type: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/20">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {WORK_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                              {t.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Title <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Homepage redesign"
                      required
                      className="bg-black/30 border-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>URL (optional)</Label>
                    <Input
                      value={formData.url}
                      onChange={e => setFormData(p => ({ ...p, url: e.target.value }))}
                      placeholder="https://..."
                      className="bg-black/30 border-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Hours Spent</Label>
                    <Input
                      type="number" min="0" step="0.5"
                      value={formData.hours_spent}
                      onChange={e => setFormData(p => ({ ...p, hours_spent: Number(e.target.value) }))}
                      className="bg-black/30 border-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="bg-black/30 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the work done…"
                    className="bg-black/30 border-white/20 min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingLog ? 'Update' : 'Add'} Work Log
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLog(null); setFormData(EMPTY_FORM); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Work logs table ── */}
        <Card className="gradient-card border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                Work Logs
                <Badge variant="outline" className="text-xs">
                  {filteredLogs.length}{filteredLogs.length !== workLogs.length ? ` / ${workLogs.length}` : ''}
                </Badge>
              </CardTitle>

              {/* Filters toggle */}
              <Button
                size="sm" variant="ghost"
                className={`h-8 gap-1.5 text-xs ${hasActiveFilters ? 'text-blue-400' : 'text-gray-400'} hover:text-white`}
                onClick={() => setFiltersOpen(v => !v)}
              >
                <Filter className="w-3.5 h-3.5" />
                {hasActiveFilters ? 'Filters active' : 'Filters'}
                {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>

            {/* Filter row */}
            {filtersOpen && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search title, description…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm bg-white/5 border-white/10"
                  />
                </div>

                {/* Type */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 w-36 bg-white/5 border-white/10 text-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Types</SelectItem>
                    {WORK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-36 bg-white/5 border-white/10 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Date from */}
                <Input
                  type="date" value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="h-8 w-36 bg-white/5 border-white/10 text-sm"
                />

                {/* Date to */}
                <Input
                  type="date" value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="h-8 w-36 bg-white/5 border-white/10 text-sm"
                />

                {hasActiveFilters && (
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-400 hover:text-white px-2" onClick={clearFilters}>
                    <X className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Code className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-muted-foreground text-sm">
                  {hasActiveFilters ? 'No logs match your filters.' : 'No work logs yet. Add your first one!'}
                </p>
                {hasActiveFilters && (
                  <Button size="sm" variant="ghost" className="mt-2 text-blue-400 hover:text-blue-300 text-xs" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id} className="border-white/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WorkTypeIcon type={log.work_type} />
                            <span className="text-sm">{getWorkTypeMeta(log.work_type).label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{log.title}</p>
                            {log.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{log.description}</p>
                            )}
                            {log.url && (
                              <a
                                href={log.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:underline truncate max-w-[200px] block mt-0.5"
                              >
                                {log.url}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{log.hours_spent}h</span>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={log.status} /></TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm" variant="outline"
                              className="h-7 w-7 p-0 border-white/15 hover:border-blue-500/50"
                              onClick={() => setEditingLog(log)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-7 w-7 p-0 border-white/15 hover:border-red-500/50 hover:text-red-400"
                              onClick={() => setDeleteTarget(log)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Delete Work Log?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete <span className="text-white font-medium">"{deleteTarget?.title}"</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 min-w-[90px]">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechWorkDashboard;
