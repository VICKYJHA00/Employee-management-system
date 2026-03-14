import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Volume2, Bell, Vibrate, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { settings, isLoading, updateSettings, triggerHaptic } = useSoundSettings();

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
    
    // Provide feedback
    if (key === 'hapticEnabled' && value) {
      triggerHaptic();
    }
    
    toast({
      title: 'Settings updated',
      description: `${key.replace(/([A-Z])/g, ' $1').replace('Enabled', '')} ${value ? 'enabled' : 'disabled'}`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">Customize your app experience</p>

          {/* Sound & Haptics */}
          <Card className="bg-gray-900/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Sound & Haptics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Button Click Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Button Click Sounds</Label>
                    <p className="text-sm text-gray-400">Play sound when tapping buttons</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => handleToggle('soundEnabled', checked)}
                />
              </div>

              {/* Notification Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Notification Sounds</Label>
                    <p className="text-sm text-gray-400">Play sound for notifications</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notificationSoundEnabled}
                  onCheckedChange={(checked) => handleToggle('notificationSoundEnabled', checked)}
                />
              </div>

              {/* Haptic Feedback */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Vibrate className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Haptic Feedback</Label>
                    <p className="text-sm text-gray-400">Vibrate on button taps (mobile only)</p>
                  </div>
                </div>
                <Switch
                  checked={settings.hapticEnabled}
                  onCheckedChange={(checked) => handleToggle('hapticEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">{adminProfile?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium">{adminProfile?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  <p className="text-white font-medium capitalize">
                    {adminProfile?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
