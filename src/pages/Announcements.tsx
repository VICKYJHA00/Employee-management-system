import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Pin, Plus, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Announcements: React.FC = () => {
  const { adminProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isPinned, setIsPinned] = useState(false);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements' as any)
      .select('*, admins!announcements_created_by_fkey(name, role)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setAnnouncements((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    const { error } = await supabase.from('announcements' as any).insert({
      title, content, priority, is_pinned: isPinned, created_by: adminProfile?.id
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Announcement posted!' });
    setTitle(''); setContent(''); setPriority('normal'); setIsPinned(false); setShowForm(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await supabase.from('announcements' as any).delete().eq('id', id);
    fetchAnnouncements();
  };

  const filtered = announcements.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400',
    normal: 'bg-blue-500/20 text-blue-400', low: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Announcements" description="Company-wide announcements and updates"
        actions={isSuperAdmin ? <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New</Button> : undefined}>
        
        {showForm && isSuperAdmin && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10" />
              <Textarea placeholder="Content..." value={content} onChange={e => setContent(e.target.value)} className="bg-white/5 border-white/10" />
              <div className="flex gap-3 items-center">
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} /> Pin
                </label>
                <Button onClick={handleCreate} size="sm">Post</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
          </div>
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : filtered.length === 0 ? <p className="text-gray-400">No announcements yet.</p> : (
          <div className="space-y-3">
            {filtered.map(a => (
              <Card key={a.id} className={`border-white/10 bg-white/5 ${a.is_pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.is_pinned && <Pin className="w-3 h-3 text-blue-400" />}
                        <h3 className="font-semibold text-white">{a.title}</h3>
                        <Badge className={priorityColors[a.priority] || priorityColors.normal}>{a.priority}</Badge>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{a.content}</p>
                      <p className="text-xs text-gray-500 mt-2">By {a.admins?.name || 'Unknown'} • {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default Announcements;
