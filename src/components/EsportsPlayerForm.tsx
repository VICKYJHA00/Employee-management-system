
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';

interface EsportsPlayerFormProps {
  onPlayerAdded: () => void;
  editingPlayer?: any;
  onCancelEdit?: () => void;
}

const EsportsPlayerForm: React.FC<EsportsPlayerFormProps> = ({ onPlayerAdded, editingPlayer, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    player_name: editingPlayer?.player_name || '',
    game_uid: editingPlayer?.game_uid || '',
    email: editingPlayer?.email || '',
    tournament_name: editingPlayer?.tournament_name || '',
    entry_fees: editingPlayer?.entry_fees || '',
    payment_received: editingPlayer?.payment_received || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const playerData = {
        ...formData,
        entry_fees: parseFloat(formData.entry_fees)
      };

      if (editingPlayer) {
        const { error } = await supabase
          .from('esports_players')
          .update(playerData)
          .eq('id', editingPlayer.id);
        
        if (error) throw error;
        await logActivity(ActivityActions.UPDATE_ESPORTS_PLAYER, { 
          player_name: formData.player_name, 
          tournament: formData.tournament_name 
        });
        toast({
          title: "Success",
          description: "Player updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('esports_players')
          .insert([playerData]);
        
        if (error) throw error;
        await logActivity(ActivityActions.CREATE_ESPORTS_PLAYER, { 
          player_name: formData.player_name, 
          tournament: formData.tournament_name 
        });
        toast({
          title: "Success",
          description: "Player added successfully!",
        });
      }

      setFormData({
        player_name: '',
        game_uid: '',
        email: '',
        tournament_name: '',
        entry_fees: '',
        payment_received: false
      });
      onPlayerAdded();
      onCancelEdit?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save player data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gradient-card border border-white/20">
      <CardHeader>
        <CardTitle>{editingPlayer ? 'Edit Player' : 'Add New Esports Player'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player_name">Player Name</Label>
              <Input
                id="player_name"
                value={formData.player_name}
                onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                required
                className="bg-black/30 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="game_uid">Game UID</Label>
              <Input
                id="game_uid"
                value={formData.game_uid}
                onChange={(e) => setFormData(prev => ({ ...prev, game_uid: e.target.value }))}
                required
                className="bg-black/30 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="bg-black/30 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament_name">Tournament Name</Label>
              <Input
                id="tournament_name"
                value={formData.tournament_name}
                onChange={(e) => setFormData(prev => ({ ...prev, tournament_name: e.target.value }))}
                required
                className="bg-black/30 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry_fees">Entry Fees (₹)</Label>
              <Input
                id="entry_fees"
                type="number"
                step="0.01"
                value={formData.entry_fees}
                onChange={(e) => setFormData(prev => ({ ...prev, entry_fees: e.target.value }))}
                required
                className="bg-black/30 border-white/20"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="payment_received"
                checked={formData.payment_received}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, payment_received: checked }))}
              />
              <Label htmlFor="payment_received">Payment Received</Label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="gradient-primary">
              {isLoading ? "Saving..." : (editingPlayer ? "Update Player" : "Add Player")}
            </Button>
            {editingPlayer && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EsportsPlayerForm;
