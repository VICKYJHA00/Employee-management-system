



import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import {
  Edit, Trash2, Search, Download, Filter, X,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2,
  Mail, Phone, Trophy, Gamepad2, Users, CheckCircle2, Clock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 50;

const PAYMENT_FILTERS = ['All', 'Paid', 'Pending'] as const;
type PaymentFilter = typeof PAYMENT_FILTERS[number];

type SortField = 'player_name' | 'tournament_name' | 'entry_fees' | 'created_at' | 'game_type' | 'rank';
type SortDir   = 'asc' | 'desc';







// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  player_name: string;
  game_uid: string;
  email: string;
  phone?: string;
  tournament_name: string;
  entry_fees: number;
  payment_received: boolean;
  team_name?: string;
  game_type?: string;
  rank?: string;
  avatar_url?: string;
  created_at: string;
}

interface EsportsPlayersListProps {
  onEditPlayer: (player: Player) => void;
  refreshTrigger: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function exportToCSV(players: Player[], filename: string) {
  const headers: (keyof Player)[] = [
    'player_name', 'game_uid', 'email', 'phone', 'tournament_name',
    'entry_fees', 'payment_received', 'team_name', 'game_type', 'rank', 'created_at',
  ];
  const rows = players.map(p =>
    headers.map(h => {
      const val = p[h] ?? '';
      const str = String(val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return dir === 'asc'
    ? <ArrowUp className="w-3 h-3 ml-1 text-blue-400" />
    : <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />;
}








// ─── Player Detail Popover ────────────────────────────────────────────────────

const PlayerDetailPopover: React.FC<{ player: Player; children: React.ReactNode }> = ({ player, children }) => (
  <Popover>
    <PopoverTrigger asChild>{children}</PopoverTrigger>
    <PopoverContent className="w-72 bg-gray-900 border-gray-700 p-0 overflow-hidden" side="right" align="start">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white/5">
        <Avatar className="h-12 w-12 border border-white/20">
          <AvatarImage src={player.avatar_url} alt={player.player_name} />
          <AvatarFallback className="bg-blue-500/20 text-blue-300 text-sm font-bold">
            {getInitials(player.player_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{player.player_name}</p>
          <p className="text-xs text-gray-400 truncate">{player.game_uid}</p>
          {player.rank && (
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300 mt-1">
              {player.rank}
            </Badge>
          )}
        </div>
      </div>
      <Separator className="bg-white/10" />
      {/* Details */}
      <div className="p-4 space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="truncate">{player.email}</span>
        </div>
        {player.phone && (
          <div className="flex items-center gap-2 text-gray-300">
            <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>{player.phone}</span>
          </div>
        )}
        {player.team_name && (
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>{player.team_name}</span>
          </div>
        )}
        {player.game_type && (
          <div className="flex items-center gap-2 text-gray-300">
            <Gamepad2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>{player.game_type}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-300">
          <Trophy className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="truncate">{player.tournament_name}</span>
        </div>
        <Separator className="bg-white/10" />
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Entry Fee</span>
          <span className="font-semibold text-white">₹{player.entry_fees.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Payment</span>
          {player.payment_received
            ? <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Paid</Badge>
            : <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
          }
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Registered</span>
          <span className="text-gray-300 text-xs">{new Date(player.created_at).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  isBulk: boolean;
  count: number;
  playerName?: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}








const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open, isBulk, count, playerName, deleting, onConfirm, onCancel,
}) => (
  <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
    <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          {isBulk ? `Delete ${count} Players?` : 'Delete Player?'}
        </DialogTitle>
        <DialogDescription className="text-gray-400">
          {isBulk
            ? `This will permanently delete ${count} selected player${count > 1 ? 's' : ''}. This action cannot be undone.`
            : `This will permanently delete "${playerName}". This action cannot be undone.`
          }
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} disabled={deleting} className="border-gray-600 text-gray-300">
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 min-w-[100px]"
        >
          {deleting
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Deleting…</>
            : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</>
          }
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);








// ─── Sortable Column Header ───────────────────────────────────────────────────

const SortableHead: React.FC<{
  field: SortField; label: string;
  sortField: SortField; sortDir: SortDir;
  onSort: (f: SortField) => void;
}> = ({ field, label, sortField, sortDir, onSort }) => (
  <TableHead
    className="cursor-pointer select-none hover:text-white transition-colors whitespace-nowrap"
    onClick={() => onSort(field)}
  >
    <span className="flex items-center">
      {label}
      <SortIcon field={field} active={sortField === field} dir={sortDir} />
    </span>
  </TableHead>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EsportsPlayersList: React.FC<EsportsPlayersListProps> = ({ onEditPlayer, refreshTrigger }) => {
  const [players, setPlayers]           = useState<Player[]>([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [isLoading, setIsLoading]       = useState(false);

  // Pagination
  const [currentPage, setCurrentPage]   = useState(1);

  // Search & filters
  const [searchTerm, setSearchTerm]     = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All');
  const [gameTypeFilter, setGameTypeFilter] = useState('all');
  const [tournamentFilter, setTournamentFilter] = useState('all');

  // Sorting
  const [sortField, setSortField]       = useState<SortField>('created_at');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');

  // Selection
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; name?: string; bulk?: boolean } | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const { toast }        = useToast();
  const { logActivity }  = useActivityLogger();








  

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { count } = await supabase
        .from('esports_players')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from('esports_players')
        .select('*')
        .order(sortField, { ascending: sortDir === 'asc' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setPlayers(data || []);
      setSelectedIds(new Set()); // clear selection on reload
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch players', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [refreshTrigger, currentPage, sortField, sortDir]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // ── Filter / sort client-side (within current page) ──────────────────────

  const filteredPlayers = useMemo(() => {
    let list = [...players];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.player_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.tournament_name.toLowerCase().includes(q) ||
        p.game_uid.toLowerCase().includes(q) ||
        (p.team_name || '').toLowerCase().includes(q) ||
        (p.game_type || '').toLowerCase().includes(q)
      );
    }

    if (paymentFilter !== 'All') {
      list = list.filter(p =>
        paymentFilter === 'Paid' ? p.payment_received : !p.payment_received
      );
    }

    if (gameTypeFilter !== 'all') {
      list = list.filter(p => p.game_type === gameTypeFilter);
    }

    if (tournamentFilter !== 'all') {
      list = list.filter(p => p.tournament_name === tournamentFilter);
    }

    return list;
  }, [players, searchTerm, paymentFilter, gameTypeFilter, tournamentFilter]);






  

  // Derived filter options from loaded page data
  const gameTypeOptions = useMemo(() =>
    Array.from(new Set(players.map(p => p.game_type).filter(Boolean))) as string[],
    [players]
  );
  const tournamentOptions = useMemo(() =>
    Array.from(new Set(players.map(p => p.tournament_name).filter(Boolean))) as string[],
    [players]
  );

  const hasActiveFilters = paymentFilter !== 'All' || gameTypeFilter !== 'all' || tournamentFilter !== 'all' || !!searchTerm;





  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);






  
  // ── Sorting ──────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };








  
  // ── Selection ────────────────────────────────────────────────────────────

  const allPageSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every(p => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const n = new Set(prev);
        filteredPlayers.forEach(p => n.delete(p.id));
        return n;
      });
    } else {
      setSelectedIds(prev => {
        const n = new Set(prev);
        filteredPlayers.forEach(p => n.add(p.id));
        return n;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };










  

  // ── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.bulk) {
        const ids = Array.from(selectedIds);
        const { error } = await supabase
          .from('esports_players')
          .delete()
          .in('id', ids);
        if (error) throw error;
        await logActivity(ActivityActions.DELETE_ESPORTS_PLAYER, {
          bulk: true, count: ids.length,
        });
        toast({ title: `${ids.length} players deleted` });
        setSelectedIds(new Set());
      } else {
        const player = players.find(p => p.id === deleteTarget.id);
        const { error } = await supabase
          .from('esports_players')
          .delete()
          .eq('id', deleteTarget.id!);
        if (error) throw error;
        await logActivity(ActivityActions.DELETE_ESPORTS_PLAYER, {
          player_name: player?.player_name,
          tournament:  player?.tournament_name,
        });
        toast({ title: 'Player deleted successfully' });
      }
      setDeleteTarget(null);
      fetchPlayers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? filteredPlayers.filter(p => selectedIds.has(p.id))
      : filteredPlayers;
    exportToCSV(toExport, `thrylos-players-${Date.now()}.csv`);
    toast({ title: `Exported ${toExport.length} player${toExport.length !== 1 ? 's' : ''}` });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="border-white/10">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            {/* Title row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                Esports Players
                <Badge variant="outline" className="text-xs">{totalCount} total</Badge>
                {selectedIds.size > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                    {selectedIds.size} selected
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedIds.size > 0 && (
                  <Button
                    size="sm" variant="destructive"
                    className="bg-red-600/80 hover:bg-red-600 h-8"
                    onClick={() => setDeleteTarget({ bulk: true })}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete {selectedIds.size}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleExport} className="border-white/20 h-8">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {selectedIds.size > 0 ? `Export ${selectedIds.size}` : 'Export CSV'}
                </Button>
              </div>
            </div>








            

            {/* Search + Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, UID, team, game…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-white/5 border-white/10"
                />
              </div>

              <Select value={paymentFilter} onValueChange={v => setPaymentFilter(v as PaymentFilter)}>
                <SelectTrigger className="h-9 w-32 bg-white/5 border-white/10 text-sm">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {PAYMENT_FILTERS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>

              {gameTypeOptions.length > 0 && (
                <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                  <SelectTrigger className="h-9 w-36 bg-white/5 border-white/10 text-sm">
                    <SelectValue placeholder="Game" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Games</SelectItem>
                    {gameTypeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {tournamentOptions.length > 0 && (
                <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                  <SelectTrigger className="h-9 w-44 bg-white/5 border-white/10 text-sm">
                    <SelectValue placeholder="Tournament" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Tournaments</SelectItem>
                    {tournamentOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  size="sm" variant="ghost"
                  className="h-9 text-gray-400 hover:text-white px-2"
                  onClick={() => {
                    setSearchTerm('');
                    setPaymentFilter('All');
                    setGameTypeFilter('all');
                    setTournamentFilter('all');
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Loading players…</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      {/* Select all */}
                      <TableHead className="w-10 pl-4">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleAll}
                          aria-label="Select all on this page"
                        />
                      </TableHead>

                      {/* Avatar */}
                      <TableHead className="w-10" />

                      <SortableHead field="player_name"     label="Player"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <SortableHead field="game_type"       label="Game"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <SortableHead field="tournament_name" label="Tournament"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <SortableHead field="rank"            label="Rank"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <SortableHead field="entry_fees"      label="Entry Fee"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredPlayers.map(player => (
                      <TableRow
                        key={player.id}
                        className={`border-white/5 transition-colors ${selectedIds.has(player.id) ? 'bg-blue-500/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedIds.has(player.id)}
                            onCheckedChange={() => toggleOne(player.id)}
                            aria-label={`Select ${player.player_name}`}
                          />
                        </TableCell>








                        

                        {/* Avatar + popover */}
                        <TableCell>
                          <PlayerDetailPopover player={player}>
                            <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
                              <Avatar className="h-8 w-8 border border-white/20 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all">
                                <AvatarImage src={player.avatar_url} alt={player.player_name} />
                                <AvatarFallback className="bg-blue-500/20 text-blue-300 text-xs font-bold">
                                  {getInitials(player.player_name)}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          </PlayerDetailPopover>
                        </TableCell>







                        

                        {/* Player name */}
                        <TableCell>
                          <div className="font-medium text-white">{player.player_name}</div>
                          <div className="text-xs text-gray-500">{player.game_uid}</div>
                          {player.team_name && (
                            <div className="text-xs text-blue-400 mt-0.5">{player.team_name}</div>
                          )}
                        </TableCell>

                        {/* Game */}
                        <TableCell>
                          {player.game_type
                            ? <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">{player.game_type}</Badge>
                            : <span className="text-gray-600 text-xs">—</span>
                          }
                        </TableCell>

                        {/* Tournament */}
                        <TableCell className="max-w-[180px]">
                          <span className="truncate block text-sm text-gray-300">{player.tournament_name}</span>
                        </TableCell>

                        {/* Rank */}
                        <TableCell>
                          {player.rank
                            ? <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">{player.rank}</Badge>
                            : <span className="text-gray-600 text-xs">—</span>
                          }
                        </TableCell>

                        {/* Entry Fee */}
                        <TableCell className="font-medium text-white">
                          ₹{player.entry_fees.toLocaleString('en-IN')}
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          {player.payment_received ? (
                            <Badge className="bg-green-500/15 text-green-300 border border-green-500/25 text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/15 text-red-300 border border-red-500/25 text-xs gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          )}
                        </TableCell>








                        

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline" size="sm"
                              className="h-7 w-7 p-0 border-white/15 hover:border-blue-500/50"
                              onClick={() => onEditPlayer(player)}
                              aria-label={`Edit ${player.player_name}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              className="h-7 w-7 p-0 border-white/15 hover:border-red-500/50 hover:text-red-400"
                              onClick={() => setDeleteTarget({ id: player.id, name: player.player_name })}
                              aria-label={`Delete ${player.player_name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>









              
              {/* Empty state */}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {hasActiveFilters ? 'No players match your filters.' : 'No players found.'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      size="sm" variant="ghost" className="mt-2 text-blue-400 hover:text-blue-300"
                      onClick={() => {
                        setSearchTerm(''); setPaymentFilter('All');
                        setGameTypeFilter('all'); setTournamentFilter('all');
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}









              

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-5">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Page {currentPage} of {totalPages} · {totalCount} total players
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>








      

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        isBulk={!!deleteTarget?.bulk}
        count={selectedIds.size}
        playerName={deleteTarget?.name}
        deleting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};










export default EsportsPlayersList;
