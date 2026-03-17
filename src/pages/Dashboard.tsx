
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import DailyTodos from '@/components/DailyTodos';
import ActivitySummary from '@/components/ActivitySummary';
import MobileDashboard from '@/components/MobileDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { rolePermissions } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import EsportsPlayerForm from '@/components/EsportsPlayerForm';
import SocialMediaOrderForm from '@/components/SocialMediaOrderForm';
import SuperAdminReviewPanel from '@/components/SuperAdminReviewPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Edit, Trash2, X, Loader2, RefreshCw, TrendingUp, TrendingDown,
  Users, IndianRupee, Clock, Award, BarChart3, Bell, FileText,
  Shield, ChevronRight, Zap, Activity, Star, Grid3X3, List,
  Search, Filter, Eye, ArrowUpRight, ArrowDownRight, Minus,
  Wifi, Cpu, Globe, BookOpen, Calendar, Heart, Package,
  ChevronDown, ChevronUp, MoreHorizontal, Pin, PinOff,
  Maximize2, Minimize2, Hash, Layers, LayoutDashboard,
  MessageSquare, Settings, Info, AlertTriangle, CheckCircle,
  TrendingUp as TUp, Database, Download, Upload, Terminal,
  UserCheck, UserX, Target, Flame, Trophy, Crown, Sparkles,
  ScanLine, Radar, PieChart, LineChart, AreaChart, Boxes,
  GitBranch, Network, HardDrive, Server, Monitor, Smartphone,
  Map, Compass, Flag, Bookmark, Tag, Palette, Lightbulb,
  Lock, Unlock, Mail, Phone, Video, Music, Image, Film,
  Coffee, Sun, Moon, CloudRain, Wind, Thermometer
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, isToday, isYesterday, differenceInDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart as RechartsArea, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine,
  Line, RadialBarChart, RadialBar, Legend
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
  successRate: number;
  totalAdmins: number;
  activeAdmins: number;
  presentToday: number;
  attendancePercentage: number;
  presentDaysThisMonth: number;
  workingDaysInMonth: number;
  totalDaysInMonth: number;
  totalCertificates: number;
  certificatesThisMonth: number;
  pendingPayments: number;
  verifiedPaymentsToday: number;
  totalInternships: number;
  completedInternships: number;
  totalMessages: number;
  monthlyGrowth: number;
  esportsUsers: number;
  socialUsers: number;
  totalUsers: number;
  todayNotifications: number;
  esportsRevenue: number;
  socialRevenue: number;
  totalAuditLogs: number;
  todayAuditActions: number;
  totalFiles: number;
  bulkUploads: number;
  socialPosts: number;
  socialFollowersGained: number;
  averageFollowers: number;
  totalEmployees: number;
  activeEmployees: number;
  totalCareerApplications: number;
  pendingCareerApplications: number;
  techWorkCount: number;
  techTotalHours: number;
  contentCount: number;
  contentPlatforms: number;
  leaveRequestsCount: number;
  pendingLeaveRequests: number;
  dailyAdminsPresentPercentage: number;
}

interface ModuleCard {
  title: string;
  description: string;
  iconSrc: string;
  route: string;
  module: string;
  badge?: string;
  stats: { label: string; value: string | number }[];
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.FC<any>;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
}

interface RevenueDataPoint {
  name: string;
  esports: number;
  social: number;
  total: number;
}

interface ActivityPoint {
  time: string;
  actions: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const MODULE_CATEGORIES = [
  'All', 'Core', 'Analytics', 'Communication', 'HR', 'Finance', 'Operations', 'System'
];

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  'All': Grid3X3,
  'Core': LayoutDashboard,
  'Analytics': BarChart3,
  'Communication': MessageSquare,
  'HR': Users,
  'Finance': IndianRupee,
  'Operations': Settings,
  'System': Server,
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val.toLocaleString()}`;

const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
  if (trend === 'up') return <ArrowUpRight className="w-3 h-3" />;
  if (trend === 'down') return <ArrowDownRight className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
  if (trend === 'up') return 'text-emerald-400';
  if (trend === 'down') return 'text-red-400';
  return 'text-muted-foreground';
};

const generateSparkData = (count = 7) =>
  Array.from({ length: count }, (_, i) => ({
    name: `d${i}`,
    value: Math.floor(Math.random() * 80) + 20
  }));

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: <Sun className="w-5 h-5 text-yellow-400" /> };
  if (h < 17) return { text: 'Good afternoon', icon: <Coffee className="w-5 h-5 text-orange-400" /> };
  return { text: 'Good evening', icon: <Moon className="w-5 h-5 text-indigo-400" /> };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PulseRing = ({ color = 'bg-green-400' }: { color?: string }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} />
    <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)} />
  </span>
);

const MiniSparkline = ({ data, color = '#3b82f6' }: { data: { value: number }[]; color?: string }) => (
  <ResponsiveContainer width="100%" height={32}>
    <RechartsArea data={data}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
        fill={`url(#sg-${color.replace('#', '')})`} dot={false} />
    </RechartsArea>
  </ResponsiveContainer>
);

