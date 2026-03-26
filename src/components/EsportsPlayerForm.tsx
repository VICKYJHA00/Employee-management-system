
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { Upload, X, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_TYPES = [
  'BGMI', 'Free Fire', 'Valorant', 'CS2', 'Fortnite',
  'Call of Duty', 'League of Legends', 'Clash Royale', 'Other',
];

const RANK_OPTIONS = [
  'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond',
  'Grandmaster', 'Challenger', 'Unranked',
];

const MAX_AVATAR_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  player_name: string;
  game_uid: string;
  email: string;
  phone: string;
  tournament_name: string;
  entry_fees: string;
  payment_received: boolean;
  team_name: string;
  game_type: string;
  rank: string;
  avatar_url: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

interface EsportsPlayerFormProps {
  onPlayerAdded: () => void;
  editingPlayer?: any;
  onCancelEdit?: () => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.player_name.trim()) {
    errors.player_name = 'Player name is required.';
  } else if (data.player_name.trim().length < 2) {
    errors.player_name = 'Player name must be at least 2 characters.';
  }

  if (!data.game_uid.trim()) {
    errors.game_uid = 'Game UID is required.';
  } else if (!/^[a-zA-Z0-9_#-]{3,30}$/.test(data.game_uid.trim())) {
    errors.game_uid = 'UID must be 3–30 characters (letters, numbers, _, #, -).';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (data.phone && !/^[6-9]\d{9}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (!data.tournament_name.trim()) {
    errors.tournament_name = 'Tournament name is required.';
  }

  if (!data.game_type) {
    errors.game_type = 'Please select a game type.';
  }

  const fee = parseFloat(data.entry_fees);
  if (!data.entry_fees) {
    errors.entry_fees = 'Entry fee is required.';
  } else if (isNaN(fee) || fee < 0) {
    errors.entry_fees = 'Entry fee must be a positive number.';
  } else if (fee > 100000) {
    errors.entry_fees = 'Entry fee seems too high. Please verify.';
  }

  return errors;
}

// ─── Field wrapper with error/success feedback ────────────────────────────────

const Field: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, touched, required, children }) => (
  <div className="space-y-1.5">
    <Label htmlFor={htmlFor} className="text-sm text-gray-300">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </Label>
    {children}
    {touched && error && (
      <p className="flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {error}
      </p>
    )}
    {touched && !error && (
      <p className="flex items-center gap-1 text-xs text-green-400">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Looks good
      </p>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const EsportsPlayerForm: React.FC<EsportsPlayerFormProps> = ({
  onPlayerAdded,
  editingPlayer,
  onCancelEdit,
}) => {
  const initialForm: FormData = {
    player_name:      editingPlayer?.player_name      || '',
    game_uid:         editingPlayer?.game_uid         || '',
    email:            editingPlayer?.email            || '',
    phone:            editingPlayer?.phone            || '',
    tournament_name:  editingPlayer?.tournament_name  || '',
    entry_fees:       editingPlayer?.entry_fees?.toString() || '',
    payment_received: editingPlayer?.payment_received || false,
    team_name:        editingPlayer?.team_name        || '',
    game_type:        editingPlayer?.game_type        || '',
    rank:             editingPlayer?.rank             || '',
    avatar_url:       editingPlayer?.avatar_url       || '',
  };

  const [formData, setFormData]     = useState<FormData>(initialForm);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [touched, setTouched]       = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isLoading, setIsLoading]   = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(editingPlayer?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  // ── Field helpers ──────────────────────────────────────────────────────────

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Re-validate on change once touched
    if (touched[field]) {
      const next = { ...formData, [field]: value };
      const newErrors = validateForm(next as FormData);
      setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const setSelect = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    const next = { ...formData, [field]: value };
    const newErrors = validateForm(next as FormData);
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  const blur = (field: keyof FormData) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validateForm(formData);
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  // ── Avatar handling ────────────────────────────────────────────────────────

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setAvatarError(`Image must be under ${MAX_AVATAR_SIZE_MB}MB.`);
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarError('');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return formData.avatar_url || null;
    setAvatarUploading(true);
    try {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('player-assets')
        .upload(fileName, avatarFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('player-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err: any) {
      toast({ title: 'Avatar Upload Failed', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields touched and validate fully
    const allTouched = Object.keys(formData).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<keyof FormData, boolean>
    );
    setTouched(allTouched);
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast({ title: 'Please fix the errors before submitting.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const uploadedUrl = await uploadAvatar();

      const playerData = {
        player_name:     formData.player_name.trim(),
        game_uid:        formData.game_uid.trim(),
        email:           formData.email.trim(),
        phone:           formData.phone.trim() || null,
        tournament_name: formData.tournament_name.trim(),
        entry_fees:      parseFloat(formData.entry_fees),
        payment_received: formData.payment_received,
        team_name:       formData.team_name.trim() || null,
        game_type:       formData.game_type || null,
        rank:            formData.rank || null,
        avatar_url:      uploadedUrl || null,
      };

      if (editingPlayer) {
        const { error } = await supabase
          .from('esports_players')
          .update(playerData)
          .eq('id', editingPlayer.id);
        if (error) throw error;
        await logActivity(ActivityActions.UPDATE_ESPORTS_PLAYER, {
          player_name: formData.player_name,
          tournament:  formData.tournament_name,
        });
        toast({ title: 'Player updated successfully!' });
      } else {
        const { error } = await supabase
          .from('esports_players')
          .insert([playerData]);
        if (error) throw error;
        await logActivity(ActivityActions.CREATE_ESPORTS_PLAYER, {
          player_name: formData.player_name,
          tournament:  formData.tournament_name,
        });
        toast({ title: 'Player added successfully!' });
      }

      // Reset
      setFormData({
        player_name: '', game_uid: '', email: '', phone: '',
        tournament_name: '', entry_fees: '', payment_received: false,
        team_name: '', game_type: '', rank: '', avatar_url: '',
      });
      setTouched({});
      setErrors({});
      clearAvatar();
      onPlayerAdded();
      onCancelEdit?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save player data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Input class helper ─────────────────────────────────────────────────────

  const inputClass = (field: keyof FormData) => {
    const base = 'bg-black/30 border-white/20 transition-colors';
    if (!touched[field]) return base;
    if (errors[field]) return `${base} border-red-500/60 focus-visible:ring-red-500/40`;
    return `${base} border-green-500/40 focus-visible:ring-green-500/30`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  const isEditing = !!editingPlayer;

  return (
    <Card className="gradient-card border border-white/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isEditing ? 'Edit Player' : 'Add New Esports Player'}
            {isEditing && (
              <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-300">
                Editing
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* ── Avatar Upload ── */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-black/40 overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-500" />
                )}
              </div>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm text-gray-300">Profile Photo</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="border-white/20 text-sm"
                >
                  {avatarUploading
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading…</>
                    : <><Upload className="w-3.5 h-3.5 mr-1.5" /> {avatarPreview ? 'Change Photo' : 'Upload Photo'}</>
                  }
                </Button>
                <span className="text-xs text-gray-500">JPG, PNG or WebP · max {MAX_AVATAR_SIZE_MB}MB</span>
              </div>
              {avatarError && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" /> {avatarError}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload avatar"
              />
            </div>
          </div>

          {/* ── Section: Identity ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Player Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Player Name" htmlFor="player_name" error={errors.player_name} touched={touched.player_name} required>
                <Input
                  id="player_name"
                  value={formData.player_name}
                  onChange={set('player_name')}
                  onBlur={blur('player_name')}
                  placeholder="e.g. ShadowStrike"
                  className={inputClass('player_name')}
                />
              </Field>

              <Field label="Game UID" htmlFor="game_uid" error={errors.game_uid} touched={touched.game_uid} required>
                <Input
                  id="game_uid"
                  value={formData.game_uid}
                  onChange={set('game_uid')}
                  onBlur={blur('game_uid')}
                  placeholder="e.g. 51239847#1234"
                  className={inputClass('game_uid')}
                />
              </Field>

              <Field label="Email" htmlFor="email" error={errors.email} touched={touched.email} required>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={set('email')}
                  onBlur={blur('email')}
                  placeholder="player@email.com"
                  className={inputClass('email')}
                />
              </Field>

              <Field label="Phone Number" htmlFor="phone" error={errors.phone} touched={touched.phone}>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={set('phone')}
                  onBlur={blur('phone')}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={inputClass('phone')}
                />
              </Field>
            </div>
          </div>

          {/* ── Section: Game Info ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Game Info</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Game Type" htmlFor="game_type" error={errors.game_type} touched={touched.game_type} required>
                <Select value={formData.game_type} onValueChange={setSelect('game_type')}>
                  <SelectTrigger id="game_type" className={`bg-black/30 border-white/20 ${touched.game_type && errors.game_type ? 'border-red-500/60' : touched.game_type && !errors.game_type ? 'border-green-500/40' : ''}`}>
                    <SelectValue placeholder="Select game…" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {GAME_TYPES.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Rank / Tier" htmlFor="rank" error={errors.rank} touched={touched.rank}>
                <Select value={formData.rank} onValueChange={setSelect('rank')}>
                  <SelectTrigger id="rank" className="bg-black/30 border-white/20">
                    <SelectValue placeholder="Select rank…" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {RANK_OPTIONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Team Name" htmlFor="team_name" error={errors.team_name} touched={touched.team_name}>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={set('team_name')}
                  onBlur={blur('team_name')}
                  placeholder="e.g. Team Phantom"
                  className={inputClass('team_name')}
                />
              </Field>
            </div>
          </div>

          {/* ── Section: Tournament & Payment ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Tournament & Payment</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tournament Name" htmlFor="tournament_name" error={errors.tournament_name} touched={touched.tournament_name} required>
                <Input
                  id="tournament_name"
                  value={formData.tournament_name}
                  onChange={set('tournament_name')}
                  onBlur={blur('tournament_name')}
                  placeholder="e.g. THRYLOS Open Season 1"
                  className={inputClass('tournament_name')}
                />
              </Field>

              <Field label="Entry Fees (₹)" htmlFor="entry_fees" error={errors.entry_fees} touched={touched.entry_fees} required>
                <Input
                  id="entry_fees"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.entry_fees}
                  onChange={set('entry_fees')}
                  onBlur={blur('entry_fees')}
                  placeholder="0.00"
                  className={inputClass('entry_fees')}
                />
              </Field>

              <div className="flex items-center gap-3 pt-5 md:col-span-2">
                <Switch
                  id="payment_received"
                  checked={formData.payment_received}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, payment_received: checked }))
                  }
                />
                <Label htmlFor="payment_received" className="cursor-pointer">
                  Payment Received
                </Label>
                {formData.payment_received && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                  </Badge>
                )}
              </div>
            </div>
          </div>




          
          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <Button
              type="submit"
              disabled={isLoading || avatarUploading}
              className="gradient-primary min-w-[130px]"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                : isEditing ? 'Update Player' : 'Add Player'
              }
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onCancelEdit} className="border-white/20">
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
