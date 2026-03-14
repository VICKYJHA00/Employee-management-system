
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';

interface EsportsPlayersListProps {
  onEditPlayer: (player: any) => void;
  refreshTrigger: number;
}

const EsportsPlayersList: React.FC<EsportsPlayersListProps> = ({ onEditPlayer, refreshTrigger }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  
  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    fetchPlayers();
  }, [refreshTrigger, currentPage]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm]);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const { count } = await supabase
        .from('esports_players')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from('esports_players')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPlayers = () => {
    if (!searchTerm) {
      setFilteredPlayers(players);
      return;
    }

    const filtered = players.filter(player =>
      player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.game_uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    const playerToDelete = players.find(p => p.id === id);

    try {
      const { error } = await supabase
        .from('esports_players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the activity
      await logActivity(ActivityActions.DELETE_ESPORTS_PLAYER, { 
        player_name: playerToDelete?.player_name,
        tournament: playerToDelete?.tournament_name
      });

      toast({
        title: "Success",
        description: "Player deleted successfully!",
      });
      
      fetchPlayers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete player",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Esports Players ({totalCount} total)</span>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Game UID</TableHead>
                  <TableHead>Entry Fees</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.player_name}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.tournament_name}</TableCell>
                    <TableCell>{player.game_uid}</TableCell>
                    <TableCell>₹{player.entry_fees}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        player.payment_received 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {player.payment_received ? 'Paid' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPlayer(player)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(player.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Page {currentPage} of {totalPages} ({totalCount} total players)
                </p>
              </div>
            )}

            {filteredPlayers.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No players found matching your search.' : 'No players found.'}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EsportsPlayersList;
