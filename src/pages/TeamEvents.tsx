




import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, CalendarDays, Clock, MapPin, Trash2, Search,
  Edit, Loader2, Check, HelpCircle, X as XIcon,
  Users, Timer, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string;
  location: string | null;
  created_by: string;
  admins?: { name: string };
}

interface RSVP {
  id: string;
  event_id: string;
  admin_id: string;
  response: 'going' | 'maybe' | 'not_going';
  admins?: { name: string };
}

type RsvpResponse = 'going' | 'maybe' | 'not_going';
type ActiveTab = 'all' | 'meeting' | 'training' | 'celebration' | 'deadline' | 'other';

interface FormState {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  eventType: string;
  location: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  title: '', description: '', eventDate: '', eventTime: '', eventType: 'meeting', location: '',
};

const EVENT_TYPES = [
  { value: 'meeting',     label: 'Meeting',     color: 'bg-blue-500/20 text-blue-400',    dot: 'bg-blue-400' },
  { value: 'training',    label: 'Training',    color: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400' },
  { value: 'celebration', label: 'Celebration', color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-400' },
  { value: 'deadline',    label: 'Deadline',    color: 'bg-red-500/20 text-red-400',       dot: 'bg-red-400' },
  { value: 'other',       label: 'Other',       color: 'bg-gray-500/20 text-gray-400',     dot: 'bg-gray-400' },
];

const RSVP_OPTIONS: { value: RsvpResponse; label: string; icon: React.ReactNode; active: string; idle: string }[] = [
  { value: 'going',     label: 'Going',     icon: <Check className="w-3.5 h-3.5" />,       active: 'bg-green-500/20 text-green-300 border-green-500/40',  idle: 'border-white/10 text-gray-400 hover:border-green-500/30 hover:text-green-300' },
  { value: 'maybe',     label: 'Maybe',     icon: <HelpCircle className="w-3.5 h-3.5" />,  active: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', idle: 'border-white/10 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-300' },
  { value: 'not_going', label: "Can't Go",  icon: <XIcon className="w-3.5 h-3.5" />,       active: 'bg-red-500/20 text-red-300 border-red-500/40',        idle: 'border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-300' },
];

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(eventDate: string, eventTime: string | null): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const target = new Date(`${eventDate}T${eventTime || '00:00:00'}`);

    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setLabel('Happening now'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (d > 0) setLabel(`${d}d ${h}h ${m}m`);
      else if (h > 0) setLabel(`${h}h ${m}m ${s}s`);
      else setLabel(`${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  return label;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const EventTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const meta = EVENT_TYPES.find(t => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
  return <Badge className={`${meta.color} text-xs capitalize`}>{meta.label}</Badge>;
};

/** Live countdown pill — only shown for upcoming events within 7 days */
const CountdownPill: React.FC<{ eventDate: string; eventTime: string | null }> = ({ eventDate, eventTime }) => {
  const label = useCountdown(eventDate, eventTime);
  const daysAway = (new Date(`${eventDate}T00:00:00`).getTime() - Date.now()) / 86_400_000;
  if (daysAway > 7) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/25">
      <Timer className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

/** RSVP summary bar showing going / maybe / not_going counts */
const RsvpSummary: React.FC<{ rsvps: RSVP[] }> = ({ rsvps }) => {
  const going    = rsvps.filter(r => r.response === 'going').length;
  const maybe    = rsvps.filter(r => r.response === 'maybe').length;
  const notGoing = rsvps.filter(r => r.response === 'not_going').length;
  if (!rsvps.length) return null;

  const names = (resp: RsvpResponse) =>
    rsvps.filter(r => r.response === resp).map(r => r.admins?.name ?? 'Unknown').join(', ');

  return (
    <div className="flex items-center gap-3 mt-2">
      <Users className="w-3 h-3 text-gray-600 shrink-0" />
      <TooltipProvider>
        {going > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-green-400 cursor-default">
                <Check className="w-3 h-3" />{going}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-xs">{names('going')}</TooltipContent>
          </Tooltip>
        )}
        {maybe > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-yellow-400 cursor-default">
                <HelpCircle className="w-3 h-3" />{maybe}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-xs">{names('maybe')}</TooltipContent>
          </Tooltip>
        )}
        {notGoing > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-red-400 cursor-default">
                <XIcon className="w-3 h-3" />{notGoing}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-700 text-xs">{names('not_going')}</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

/** RSVP buttons for a single event */
const RsvpButtons: React.FC<{
  eventId: string;
  adminId: string;
  rsvps: RSVP[];
  onChanged: () => void;
}> = ({ eventId, adminId, rsvps, onChanged }) => {
  const myRsvp   = rsvps.find(r => r.admin_id === adminId);
  const [saving, setSaving] = useState(false);

  const handleRsvp = async (response: RsvpResponse) => {
    // Toggle off if clicking the same option
    if (myRsvp?.response === response) {
      setSaving(true);
      await supabase.from('event_rsvps' as any).delete().eq('id', myRsvp.id);
      setSaving(false);
      onChanged();
      return;
    }
    setSaving(true);
    if (myRsvp) {
      await supabase.from('event_rsvps' as any).update({ response }).eq('id', myRsvp.id);
    } else {
      await supabase.from('event_rsvps' as any).insert({ event_id: eventId, admin_id: adminId, response } as any);
    }
    setSaving(false);
    onChanged();
  };

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {saving && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
      {RSVP_OPTIONS.map(opt => {
        const isActive = myRsvp?.response === opt.value;
        return (
          <button
            key={opt.value}
            disabled={saving}
            onClick={() => handleRsvp(opt.value)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${isActive ? opt.active : opt.idle}`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Event Form ───────────────────────────────────────────────────────────────

const EventForm: React.FC<{
  initial?: FormState;
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}> = ({ initial = EMPTY_FORM, onSubmit, onCancel, isEditing }) => {
  const [form, setForm]     = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.eventDate) {
      toast({ title: 'Title and date are required.', variant: 'destructive' }); return;
    }
    setSaving(true);
    try { await onSubmit(form); } finally { setSaving(false); }
  };

  return (
    <Card className="mb-5 border-white/10 bg-white/5">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Event title *" value={form.title} onChange={set('title')} required
            className="bg-white/5 border-white/10"
          />
          <Textarea
            placeholder="Description…" value={form.description} onChange={set('description')}
            className="bg-white/5 border-white/10 min-h-[72px]"
          />
          <div className="flex gap-3 flex-wrap">
            <Input
              type="date" value={form.eventDate} onChange={set('eventDate')} required
              className="w-40 bg-white/5 border-white/10"
            />
            <Input
              type="time" value={form.eventTime} onChange={set('eventTime')}
              className="w-32 bg-white/5 border-white/10"
            />
            <Select value={form.eventType} onValueChange={v => setForm(p => ({ ...p, eventType: v }))}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Location" value={form.location} onChange={set('location')}
              className="w-44 bg-white/5 border-white/10"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={saving} className="gradient-primary min-w-[100px]">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} className="border-white/20">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// ─── Single event card ────────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: TeamEvent;
  rsvps: RSVP[];
  adminId: string;
  isSuperAdmin: boolean;
  isPast?: boolean;
  onEdit: (e: TeamEvent) => void;
  onDelete: (e: TeamEvent) => void;
  onRsvpChanged: () => void;
}> = ({ event, rsvps, adminId, isSuperAdmin, isPast, onEdit, onDelete, onRsvpChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const eventRsvps = rsvps.filter(r => r.event_id === event.id);

  return (
    <Card className={`border-white/10 bg-white/5 transition-opacity ${isPast ? 'opacity-55' : ''}`}>
      <CardContent className={isPast ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`font-semibold text-white ${isPast ? 'text-sm' : ''}`}>{event.title}</h3>
              <EventTypeBadge type={event.event_type} />
              {!isPast && <CountdownPill eventDate={event.event_date} eventTime={event.event_time} />}
            </div>

            {/* Description (collapsible if long) */}
            {event.description && (
              <div className="mb-2">
                <p className={`text-sm text-gray-300 ${!expanded && event.description.length > 120 ? 'line-clamp-2' : ''}`}>
                  {event.description}
                </p>
                {event.description.length > 120 && (
                  <button
                    className="text-xs text-blue-400 mt-0.5 flex items-center gap-0.5"
                    onClick={() => setExpanded(v => !v)}
                  >
                    {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                  </button>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
              {event.event_time && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.event_time}</span>
              )}
              {event.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
              )}
              {event.admins?.name && (
                <span className="text-gray-600">by {event.admins.name}</span>
              )}
            </div>

            {/* RSVP */}
            {!isPast && (
              <>
                <RsvpButtons eventId={event.id} adminId={adminId} rsvps={eventRsvps} onChanged={onRsvpChanged} />
                <RsvpSummary rsvps={eventRsvps} />
              </>
            )}
          </div>

          {/* Actions */}
          {isSuperAdmin && (
            <div className="flex gap-1 shrink-0">
              {!isPast && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-blue-400"
                  onClick={() => onEdit(event)}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost" size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                onClick={() => onDelete(event)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TeamEvents: React.FC = () => {
  const { adminProfile } = useAuth();
  const [events, setEvents]     = useState<TeamEvent[]>([]);
  const [rsvps, setRsvps]       = useState<RSVP[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');

  // Form
  const [showForm, setShowForm]       = useState(false);
  const [editingEvent, setEditingEvent] = useState<TeamEvent | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<TeamEvent | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const adminId      = adminProfile?.id ?? '';
  const todayStr     = new Date().toISOString().split('T')[0];

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    const [{ data: evData }, { data: rsvpData }] = await Promise.all([
      supabase
        .from('team_events' as any)
        .select('*, admins!team_events_created_by_fkey(name)')
        .order('event_date', { ascending: true }),
      supabase
        .from('event_rsvps' as any)
        .select('*, admins(name)'),
    ]);
    setEvents((evData as TeamEvent[]) || []);
    setRsvps((rsvpData as RSVP[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // ─── Create ──────────────────────────────────────────────────────────────────

  const handleCreate = async (form: FormState) => {
    const { error } = await supabase.from('team_events' as any).insert({
      title:       form.title,
      description: form.description || null,
      event_date:  form.eventDate,
      event_time:  form.eventTime || null,
      event_type:  form.eventType,
      location:    form.location || null,
      created_by:  adminId,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event created!' });
    setShowForm(false);
    fetchEvents();
  };

  // ─── Update ──────────────────────────────────────────────────────────────────

  const handleUpdate = async (form: FormState) => {
    if (!editingEvent) return;
    const { error } = await supabase.from('team_events' as any).update({
      title:       form.title,
      description: form.description || null,
      event_date:  form.eventDate,
      event_time:  form.eventTime || null,
      event_type:  form.eventType,
      location:    form.location || null,
    }).eq('id', editingEvent.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event updated!' });
    setEditingEvent(null);
    fetchEvents();
  };

  // ─── Delete ───────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from('event_rsvps' as any).delete().eq('event_id', deleteTarget.id);
    await supabase.from('team_events' as any).delete().eq('id', deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    toast({ title: 'Event deleted' });
    fetchEvents();
  };

  // ─── Filtered + grouped events ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (activeTab !== 'all' && e.event_type !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.event_type || '').toLowerCase().includes(q) ||
        (e.location || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    });
  }, [events, search, activeTab]);

  const upcoming = filtered.filter(e => e.event_date >= todayStr);
  const past     = filtered.filter(e => e.event_date < todayStr).slice(0, 15);

  // Tab counts (all events, ignoring search, for badge numbers)
  const tabCounts = useMemo(() => {
    const upcoming = events.filter(e => e.event_date >= todayStr);
    return EVENT_TYPES.reduce((acc, t) => {
      acc[t.value] = upcoming.filter(e => e.event_type === t.value).length;
      return acc;
    }, {} as Record<string, number>);
  }, [events]);

  // ─── Form initial values for editing ────────────────────────────────────────

  const editInitial = editingEvent ? {
    title:       editingEvent.title,
    description: editingEvent.description ?? '',
    eventDate:   editingEvent.event_date,
    eventTime:   editingEvent.event_time ?? '',
    eventType:   editingEvent.event_type,
    location:    editingEvent.location ?? '',
  } : undefined;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout
        title="Team Events"
        description="Calendar of team events and meetings"
        actions={
          isSuperAdmin && !showForm && !editingEvent ? (
            <Button onClick={() => setShowForm(true)} size="sm" className="gradient-primary">
              <Plus className="w-4 h-4 mr-1" /> New Event
            </Button>
          ) : undefined
        }
      >
        {/* ── Create form ── */}
        {showForm && isSuperAdmin && (
          <EventForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* ── Edit form ── */}
        {editingEvent && isSuperAdmin && (
          <EventForm
            initial={editInitial}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEvent(null)}
            isEditing
          />
        )}

        {/* ── Search ── */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        {/* ── Type filter tabs ── */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ActiveTab)} className="mb-5">
          <TabsList className="bg-white/5 flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10">
              All <span className="ml-1 text-gray-500">{events.filter(e => e.event_date >= todayStr).length}</span>
            </TabsTrigger>
            {EVENT_TYPES.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="text-xs data-[state=active]:bg-white/10">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${t.dot}`} />
                {t.label}
                {tabCounts[t.value] > 0 && (
                  <span className="ml-1 text-gray-500">{tabCounts[t.value]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
                  Upcoming · {upcoming.length}
                </h3>
                <div className="space-y-2">
                  {upcoming.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      rsvps={rsvps}
                      adminId={adminId}
                      isSuperAdmin={isSuperAdmin}
                      onEdit={setEditingEvent}
                      onDelete={setDeleteTarget}
                      onRsvpChanged={fetchEvents}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
                  Past Events
                </h3>
                <div className="space-y-2">
                  {past.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      rsvps={rsvps}
                      adminId={adminId}
                      isSuperAdmin={isSuperAdmin}
                      isPast
                      onEdit={setEditingEvent}
                      onDelete={setDeleteTarget}
                      onRsvpChanged={fetchEvents}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && past.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {search || activeTab !== 'all' ? 'No events match your filters.' : 'No events yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </ModuleLayout>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Delete Event?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete{' '}
              <span className="text-white font-medium">"{deleteTarget?.title}"</span>{' '}
              and all RSVPs. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 min-w-[90px]"
            >
              {isDeleting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamEvents;
