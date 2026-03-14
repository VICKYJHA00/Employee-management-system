import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SoundSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationSoundEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  notificationSoundEnabled: true
};

export const useSoundSettings = () => {
  const { adminProfile } = useAuth();
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!adminProfile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('admin_id', adminProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching sound settings:', error);
        return;
      }

      if (data) {
        setSettings({
          soundEnabled: data.sound_enabled,
          hapticEnabled: data.haptic_enabled,
          notificationSoundEnabled: data.notification_sound_enabled
        });
      } else {
        // Create default settings if none exist
        const { error: insertError } = await supabase
          .from('admin_settings')
          .insert({
            admin_id: adminProfile.id,
            sound_enabled: true,
            haptic_enabled: true,
            notification_sound_enabled: true
          });
        
        if (insertError) {
          console.warn('Error creating default settings:', insertError);
        }
      }
    } catch (error) {
      console.warn('Error in fetchSettings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adminProfile?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<SoundSettings>) => {
    if (!adminProfile?.id) return;

    const updates: Record<string, boolean> = {};
    if (newSettings.soundEnabled !== undefined) {
      updates.sound_enabled = newSettings.soundEnabled;
    }
    if (newSettings.hapticEnabled !== undefined) {
      updates.haptic_enabled = newSettings.hapticEnabled;
    }
    if (newSettings.notificationSoundEnabled !== undefined) {
      updates.notification_sound_enabled = newSettings.notificationSoundEnabled;
    }

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update(updates)
        .eq('admin_id', adminProfile.id);

      if (error) {
        console.error('Error updating settings:', error);
        return;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error in updateSettings:', error);
    }
  }, [adminProfile?.id]);

  const triggerHaptic = useCallback(() => {
    if (settings.hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [settings.hapticEnabled]);

  return {
    settings,
    isLoading,
    updateSettings,
    triggerHaptic
  };
};

export default useSoundSettings;