const BigStatCard = ({
  label, value, icon: Icon, color, bgColor, trend, trendValue, prefix = '', suffix = '',
  description, sparkData, onClick
}: QuickStat & { sparkData?: { value: number }[]; onClick?: () => void }) => (
  <div
    className={cn(
      "relative group overflow-hidden rounded-2xl border border-white/10 p-5 cursor-pointer",
      "hover:border-white/25 hover:shadow-xl transition-all duration-300",
      "bg-gradient-to-br from-white/8 to-white/3"
    )}
    onClick={onClick}
  >
    {/* Glow orb */}
    <div className={cn("absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl", bgColor)} />

    <div className="flex items-start justify-between mb-3">
      <div className={cn("p-2.5 rounded-xl border border-white/15", bgColor)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      {trend && trendValue !== undefined && (
        <span className={cn("flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full border",
          trend === 'up' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
          trend === 'down' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
          'text-muted-foreground border-white/10 bg-white/5'
        )}>
          {getTrendIcon(trend)}{Math.abs(trendValue)}%
        </span>
      )}
    </div>

    <div className="mt-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-foreground">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>

    {sparkData && (
      <div className="mt-3 -mx-1">
        <MiniSparkline data={sparkData} color={color.replace('text-', '').includes('-') ? ACCENT_COLORS[0] : ACCENT_COLORS[0]} />
      </div>
    )}

    <div className="absolute bottom-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 transition-opacity">
      <Icon className="w-full h-full" />
    </div>
  </div>
);

const StatStrip = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.FC<any>; color: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", `bg-${color}-400/15`)}>
      <Icon className={cn("w-4 h-4", `text-${color}-400`)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  </div>
);

const AttendanceRing = ({ percentage, present, total, label }: { percentage: number; present: number; total: number; label: string }) => {
  const data = [
    { name: 'present', value: percentage, fill: '#10b981' },
    { name: 'absent', value: 100 - percentage, fill: 'rgba(255,255,255,0.08)' }
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%" outerRadius="100%"
            data={data} startAngle={90} endAngle={-270}
          >
            <RadialBar dataKey="value" background={false} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{percentage}%</span>
          <span className="text-xs text-muted-foreground">{present}/{total}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

const NotificationToast = ({ notifications }: { notifications: Notification[] }) => {
  const unread = notifications.filter(n => !n.read);
  if (unread.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
      {unread.slice(0, 3).map(n => (
        <div key={n.id} className={cn(
          "flex items-start gap-3 p-3 rounded-xl border shadow-xl backdrop-blur-sm animate-in slide-in-from-right-4 duration-300",
          n.type === 'success' ? 'bg-emerald-950/90 border-emerald-400/30' :
          n.type === 'warning' ? 'bg-yellow-950/90 border-yellow-400/30' :
          n.type === 'error' ? 'bg-red-950/90 border-red-400/30' :
          'bg-gray-950/90 border-white/20'
        )}>
          <div className="mt-0.5">
            {n.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
             n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> :
             n.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
             <Info className="w-4 h-4 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const QuickActionButton = ({ icon: Icon, label, onClick, color = 'blue', badge }: {
  icon: React.FC<any>; label: string; onClick: () => void; color?: string; badge?: string | number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/10",
      "hover:border-white/25 hover:bg-white/10 transition-all duration-200 group text-center min-w-[72px]"
    )}
  >
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${color}-400/15 group-hover:bg-${color}-400/25 transition-colors`)}>
      <Icon className={cn("w-5 h-5", `text-${color}-400`)} />
    </div>
    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{label}</span>
    {badge !== undefined && badge !== 0 && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1 font-bold">
        {badge}
      </span>
    )}
  </button>
);

const SectionHeader = ({ title, subtitle, icon: Icon, actions }: {
  title: string; subtitle?: string; icon?: React.FC<any>; actions?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

const ModuleCardEnhanced = ({
  card, onClick, isPinned, onPin, viewMode
}: {
  card: ModuleCard & { category?: string; isNew?: boolean; isFeatured?: boolean };
  onClick: () => void;
  isPinned: boolean;
  onPin: () => void;
  viewMode: 'grid' | 'list';
}) => {
  const [hovered, setHovered] = useState(false);

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/25",
          "hover:bg-white/8 transition-all duration-200 cursor-pointer group"
        )}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img src={card.iconSrc} alt={card.title} className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{card.title}</p>
            {card.badge && (
              <Badge className={cn("text-xs py-0 px-1.5 shrink-0",
                card.badge === 'Super Admin' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                card.badge === 'Live' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                'bg-blue-400/10 text-blue-400 border-blue-400/20'
              )}>
                {card.badge === 'Live' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse inline-block" />}
                {card.badge}
              </Badge>
            )}
            {card.isNew && <Badge className="text-xs py-0 px-1.5 bg-primary/10 text-primary border-primary/20">New</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{card.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {card.stats.slice(0, 2).map((s, i) => (
            <div key={i} className="text-right hidden sm:block">
              <p className="text-sm font-bold text-foreground">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onPin(); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors">
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-2xl border border-white/10 p-4 cursor-pointer",
        "hover:border-white/30 hover:shadow-2xl transition-all duration-300",
        "bg-gradient-to-br from-white/8 to-white/3",
        card.isFeatured && "border-primary/30 from-primary/10 to-white/3"
      )}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Featured glow */}
      {card.isFeatured && (
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary rounded-full opacity-10 blur-2xl" />
      )}

      {/* Pin button */}
      <button
        onClick={e => { e.stopPropagation(); onPin(); }}
        className={cn(
          "absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 z-10",
          isPinned ? "opacity-100 text-primary bg-primary/15" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-white/10"
        )}
      >
        {isPinned ? <Pin className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-110 transition-transform duration-300">
          <img src={card.iconSrc} alt={card.title} className="w-7 h-7 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground leading-tight">{card.title}</h3>
            {card.isNew && (
              <span className="text-xs px-1.5 py-0 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">NEW</span>
            )}
          </div>
          {card.badge && (
            <span className={cn("inline-flex items-center gap-1 text-xs mt-0.5",
              card.badge === 'Super Admin' ? 'text-yellow-400' :
              card.badge === 'Live' ? 'text-green-400' : 'text-blue-400'
            )}>
              {card.badge === 'Live' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
              {card.badge}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 group-hover:text-foreground/70 transition-colors">
        {card.description}
      </p>

      {/* Stats */}
      {card.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {card.stats.slice(0, 2).map((s, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-2.5 py-2 border border-white/8">
              <p className="text-xs font-bold text-foreground">
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {card.category && (
          <span className="text-xs text-muted-foreground/60">{card.category}</span>
        )}
        <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          Open <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

const RevenueChart = ({ stats }: { stats: DashboardStats }) => {
  const data: RevenueDataPoint[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = format(subDays(new Date(), 6 - i), 'EEE');
      const mult = 0.6 + Math.random() * 0.8;
      return {
        name: day,
        esports: Math.round((stats.esportsRevenue / 7) * mult),
        social: Math.round((stats.socialRevenue / 7) * mult),
        total: Math.round((stats.totalRevenue / 7) * mult),
      };
    });
  }, [stats]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <RechartsArea data={data}>
        <defs>
          <linearGradient id="gEsports" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSocial" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} width={40}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
        <RechartsTooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 11 }}
          formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, '']}
        />
        <Area type="monotone" dataKey="esports" stroke="#3b82f6" strokeWidth={2} fill="url(#gEsports)" name="Esports" />
        <Area type="monotone" dataKey="social" stroke="#10b981" strokeWidth={2} fill="url(#gSocial)" name="Social" />
      </RechartsArea>
    </ResponsiveContainer>
  );
};

const UserDistributionChart = ({ stats }: { stats: DashboardStats }) => {
  const data = [
    { name: 'Esports', value: stats.esportsUsers, fill: '#3b82f6' },
    { name: 'Social', value: stats.socialUsers, fill: '#10b981' },
    { name: 'Employees', value: stats.totalEmployees, fill: '#f59e0b' },
    { name: 'Interns', value: stats.totalInternships, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RechartsPie>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <RechartsTooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 11 }}
        />
      </RechartsPie>
    </ResponsiveContainer>
  );
};

const WelcomeBanner = ({ name, role }: { name: string; role: string }) => {
  const { text: greetText, icon: greetIcon } = greetingByHour();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-primary/15 via-white/5 to-transparent p-6 mb-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {greetIcon}
            <span className="text-sm text-muted-foreground">{greetText}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {name} <span className="text-primary">🩵</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="capitalize">{role.replace(/_/g, ' ')}</span> · Manage your authorized modules below
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground font-mono">
              {format(time, 'HH:mm:ss')}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(time, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PulseRing color="bg-green-400" />
            <span className="text-xs text-muted-foreground">Live updates active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PinnedModulesRow = ({ pinned, modules, navigate, onUnpin }: {
  pinned: string[];
  modules: ModuleCard[];
  navigate: (r: string) => void;
  onUnpin: (title: string) => void;
}) => {
  if (pinned.length === 0) return null;
  const pinnedCards = modules.filter(m => pinned.includes(m.title));
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Pinned</h3>
      </div>
      <div className="flex gap-3 flex-wrap">
        {pinnedCards.map(card => (
          <button
            key={card.title}
            onClick={() => navigate(card.route)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-primary/25 bg-primary/10 hover:bg-primary/20 transition-colors group"
          >
            <img src={card.iconSrc} alt={card.title} className="w-4 h-4 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-xs font-medium text-foreground">{card.title}</span>
            <button onClick={e => { e.stopPropagation(); onUnpin(card.title); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
              <X className="w-3 h-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};

const DataTable = ({ activeData, activeSection, editingItem, setEditingItem, handleDelete }: {
  activeData: any[];
  activeSection: string;
  editingItem: any;
  setEditingItem: (item: any) => void;
  handleDelete: (item: any) => void;
}) => {
  const [search, setSearch] = useState('');
  const data = activeData.filter(item => item.type === activeSection);
  const filtered = search
    ? data.filter(d => JSON.stringify(d).toLowerCase().includes(search.toLowerCase()))
    : data;

  if (filtered.length === 0 && !search) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Recent {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Data
          <Badge className="ml-2 text-xs bg-white/10 text-muted-foreground border-white/15">{data.length}</Badge>
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-black/30 border-white/10 w-48"
          />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/5">
              <TableHead className="text-xs text-muted-foreground">Details</TableHead>
              <TableHead className="text-xs text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 10).map((item) => (
              <TableRow key={`${item.type}-${item.id}`} className="border-white/8 hover:bg-white/5">
                <TableCell className="text-sm">
                  {item.type === 'esports' && (
                    <div>
                      <p className="font-medium text-foreground">{item.player_name}</p>
                      <p className="text-xs text-muted-foreground">{item.tournament_name}</p>
                    </div>
                  )}
                  {item.type === 'social' && (
                    <div>
                      <p className="font-medium text-foreground">{item.service_type}</p>
                      <p className="text-xs text-muted-foreground">{item.order_type}</p>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {item.type === 'esports' && `₹${item.entry_fees?.toLocaleString()}`}
                  {item.type === 'social' && `₹${item.payment_amount?.toLocaleString()}`}
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs",
                    item.payment_received
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                      : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                  )}>
                    {item.payment_received ? '✓ Paid' : '⏳ Pending'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-white/10 hover:border-blue-400/30 hover:text-blue-400"
                      onClick={() => setEditingItem(item)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-white/10 hover:border-red-400/30 hover:text-red-400"
                      onClick={() => handleDelete(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filtered.length > 10 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Showing 10 of {filtered.length} records
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, adminProfile } = useAuth();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0, activeUsers: 0, pendingOrders: 0, successRate: 0,
    totalAdmins: 0, activeAdmins: 0, presentToday: 0, attendancePercentage: 0,
    presentDaysThisMonth: 0, workingDaysInMonth: 0, totalDaysInMonth: 0,
    totalCertificates: 0, certificatesThisMonth: 0, pendingPayments: 0,
    verifiedPaymentsToday: 0, totalInternships: 0, completedInternships: 0,
    totalMessages: 0, monthlyGrowth: 0, esportsUsers: 0, socialUsers: 20,
    totalUsers: 0, todayNotifications: 0, esportsRevenue: 0, socialRevenue: 0,
    totalAuditLogs: 0, todayAuditActions: 0, totalFiles: 0, bulkUploads: 0,
    socialPosts: 0, socialFollowersGained: 0, averageFollowers: 0,
    totalEmployees: 0, activeEmployees: 0, totalCareerApplications: 0,
    pendingCareerApplications: 0, techWorkCount: 0, techTotalHours: 0,
    contentCount: 0, contentPlatforms: 0, leaveRequestsCount: 0,
    pendingLeaveRequests: 0, dailyAdminsPresentPercentage: 0
  });

  const [activeData, setActiveData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);

  // UI state
  const [moduleViewMode, setModuleViewMode] = useState<'grid' | 'list'>('grid');
  const [moduleSearch, setModuleSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [pinnedModules, setPinnedModules] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pinnedModules') || '[]'); } catch { return []; }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [expandedStats, setExpandedStats] = useState(false);

  const sparkCache = useRef<Record<string, { value: number }[]>>({});
  const getSpark = (key: string) => {
    if (!sparkCache.current[key]) sparkCache.current[key] = generateSparkData();
    return sparkCache.current[key];
  };

  // ─── HOLIDAY / WORKING DAY LOGIC ─────────────────────────────────────────

  useEffect(() => {
    const fetchHolidays = async () => {
      const { data } = await supabase.from('holidays').select('date');
      setHolidayDates((data || []).map((h: any) => h.date));
    };
    fetchHolidays();
  }, []);

  const getWorkingDaysInMonth = useCallback((year: number, month: number, upToDay: number) => {
    let workingDays = 0;
    for (let day = 1; day <= upToDay; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(dateStr)) workingDays++;
    }
    return workingDays;
  }, [holidayDates]);

  // ─── DATA FETCHING ────────────────────────────────────────────────────────

  const fetchRealDashboardStats = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const monthStart = `${year}-${month}-01`;

      const [
        { data: admins }, { data: todayAttendanceData }, { data: monthlyAttendance },
        { data: certificates }, { data: internships }, { data: chatMessages },
        { data: paymentVerifications }, { data: esportsPlayers }, { data: socialOrders },
        { data: socialAnalytics }, { data: employees }, { data: careerApplications },
        { data: techWorkLogs }, { data: contentWorkLogs }, { data: leaveRequests }
      ] = await Promise.all([
        supabase.from('admins').select('*'),
        supabase.from('attendance').select('*').eq('date', todayStr),
        supabase.from('attendance').select('*').gte('date', monthStart).lte('date', todayStr).eq('admin_id', adminProfile?.id || ''),
        supabase.from('certificates').select('*'),
        supabase.from('internships').select('*'),
        supabase.from('chat_messages').select('*'),
        supabase.from('payment_verifications').select('*'),
        supabase.from('esports_players').select('*'),
        supabase.from('social_media_orders').select('*'),
        supabase.from('social_media_analytics').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('career_applications').select('*'),
        supabase.from('tech_work_logs').select('*'),
        supabase.from('content_work_logs').select('*'),
        adminProfile?.role === 'super_admin'
          ? supabase.from('leave_requests').select('*')
          : supabase.from('leave_requests').select('*').eq('admin_id', adminProfile?.id || '')
      ]);

      const esportsRevenue = esportsPlayers?.filter((p: any) => p.payment_received).reduce((s: number, p: any) => s + (p.entry_fees || 0), 0) || 0;
      const socialRevenue = socialOrders?.filter((o: any) => o.payment_received).reduce((s: number, o: any) => s + (o.payment_amount || 0), 0) || 0;
      const socialPosts = socialAnalytics?.reduce((s: number, a: any) => s + (a.posts_count || 0), 0) || 0;
      const socialFollowersGained = socialAnalytics?.reduce((s: number, a: any) => s + (a.followers_gained || 0), 0) || 0;
      const totalFollowers = socialAnalytics?.reduce((s: number, a: any) => s + (a.total_followers || 0), 0) || 0;
      const analyticsCount = socialAnalytics?.length || 0;
      const averageFollowers = analyticsCount > 0 ? Math.round(totalFollowers / analyticsCount) : 0;
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter((e: any) => e.status === 'active').length || 0;
      const totalCareerApplications = careerApplications?.length || 0;
      const pendingCareerApplications = careerApplications?.filter((a: any) => a.status === 'pending').length || 0;
      const techWorkCount = techWorkLogs?.length || 0;
      const techTotalHours = techWorkLogs?.reduce((s: number, l: any) => s + (l.hours_spent || 0), 0) || 0;
      const contentCount = contentWorkLogs?.length || 0;
      const uniquePlatforms = new Set(contentWorkLogs?.map((l: any) => l.platform).filter(Boolean) || []);
      const contentPlatforms = uniquePlatforms.size;
      const leaveRequestsCount = leaveRequests?.length || 0;
      const pendingLeaveRequests = leaveRequests?.filter((l: any) => l.status === 'pending').length || 0;
      const currentDay = now.getDate();
      const workingDaysInMonth = getWorkingDaysInMonth(now.getFullYear(), now.getMonth(), currentDay);
      const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const presentCount = monthlyAttendance?.filter((a: any) => a.status === 'present').length || 0;
      const lateCount = monthlyAttendance?.filter((a: any) => a.status === 'late').length || 0;
      const attendanceScore = presentCount + (lateCount * 0.5);
      const cappedScore = Math.min(attendanceScore, workingDaysInMonth);
      const presentDaysThisMonth = Math.round(cappedScore);
      const monthlyAttendancePercentage = workingDaysInMonth > 0
        ? Math.min(100, Math.round((cappedScore / workingDaysInMonth) * 100)) : 0;
      const totalAdmins = admins?.length || 0;
      const presentToday = todayAttendanceData?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const dailyAdminsPresentPercentage = totalAdmins > 0
        ? Math.min(100, Math.round((presentToday / totalAdmins) * 100)) : 0;
      const attendancePercentage = monthlyAttendancePercentage;
      const totalCertificates = certificates?.length || 0;
      const thisMonth = new Date().getMonth();
      const certificatesThisMonth = certificates?.filter((c: any) => new Date(c.created_at).getMonth() === thisMonth).length || 0;
      const totalInternships = internships?.filter((i: any) => i.status === 'active').length || 0;
      const completedInternships = internships?.filter((i: any) => i.status === 'completed').length || 0;
      const totalMessages = chatMessages?.length || 0;
      const verifiedPayments = paymentVerifications?.filter((p: any) => p.payment_received) || [];
      const totalRevenue = verifiedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0) + esportsRevenue + socialRevenue;
      const pendingPayments = paymentVerifications?.filter((p: any) => !p.payment_received).length || 0;
      const verifiedToday = verifiedPayments.filter((p: any) => p.verified_at && new Date(p.verified_at).toDateString() === new Date().toDateString()).length;
      const esportsUserNames = new Set(esportsPlayers?.map((p: any) => p.player_name.toLowerCase()) || []);
      const esportsUsers = esportsUserNames.size;
      const totalUsers = esportsUsers + 20;
      const today = new Date().toDateString();
      const todayPayments = paymentVerifications?.filter((p: any) => new Date(p.created_at).toDateString() === today).length || 0;
      const todayAttendanceCount = todayAttendanceData?.length || 0;
      const todayCertificates = certificates?.filter((c: any) => new Date(c.created_at).toDateString() === today).length || 0;
      const todayNotifications = todayPayments + todayAttendanceCount + todayCertificates;
      const totalAuditLogs = (paymentVerifications?.length || 0) + (certificates?.length || 0) + (internships?.length || 0) + (todayAttendanceData?.length || 0);
      const todayAuditActions = todayPayments + todayCertificates + todayAttendanceCount;

      setDashboardStats({
        totalRevenue, activeUsers: totalUsers, pendingOrders: pendingPayments,
        successRate: verifiedPayments.length > 0 ? Math.round((verifiedPayments.length / (paymentVerifications?.length || 1)) * 100) : 0,
        totalAdmins, activeAdmins: totalAdmins, presentToday, attendancePercentage,
        presentDaysThisMonth, workingDaysInMonth, totalDaysInMonth, totalCertificates,
        certificatesThisMonth, pendingPayments, verifiedPaymentsToday: verifiedToday,
        totalInternships, completedInternships, totalMessages,
        monthlyGrowth: certificatesThisMonth > 0 ? Math.round(((certificatesThisMonth / totalCertificates) * 100)) : 0,
        esportsUsers, socialUsers: 20, totalUsers, todayNotifications,
        esportsRevenue, socialRevenue, totalAuditLogs, todayAuditActions,
        totalFiles: 0, bulkUploads: 0, socialPosts, socialFollowersGained, averageFollowers,
        totalEmployees, activeEmployees, totalCareerApplications, pendingCareerApplications,
        techWorkCount, techTotalHours, contentCount, contentPlatforms, leaveRequestsCount,
        pendingLeaveRequests, dailyAdminsPresentPercentage
      });

      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adminProfile, getWorkingDaysInMonth]);

  const fetchRoleSpecificData = useCallback(async () => {
    try {
      let data: any[] = [];
      if (!adminProfile) return;
      if (adminProfile.role === 'super_admin' || adminProfile.role === 'esports_admin') {
        const { data: esportsData } = await supabase.from('esports_players').select('*').order('created_at', { ascending: false });
        if (esportsData) data = [...data, ...esportsData.map(item => ({ ...item, type: 'esports' }))];
      }
      if (adminProfile.role === 'super_admin' || adminProfile.role === 'social_admin') {
        const { data: socialData } = await supabase.from('social_media_orders').select('*').order('created_at', { ascending: false });
        if (socialData) data = [...data, ...socialData.map(item => ({ ...item, type: 'social' }))];
      }
      setActiveData(data);
    } catch (error) {
      console.error('Error fetching role-specific data:', error);
    }
  }, [adminProfile]);

  // ─── EFFECTS ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (holidayDates.length >= 0) fetchRealDashboardStats();
    const interval = setInterval(fetchRealDashboardStats, 5000);
    return () => clearInterval(interval);
  }, [holidayDates, fetchRealDashboardStats]);

  useEffect(() => {
    if (adminProfile) fetchRoleSpecificData();
  }, [adminProfile, fetchRoleSpecificData]);

  // Real-time Supabase subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_verifications' }, () => {
        fetchRealDashboardStats();
        addNotification({ title: 'New Payment', message: 'A new payment verification was submitted', type: 'info' });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'certificates' }, () => {
        fetchRealDashboardStats();
        addNotification({ title: 'Certificate Issued', message: 'A new certificate has been issued', type: 'success' });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addNotification = (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newN: Notification = { ...n, id: Math.random().toString(), timestamp: new Date(), read: false };
    setNotifications(prev => [newN, ...prev].slice(0, 20));
    setTimeout(() => {
      setNotifications(prev => prev.map(n2 => n2.id === newN.id ? { ...n2, read: true } : n2));
    }, 5000);
  };

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const tableMap: Record<string, string> = { esports: 'esports_players', social: 'social_media_orders' };
      const tableName = tableMap[item.type];
      if (!tableName) throw new Error(`Unknown item type: ${item.type}`);
      const { error } = await supabase.from(tableName as any).delete().eq('id', item.id);
      if (error) throw error;
      fetchRoleSpecificData();
      fetchRealDashboardStats();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchRealDashboardStats(), fetchRoleSpecificData()]);
    setIsRefreshing(false);
  };

  const handlePinToggle = (title: string) => {
    setPinnedModules(prev => {
      const next = prev.includes(title) ? prev.filter(p => p !== title) : [...prev, title];
      localStorage.setItem('pinnedModules', JSON.stringify(next));
      return next;
    });
  };

  // ─── GUARD RENDERS ────────────────────────────────────────────────────────

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-primary/30 rounded-full" />
              <div className="w-16 h-16 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-semibold">Loading Dashboard</p>
              <p className="text-muted-foreground text-sm mt-1">Fetching your data...</p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-80">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">No Admin Profile</h2>
              <p className="text-gray-400 text-sm mb-6">
                Please contact a super admin to create your admin account.
              </p>
              <Button onClick={() => window.location.href = '/login'} variant="outline" className="border-white/20">
                Back to Login
              </Button>
              </div>
          </div>
        </div>
      </div>
    );
  }
 
  const displayProfile = adminProfile;
 
  const hasPermission = (module: string) => {
    const permissions = rolePermissions[displayProfile.role];
    return permissions.includes('*') || permissions.includes(module);
  };
 
  // ─── MODULE DEFINITIONS ───────────────────────────────────────────────────
 
  const dataEntryCards: (ModuleCard & { visible: boolean })[] = [
    {
      title: 'Esports Players',
      description: 'Add and manage esports tournament players and registrations',
      iconSrc: '/icons/game.png',
      route: '/dashboard/esports-players',
      visible: adminProfile.role === 'super_admin' || adminProfile.role === 'esports_admin',
      module: 'esports',
      category: 'Operations',
      stats: [
        { label: 'Total Users', value: dashboardStats.esportsUsers },
        { label: 'Revenue', value: formatCurrency(dashboardStats.esportsRevenue) }
      ]
    },
    {
      title: 'Social Media Analytics',
      description: 'Track posts, followers gained, engagement and requests across platforms',
      iconSrc: '/icons/social-media.png',
      route: '/dashboard/social-analytics',
      visible: ['super_admin', 'social_admin', 'content_admin'].includes(adminProfile.role as string),
      module: 'social',
      category: 'Analytics',
      stats: [
        { label: 'Total Posts', value: dashboardStats.socialPosts },
        { label: 'Followers +', value: `+${dashboardStats.socialFollowersGained}` }
      ]
    },
    {
      title: 'Tech Work Dashboard',
      description: 'Track pages created, bugs fixed, features added and development work',
      iconSrc: '/icons/trade.png',
      route: '/dashboard/tech-work',
      visible: ['super_admin', 'tech_admin'].includes(adminProfile.role as string),
      module: 'tech',
      category: 'Operations',
      stats: [
        { label: 'Work Logged', value: dashboardStats.techWorkCount },
        { label: 'Total Hours', value: `${dashboardStats.techTotalHours}h` }
      ]
    },
    {
      title: 'Content Work Dashboard',
      description: 'Track posters, images, videos and content created across platforms',
      iconSrc: '/icons/files.png',
      route: '/dashboard/content-work',
      visible: ['super_admin', 'social_admin', 'content_admin'].includes(adminProfile.role as string),
      module: 'content',
      category: 'Operations',
      stats: [
        { label: 'Content Created', value: dashboardStats.contentCount },
        { label: 'Platforms', value: dashboardStats.contentPlatforms }
      ]
    }
  ];
 
  const modules: (ModuleCard & { category: string; isNew?: boolean; isFeatured?: boolean })[] = [
    {
      title: 'Overview Stats', description: 'Role-specific summary cards showing sales, orders, trades, and performance',
      iconSrc: '/icons/analytics.png', route: '/dashboard/overview', module: 'analytics',
      category: 'Analytics', isFeatured: true,
      stats: [
        { label: 'Total Revenue', value: formatCurrency(dashboardStats.totalRevenue) },
        { label: 'Active Users', value: dashboardStats.activeUsers }
      ]
    },
    {
      title: 'Attendance Tracker', description: 'Mark daily attendance, manage absences with reasons, and view attendance reports',
      iconSrc: '/icons/attendance.png', route: '/dashboard/attendance', module: '*',
      badge: 'All Users', category: 'HR',
      stats: adminProfile?.role === 'super_admin'
        ? [
            { label: 'Today Present', value: `${dashboardStats.presentToday}/${dashboardStats.totalAdmins}` },
            { label: 'Attendance %', value: `${dashboardStats.dailyAdminsPresentPercentage}%` }
          ]
        : [
            { label: 'This Month', value: `${dashboardStats.presentDaysThisMonth}/${dashboardStats.workingDaysInMonth}` },
            { label: 'Attendance %', value: `${dashboardStats.attendancePercentage}%` }
          ]
    },
    {
      title: 'Real-Time Team Chat', description: 'WebSocket-powered team communication with file uploads and role-based messaging',
      iconSrc: '/icons/chat.png', route: '/dashboard/chat', module: '*',
      badge: 'Live', category: 'Communication',
      stats: [
        { label: 'Online', value: dashboardStats.activeAdmins },
        { label: 'Messages', value: dashboardStats.totalMessages }
      ]
    },
    {
      title: 'Analytics Dashboard', description: 'Revenue breakdown, earnings graphs, and domain-wise performance analytics',
      iconSrc: '/icons/stat.png', route: '/dashboard/analytics', module: 'analytics',
      category: 'Analytics',
      stats: [
        { label: 'Monthly Growth', value: `${dashboardStats.monthlyGrowth >= 0 ? '+' : ''}${dashboardStats.monthlyGrowth}%` },
        { label: 'Total Revenue', value: formatCurrency(dashboardStats.totalRevenue) }
      ]
    },
    {
      title: 'Payment Verification', description: 'Verify user payments, manage transaction IDs, and export payment reports',
      iconSrc: '/icons/card.png', route: '/dashboard/payments', module: '*',
      badge: 'All Users', category: 'Finance',
      stats: [
        { label: 'Pending', value: dashboardStats.pendingPayments },
        { label: 'Verified Today', value: dashboardStats.verifiedPaymentsToday }
      ]
    },
    {
      title: 'Certificate Manager', description: 'Issue certificates, manage IDs, and provide real-time verification with Certificate ID',
      iconSrc: '/icons/certificate.png', route: '/dashboard/certificates', module: 'super_admin_only',
      badge: 'Super Admin', category: 'System',
      stats: [
        { label: 'Total Issued', value: dashboardStats.totalCertificates },
        { label: 'This Month', value: dashboardStats.certificatesThisMonth }
      ]
    },
    {
      title: 'Internship Tracker', description: 'Manage intern records, track attendance, assign tasks, and monitor progress',
      iconSrc: '/icons/internship.png', route: '/dashboard/internships', module: 'super_admin_only',
      badge: 'Super Admin', category: 'HR',
      stats: [
        { label: 'Active Interns', value: dashboardStats.totalInternships },
        { label: 'Completed', value: dashboardStats.completedInternships }
      ]
    },
    {
      title: 'Admin Management', description: 'Manage admin accounts, assign roles, view activity logs, and reset passwords',
      iconSrc: '/icons/admin.png', route: '/dashboard/admin-management', module: 'super_admin_only',
      badge: 'Super Admin', category: 'System',
      stats: [
        { label: 'Total Admins', value: dashboardStats.totalAdmins },
        { label: 'Active', value: dashboardStats.activeAdmins }
      ]
    },
    {
      title: 'Bulk Upload & Import', description: 'Upload CSV/Excel files for tournaments, stocks, and orders with smart validation',
      iconSrc: '/icons/files.png', route: '/dashboard/bulk-upload', module: '*', category: 'Operations',
      stats: [
        { label: 'Files Uploaded', value: dashboardStats.bulkUploads },
        { label: 'Success Rate', value: '100%' }
      ]
    },
    {
      title: 'Notification Center', description: 'Real-time alerts for orders, matches, stocks with role-based filtering',
      iconSrc: '/icons/active.png', route: '/dashboard/notifications', module: '*',
      badge: 'Live', category: 'Communication',
      stats: [
        { label: 'Unread', value: dashboardStats.todayNotifications },
        { label: 'Today', value: dashboardStats.todayNotifications }
      ]
    },
    {
      title: 'File & Media Manager', description: 'Upload tournament posters, certificates, receipts with cloud storage',
      iconSrc: '/icons/folder.png', route: '/dashboard/files', module: '*', category: 'Operations',
      stats: [
        { label: 'Total Files', value: dashboardStats.totalFiles },
        { label: 'Storage Used', value: '0 GB' }
      ]
    },
    {
      title: 'Audit Logs', description: 'Track admin actions, login history, and system activity with detailed logs',
      iconSrc: '/icons/log.png', route: '/dashboard/audit-logs', module: 'super_admin_only',
      badge: 'Super Admin', category: 'System',
      stats: [
        { label: 'Today Actions', value: dashboardStats.todayAuditActions },
        { label: 'Total Logs', value: dashboardStats.totalAuditLogs }
      ]
    },
    {
      title: 'Employee Management', description: 'Manage employee records, documents, Aadhar, PAN, offer letters and details',
      iconSrc: '/icons/admin.png', route: '/dashboard/employees', module: 'super_admin_only',
      badge: 'Super Admin', category: 'HR',
      stats: [
        { label: 'Employees', value: dashboardStats.totalEmployees },
        { label: 'Active', value: dashboardStats.activeEmployees }
      ]
    },
    {
      title: 'Career Applications', description: 'View and manage job applications, review candidates and track hiring status',
      iconSrc: '/icons/internship.png', route: '/dashboard/careers', module: 'super_admin_only',
      badge: 'Super Admin', category: 'HR',
      stats: [
        { label: 'Applications', value: dashboardStats.totalCareerApplications },
        { label: 'Pending', value: dashboardStats.pendingCareerApplications }
      ]
    },
    {
      title: 'Leave Management', description: 'Apply for leave, track leave requests and view approval status',
      iconSrc: '/icons/attendance.png', route: '/dashboard/leave', module: '*',
      badge: 'All Users', category: 'HR',
      stats: [
        { label: 'Requests', value: dashboardStats.leaveRequestsCount },
        { label: 'Pending', value: dashboardStats.pendingLeaveRequests }
      ]
    },
    {
      title: 'HR Dashboard', description: 'Access HR functions including employee management, interns, and certificates',
      iconSrc: '/icons/admin.png', route: '/dashboard/hr', module: 'hr_admin_only',
      badge: 'HR Admin', category: 'HR',
      stats: [
        { label: 'Employees', value: dashboardStats.totalEmployees },
        { label: 'Interns', value: dashboardStats.totalInternships }
      ]
    },
    {
      title: 'Holiday Calendar', description: 'Manage company holidays excluded from working days calculation',
      iconSrc: '/icons/attendance.png', route: '/dashboard/holidays', module: 'super_admin_only',
      badge: 'Super Admin', category: 'HR',
      stats: [
        { label: 'Holidays', value: 0 },
        { label: 'This Year', value: new Date().getFullYear() }
      ]
    },
    {
      title: 'Announcements', description: 'Company-wide announcements and important updates for all team members',
      iconSrc: '/icons/active.png', route: '/dashboard/announcements', module: '*',
      badge: 'Live', category: 'Communication', isNew: true,
      stats: [
        { label: 'Board', value: 'Live' },
        { label: 'All Roles', value: '✓' }
      ]
    },
    {
      title: 'Polls & Surveys', description: 'Create polls, gather team opinions, and make data-driven decisions',
      iconSrc: '/icons/stat.png', route: '/dashboard/polls', module: '*', category: 'Communication',
      stats: [
        { label: 'Voting', value: 'Live' },
        { label: 'Anonymous', value: '✓' }
      ]
    },
    {
      title: 'Task Board', description: 'Kanban-style task management with assignments, priorities, and due dates',
      iconSrc: '/icons/trade.png', route: '/dashboard/tasks', module: '*',
      badge: 'Live', category: 'Core', isNew: true,
      stats: [
        { label: 'Kanban', value: '4 Cols' },
        { label: 'Realtime', value: '✓' }
      ]
    },
    {
      title: 'Daily Standups', description: 'Quick daily updates — yesterday, today, blockers with mood tracking',
      iconSrc: '/icons/chat.png', route: '/dashboard/standups', module: '*', category: 'Communication',
      stats: [
        { label: 'Daily', value: 'Updates' },
        { label: 'Mood', value: '✓' }
      ]
    },
    {
      title: 'Feedback', description: 'Share anonymous or named feedback, suggestions, and bug reports',
      iconSrc: '/icons/social-media.png', route: '/dashboard/feedback', module: '*', category: 'Communication',
      stats: [
        { label: 'System', value: 'Open' },
        { label: 'Anonymous', value: '✓' }
      ]
    },
    {
      title: 'Team Events', description: 'Calendar of meetings, trainings, celebrations, and deadlines',
      iconSrc: '/icons/attendance.png', route: '/dashboard/events', module: '*', category: 'Core',
      stats: [
        { label: 'Calendar', value: 'Live' },
        { label: 'Types', value: '5' }
      ]
    },
    {
      title: 'Performance Scores', description: 'Auto-calculated performance rankings based on attendance and work logs',
      iconSrc: '/icons/analytics.png', route: '/dashboard/performance', module: '*',
      badge: 'Live', category: 'Analytics',
      stats: [
        { label: 'Rankings', value: 'Live' },
        { label: 'Metrics', value: '3' }
      ]
    },
    {
      title: 'Admin Reports', description: 'Generate detailed per-admin reports with attendance, work logs, and leave data',
      iconSrc: '/icons/files.png', route: '/dashboard/reports', module: 'super_admin_only',
      badge: 'Super Admin', category: 'System',
      stats: [
        { label: 'Export', value: 'CSV' },
        { label: 'Detailed', value: '✓' }
      ]
    },
    {
      title: 'Birthday Reminders', description: 'Never miss a team member\'s birthday — upcoming and today\'s celebrations',
      iconSrc: '/icons/certificate.png', route: '/dashboard/birthdays', module: '*', category: 'Core', isNew: true,
      stats: [
        { label: 'Reminders', value: 'Auto' },
        { label: 'Team', value: '✓' }
      ]
    },
  ];
 
  const availableModules = modules.filter(module => {
    if (module.module === '*') return true;
    if (module.module === 'super_admin_only') return adminProfile.role === 'super_admin';
    if (module.module === 'hr_admin_only') return ['hr_admin', 'super_admin'].includes(adminProfile.role as string);
    if (module.module === 'social_admin') return ['social_admin', 'super_admin'].includes(adminProfile.role as string);
    return hasPermission(module.module);
  });
 
  const availableDataEntryCards = dataEntryCards.filter(card => card.visible);
 
  const filteredModules = useMemo(() => {
    return availableModules.filter(m => {
      const matchesSearch = !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(moduleSearch.toLowerCase());
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableModules, moduleSearch, activeCategory]);
 
  // ─── QUICK STATS ──────────────────────────────────────────────────────────
 
  const quickStats: QuickStat[] = [
    {
      label: 'Total Revenue', value: formatCurrency(dashboardStats.totalRevenue),
      icon: IndianRupee, color: 'text-emerald-400', bgColor: 'bg-emerald-400/15',
      trend: dashboardStats.monthlyGrowth >= 0 ? 'up' : 'down',
      trendValue: Math.abs(dashboardStats.monthlyGrowth),
      description: 'Esports + Social combined'
    },
    {
      label: 'Active Users', value: dashboardStats.totalUsers,
      icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-400/15',
      trend: 'up', trendValue: 5, description: 'Across all platforms'
    },
    {
      label: 'Pending Payments', value: dashboardStats.pendingPayments,
      icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-400/15',
      trend: dashboardStats.pendingPayments > 10 ? 'down' : 'neutral',
      description: 'Awaiting verification'
    },
    {
      label: 'Certificates Issued', value: dashboardStats.totalCertificates,
      icon: Award, color: 'text-purple-400', bgColor: 'bg-purple-400/15',
      trend: 'up', trendValue: dashboardStats.monthlyGrowth,
      description: `${dashboardStats.certificatesThisMonth} this month`
    },
    {
      label: 'Team Messages', value: dashboardStats.totalMessages,
      icon: MessageSquare, color: 'text-cyan-400', bgColor: 'bg-cyan-400/15',
      trend: 'neutral', description: 'Total chat history'
    },
    {
      label: 'Success Rate', value: dashboardStats.successRate, suffix: '%',
      icon: Target, color: 'text-green-400', bgColor: 'bg-green-400/15',
      trend: dashboardStats.successRate >= 80 ? 'up' : 'down',
      description: 'Payment success rate'
    },
  ];
 
  // ─── RENDER ACTIVE SECTION ─────────────────────────────────────────────────
 
  const renderActiveSection = () => {
    if (!activeSection) return null;
    return (
      <Card className="mb-8 border-white/15 bg-gradient-to-br from-white/8 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              {activeSection === 'esports' ? <Trophy className="w-4 h-4 text-primary" /> :
               activeSection === 'social' ? <Globe className="w-4 h-4 text-primary" /> :
               <Database className="w-4 h-4 text-primary" />}
            </div>
            {activeSection === 'esports' && 'Esports Players Management'}
            {activeSection === 'social' && 'Social Media Orders'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { setActiveSection(null); setEditingItem(null); }}
            className="h-8 border-white/15 hover:border-red-400/30 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === 'esports' && (
            <EsportsPlayerForm
              onPlayerAdded={() => { fetchRoleSpecificData(); fetchRealDashboardStats(); }}
              editingPlayer={editingItem?.type === 'esports' ? editingItem : undefined}
              onCancelEdit={() => setEditingItem(null)}
            />
          )}
          {activeSection === 'social' && (
            <SocialMediaOrderForm
              onOrderAdded={() => { fetchRoleSpecificData(); fetchRealDashboardStats(); }}
              editingOrder={editingItem?.type === 'social' ? editingItem : undefined}
              onCancelEdit={() => setEditingItem(null)}
            />
          )}
          <DataTable
            activeData={activeData} activeSection={activeSection}
            editingItem={editingItem} setEditingItem={setEditingItem}
            handleDelete={handleDelete}
          />
        </CardContent>
      </Card>
    );
  };
 
  // ─── MOBILE ───────────────────────────────────────────────────────────────
 
  if (isMobile) {
    return (
      <>
        <Header />
        <MobileDashboard adminProfile={adminProfile} dashboardStats={dashboardStats} />
      </>
    );
  }
 
  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
 
  return (
    <TooltipProvider>
      <>
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-screen-2xl">
 
          {/* ── Welcome Banner ─────────────────────────────────────────────── */}
          <WelcomeBanner name={displayProfile.name} role={displayProfile.role} />
 
          {/* ── Quick Actions Bar ──────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Quick Actions</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  onClick={handleManualRefresh}
                  className={cn("flex items-center gap-1 hover:text-foreground transition-colors", isRefreshing && "animate-spin")}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <span>Updated {format(lastRefreshed, 'h:mm:ss a')}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <QuickActionButton icon={Calendar} label="Attendance" onClick={() => navigate('/dashboard/attendance')} color="blue" />
              <QuickActionButton icon={MessageSquare} label="Chat" onClick={() => navigate('/dashboard/chat')} color="green" badge={dashboardStats.todayNotifications > 0 ? dashboardStats.todayNotifications : undefined} />
              <QuickActionButton icon={IndianRupee} label="Payments" onClick={() => navigate('/dashboard/payments')} color="yellow" badge={dashboardStats.pendingPayments > 0 ? dashboardStats.pendingPayments : undefined} />
              <QuickActionButton icon={Bell} label="Alerts" onClick={() => navigate('/dashboard/notifications')} color="purple" badge={dashboardStats.todayNotifications > 0 ? dashboardStats.todayNotifications : undefined} />
              <QuickActionButton icon={BarChart3} label="Analytics" onClick={() => navigate('/dashboard/analytics')} color="cyan" />
              {adminProfile.role === 'super_admin' && (
                <>
                  <QuickActionButton icon={Users} label="Admins" onClick={() => navigate('/dashboard/admin-management')} color="red" />
                  <QuickActionButton icon={Award} label="Certs" onClick={() => navigate('/dashboard/certificates')} color="orange" />
                  <QuickActionButton icon={Shield} label="Audit" onClick={() => navigate('/dashboard/audit-logs')} color="slate" />
                </>
              )}
            </div>
          </div>
 
          {/* ── Key Metrics Grid ───────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              title="Key Metrics"
              icon={BarChart3}
              subtitle="Real-time snapshot of your platform"
              actions={
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                  onClick={() => setExpandedStats(!expandedStats)}>
                  {expandedStats ? <><ChevronUp className="w-3 h-3 mr-1" /> Collapse</> : <><ChevronDown className="w-3 h-3 mr-1" /> Expand</>}
                </Button>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickStats.map((stat, idx) => (
                <BigStatCard key={idx} {...stat} sparkData={getSpark(stat.label)} />
              ))}
            </div>
 
            {expandedStats && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 animate-in slide-in-from-top-2 duration-200">
                {[
                  { label: 'Esports Revenue', value: formatCurrency(dashboardStats.esportsRevenue), icon: Trophy, color: 'blue' },
                  { label: 'Social Revenue', value: formatCurrency(dashboardStats.socialRevenue), icon: Globe, color: 'green' },
                  { label: 'Social Posts', value: dashboardStats.socialPosts, icon: FileText, color: 'pink' },
                  { label: 'Followers Gained', value: `+${dashboardStats.socialFollowersGained}`, icon: TrendingUp, color: 'cyan' },
                  { label: 'Tech Hours', value: `${dashboardStats.techTotalHours}h`, icon: Cpu, color: 'purple' },
                  { label: 'Content Pieces', value: dashboardStats.contentCount, icon: Image, color: 'orange' },
                  { label: 'Leave Requests', value: dashboardStats.leaveRequestsCount, icon: Calendar, color: 'yellow' },
                  { label: 'Pending Leaves', value: dashboardStats.pendingLeaveRequests, icon: Clock, color: 'red' },
                  { label: 'Audit Actions', value: dashboardStats.todayAuditActions, icon: Shield, color: 'slate' },
                  { label: 'Career Apps', value: dashboardStats.totalCareerApplications, icon: BookOpen, color: 'teal' },
                  { label: 'Avg Followers', value: dashboardStats.averageFollowers.toLocaleString(), icon: Star, color: 'amber' },
                  { label: 'Active Employees', value: dashboardStats.activeEmployees, icon: UserCheck, color: 'emerald' },
                ].map((s, i) => (
                  <StatStrip key={i} {...s} icon={s.icon as React.FC<any>} />
                ))}
              </div>
            )}
          </div>
 
          {/* ── Attendance + Revenue Row ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
 
            {/* Attendance Ring */}
            <Card className="border-white/10 bg-gradient-to-br from-white/8 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around">
                  {adminProfile.role === 'super_admin' ? (
                    <>
                      <AttendanceRing
                        percentage={dashboardStats.dailyAdminsPresentPercentage}
                        present={dashboardStats.presentToday}
                        total={dashboardStats.totalAdmins}
                        label="Team Today"
                      />
                      <AttendanceRing
                        percentage={dashboardStats.attendancePercentage}
                        present={dashboardStats.presentDaysThisMonth}
                        total={dashboardStats.workingDaysInMonth}
                        label="My Month"
                      />
                    </>
                  ) : (
                    <AttendanceRing
                      percentage={dashboardStats.attendancePercentage}
                      present={dashboardStats.presentDaysThisMonth}
                      total={dashboardStats.workingDaysInMonth}
                      label={`${format(new Date(), 'MMMM')}`}
                    />
                  )}
                </div>
                <Separator className="my-3 opacity-20" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{dashboardStats.presentDaysThisMonth}</p>
                    <p className="text-xs text-muted-foreground">Days Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{dashboardStats.workingDaysInMonth}</p>
                    <p className="text-xs text-muted-foreground">Working Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
 
            {/* Revenue Chart */}
            <Card className="lg:col-span-2 border-white/10 bg-gradient-to-br from-white/8 to-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Revenue — Last 7 Days
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Esports</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Social</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RevenueChart stats={dashboardStats} />
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: 'Esports', value: formatCurrency(dashboardStats.esportsRevenue), color: 'text-blue-400' },
                    { label: 'Social', value: formatCurrency(dashboardStats.socialRevenue), color: 'text-emerald-400' },
                    { label: 'Total', value: formatCurrency(dashboardStats.totalRevenue), color: 'text-foreground' },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-xl bg-white/5 p-2.5 border border-white/8">
                      <p className={cn("text-base font-bold", r.color)}>{r.value}</p>
                      <p className="text-xs text-muted-foreground">{r.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
 
          {/* ── User Stats Row ─────────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader title="User Statistics" icon={Users} subtitle="Platform-wise user breakdown" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card className="lg:col-span-2 border-white/10 bg-gradient-to-br from-white/8 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserDistributionChart stats={dashboardStats} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { label: 'Esports', value: dashboardStats.esportsUsers, color: 'bg-blue-400' },
                      { label: 'Social', value: dashboardStats.socialUsers, color: 'bg-emerald-400' },
                      { label: 'Employees', value: dashboardStats.totalEmployees, color: 'bg-yellow-400' },
                      { label: 'Interns', value: dashboardStats.totalInternships, color: 'bg-purple-400' },
                    ].map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", d.color)} />
                        <span className="text-xs text-muted-foreground">{d.label}</span>
                        <span className="text-xs font-semibold text-foreground ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Total Users', value: dashboardStats.esportsUsers, icon: Users, color: 'blue', description: 'Platform total' },
                  { label: 'Esports Users', value: dashboardStats.esportsUsers, icon: Trophy, color: 'purple', description: 'Tournament players' },
                  { label: 'Avg. Followers', value: dashboardStats.averageFollowers.toLocaleString(), icon: Star, color: 'yellow', description: 'Social avg.' },
                  { label: 'Active Employees', value: dashboardStats.activeEmployees, icon: UserCheck, color: 'green', description: `of ${dashboardStats.totalEmployees} total` },
                ].map((s, i) => (
                  <BigStatCard key={i} {...s as any} sparkData={getSpark(`us-${i}`)} />
                ))}
              </div>
            </div>
          </div>
 
          {/* ── Daily Tasks & Activity ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DailyTodos />
            <ActivitySummary />
          </div>
 
          {/* ── Super Admin Review Panel ────────────────────────────────────── */}
          {adminProfile?.role === 'super_admin' && (
            <div className="mb-8">
              <SuperAdminReviewPanel />
            </div>
          )}
 
          {/* ── Active Data Entry Section ───────────────────────────────────── */}
          {renderActiveSection()}
 
          {/* ── Data Entry Cards ────────────────────────────────────────────── */}
          {availableDataEntryCards.length > 0 && (
            <div className="mb-8">
              <SectionHeader
                title="Data Management"
                icon={Database}
                subtitle={`${availableDataEntryCards.length} modules available for your role`}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {availableDataEntryCards.map((card, index) => (
                  <ModuleCardEnhanced
                    key={index}
                    card={card}
                    onClick={() => navigate(card.route)}
                    isPinned={pinnedModules.includes(card.title)}
                    onPin={() => handlePinToggle(card.title)}
                    viewMode="grid"
                  />
                ))}
              </div>
            </div>
          )}
 
          {/* ── System Modules ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              title="System Modules"
              icon={LayoutDashboard}
              subtitle={`${filteredModules.length} of ${availableModules.length} modules`}
              actions={
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={e => setModuleSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-black/30 border-white/10 w-48"
                    />
                    {moduleSearch && (
                      <button onClick={() => setModuleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-black/20">
                    {(['grid', 'list'] as const).map(mode => (
                      <button key={mode} onClick={() => setModuleViewMode(mode)}
                        className={cn("h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                          moduleViewMode === mode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
                        {mode === 'grid' ? <Grid3X3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
 
            {/* Pinned Modules */}
            <PinnedModulesRow
              pinned={pinnedModules}
              modules={availableModules}
              navigate={navigate}
              onUnpin={handlePinToggle}
            />
 
            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap mb-5">
              {MODULE_CATEGORIES.map(cat => {
                const CatIcon = CATEGORY_ICONS[cat];
                const count = cat === 'All' ? availableModules.length : availableModules.filter(m => m.category === cat).length;
                if (count === 0 && cat !== 'All') return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all",
                      activeCategory === cat
                        ? "bg-primary/20 border-primary/35 text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    {cat}
                    <span className={cn("text-xs rounded-full px-1.5 py-0",
                      activeCategory === cat ? "bg-primary/20" : "bg-white/10"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
 
            {/* Module Grid / List */}
            {filteredModules.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-white/10 rounded-2xl">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No modules found</p>
                <p className="text-xs mt-1 opacity-60">Try adjusting your search or category filter</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setModuleSearch(''); setActiveCategory('All'); }}>
                  Clear filters
                </Button>
              </div>
            ) : moduleViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredModules.map((module, index) => (
                  <ModuleCardEnhanced
                    key={index}
                    card={module}
                    onClick={() => navigate(module.route)}
                    isPinned={pinnedModules.includes(module.title)}
                    onPin={() => handlePinToggle(module.title)}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredModules.map((module, index) => (
                  <ModuleCardEnhanced
                    key={index}
                    card={module}
                    onClick={() => navigate(module.route)}
                    isPinned={pinnedModules.includes(module.title)}
                    onPin={() => handlePinToggle(module.title)}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </div>
 
          {/* ── Footer Info ──────────────────────────────────────────────────── */}
          <div className="border-t border-white/8 pt-6 mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>THRYLOS Admin Panel</span>
              <Separator orientation="vertical" className="h-3" />
              <span>{availableModules.length} modules available</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="capitalize">{displayProfile.role.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <PulseRing color="bg-green-400" />
              <span>Auto-refresh every 5s</span>
            </div>
          </div>
        </div>
 
        {/* ── Floating Notifications ─────────────────────────────────────────── */}
        <NotificationToast notifications={notifications} />
      </>
    </TooltipProvider>
  );
};
 
export default Dashboard;
 
            
