import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, Activity, Clock, FileText, User, Bell, Upload, 
  CheckCircle, LogIn, Calendar as CalendarIcon, Shield, Award, Database,
  BarChart3, TrendingUp, Volume2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  created_at: string;
  admin?: { name: string; role: string };
}

interface Admin {
  id: string;
  name: string;
  role: string;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface ActionBreakdown {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ActivitySummary = () => {
  const { adminProfile } = useAuth();
  const { playSound } = useNotificationSound();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('self');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [dailyData, setDailyData] = useState<DailyActivity[]>([]);
  const [actionBreakdown, setActionBreakdown] = useState<ActionBreakdown[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastActivityCount = useRef(0);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  useEffect(() => {
    if (adminProfile) {
      fetchActivities();
      if (isSuperAdmin) {
        fetchAdmins();
        fetchChartData();
      }

      // Real-time subscription for activity updates
      const channel = supabase
        .channel('activity-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' },
          (payload) => {
            fetchActivities();
            if (isSuperAdmin) fetchChartData();
            
            // Play sound for new activities (not from self)
            const newActivity = payload.new as any;
            if (newActivity.admin_id !== adminProfile.id && soundEnabled) {
              playSound();
              toast({
                title: "New Activity",
                description: `${newActivity.action}`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [adminProfile, selectedAdmin, selectedDate, soundEnabled]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, role')
        .eq('is_active', true);

      if (error) throw error;
      setAdmins((data || []) as Admin[]);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Fetch last 7 days of activity for charts
      const last7Days = subDays(new Date(), 7);
      
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .gte('created_at', last7Days.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process daily activity data
      const dailyMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        dailyMap.set(date, 0);
      }

      (data || []).forEach(activity => {
        const date = format(new Date(activity.created_at), 'MMM dd');
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        }
      });

      setDailyData(Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })));

      // Process action breakdown
      const actionMap = new Map<string, number>();
      (data || []).forEach(activity => {
        const action = activity.action.split(' ')[0]; // Get first word
        actionMap.set(action, (actionMap.get(action) || 0) + 1);
      });

      const breakdown = Array.from(actionMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value], index) => ({
          name,
          value,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));

      setActionBreakdown(breakdown);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchActivities = async () => {
    if (!adminProfile) return;
    setIsLoading(true);
    try {
      // Get start and end of selected date
      const startOfDayDate = startOfDay(selectedDate);
      const endOfDayDate = endOfDay(selectedDate);
      
      // Fetch from admin_activity_logs
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .gte('created_at', startOfDayDate.toISOString())
        .lte('created_at', endOfDayDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedAdmin !== 'all' && !isSuperAdmin) {
        query = query.eq('admin_id', adminProfile.id);
      } else if (selectedAdmin !== 'all' && selectedAdmin !== 'self') {
        query = query.eq('admin_id', selectedAdmin);
      } else if (selectedAdmin === 'self') {
        query = query.eq('admin_id', adminProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get admin names for activities
      const adminIds = [...new Set((data || []).map(a => a.admin_id))];
      let adminData: any[] = [];
      if (adminIds.length > 0) {
        const { data: adminsResult } = await supabase
          .from('admins')
          .select('id, name, role')
          .in('id', adminIds);
        adminData = adminsResult || [];
      }

      const activitiesWithAdmin = (data || []).map(activity => ({
        ...activity,
        admin: adminData.find(a => a.id === activity.admin_id)
      }));

      setActivities(activitiesWithAdmin as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      // Fetch all activities for the selected date range (or all for super admin)
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile?.id);
      } else if (selectedAdmin !== 'all' && selectedAdmin !== 'self') {
        query = query.eq('admin_id', selectedAdmin);
      } else if (selectedAdmin === 'self') {
        query = query.eq('admin_id', adminProfile?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get admin names
      const adminIds = [...new Set((data || []).map(a => a.admin_id))];
      const { data: adminsData } = await supabase
        .from('admins')
        .select('id, name, role')
        .in('id', adminIds);

      const adminMap = new Map((adminsData || []).map(a => [a.id, a]));

      // Create CSV content
      const headers = ['Date', 'Time', 'Admin Name', 'Role', 'Action', 'Details'];
      const rows = (data || []).map(activity => {
        const admin = adminMap.get(activity.admin_id);
        const dateTime = new Date(activity.created_at);
        return [
          format(dateTime, 'yyyy-MM-dd'),
          format(dateTime, 'HH:mm:ss'),
          admin?.name || 'Unknown',
          admin?.role || 'Unknown',
          activity.action,
          JSON.stringify(activity.details || {})
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const downloadSummary = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const summaryText = activities.map(a => {
      const details = a.details ? JSON.stringify(a.details) : '';
      return `[${format(new Date(a.created_at), 'HH:mm:ss')}] ${a.admin?.name || 'Unknown'}: ${a.action}${details ? ` - ${details}` : ''}`;
    }).join('\n');

    const blob = new Blob([`Activity Summary - ${dateStr}\n${'='.repeat(50)}\n\nTotal Activities: ${activities.length}\n\n${summaryText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-summary-${dateStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login') || lowerAction.includes('logged in')) return <LogIn className="w-4 h-4 text-cyan-400" />;
    if (lowerAction.includes('logout')) return <User className="w-4 h-4 text-orange-400" />;
    if (lowerAction.includes('attendance')) return <CalendarIcon className="w-4 h-4 text-purple-400" />;
    if (lowerAction.includes('notification') || lowerAction.includes('read')) return <Bell className="w-4 h-4 text-yellow-400" />;
    if (lowerAction.includes('upload') || lowerAction.includes('file')) return <Upload className="w-4 h-4 text-blue-400" />;
    if (lowerAction.includes('export') || lowerAction.includes('download')) return <Download className="w-4 h-4 text-green-400" />;
    if (lowerAction.includes('add') || lowerAction.includes('create')) return <FileText className="w-4 h-4 text-green-400" />;
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return <Activity className="w-4 h-4 text-blue-400" />;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <Activity className="w-4 h-4 text-red-400" />;
    if (lowerAction.includes('verify') || lowerAction.includes('payment')) return <Shield className="w-4 h-4 text-green-400" />;
    if (lowerAction.includes('certificate')) return <Award className="w-4 h-4 text-yellow-400" />;
    if (lowerAction.includes('complete') || lowerAction.includes('done')) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (lowerAction.includes('data') || lowerAction.includes('player') || lowerAction.includes('user') || lowerAction.includes('esports') || lowerAction.includes('social') || lowerAction.includes('tech') || lowerAction.includes('content')) return <Database className="w-4 h-4 text-indigo-400" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login')) return 'text-cyan-400';
    if (lowerAction.includes('create') || lowerAction.includes('add')) return 'text-green-400';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'text-blue-400';
    if (lowerAction.includes('delete')) return 'text-red-400';
    if (lowerAction.includes('read') || lowerAction.includes('notification')) return 'text-yellow-400';
    return 'text-foreground';
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-4">
      <Card className="gradient-card border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Activity Summary
              {isToday && (
                <Badge variant="outline" className="ml-2 text-xs animate-pulse">
                  Live
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 text-xs bg-black/30 border-white/10 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {format(selectedDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              
              {isSuperAdmin && (
                <>
                  <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-black/30 border-white/10">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">My Activity</SelectItem>
                      <SelectItem value="all">All Admins</SelectItem>
                      {admins.map(admin => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCharts(!showCharts)}
                    className="h-8"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {showCharts ? 'Hide' : 'Charts'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={exportToCSV}
                    className="h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={downloadSummary}
                className="h-8"
                disabled={activities.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activities.length} activities on {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activities recorded for this date</p>
                <p className="text-xs mt-1">Select a different date to view activities</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        {isSuperAdmin && selectedAdmin !== 'self' && activity.admin && (
                          <Badge variant="outline" className="text-xs">
                            {activity.admin.name}
                          </Badge>
                        )}
                      </div>
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {typeof activity.details === 'object' 
                            ? Object.entries(activity.details)
                                .filter(([key]) => !['timestamp', 'admin_id'].includes(key))
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' • ')
                                .slice(0, 100)
                            : String(activity.details).slice(0, 100)
                          }
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.created_at), 'h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Charts for Super Admin */}
      {isSuperAdmin && showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Activity Chart */}
          <Card className="gradient-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Daily Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Action Breakdown Chart */}
          <Card className="gradient-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Action Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={actionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {actionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {actionBreakdown.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ActivitySummary;
