import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ModuleLayout from '@/components/ModuleLayout';
import { ArrowLeft, Gamepad2, Save, X } from 'lucide-react';

const EsportsAddPlayer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  return (
    <ModuleLayout title={editId ? "Edit Player" : "Add New Player"}>
      <div className="max-w-3xl mx-auto">
        {/* UI will be added later */}
      </div>
    </ModuleLayout>
  );
};

export default EsportsAddPlayer;
const [formData, setFormData] = useState({
  player_name: '',
  game_uid: '',
  email: '',
  tournament_name: '',
  entry_fees: '',
  payment_received: false
});

const [isLoading, setIsLoading] = useState(false);
const [isFetching, setIsFetching] = useState(false);
