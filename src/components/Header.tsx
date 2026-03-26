



import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { roleNames } from '@/types/auth';
import {
  LogOut, ChevronRight, Home, Settings, User,
  Zap, Users, BarChart3, Calendar, Shield,
  Circle, Moon, Coffee,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

// ─── Types ────────────────────────────────────────────────────────────────────
// Use a const assertion for stronger type inference if reused elsewhere
export const ADMIN_STATUSES = ['online', 'away', 'busy'] as const;
export type AdminStatus = typeof ADMIN_STATUSES[number];

// Optional: reusable Tailwind class type for better semantics
type TailwindClass = string;

// Centralized icon type (helps if you later swap icon systems)
type IconType = React.ReactNode;

export interface StatusConfig {
  /** Display label for the status */
  readonly label: string;

  /** Tailwind background color class */
  readonly color: TailwindClass;

  /** Tailwind ring color class */
  readonly ringColor: TailwindClass;

  /** Icon representing the status */
  readonly icon: IconType;

  /** Tailwind classes for the status dot */
  readonly dotClass: TailwindClass;
}

export interface QuickAction {
  /** Display label for the action */
  readonly label: string;

  /** Human-readable shortcut (e.g. "⌘ + H") */
  readonly shortcut: string;

  /** Key combination to trigger the action (order-sensitive) */
  readonly keys: ReadonlyArray<string>;

  /** Icon for the action */
  readonly icon: IconType;

  /** Navigation path */
  readonly path: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Optional: extract repeated Tailwind sizing into a constant
const ICON_SIZE = 'w-3 h-3';

// Optional: helper to build icon classes consistently
const iconClass = (color: string, fill = false) =>
  `${ICON_SIZE} ${fill ? `fill-${color}` : ''} text-${color}`.trim();

export const STATUS_CONFIG: Readonly<Record<AdminStatus, StatusConfig>> = {
  online: {
    label: 'Online',
    color: 'bg-green-500',
    ringColor: 'ring-green-500',
    icon: (
      <Circle
        className={iconClass('green-400', true)}
        aria-label="Online status"
      />
    ),
    dotClass: 'bg-green-400',
  },

  away: {
    label: 'Away',
    color: 'bg-yellow-500',
    ringColor: 'ring-yellow-500',
    icon: (
      <Moon
        className={iconClass('yellow-400')}
        aria-label="Away status"
      />
    ),
    dotClass: 'bg-yellow-400',
  },

  busy: {
    label: 'Do Not Disturb',
    color: 'bg-red-500',
    ringColor: 'ring-red-500',
    icon: (
      <Coffee
        className={iconClass('red-400')}
        aria-label="Do Not Disturb status"
      />
    ),
    dotClass: 'bg-red-400',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [
    { label: 'Dashboard', path: '/' },
    ...segments.map((seg, i) => ({
      label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      path:  '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];
  // Deduplicate if we're already at root
  return segments.length === 0 ? [crumbs[0]] : crumbs;
}

/** Persist admin status in localStorage */
function useAdminStatus() {
  const [status, setStatusRaw] = useState<AdminStatus>(
    () => (localStorage.getItem('adminStatus') as AdminStatus) || 'online'
  );
  const setStatus = (s: AdminStatus) => {
    setStatusRaw(s);
    localStorage.setItem('adminStatus', s);
  };
  return [status, setStatus] as const;
}

// ─── Animated gradient logo ───────────────────────────────────────────────────

const AnimatedLogo: React.FC = () => (
  <>
    <style>{`
      @keyframes gradientShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .thrylos-logo-text {
        background: linear-gradient(
          270deg,
          #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #f97316
        );
        background-size: 300% 300%;
        animation: gradientShift 5s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      @keyframes pulseGlow {
        0%, 100% { filter: drop-shadow(0 0 4px rgba(249,115,22,0.4)); }
        50%       { filter: drop-shadow(0 0 10px rgba(236,72,153,0.6)); }
      }
      .thrylos-logo-img {
        animation: pulseGlow 3s ease-in-out infinite;
      }
    `}</style>
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <img
        src="/thrylosindia.png"
        alt="THRYLOS logo"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 thrylos-logo-img"
      />
      <div className="shrink-0">
        <div
          className="thrylos-logo-text text-lg sm:text-2xl font-extrabold tracking-wide"
          style={{ fontFamily: "'Nixmat', sans-serif" }}
        >
          ThryLos
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block -mt-0.5 tracking-widest uppercase">
          Admin Dashboard
        </p>
      </div>
    </div>
  </>
);

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb: React.FC = () => {
  const navigate  = useNavigate();
  const crumbs    = useBreadcrumbs();

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-xs text-gray-500 ml-6 pl-6 border-l border-gray-800">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-gray-700 shrink-0" />}
            {isLast ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <button
                onClick={() => navigate(crumb.path)}
                className="hover:text-gray-300 transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadgeButton: React.FC<{
  status: AdminStatus;
  onChange: (s: AdminStatus) => void;
}> = ({ status, onChange }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {cfg.icon}
          <span className="hidden lg:inline">{cfg.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-black border-gray-800">
        <DropdownMenuLabel className="text-xs text-gray-500">Set status</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        {(Object.entries(STATUS_CONFIG) as [AdminStatus, StatusConfig][]).map(([key, s]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onChange(key)}
            className={`gap-2 text-sm ${status === key ? 'bg-white/5' : ''} hover:bg-gray-800`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dotClass}`} />
            {s.label}
            {status === key && <span className="ml-auto text-xs text-gray-600">active</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─── Quick Actions Panel ──────────────────────────────────────────────────────

const QuickActionsMenu: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const gPressed = useRef(false);
  const gTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut handler: "G then X"
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't fire inside inputs/textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

    if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
      gPressed.current = true;
      if (gTimer.current) clearTimeout(gTimer.current);
      gTimer.current = setTimeout(() => { gPressed.current = false; }, 1500);
      return;
    }

    if (gPressed.current) {
      const action = QUICK_ACTIONS.find(a => a.keys[1] === e.key.toLowerCase());
      if (action) {
        e.preventDefault();
        gPressed.current = false;
        navigate(action.path);
      }
    }

    // ? to open the quick actions panel
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      setOpen(v => !v);
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Quick Nav</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-gray-800 border border-gray-700 rounded text-gray-400">
                  ?
                </kbd>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-black border-gray-800" sideOffset={8}>
              <DropdownMenuLabel className="text-xs text-gray-500 flex items-center justify-between">
                Quick Navigation
                <span className="text-[10px] text-gray-600">Press G then key</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuGroup>
                {QUICK_ACTIONS.map(action => (
                  <DropdownMenuItem
                    key={action.path}
                    onClick={() => { navigate(action.path); setOpen(false); }}
                    className="gap-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                  >
                    <span className="text-gray-500">{action.icon}</span>
                    {action.label}
                    <DropdownMenuShortcut className="font-mono text-[10px] text-gray-600">
                      {action.shortcut}
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-xs">
          Quick navigation — press <kbd className="font-mono bg-gray-800 px-1 rounded">?</kbd> to open
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Status dot overlay on avatar ────────────────────────────────────────────

const AvatarWithStatus: React.FC<{
  src?: string; name: string; status: AdminStatus;
}> = ({ src, name, status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="relative">
      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-700">
        <AvatarImage src={src} alt={name} className="object-cover" />
        <AvatarFallback className="bg-gray-800 text-white text-xs font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {/* Status dot */}
      <span
        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${cfg.dotClass}`}
        aria-label={cfg.label}
      />
    </div>
  );
};

// ─── Main Header ─────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const { user, adminProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [adminStatus, setAdminStatus] = useAdminStatus();

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-black/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 gap-0">

            {/* ── Left: Logo + Breadcrumb ── */}
            <div className="flex items-center min-w-0 flex-1">
              <AnimatedLogo />
              <Breadcrumb />
            </div>

            {/* ── Right: Actions + User ── */}
            {user && adminProfile ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">

                {/* Quick Actions */}
                <QuickActionsMenu />

                {/* Status toggle */}
                <StatusBadgeButton status={adminStatus} onChange={setAdminStatus} />

                {/* Notification bell */}
                <NotificationBell />

                {/* Divider */}
                <div className="w-px h-5 bg-gray-800 mx-1 hidden sm:block" />

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 sm:h-10 w-auto px-1 sm:px-3 hover:bg-gray-800/80 gap-2.5 focus-visible:ring-0"
                    >
                      {/* Name + role (hidden on mobile) */}
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white leading-tight">{adminProfile.name}</p>
                        <p className="text-[10px] text-gray-500 leading-tight">{roleNames[adminProfile.role]}</p>
                      </div>
                      {/* Avatar with status dot */}
                      <AvatarWithStatus
                        src={adminProfile.avatar || undefined}
                        name={adminProfile.name}
                        status={adminStatus}
                      />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 bg-black border-gray-800 shadow-xl" sideOffset={8}>
                    {/* Profile summary */}
                    <div className="px-3 py-3 flex items-center gap-3">
                      <AvatarWithStatus
                        src={adminProfile.avatar || undefined}
                        name={adminProfile.name}
                        status={adminStatus}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{adminProfile.name}</p>
                        <p className="text-xs text-gray-500 truncate">{adminProfile.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-gray-700 text-gray-400 font-normal">
                            {roleNames[adminProfile.role]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1.5 font-normal border-0 ${
                              adminStatus === 'online' ? 'bg-green-500/15 text-green-400'
                              : adminStatus === 'away' ? 'bg-yellow-500/15 text-yellow-400'
                              : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {STATUS_CONFIG[adminStatus].label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator className="bg-gray-800" />

                    {/* Navigation shortcuts */}
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-1">
                        Account
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="gap-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                        onClick={() => navigate('/profile')}
                      >
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        Profile
                        <DropdownMenuShortcut className="font-mono text-[10px] text-gray-600">G P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                        onClick={() => navigate('/settings')}
                      >
                        <Settings className="w-3.5 h-3.5 text-gray-500" />
                        Settings
                        <DropdownMenuShortcut className="font-mono text-[10px] text-gray-600">G S</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    {/* Status submenu */}
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-1">
                        Status
                      </DropdownMenuLabel>
                      {(Object.entries(STATUS_CONFIG) as [AdminStatus, StatusConfig][]).map(([key, s]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => setAdminStatus(key)}
                          className={`gap-2.5 text-sm hover:bg-gray-800 cursor-pointer ${
                            adminStatus === key ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${s.dotClass}`} />
                          {s.label}
                          {adminStatus === key && (
                            <span className="ml-auto text-[10px] text-gray-600">current</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-gray-800" />

                    {/* Logout */}
                    <DropdownMenuItem
                      className="gap-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/50 cursor-pointer"
                      onClick={logout}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                      <DropdownMenuShortcut className="font-mono text-[10px] text-red-800">⇧ Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-8"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};





export default Header;
